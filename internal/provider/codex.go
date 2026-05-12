package provider

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"cmt/internal/commit"
)

func newCodexDefinition() Definition {
	return Definition{
		ID:             "codex",
		ExecutableName: "codex",
		DefaultModel:   "",
		ResolveModel:   resolveCodexModel,
		newAdapter: func(executablePath, model string) Adapter {
			return &codexAdapter{
				executablePath: executablePath,
				model:          strings.TrimSpace(model),
			}
		},
		preflight: preflightCodex,
	}
}

type codexAdapter struct {
	executablePath string
	model          string
}

func preflightCodex(ctx context.Context, executablePath string) error {
	if err := requireHelpTokens(ctx, "codex", executablePath, []string{"--help"}, []string{
		"--ask-for-approval",
		"never",
	}); err != nil {
		return err
	}

	if err := requireHelpTokens(ctx, "codex", executablePath, []string{"exec", "--help"}, []string{
		"--sandbox",
		"read-only",
		"--ignore-user-config",
		"--ignore-rules",
		"--output-last-message",
		"--ephemeral",
	}); err != nil {
		return err
	}

	result, err := runCommand(ctx, executablePath, "login", "status")
	if err != nil {
		if result.stderr != "" {
			return fmt.Errorf("codex is not ready: %s (run `codex login`)", result.stderr)
		}

		return fmt.Errorf("codex is not ready: %w (run `codex login`)", err)
	}

	if strings.Contains(strings.ToLower(result.stdout), "not logged in") {
		return fmt.Errorf("codex is not authenticated (run `codex login`)")
	}

	return nil
}

func resolveCodexModel(ctx context.Context, executablePath, explicit string) (string, error) {
	if explicit != "" {
		return explicit, nil
	}

	result, err := runCommand(ctx, executablePath, "login", "status")
	if err != nil {
		if result.stderr != "" {
			return "", fmt.Errorf("codex model resolution failed: %s", result.stderr)
		}

		return "", fmt.Errorf("codex model resolution failed: %w", err)
	}

	// ChatGPT-backed Codex accounts reject `gpt-5-codex`. In that mode, defer to
	// the CLI-selected default by omitting `--model` entirely.
	if strings.Contains(strings.ToLower(result.stdout), "chatgpt") {
		return "", nil
	}

	return "", nil
}

func (a *codexAdapter) GenerateCommitMessage(ctx context.Context, repoDir, userHint string) (string, error) {
	prompt, err := commit.BuildPrompt(codexPromptOverlay, userHint)
	if err != nil {
		return "", err
	}

	outputFile, err := writeTempFile("", "cmt-codex-*.txt")
	if err != nil {
		return "", fmt.Errorf("create codex output file: %w", err)
	}

	outputPath := outputFile.Name()
	_ = outputFile.Close()

	defer func() {
		_ = os.Remove(outputPath)
	}()

	args := []string{
		"--ask-for-approval", "never",
		"exec",
		"--sandbox", "read-only",
		"--ignore-user-config",
		"--ignore-rules",
		"--ephemeral",
		"--color", "never",
		"--cd", repoDir,
		"--output-last-message", outputPath,
	}
	if a.model != "" {
		args = append(args, "--model", a.model)
	}

	args = append(args, prompt)

	cmd := exec.CommandContext(ctx, a.executablePath, args...)
	cmd.Dir = repoDir

	output, err := cmd.CombinedOutput()
	if err != nil {
		if ctx.Err() != nil {
			return "", fmt.Errorf("codex exec failed: %w", ctx.Err())
		}

		trimmed := strings.TrimSpace(string(output))
		if trimmed != "" {
			return "", fmt.Errorf("codex exec failed: %s", trimmed)
		}

		return "", fmt.Errorf("codex exec failed: %w", err)
	}

	messageBytes, err := os.ReadFile(outputPath)
	if err != nil {
		return "", fmt.Errorf("read codex output: %w", err)
	}

	message := strings.TrimSpace(string(messageBytes))
	if message == "" {
		return "", fmt.Errorf("codex exec returned an empty commit message")
	}

	return message, nil
}

const codexPromptOverlay = `Inspect the staged snapshot in this repository before writing the message.

At minimum run:

- git status --porcelain
- git diff --cached
- git log -10 --oneline

Use git show only when the staged diff is not enough for accurate context.
Ignore unstaged changes.
Do not attempt file writes or commits.
For broad changes such as new packages, provider support, workflow changes, or
new config surfaces, include a short body of one or two sentences explaining
the capability added and any important runtime behavior.`

package provider

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"

	"cmt/internal/commit"
)

const claudeAllowedTools = "Bash(git status*),Bash(git diff --cached*),Bash(git log*),Bash(git show*)"

func newClaudeDefinition() Definition {
	return Definition{
		ID:             "claude",
		ExecutableName: "claude",
		DefaultModel:   "sonnet",
		ResolveModel: func(_ context.Context, _ string, explicit string) (string, error) {
			if explicit != "" {
				return explicit, nil
			}

			return "sonnet", nil
		},
		newAdapter: func(executablePath, model string) Adapter {
			return &claudeAdapter{
				executablePath: executablePath,
				model:          strings.TrimSpace(model),
			}
		},
		preflight: preflightClaude,
	}
}

type claudeAdapter struct {
	executablePath string
	model          string
}

func preflightClaude(ctx context.Context, executablePath string) error {
	if err := requireHelpTokens(ctx, "claude", executablePath, []string{"--help"}, []string{
		"--disable-slash-commands",
		"--no-session-persistence",
		"--permission-mode",
		"--allowedTools",
		"-p, --print",
	}); err != nil {
		return err
	}

	result, err := runCommand(ctx, executablePath, "auth", "status")
	if err != nil {
		if result.stderr != "" {
			return fmt.Errorf("claude is not ready: %s (run `claude auth login`)", result.stderr)
		}

		return fmt.Errorf("claude is not ready: %w (run `claude auth login`)", err)
	}

	if strings.Contains(result.stdout, `"loggedIn": false`) {
		return fmt.Errorf("claude is not authenticated (run `claude auth login`)")
	}

	return nil
}

func (a *claudeAdapter) GenerateCommitMessage(ctx context.Context, repoDir, userHint string) (string, error) {
	prompt, err := commit.BuildPrompt(claudePromptOverlay, userHint)
	if err != nil {
		return "", err
	}

	args := []string{
		"--disable-slash-commands",
		"--no-session-persistence",
		"--permission-mode", "bypassPermissions",
		"--allowedTools", claudeAllowedTools,
	}
	if a.model != "" {
		args = append(args, "--model", a.model)
	}

	args = append(args, "-p", prompt)

	cmd := exec.CommandContext(ctx, a.executablePath, args...)
	cmd.Dir = repoDir

	var stdout bytes.Buffer
	var stderr bytes.Buffer

	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		if ctx.Err() != nil {
			return "", fmt.Errorf("claude -p failed: %w", ctx.Err())
		}

		if stderr.Len() > 0 {
			return "", fmt.Errorf("claude -p failed: %s", strings.TrimSpace(stderr.String()))
		}

		if stdout.Len() > 0 {
			return "", fmt.Errorf("claude -p failed: %s", strings.TrimSpace(stdout.String()))
		}

		return "", fmt.Errorf("claude -p failed: %w", err)
	}

	message := strings.TrimSpace(stdout.String())
	if message == "" {
		return "", fmt.Errorf("claude -p returned an empty commit message")
	}

	return message, nil
}

const claudePromptOverlay = `Use the Bash tool to inspect the staged snapshot before writing the message.

At minimum run:

- git status --porcelain
- git diff --cached
- git log -10 --oneline

Use git show only when the staged diff is not enough for accurate context.
Do not inspect unstaged changes.
Do not run write commands.
Prefer a subject-only commit message unless a body is strictly necessary.
Do not explain config precedence, provider wiring, file structure, or internal
refactor mechanics unless that context is essential to understand the commit.`

package commit

import (
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"text/template"
	"time"
)

const DefaultTimeout = 2 * time.Minute

var ansiRegex = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]`)

//go:embed commit_prompt.md
var commitPromptTemplateText string

var commitPromptTemplate = template.Must(template.New("commit_prompt").Parse(commitPromptTemplateText))

// Generator shells out to Claude from a specific repository directory.
type Generator struct {
	Dir        string
	Executable string
	Timeout    time.Duration
}

// NewGenerator constructs a Claude-backed commit message generator.
func NewGenerator(dir, executable string) *Generator {
	return &Generator{
		Dir:        dir,
		Executable: executable,
		Timeout:    DefaultTimeout,
	}
}

// CleanStatus strips ANSI codes and trailing whitespace from each line.
func CleanStatus(s string) string {
	var cleanedLines []string

	for _, line := range strings.Split(s, "\n") {
		cleaned := ansiRegex.ReplaceAllString(line, "")

		cleaned = strings.TrimRight(cleaned, " \t\r")
		if strings.Trim(cleaned, " \t\r") == "" {
			continue
		}

		cleanedLines = append(cleanedLines, cleaned)
	}

	return strings.Join(cleanedLines, "\n")
}

// GenerateMessage shells out to `claude -p "<prompt>"` to produce a commit
// message. The prompt instructs Claude Code to gather the full diff/context
// itself via its bash tool and emit only the commit message text.
func (g *Generator) GenerateMessage(ctx context.Context, log, userInput string) (string, error) {
	prompt, err := buildPrompt(log, userInput)
	if err != nil {
		return "", fmt.Errorf("build commit prompt: %w", err)
	}

	runCtx := ctx
	cancel := func() {}

	if g.Timeout > 0 {
		runCtx, cancel = context.WithTimeout(ctx, g.Timeout)
	}

	defer cancel()

	cmd := exec.CommandContext(runCtx, g.executable(), "-p", prompt)
	cmd.Dir = g.Dir

	var stdout, stderr bytes.Buffer

	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		if runCtx.Err() != nil {
			return "", fmt.Errorf("claude -p failed: %w", runCtx.Err())
		}

		if stderr.Len() > 0 {
			return "", fmt.Errorf("claude -p failed: %s", strings.TrimSpace(stderr.String()))
		}

		return "", fmt.Errorf("claude -p failed: %w", err)
	}

	msg := strings.TrimSpace(stdout.String())
	if msg == "" {
		return "", fmt.Errorf("claude -p returned an empty commit message")
	}

	return msg, nil
}

func buildPrompt(log, userInput string) (string, error) {
	var b strings.Builder

	data := struct {
		Log          string
		UserInput    string
		HasUserInput bool
	}{
		Log:          normalizePromptBlock(log, "(no prior commits)"),
		UserInput:    normalizePromptBlock(userInput, ""),
		HasUserInput: strings.TrimSpace(userInput) != "",
	}

	if err := commitPromptTemplate.Execute(&b, data); err != nil {
		return "", err
	}

	return b.String(), nil
}

func normalizePromptBlock(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		if fallback == "" {
			return ""
		}

		return fallback + "\n"
	}

	if strings.HasSuffix(value, "\n") {
		return value
	}

	return value + "\n"
}

func (g *Generator) executable() string {
	if g.Executable != "" {
		return g.Executable
	}

	return "claude"
}

package commit_test

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"gic/internal/commit"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func writeClaudeStub(t *testing.T, dir, script string) string {
	t.Helper()

	if runtime.GOOS == "windows" {
		t.Skip("claude stub uses POSIX sh")
	}

	stubPath := filepath.Join(dir, "claude")
	require.NoError(t, os.WriteFile(stubPath, []byte(script), 0o755))

	return stubPath
}

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

func TestCleanStatus(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "strips ansi and trailing whitespace",
			in:   "\x1b[31m M file.txt\x1b[0m   \n",
			want: " M file.txt",
		},
		{
			name: "drops empty lines",
			in:   "A  file.txt\n\n\t \n?? other.txt\r\n",
			want: "A  file.txt\n?? other.txt",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, commit.CleanStatus(tt.in))
		})
	}
}

func TestGenerateMessageInvokesClaude(t *testing.T) {
	stubDir := t.TempDir()
	argsFile := filepath.Join(stubDir, "argv.txt")
	expected := "Refactor commit pipeline to wrap claude CLI"

	stubPath := writeClaudeStub(t, stubDir, "#!/bin/sh\n"+
		"printf '%s\\n' \"$@\" > "+shellQuote(argsFile)+"\n"+
		"printf '%s' "+shellQuote(expected+"\n")+"\n")

	generator := commit.NewGenerator(stubDir, stubPath)
	got, err := generator.GenerateMessage(context.Background(), "abc123 Initial commit", "")
	require.NoError(t, err)
	assert.Equal(t, expected, got)

	argv, err := os.ReadFile(argsFile)
	require.NoError(t, err)

	lines := strings.Split(strings.TrimRight(string(argv), "\n"), "\n")
	require.GreaterOrEqual(t, len(lines), 2)
	assert.Equal(t, "-p", lines[0])

	prompt := strings.Join(lines[1:], "\n")
	assert.Contains(t, prompt, "abc123 Initial commit")
	assert.Contains(t, prompt, "Short imperative summary")
	assert.Contains(t, prompt, "around 50 characters is a good target")
	assert.Contains(t, prompt, "Reply with the commit message text only")
}

func TestGenerateMessageUsesNoPriorCommitsFallback(t *testing.T) {
	stubDir := t.TempDir()
	argsFile := filepath.Join(stubDir, "argv.txt")
	stubPath := writeClaudeStub(t, stubDir, "#!/bin/sh\n"+
		"printf '%s\\n' \"$@\" > "+shellQuote(argsFile)+"\n"+
		"printf '%s' 'initial commit message\\n'\n")

	generator := commit.NewGenerator(stubDir, stubPath)

	_, err := generator.GenerateMessage(context.Background(), "", "")
	require.NoError(t, err)

	argv, err := os.ReadFile(argsFile)
	require.NoError(t, err)

	prompt := strings.Join(strings.Split(strings.TrimRight(string(argv), "\n"), "\n")[1:], "\n")
	assert.Contains(t, prompt, "(no prior commits)")
	assert.NotContains(t, prompt, "Additional user-supplied context")
}

func TestGenerateMessageForwardsUserInput(t *testing.T) {
	stubDir := t.TempDir()
	argsFile := filepath.Join(stubDir, "argv.txt")
	stubPath := writeClaudeStub(t, stubDir, "#!/bin/sh\n"+
		"printf '%s\\n' \"$@\" > "+shellQuote(argsFile)+"\n"+
		"printf '%s' 'fix auth bug regression\\n'\n")

	generator := commit.NewGenerator(stubDir, stubPath)

	_, err := generator.GenerateMessage(context.Background(), "", "fixed auth bug")
	require.NoError(t, err)

	argv, err := os.ReadFile(argsFile)
	require.NoError(t, err)

	prompt := strings.Join(strings.Split(strings.TrimRight(string(argv), "\n"), "\n")[1:], "\n")
	assert.Contains(t, prompt, "fixed auth bug")
	assert.Contains(t, prompt, "Additional user-supplied context")
	assert.Contains(t, prompt, "Wrap multi-line body prose to roughly 72 characters")
}

func TestGenerateMessageRejectsEmptyOutput(t *testing.T) {
	stubDir := t.TempDir()
	stubPath := writeClaudeStub(t, stubDir, "#!/bin/sh\n")

	generator := commit.NewGenerator(stubDir, stubPath)

	_, err := generator.GenerateMessage(context.Background(), "", "")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "empty commit message")
}

func TestGenerateMessageHonorsContextCancellation(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("claude stub uses POSIX sh")
	}

	stubDir := t.TempDir()
	stubPath := writeClaudeStub(t, stubDir, "#!/bin/sh\nsleep 5\n")

	generator := commit.NewGenerator(stubDir, stubPath)
	generator.Timeout = 0

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	_, err := generator.GenerateMessage(ctx, "", "")
	require.Error(t, err)
	assert.ErrorIs(t, err, context.DeadlineExceeded)
}

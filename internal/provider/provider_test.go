package provider_test

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"cmt/internal/provider"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func writeExecutable(t *testing.T, dir, name, script string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	require.NoError(t, os.WriteFile(path, []byte(script), 0o755))

	return path
}

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

func requirePOSIXShell(t *testing.T) {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("provider stubs use POSIX sh")
	}
}

func TestClaudeAdapterInvokesExpectedFlags(t *testing.T) {
	requirePOSIXShell(t)

	stubDir := t.TempDir()
	argsFile := filepath.Join(stubDir, "argv.txt")
	expected := "Route commit flow through provider bootstrap"

	stubPath := writeExecutable(t, stubDir, "claude", "#!/bin/sh\n"+
		"printf '%s\\n' \"$@\" > "+shellQuote(argsFile)+"\n"+
		"printf '%s' "+shellQuote(expected+"\n")+"\n")

	definition, err := provider.Lookup("claude")
	require.NoError(t, err)

	adapter := definition.NewAdapter(stubPath, "sonnet")
	got, err := adapter.GenerateCommitMessage(context.Background(), stubDir, "keep staged context only")
	require.NoError(t, err)
	assert.Equal(t, expected, got)

	argv, err := os.ReadFile(argsFile)
	require.NoError(t, err)

	raw := string(argv)
	lines := strings.Split(strings.TrimRight(raw, "\n"), "\n")
	assert.Contains(t, lines, "--disable-slash-commands")
	assert.Contains(t, lines, "--no-session-persistence")
	assert.Contains(t, lines, "--permission-mode")
	assert.Contains(t, lines, "bypassPermissions")
	assert.Contains(t, lines, "--allowedTools")
	assert.Contains(t, lines, "--model")
	assert.Contains(t, lines, "sonnet")
	assert.Contains(t, lines, "-p")
	assert.Contains(t, raw, "git diff --cached")
	assert.Contains(t, raw, "keep staged context only")
	assert.Contains(t, raw, "Prefer a subject-only commit message unless a body is strictly necessary")
	assert.Contains(t, raw, "Reply with the commit message text only")
}

func TestCodexAdapterInvokesExpectedFlagsAndReadsOutputFile(t *testing.T) {
	requirePOSIXShell(t)

	stubDir := t.TempDir()
	argsFile := filepath.Join(stubDir, "argv.txt")
	expected := "Add codex provider adapter"

	stubPath := writeExecutable(t, stubDir, "codex", "#!/bin/sh\n"+
		"printf '%s\\n' \"$@\" > "+shellQuote(argsFile)+"\n"+
		"out=''\n"+
		"prev=''\n"+
		"for arg in \"$@\"; do\n"+
		"  if [ \"$prev\" = '--output-last-message' ]; then out=\"$arg\"; fi\n"+
		"  prev=\"$arg\"\n"+
		"done\n"+
		"printf '%s' "+shellQuote(expected+"\n")+" > \"$out\"\n")

	definition, err := provider.Lookup("codex")
	require.NoError(t, err)

	repoDir := t.TempDir()
	adapter := definition.NewAdapter(stubPath, "gpt-5-codex")
	got, err := adapter.GenerateCommitMessage(context.Background(), repoDir, "prefer staged diff only")
	require.NoError(t, err)
	assert.Equal(t, expected, got)

	argv, err := os.ReadFile(argsFile)
	require.NoError(t, err)

	raw := string(argv)
	lines := strings.Split(strings.TrimRight(raw, "\n"), "\n")
	assert.Equal(t, "--ask-for-approval", lines[0])
	assert.Equal(t, "never", lines[1])
	assert.Equal(t, "exec", lines[2])
	assert.Contains(t, lines, "--sandbox")
	assert.Contains(t, lines, "read-only")
	assert.Contains(t, lines, "--ignore-user-config")
	assert.Contains(t, lines, "--ignore-rules")
	assert.Contains(t, lines, "--ephemeral")
	assert.Contains(t, lines, "--cd")
	assert.Contains(t, lines, repoDir)
	assert.Contains(t, lines, "--output-last-message")
	assert.Contains(t, lines, "--model")
	assert.Contains(t, lines, "gpt-5-codex")
	assert.Contains(t, raw, "git diff --cached")
	assert.Contains(t, raw, "prefer staged diff only")
	assert.Contains(t, raw, "include a short body of one or two sentences")
	assert.Contains(t, raw, "Reply with the commit message text only")
}

func TestCodexResolveModelDefersToCLIForChatGPTAuth(t *testing.T) {
	requirePOSIXShell(t)

	stubDir := t.TempDir()
	stubPath := writeExecutable(t, stubDir, "codex", "#!/bin/sh\n"+
		"if [ \"$1\" = 'login' ] && [ \"$2\" = 'status' ]; then\n"+
		"  printf '%s\\n' 'Logged in using ChatGPT'\n"+
		"  exit 0\n"+
		"fi\n"+
		"exit 1\n")

	definition, err := provider.Lookup("codex")
	require.NoError(t, err)

	model, err := definition.ResolveModel(context.Background(), stubPath, "")
	require.NoError(t, err)
	assert.Equal(t, "", model)
}

func TestCodexResolveModelPreservesExplicitModel(t *testing.T) {
	definition, err := provider.Lookup("codex")
	require.NoError(t, err)

	model, err := definition.ResolveModel(context.Background(), "/does/not/matter", "gpt-5-codex")
	require.NoError(t, err)
	assert.Equal(t, "gpt-5-codex", model)
}

func TestPreflightFailsWhenRequiredCapabilityIsMissing(t *testing.T) {
	requirePOSIXShell(t)

	stubDir := t.TempDir()
	stubPath := writeExecutable(t, stubDir, "codex", "#!/bin/sh\n"+
		"if [ \"$1\" = '--help' ]; then\n"+
		"  cat <<'EOF'\n"+
		"Usage: codex [OPTIONS] [PROMPT]\n"+
		"  --ask-for-approval\n"+
		"  never\n"+
		"EOF\n"+
		"  exit 0\n"+
		"fi\n"+
		"if [ \"$1\" = 'exec' ] && [ \"$2\" = '--help' ]; then\n"+
		"  cat <<'EOF'\n"+
		"Usage: codex exec [OPTIONS] [PROMPT]\n"+
		"  --sandbox\n"+
		"  read-only\n"+
		"  --ignore-user-config\n"+
		"  --output-last-message\n"+
		"  --ephemeral\n"+
		"EOF\n"+
		"  exit 0\n"+
		"fi\n"+
		"if [ \"$1\" = 'login' ] && [ \"$2\" = 'status' ]; then\n"+
		"  printf '%s\\n' 'Logged in using ChatGPT'\n"+
		"  exit 0\n"+
		"fi\n"+
		"exit 0\n")

	definition, err := provider.Lookup("codex")
	require.NoError(t, err)

	err = provider.Preflight(context.Background(), definition, stubPath)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "--ignore-rules")
}

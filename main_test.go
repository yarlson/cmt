package main

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"

	"cmt/internal/provider"

	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestCommand() *cobra.Command {
	cmd := &cobra.Command{Use: "cmt"}
	cmd.Flags().String("provider", "", "")
	cmd.Flags().String("model", "", "")

	return cmd
}

// TestRunErrorsWhenDefaultProviderMissing verifies that `run` exits with a
// clear provider error before any UI fires when the default provider binary is
// unavailable on $PATH.
func TestRunErrorsWhenDefaultProviderMissing(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("symlink-based PATH setup uses POSIX behavior")
	}

	stubDir := t.TempDir()
	gitPath, err := exec.LookPath("git")
	require.NoError(t, err)

	linkPath := filepath.Join(stubDir, "git")
	require.NoError(t, os.Symlink(gitPath, linkPath))
	t.Setenv("PATH", stubDir)

	err = run(context.Background(), newTestCommand(), "anything")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "claude")
	assert.Contains(t, err.Error(), "PATH")
}

// buildCmtBinary compiles the cmt binary into a fresh temp dir and returns
// its path. Used by acceptance tests that need to run `cmt` as a subprocess.
func buildCmtBinary(t *testing.T) string {
	t.Helper()

	binDir := t.TempDir()

	binName := "cmt"
	if runtime.GOOS == "windows" {
		binName += ".exe"
	}

	binPath := filepath.Join(binDir, binName)

	repoRoot, err := os.Getwd()
	require.NoError(t, err)

	cmd := exec.Command("go", "build", "-o", binPath, ".")
	cmd.Dir = repoRoot

	out, err := cmd.CombinedOutput()
	require.NoErrorf(t, err, "go build failed: %s", out)

	return binPath
}

// TestVersionCommandsDoNotInvokeProviders verifies that `cmt version` and
// `cmt --version` print build metadata without requiring provider CLIs on
// $PATH.
func TestVersionCommandsDoNotInvokeProviders(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("PATH manipulation depends on POSIX layout")
	}

	binPath := buildCmtBinary(t)

	for _, args := range [][]string{{"version"}, {"--version"}} {
		cmd := exec.Command(binPath, args...)

		cmd.Env = append(os.Environ(), "PATH=")

		out, err := cmd.CombinedOutput()
		require.NoErrorf(t, err, "cmt %v should succeed without provider CLIs on PATH (out: %s)", args, out)
		assert.Contains(t, string(out), "Version:", "cmt %v should print version metadata", args)
		assert.Contains(t, string(out), "Built:", "cmt %v should print build metadata", args)
	}
}

func TestResolveOptionPrecedence(t *testing.T) {
	cmd := newTestCommand()
	t.Setenv("CMT_PROVIDER", "claude")

	require.NoError(t, cmd.Flags().Set("provider", "codex"))
	assert.Equal(t, "codex", resolveOption(cmd, "provider", "CMT_PROVIDER", provider.DefaultProviderID))
}

func TestResolveOptionFallsBackToEnvThenDefault(t *testing.T) {
	cmd := newTestCommand()
	t.Setenv("CMT_MODEL", "opus")

	assert.Equal(t, "opus", resolveOption(cmd, "model", "CMT_MODEL", "sonnet"))
	assert.Equal(t, provider.DefaultProviderID, resolveOption(cmd, "provider", "CMT_PROVIDER", provider.DefaultProviderID))
}

func TestProviderDefinitionsExposeProviderSpecificDefaults(t *testing.T) {
	claude, err := provider.Lookup("claude")
	require.NoError(t, err)
	assert.Equal(t, "sonnet", claude.DefaultModel)

	codex, err := provider.Lookup("codex")
	require.NoError(t, err)
	assert.Equal(t, "", codex.DefaultModel)
}

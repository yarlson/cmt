package main

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRunErrorsWhenClaudeMissing verifies that `run` exits with a clear,
// claude-naming error before any UI fires when the `claude` binary is not
// available on $PATH.
func TestRunErrorsWhenClaudeMissing(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("symlink-based PATH setup uses POSIX behavior")
	}

	stubDir := t.TempDir()
	gitPath, err := exec.LookPath("git")
	require.NoError(t, err)

	linkPath := filepath.Join(stubDir, "git")
	require.NoError(t, os.Symlink(gitPath, linkPath))
	t.Setenv("PATH", stubDir)

	err = run(context.Background(), "anything")
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

// TestVersionCommandsDoNotInvokeClaude verifies that `cmt version` and
// `cmt --version` print the build metadata box without requiring `claude`
// on $PATH.
func TestVersionCommandsDoNotInvokeClaude(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("PATH manipulation depends on POSIX layout")
	}

	binPath := buildCmtBinary(t)

	for _, args := range [][]string{{"version"}, {"--version"}} {
		cmd := exec.Command(binPath, args...)

		cmd.Env = append(os.Environ(), "PATH=")

		out, err := cmd.CombinedOutput()
		require.NoErrorf(t, err, "cmt %v should succeed without claude on PATH (out: %s)", args, out)
		assert.Contains(t, string(out), "Version:", "cmt %v should print version metadata", args)
		assert.Contains(t, string(out), "Built:", "cmt %v should print build metadata", args)
	}
}

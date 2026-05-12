package app_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"gic/internal/app"
	"gic/internal/commit"
	"gic/internal/git"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func initRepo(t *testing.T) (string, string) {
	t.Helper()

	repoDir := t.TempDir()
	gitPath, err := exec.LookPath("git")
	require.NoError(t, err)

	for _, args := range [][]string{
		{"init"},
		{"config", "user.name", "Test User"},
		{"config", "user.email", "test@example.com"},
	} {
		cmd := exec.Command(gitPath, args...)
		cmd.Dir = repoDir
		out, err := cmd.CombinedOutput()
		require.NoErrorf(t, err, "git %v failed: %s", args, out)
	}

	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "initial.txt"), []byte("initial"), 0o644))

	client := git.NewClient(repoDir, gitPath)
	require.NoError(t, client.Add(context.Background(), "initial.txt"))
	require.NoError(t, client.Commit(context.Background(), "Initial commit"))

	return repoDir, gitPath
}

func writeExecutable(t *testing.T, dir, name, script string) string {
	t.Helper()
	require.NoError(t, os.WriteFile(filepath.Join(dir, name), []byte(script), 0o755))

	return filepath.Join(dir, name)
}

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

func newDependencies(repoDir, gitPath, claudePath string) app.Dependencies {
	return app.Dependencies{
		Git:       git.NewClient(repoDir, gitPath),
		Generator: commit.NewGenerator(repoDir, claudePath),
	}
}

func TestRunAutoApproveCreatesCommitFromClaudeStub(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("claude stub uses POSIX sh")
	}

	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	stubDir := t.TempDir()
	argsFile := filepath.Join(stubDir, "argv.txt")
	expected := "Wire claude CLI into commit pipeline"
	claudePath := writeExecutable(t, stubDir, "claude", "#!/bin/sh\n"+
		"printf '%s\\n' \"$@\" > "+shellQuote(argsFile)+"\n"+
		"printf '%s' "+shellQuote(expected+"\n")+"\n")

	err := app.Run(context.Background(), newDependencies(repoDir, gitPath, claudePath), "wire up claude", true)
	require.NoError(t, err)

	out, err := exec.Command(gitPath, "-C", repoDir, "log", "-1", "--pretty=%s").Output()
	require.NoError(t, err)
	assert.Equal(t, expected, strings.TrimSpace(string(out)))

	argv, err := os.ReadFile(argsFile)
	require.NoError(t, err)

	prompt := strings.Join(strings.Split(strings.TrimRight(string(argv), "\n"), "\n")[1:], "\n")
	assert.Contains(t, prompt, "wire up claude")
}

func TestRunReturnsNilWhenStatusIsEmpty(t *testing.T) {
	repoDir, gitPath := initRepo(t)
	deps := newDependencies(repoDir, gitPath, filepath.Join(t.TempDir(), "claude-does-not-run"))

	err := app.Run(context.Background(), deps, "", true)
	require.NoError(t, err)
}

func TestRunReturnsErrUserCancelled(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("claude stub uses POSIX sh")
	}

	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	stubDir := t.TempDir()
	claudePath := writeExecutable(t, stubDir, "claude", "#!/bin/sh\nprintf '%s' 'Add feature\\n'\n")

	deps := newDependencies(repoDir, gitPath, claudePath)
	deps.Confirm = func(context.Context) bool { return false }

	err := app.Run(context.Background(), deps, "", false)
	require.ErrorIs(t, err, app.ErrUserCancelled)
}

func TestRunPropagatesGeneratorFailure(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("claude stub uses POSIX sh")
	}

	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	stubDir := t.TempDir()
	claudePath := writeExecutable(t, stubDir, "claude", "#!/bin/sh\necho 'boom: rate limited' 1>&2\nexit 7\n")

	err := app.Run(context.Background(), newDependencies(repoDir, gitPath, claudePath), "", true)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to generate commit message")
	assert.Contains(t, err.Error(), "boom: rate limited")
}

func TestRunPropagatesCommitFailure(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell stub uses POSIX sh")
	}

	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	stubDir := t.TempDir()
	claudePath := writeExecutable(t, stubDir, "claude", "#!/bin/sh\nprintf '%s' 'Add feature\\n'\n")
	failingGitPath := writeExecutable(t, stubDir, "git-wrapper", "#!/bin/sh\n"+
		"if [ \"$1\" = 'commit' ]; then\n"+
		"  echo 'commit blocked' 1>&2\n"+
		"  exit 9\n"+
		"fi\n"+
		"exec "+shellQuote(gitPath)+" \"$@\"\n")

	err := app.Run(context.Background(), newDependencies(repoDir, failingGitPath, claudePath), "", true)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create commit")
	assert.Contains(t, err.Error(), "commit blocked")
}

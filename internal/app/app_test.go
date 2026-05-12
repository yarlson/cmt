package app_test

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"cmt/internal/app"
	"cmt/internal/git"

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

type stubProvider struct {
	message  string
	err      error
	repoDir  string
	userHint string
}

func (s *stubProvider) GenerateCommitMessage(_ context.Context, repoDir, userHint string) (string, error) {
	s.repoDir = repoDir
	s.userHint = userHint

	if s.err != nil {
		return "", s.err
	}

	return s.message, nil
}

func newDependencies(repoDir, gitPath string, adapter *stubProvider) app.Dependencies {
	return app.Dependencies{
		Git:      git.NewClient(repoDir, gitPath),
		Provider: adapter,
	}
}

func TestRunAutoApproveCreatesCommitFromProvider(t *testing.T) {
	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	expected := "Wire provider bootstrap into commit flow"
	adapter := &stubProvider{message: expected}

	err := app.Run(context.Background(), newDependencies(repoDir, gitPath, adapter), "wire provider bootstrap", true)
	require.NoError(t, err)

	out, err := exec.Command(gitPath, "-C", repoDir, "log", "-1", "--pretty=%s").Output()
	require.NoError(t, err)
	assert.Equal(t, expected, strings.TrimSpace(string(out)))
	assert.Equal(t, repoDir, adapter.repoDir)
	assert.Equal(t, "wire provider bootstrap", adapter.userHint)
}

func TestRunReturnsNilWhenStatusIsEmpty(t *testing.T) {
	repoDir, gitPath := initRepo(t)
	adapter := &stubProvider{message: "should not be used"}

	err := app.Run(context.Background(), newDependencies(repoDir, gitPath, adapter), "", true)
	require.NoError(t, err)
	assert.Equal(t, "", adapter.repoDir)
}

func TestRunReturnsErrUserCancelled(t *testing.T) {
	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	adapter := &stubProvider{message: "Add feature"}
	deps := newDependencies(repoDir, gitPath, adapter)
	deps.Confirm = func(context.Context) bool { return false }

	err := app.Run(context.Background(), deps, "", false)
	require.ErrorIs(t, err, app.ErrUserCancelled)
}

func TestRunPropagatesProviderFailure(t *testing.T) {
	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	adapter := &stubProvider{err: errors.New("provider boom")}

	err := app.Run(context.Background(), newDependencies(repoDir, gitPath, adapter), "", true)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to generate commit message")
	assert.Contains(t, err.Error(), "provider boom")
}

func TestRunPropagatesCommitFailure(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("shell stub uses POSIX sh")
	}

	repoDir, gitPath := initRepo(t)
	require.NoError(t, os.WriteFile(filepath.Join(repoDir, "feature.txt"), []byte("feature"), 0o644))

	stubDir := t.TempDir()
	failingGitPath := writeExecutable(t, stubDir, "git-wrapper", "#!/bin/sh\n"+
		"if [ \"$1\" = 'commit' ]; then\n"+
		"  echo 'commit blocked' 1>&2\n"+
		"  exit 9\n"+
		"fi\n"+
		"exec "+shellQuote(gitPath)+" \"$@\"\n")

	adapter := &stubProvider{message: "Add feature"}

	err := app.Run(context.Background(), newDependencies(repoDir, failingGitPath, adapter), "", true)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create commit")
	assert.Contains(t, err.Error(), "commit blocked")
}

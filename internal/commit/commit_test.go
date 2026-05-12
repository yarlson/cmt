package commit_test

import (
	"testing"

	"cmt/internal/commit"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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

func TestBuildPromptIncludesOverlayAndUserInput(t *testing.T) {
	prompt, err := commit.BuildPrompt("Run git diff --cached", "focus on auth regression")
	require.NoError(t, err)

	assert.Contains(t, prompt, "changes currently staged")
	assert.Contains(t, prompt, "Run git diff --cached")
	assert.Contains(t, prompt, "Use staged changes as the source of truth")
	assert.Contains(t, prompt, "Prefer a subject-only commit message when it is sufficient")
	assert.Contains(t, prompt, "do not restate the obvious")
	assert.Contains(t, prompt, "focus on auth regression")
	assert.Contains(t, prompt, "Reply with the commit message text only")
}

func TestBuildPromptOmitsOptionalUserSectionWhenEmpty(t *testing.T) {
	prompt, err := commit.BuildPrompt("Run git diff --cached", "")
	require.NoError(t, err)

	assert.NotContains(t, prompt, "Additional user-supplied context")
}

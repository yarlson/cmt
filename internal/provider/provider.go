package provider

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"slices"
	"strings"
)

const DefaultProviderID = "claude"

// Adapter generates a plain-text commit message for a repository.
type Adapter interface {
	GenerateCommitMessage(ctx context.Context, repoDir, userHint string) (string, error)
}

// Definition describes a supported provider and how to bootstrap it.
type Definition struct {
	ID             string
	ExecutableName string
	DefaultModel   string
	ResolveModel   func(context.Context, string, string) (string, error)
	newAdapter     func(executablePath, model string) Adapter
	preflight      func(context.Context, string) error
}

var definitions = map[string]Definition{
	"claude": newClaudeDefinition(),
	"codex":  newCodexDefinition(),
}

// Lookup resolves a provider identifier against the hardcoded supported set.
func Lookup(id string) (Definition, error) {
	normalized := strings.ToLower(strings.TrimSpace(id))

	definition, ok := definitions[normalized]
	if !ok {
		return Definition{}, fmt.Errorf("unsupported provider %q (supported: %s)", id, strings.Join(SupportedIDs(), ", "))
	}

	return definition, nil
}

// SupportedIDs returns the supported provider identifiers in stable order.
func SupportedIDs() []string {
	ids := make([]string, 0, len(definitions))
	for id := range definitions {
		ids = append(ids, id)
	}

	slices.Sort(ids)

	return ids
}

// NewAdapter constructs the provider-specific adapter.
func (d Definition) NewAdapter(executablePath, model string) Adapter {
	return d.newAdapter(executablePath, model)
}

// Preflight validates auth state and required CLI capabilities before UI work.
func Preflight(ctx context.Context, definition Definition, executablePath string) error {
	return definition.preflight(ctx, executablePath)
}

type commandResult struct {
	stdout string
	stderr string
}

func runCommand(ctx context.Context, executablePath string, args ...string) (commandResult, error) {
	cmd := exec.CommandContext(ctx, executablePath, args...)

	var stdout bytes.Buffer

	var stderr bytes.Buffer

	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return commandResult{
			stdout: strings.TrimSpace(stdout.String()),
			stderr: strings.TrimSpace(stderr.String()),
		}, err
	}

	return commandResult{
		stdout: strings.TrimSpace(stdout.String()),
		stderr: strings.TrimSpace(stderr.String()),
	}, nil
}

func requireHelpTokens(ctx context.Context, providerID, executablePath string, helpArgs []string, tokens []string) error {
	result, err := runCommand(ctx, executablePath, helpArgs...)
	if err != nil {
		return fmt.Errorf("%s capability probe failed: %w", providerID, err)
	}

	helpText := result.stdout + "\n" + result.stderr

	for _, token := range tokens {
		if !strings.Contains(helpText, token) {
			return fmt.Errorf("%s CLI is missing required capability %q", providerID, token)
		}
	}

	return nil
}

func writeTempFile(dir, pattern string) (*os.File, error) {
	return os.CreateTemp(dir, pattern)
}

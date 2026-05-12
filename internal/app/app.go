package app

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"gic/internal/commit"
	"gic/internal/git"

	"github.com/yarlson/tap"
)

// ErrUserCancelled reports that the user declined to create the commit.
var ErrUserCancelled = errors.New("user cancelled commit")

// ConfirmFunc decides whether the workflow should continue after previewing a commit.
type ConfirmFunc func(context.Context) bool

// Dependencies holds the external command clients used by the workflow.
type Dependencies struct {
	Git       *git.Client
	Generator *commit.Generator
	Confirm   ConfirmFunc
}

// Run executes the commit workflow.
func Run(ctx context.Context, deps Dependencies, userInput string, autoApprove bool) error {
	if deps.Git == nil || deps.Generator == nil {
		return fmt.Errorf("app dependencies are not configured")
	}

	tap.Intro("🤖 Git Commit Assistant")

	if err := deps.Git.Add(ctx, "."); err != nil {
		return fmt.Errorf("failed to stage changes: %w", err)
	}

	var (
		status, log string
		errs        []error
		wg          sync.WaitGroup
		mu          sync.Mutex
	)

	wg.Add(2)

	go func() {
		defer wg.Done()

		s, err := deps.Git.Status(ctx)
		if err != nil {
			mu.Lock()

			errs = append(errs, fmt.Errorf("git status failed: %w", err))
			mu.Unlock()

			return
		}

		status = s
	}()

	go func() {
		defer wg.Done()

		l, err := deps.Git.Log(ctx)
		if err != nil {
			if errors.Is(err, git.ErrNoCommitsYet) {
				return
			}

			mu.Lock()

			errs = append(errs, fmt.Errorf("git log failed: %w", err))
			mu.Unlock()

			return
		}

		log = l
	}()

	wg.Wait()

	if len(errs) > 0 {
		return errs[0]
	}

	if strings.TrimSpace(status) == "" {
		tap.Outro("No changes to commit")
		return nil
	}

	tap.Box(commit.CleanStatus(status), "📝 Repository Status", tap.BoxOptions{
		TitleAlign:     tap.BoxAlignLeft,
		ContentAlign:   tap.BoxAlignLeft,
		TitlePadding:   1,
		ContentPadding: 1,
		Rounded:        true,
		IncludePrefix:  true,
		FormatBorder:   tap.GrayBorder,
	})

	sp := tap.NewSpinner(tap.SpinnerOptions{Indicator: "dots"})
	sp.Start("Generating commit message with Claude")

	commitMsg, err := deps.Generator.GenerateMessage(ctx, log, userInput)
	if err != nil {
		sp.Stop("Failed to generate commit message", 2)
		return fmt.Errorf("failed to generate commit message: %w", err)
	}

	sp.Stop("Commit message generated               ", 0)

	tap.Box(commitMsg, "📋 Proposed Commit Message", tap.BoxOptions{
		TitleAlign:     tap.BoxAlignLeft,
		ContentAlign:   tap.BoxAlignLeft,
		TitlePadding:   1,
		ContentPadding: 1,
		Rounded:        true,
		IncludePrefix:  true,
		FormatBorder:   tap.GrayBorder,
	})

	proceed := true

	if autoApprove {
		tap.Message("Auto-approve enabled; skipping confirmation prompt")
	} else {
		proceed = confirm(ctx, deps.Confirm)
	}

	if !proceed {
		tap.Message("Commit cancelled")
		return ErrUserCancelled
	}

	sp = tap.NewSpinner(tap.SpinnerOptions{Indicator: "dots"})
	sp.Start("Creating commit")

	if err := deps.Git.Commit(ctx, commitMsg); err != nil {
		sp.Stop("Failed to create commit", 2)
		return fmt.Errorf("failed to create commit: %w", err)
	}

	sp.Stop("Commit created!", 0)
	tap.Outro("All done!")

	return nil
}

func confirm(ctx context.Context, fn ConfirmFunc) bool {
	if fn != nil {
		return fn(ctx)
	}

	return tap.Confirm(ctx, tap.ConfirmOptions{
		Message:      "Proceed with commit?",
		Active:       "Yes",
		Inactive:     "No",
		InitialValue: true,
	})
}

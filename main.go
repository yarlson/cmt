package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"cmt/internal/app"
	"cmt/internal/commit"
	"cmt/internal/git"

	"github.com/spf13/cobra"
	"github.com/yarlson/tap"
)

// version metadata is injected via ldflags; defaults cover local builds.
var (
	version   = "dev"
	buildTime = "unknown"
)

var (
	showVersion bool
	autoApprove bool

	rootCmd = &cobra.Command{
		Use:           "cmt [commit-message]",
		Short:         "Generate polished git commits with AI assistance",
		SilenceUsage:  true,
		SilenceErrors: true,
		Args:          cobra.ArbitraryArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			if showVersion {
				printVersion()
				return nil
			}

			userInput := strings.Join(args, " ")

			return run(cmd.Context(), userInput)
		},
	}

	versionCmd = &cobra.Command{
		Use:           "version",
		Short:         "Show build metadata",
		SilenceUsage:  true,
		SilenceErrors: true,
		Run: func(cmd *cobra.Command, args []string) {
			printVersion()
		},
	}
)

func main() {
	if err := rootCmd.ExecuteContext(context.Background()); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error: %v\n", err)

		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().BoolVarP(&showVersion, "version", "v", false, "Show version information")
	rootCmd.Flags().BoolVarP(&autoApprove, "auto-approve", "y", false, "Skip confirmation prompt and create the commit automatically")
	rootCmd.AddCommand(versionCmd)
}

func printVersion() {
	tap.Intro("📦 cmt")

	tap.Box(
		fmt.Sprintf("Version:    %s\nBuilt:      %s", version, buildTime),
		"Build Details",
		tap.BoxOptions{
			TitleAlign:     tap.BoxAlignLeft,
			ContentAlign:   tap.BoxAlignLeft,
			TitlePadding:   1,
			ContentPadding: 1,
			Rounded:        true,
			IncludePrefix:  true,
			FormatBorder:   tap.GrayBorder,
		},
	)

	tap.Outro("Run `cmt` without flags to launch the assistant ✨")
}

func run(ctx context.Context, userInput string) error {
	gitPath, err := exec.LookPath("git")
	if err != nil {
		return fmt.Errorf("required executable `git` not found in $PATH: %w", err)
	}

	claudePath, err := exec.LookPath("claude")
	if err != nil {
		return fmt.Errorf("required executable `claude` not found in $PATH: %w", err)
	}

	repoDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to determine current directory: %w", err)
	}

	return app.Run(ctx, app.Dependencies{
		Git:       git.NewClient(repoDir, gitPath),
		Generator: commit.NewGenerator(repoDir, claudePath),
	}, userInput, autoApprove)
}

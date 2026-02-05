#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_FILE="$ROOT_DIR/docs/PROVIDERS.md"

cd "$ROOT_DIR"

bun run build

mkdir -p "$ROOT_DIR/docs"

providers=()
while IFS= read -r provider; do
	if [[ -z "$provider" ]]; then
		continue
	fi
	providers+=("$provider")
done < <(bun run start providers --short)

{
	echo "# Providers and Models"
	echo ""
	echo "## Table of contents"
	echo ""
	echo "- [Providers](#providers)"
	echo "- [Models by provider](#models-by-provider)"
	for provider in "${providers[@]}"; do
		echo "  - [$provider](#$provider)"
	done
	echo ""
	echo "## Providers"
	echo ""
	bun run start providers --markdown
	echo ""
	echo "## Models by provider"
} >"$OUTPUT_FILE"

for provider in "${providers[@]}"; do
	{
		echo ""
		echo "### $provider"
		echo ""
		bun run start models --provider "$provider" --markdown
	} >>"$OUTPUT_FILE"
done

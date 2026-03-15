#!/usr/bin/env bash
set -e

TARGETS=(
  "x86_64-apple-darwin:macOS (x86_64)"
  "aarch64-apple-darwin:macOS (Apple Silicon)"
  "x86_64-pc-windows-msvc:Windows (x86_64)"
  "x86_64-unknown-linux-gnu:Linux (x86_64)"
)

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

FAILED=()
SUCCEEDED=()

echo -e "${CYAN}========================================${RESET}"
echo -e "${CYAN}       ADB Compass - Build All          ${RESET}"
echo -e "${CYAN}========================================${RESET}"

for entry in "${TARGETS[@]}"; do
  target="${entry%%:*}"
  label="${entry#*:}"

  echo ""
  echo -e "${YELLOW}>> Building: ${label} (${target})${RESET}"
  echo -e "${CYAN}----------------------------------------${RESET}"

  if rustup target list --installed | grep -q "^${target}$"; then
    if pnpm tauri build --target "$target"; then
      echo -e "${GREEN}✔ Build succeeded: ${label}${RESET}"
      SUCCEEDED+=("$label")
    else
      echo -e "${RED}✘ Build failed: ${label}${RESET}"
      FAILED+=("$label")
    fi
  else
    echo -e "${RED}✘ Rust target not installed: ${target}${RESET}"
    echo -e "  Run: ${YELLOW}rustup target add ${target}${RESET}"
    FAILED+=("$label (missing rust target)")
  fi
done

echo ""
echo -e "${CYAN}========================================${RESET}"
echo -e "${CYAN}              Summary                   ${RESET}"
echo -e "${CYAN}========================================${RESET}"

if [ ${#SUCCEEDED[@]} -gt 0 ]; then
  echo -e "${GREEN}Succeeded:${RESET}"
  for s in "${SUCCEEDED[@]}"; do
    echo -e "  ${GREEN}✔ ${s}${RESET}"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "${RED}Failed:${RESET}"
  for f in "${FAILED[@]}"; do
    echo -e "  ${RED}✘ ${f}${RESET}"
  done
  exit 1
fi

echo ""
echo -e "${GREEN}All builds completed successfully!${RESET}"

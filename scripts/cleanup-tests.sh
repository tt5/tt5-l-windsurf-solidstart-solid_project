#!/bin/bash

# This script removes redundant test files that have been consolidated into test-runner.ts and test-utils.ts

# List of test files to keep
KEEP_FILES=(
  "test-runner.ts"
  "test-utils.ts"
)

# Change to scripts directory
cd "$(dirname "$0")" || exit 1

# Find all test files
TEST_FILES=($(find . -maxdepth 1 -name 'test-*' -type f -printf "%f\n"))

# Remove files not in the keep list
for file in "${TEST_FILES[@]}"; do
  if [[ ! " ${KEEP_FILES[*]} " =~ " ${file} " ]]; then
    echo "Removing: $file"
    rm -f "$file"
  else
    echo "Keeping: $file"
  fi
done

echo "\nCleanup complete. The following test files were kept:"
for file in "${KEEP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "- $file"
  fi
done

# Justfile generated (style similar to `just --init`)
# Minimal recipes to help set up and work with the mimo project.

# Use bash with `-eu` so failures stop early and undefined variables fail.
set shell := ["bash", "-ceu"]

# Path to bun (adjust if you prefer npm/node)
BUN := "bun"

# Default task
default: help

help:
    @echo "Available tasks:"
    @echo "  just setup     - install dependencies and run prebuild steps"
    @echo "  just dev       - run the project in dev/test mode"
    @echo "  just build     - build artifacts (as defined by package scripts)"
    @echo "  just test      - run tests"
    @echo "  just fmt       - format test/source files"

# Setup the project for development. This installs dependencies and
# runs the project's prebuild script that stamps the mimo binary.
setup:
    @echo "Setting up mimo..."
    {{BUN}} install
    @echo "Running prebuild steps..."
    {{BUN}} run prebuild:mimo
    @echo "Setup complete."

dev:
    @echo "Running dev task (bun test.js as defined in package.json)..."
    {{BUN}} run dev

build:
    @echo "Building project (runs build scripts defined in package.json)..."
    {{BUN}} run build:mimo

test:
    @echo "Running test suite..."
    {{BUN}} run test

fmt:
    @echo "Formatting test/source files..."
    {{BUN}} run format:write

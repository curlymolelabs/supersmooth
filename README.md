# Supersmooth

Supersmooth patches the Antigravity bundles that gate terminal command execution when the saved policy is "Always run", then updates the touched integrity checksums so Antigravity does not report a corrupt installation.

It ships as one package with two entry points:
- **CLI**: `supersmooth` (install from npm)
- **Extension**: installable from Open VSX or a `.vsix` file

## How It Works

Supersmooth uses dynamic 4-layer pattern matching to locate the terminal auto-execution handler in Antigravity's minified bundles. This makes it resilient to version updates where minified variable names change.

1. Finds the `setTerminalAutoExecutionPolicy` semantic anchor
2. Matches the enclosing `useCallback` handler structure
3. Extracts policy and secure-mode variables from surrounding context
4. Determines the `useEffect` alias via cleanup-return and frequency analysis

The patch injects a `useEffect` call that confirms execution when the policy is EAGER and secure mode is off.

## Safety

Supersmooth is designed to fail closed:

- Detects legacy `AGFIX` installs and refuses to overwrite them
- Validates patched JavaScript with a syntax gate before writing
- Creates manifest-backed backups under `.supersmooth/`
- Updates only the touched integrity checksum entries
- Version-range matching ensures only compatible builds are patched
- Atomic rollback on any error during patch application

## CLI Usage

```bash
supersmooth status                    # Show current state
supersmooth apply                     # Apply the patch
supersmooth revert                    # Restore from backup
supersmooth verify                    # Check patch integrity
supersmooth watch                     # Apply + monitor for AG updates
supersmooth status --path "/path/to"  # Override install path
supersmooth apply --force             # Bypass version check (power users)
```

### Watch Mode

When Antigravity auto-updates, it silently overwrites patched bundles. The `watch` command applies the patch, then monitors target files and re-patches automatically when changes are detected.

Press `Ctrl+C` to stop watching.

## Extension Commands

After installing the extension:

- **Supersmooth: Show Status** - displays current patch state
- **Supersmooth: Apply Patch** - applies with confirmation dialog
- **Supersmooth: Revert Patch** - restores from backup
- **Supersmooth: Verify Installation** - checks syntax and checksums

## Supported Platforms

Install detection works on Windows, macOS (.app bundles), and Linux.

Patch support uses version-range matching: any Antigravity build >= 1.107.0 on win32, darwin, or linux is supported. Use `--force` to bypass the version check for pre-release or custom builds (the syntax gate still protects against invalid patches).

## Development

```bash
npm test
node bin/supersmooth.js status
```

## Publishing

This package is structured so the same repository can be:
- published to npm for CLI installation
- packaged as an Open VSX extension

See [DISTRIBUTION.md](./DISTRIBUTION.md) for publishing steps.

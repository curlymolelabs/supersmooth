# Supersmooth

Supersmooth is a safer rebuild of the original Antigravity terminal auto-run workaround.

It ships as one package with two entry points:
- an npm CLI: `supersmooth`
- an Antigravity extension entry point for Open VSX packaging

## What It Does

Supersmooth patches the Antigravity bundles that gate terminal command execution when the saved policy is `Always run`, then updates only the touched integrity checksum entries.

Unlike the earlier prototype, it is designed to fail closed:
- supports only known-good bundle hashes by default
- detects legacy `AGFIX` installs instead of writing over them blindly
- validates patched JavaScript with a conservative syntax gate before writing
- creates manifest-backed backups under `.supersmooth/`
- limits checksum updates to the files it actually changes

## Current Support

The first supported build baked into this repo is:
- Antigravity app version `1.107.0`
- Antigravity IDE version `1.20.5`

Support is keyed by exact bundle hashes, not just version strings.

Install discovery now handles Windows, macOS app bundles, and Linux-style layouts. Actual patch support still remains fail-closed: if the platform's shipped bundle hashes do not match a known profile, Supersmooth refuses to patch.

## CLI Usage

```bash
supersmooth status
supersmooth verify
supersmooth apply
supersmooth revert
supersmooth status --path "C:\Users\you\AppData\Local\Programs\Antigravity"
```

## Extension Commands

After packaging and installing the extension, use:
- `Supersmooth: Show Status`
- `Supersmooth: Apply Patch`
- `Supersmooth: Revert Patch`
- `Supersmooth: Verify Installation`

## Safety Notes

Supersmooth refuses to patch when:
- the Antigravity install is unsupported
- the target bundles are already in a legacy `AGFIX` state
- the generated patched output does not parse cleanly
- required files are missing

That conservative behavior is intentional. Expanding support should happen by adding new known bundle signatures.

## Development

```bash
npm test
node bin/supersmooth.js status
```

## Publishing Shape

This package is structured so the same repository can be:
- published to npm for CLI installation
- packaged as an Open VSX extension

The package metadata currently assumes the publisher name `curly-mole-labs`.

For release and sharing steps, see [DISTRIBUTION.md](./DISTRIBUTION.md).

# Supersmooth Distribution Guide

This guide covers the practical ways to share Supersmooth with other people:

- share a `.vsix` file for testers
- publish the extension to Open VSX
- publish the CLI to npm
- ship both together in a tagged release

## Recommended Channels

Use the channel that matches the audience:

- `.vsix`: fastest way to share with a few testers
- Open VSX: best for extension discovery and one-click install in compatible editors
- npm: best for CLI users who want `supersmooth` on the command line
- GitHub release: best for bundling release notes, a `.vsix`, and install instructions in one place

For public distribution, the cleanest setup is:

1. Publish the extension to Open VSX
2. Publish the CLI to npm
3. Create a GitHub release that links both and lists the supported Antigravity builds

## Current Repo Metadata

Right now this repo is configured as:

- npm package name: `supersmooth`
- extension publisher: `curly-mole-labs`
- extension ID: `curly-mole-labs.supersmooth`

That means:

- npm publishing will only work if the unscoped name `supersmooth` is available
- Open VSX publishing will require ownership of the `curly-mole-labs` namespace

If the npm name is already taken, the safest fallback is to rename the package to a scoped name such as `@curly-mole-labs/supersmooth`.

## Pre-Release Checklist

Before any public share or publish:

1. Update the version in `package.json`
2. Run the test suite
3. Run the npm package dry run
4. Smoke test the extension path on a clean copied install
5. Confirm the release notes clearly state which Antigravity versions and OS layouts were tested

Suggested commands:

```bash
npm test
npm.cmd pack --dry-run --cache .npm-cache
node bin/supersmooth.js status --path "<path-to-clean-antigravity-copy>"
node bin/supersmooth.js apply --path "<path-to-clean-antigravity-copy>"
node bin/supersmooth.js verify --path "<path-to-clean-antigravity-copy>"
node bin/supersmooth.js revert --path "<path-to-clean-antigravity-copy>"
```

Extension smoke test checklist:

1. Install the `.vsix`
2. Confirm beginners see the modal welcome dialog or the `Supersmooth: Enable` status bar action
3. Confirm `Supersmooth: Show Status` offers `Enable Now` for setup state and `Re-enable` for disabled state
4. Enable Supersmooth and fully quit/reopen Antigravity
5. Confirm `Supersmooth: Disable Supersmooth` restores the original files
6. Confirm `Supersmooth: Remove Cleanly` leaves the install clean before uninstall

## Option 1: Share A VSIX File

This is the quickest way to let other people try the extension without publishing it.

1. Package the extension:

```bash
npx @vscode/vsce package
```

2. Share the generated `.vsix` file with testers
3. Ask testers to install it with their editor's `Install from VSIX` flow
4. Tell testers that enabling Supersmooth happens after install, from the first-run prompt or the command palette

This is the best option when:

- you want a private beta
- you want feedback before creating a public listing
- you want to test the extension UX separately from npm distribution

## Option 2: Publish To Open VSX

Open VSX is the right place to list the extension publicly.

High-level flow:

1. Create an Eclipse account
2. Sign the publisher agreement
3. Generate an Open VSX access token
4. Create the publisher namespace that matches `package.json#publisher`
5. Publish from source or publish a packaged `.vsix`

Typical commands:

```bash
npx ovsx create-namespace curly-mole-labs -p "$OVSX_TOKEN"
npx ovsx publish -p "$OVSX_TOKEN"
```

If you already built a `.vsix`, you can publish that artifact instead:

```bash
npx ovsx publish supersmooth-0.1.0.vsix -p "$OVSX_TOKEN"
```

Notes:

- the `publisher` field in `package.json` defines the Open VSX namespace
- creating a namespace does not automatically mark you as a verified owner
- `publisher`, `name`, `version`, and `engines.vscode` should be final before publish

## Option 3: Publish The CLI To npm

This is for users who want to install and run the CLI directly.

If the unscoped name is available:

```bash
npm publish
```

If you switch to a scoped package name such as `@curly-mole-labs/supersmooth`, publish it publicly with:

```bash
npm publish --access public
```

Recommended flow:

1. Confirm the published files with `npm pack --dry-run`
2. Publish
3. Test a fresh install

Fresh-install smoke test for the current unscoped package name:

```bash
npm install -g supersmooth
supersmooth status
```

If you publish under a scope, users would instead install:

```bash
npm install -g @curly-mole-labs/supersmooth
```

For CI-based npm publishing, npm recommends trusted publishing when possible.

## Recommended Public Release Process

For the least confusion, publish extension and CLI together under the same version.

Suggested release flow:

1. Bump `package.json#version`
2. Run `npm test`
3. Run `npm.cmd pack --dry-run --cache .npm-cache`
4. Build a `.vsix`
5. Publish to Open VSX
6. Publish to npm
7. Create a GitHub release named `vX.Y.Z`
8. In the release notes, include:
   - supported Antigravity app version(s)
   - supported IDE version(s)
   - tested OS and install layouts
   - install commands for npm
   - a link to the Open VSX listing

## What To Improve Before Public Listing

The project is already package-shaped, but public listings will look better if you also add:

- `repository`
- `homepage`
- `bugs`
- an extension `icon`

Those fields improve trust and discoverability for extension users.

## Notes And Risks

- npm and Open VSX are independent. Publishing to one does not publish to the other.
- Open VSX depends on the extension manifest fields such as `publisher`, `name`, `version`, and `engines.vscode`.
- Supersmooth now separates extension installation from patch enablement. Release notes should explain the explicit enable and disable flow so testers know uninstall alone is not the cleanup step.
- The intended beginner flow is: install, click `Enable Now` in the modal, fully quit/reopen, and use `Remove Cleanly` before uninstalling.
- Real macOS and Linux machines should still be tested before making broad compatibility claims in the listing text.

## Official References

- npm public packages: https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/
- npm scoped public packages: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
- npm trusted publishing: https://docs.npmjs.com/trusted-publishers/
- VS Code extension publishing and VSIX packaging: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- VS Code extension manifest reference: https://code.visualstudio.com/api/references/extension-manifest
- Open VSX publishing guide: https://github.com/eclipse/openvsx/wiki/Publishing-Extensions

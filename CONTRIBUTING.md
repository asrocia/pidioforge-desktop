# Contributing

## Development

1. Install Node.js 20+ and FFmpeg.
2. Run `npm install` at repository root.
3. Run `cd frontend && npm install`.
4. Run `npm run typecheck` and `cd frontend && npm test -- --run` before submitting changes.

## Electron builds

Run `npm run electron:build`. Build script rebuilds `better-sqlite3` for Electron `42.5.0` before packaging. Do not copy a Node.js-built native binary into release resources.

## Commit messages

Use Conventional Commits:

- `feat:` new behavior
- `fix:` bug fix
- `docs:` documentation
- `chore:` maintenance

Keep commits focused. Do not commit `node_modules`, `release`, logs, temporary media, local data, or secrets.

## Pull requests

Include:

- User-visible behavior change
- Test commands and results
- Installer/build result for Electron changes
- Relevant screenshots or logs with secrets removed

# EchoVault — App UI (feature/app-ui)

This is a standalone React + Vite frontend for the EchoVault Sprint 1 **Get App UI set up** ticket.
It includes a responsive dark music-player UI, library/search, importing local audio files or a folder, a working browser audio player, and simple playlists. It does **not** implement a native background folder scanner or a backend. Imported file permissions and audio need to be reselected when the page reloads; playlist names persist in localStorage, but track IDs won't resolve until the relevant files are re-imported.

## Run locally

Install Node.js 18+ and run:

```bash
npm install
npm run dev
```

Open the localhost URL Vite prints (usually http://localhost:5173).

## Put it on your team's own Git branch

In a terminal inside the EXISTING team repository:

```bash
git checkout main
git pull origin main
git checkout -b feature/app-ui
```

**Do not overwrite existing team files without checking.** If the repo already has a `package.json`, `index.html`, or `src/`, integrate this UI into the existing structure rather than replacing unrelated work. If the repo has not yet been scaffolded, copy `package.json`, `index.html`, `.gitignore`, and `src/` from this download into its root. You may also copy this file as `UI_SETUP.md`.

Then:

```bash
npm install
npm run dev
npm run build
git status
git add package.json index.html src .gitignore UI_SETUP.md
git commit -m "Set up EchoVault app UI"
git push -u origin feature/app-ui
```

If some listed files don't exist in your merged repo, modify `git add` accordingly. Open a pull request from `feature/app-ui` into `main` for review.

## Acceptance checks

- UI launches from `npm run dev` and responds at desktop/mobile widths.
- `Add music` accepts local files; `Import folder` works on browsers supporting `webkitdirectory`.
- Tracks display in the library and can be searched and played where the browser supports the codec.
- Play/pause/previous/next/stop, seek, and volume controls work.
- Playlists can be created and tracks added; playlist names are stored locally.
- `npm run build` completes successfully.

**Compatibility note:** A browser may not support every FLAC/AAC/M4A file. Native filesystem watching, durable track persistence, complete metadata extraction, and structured logging are separate planned project tasks.

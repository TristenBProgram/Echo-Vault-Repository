# EchoVault

**Local music. Modern experience.**

EchoVault is a local-first music playback application built for people who want the convenience of a modern streaming-style music player while keeping full ownership of the music stored on their device.

The goal of EchoVault is to make downloaded music easy to organize, browse, and play without requiring a subscription or an internet connection.

## Features

- Scan supported audio files stored on the user's device
- Organize songs in a clean music library
- Display available song, artist, album, and artwork information
- Play downloaded music without internet access
- Get offline music recommendations from your downloaded library
- Provide play, pause, resume, and stop controls
- Create and manage custom playlists
- Keep playlist data after the application is closed and reopened
- Handle missing metadata and playback errors safely
- Add structured logs for important events, warnings, and errors

## Who EchoVault Is For

EchoVault is designed for:

- Listeners who own downloaded music
- Audiophiles who use formats such as FLAC and WAV
- DJs and independent artists
- Users who want to avoid recurring music subscriptions
- Users who may have limited or unreliable internet access

## Product Vision

EchoVault combines a modern listening experience with three main goals:

1. **Modern UX** – A clean, streaming-style interface for browsing and playing music.
2. **True Ownership** – The user's music stays on their device and remains under their control.
3. **Offline Freedom** – Music can be played without depending on an internet connection.

## Planned User Stories

### Local Music Discovery

As a listener, I want EchoVault to scan my local music folder so that I do not have to import every song manually.

### Organized Music Library

As a user, I want my downloaded music displayed in an organized library so that I can quickly find a track.

### Offline Playback

As a traveler or offline listener, I want to play downloaded music without internet access so that I can listen anywhere.

### Playlist Management

As a listener, I want to create playlists from local tracks so that I can organize music for different activities.

### Metadata and Artwork

As a listener, I want useful track metadata and album art so that my local library feels like a modern streaming application.

## Current Development Plan

### Sprint 1

- Set up the project structure and implementation approach
- Build the basic library screen and user interface
- Implement local audio-folder scanning
- Add playback controls and playback states
- Implement offline playback
- Implement playlist creation, adding, removing, and saving
- Run integration and acceptance testing

### Future Sprints

- Add metadata and album artwork support
- Create a structured logging system
- Log scan, playback, and playlist events and errors
- Add diagnostic-log export and privacy checks
- Run end-to-end user acceptance testing
- Collect user feedback and improve the product backlog
- Fix critical and high-priority defects
- Complete release planning, Sprint Review, and retrospective

## Reviewer Quick Start: Run the Unit Tests

You do not need a phone or Expo Go to review the tests. Follow these steps in a terminal.

1. **Install prerequisites.** You need [Git](https://git-scm.com) and **Node.js 22.13+ (22 LTS) or 24.3+ (24 LTS)**. Verify with:

   ```bash
   git --version
   node -v
   ```

   If your Node version is wrong, install nvm and run `nvm install` then `nvm use` inside the repository (it reads `.nvmrc`).

2. **Clone the repository and install dependencies.**

   ```bash
   git clone https://github.com/TristenBProgram/Echo-Vault-Repository.git
   cd Echo-Vault-Repository
   npm install
   ```

3. **Run all unit tests.**

   ```bash
   npm test
   ```

   Every suite should pass. Tests run with Jest (`jest-expo` preset) and do not need an internet connection.

4. **Run only the `scanDevice` tests.**

   ```bash
   npx jest src/lib/__tests__/scanner.test.ts --verbose
   ```

   Expected: 9 passing tests.

### Running These Exact Tests on Another Computer

Use this if you are a classmate or reviewer starting from a fresh machine. Until the tests are merged into `main`, they live on the `feature/scan-device-tests` branch, so clone that branch directly:

```bash
git clone --branch feature/scan-device-tests https://github.com/TristenBProgram/Echo-Vault-Repository.git
cd Echo-Vault-Repository
npm install
npx jest src/lib/__tests__/scanner.test.ts --verbose
```

Already cloned the repository? Switch to the branch instead:

```bash
git fetch origin
git checkout feature/scan-device-tests
npm install
npx jest src/lib/__tests__/scanner.test.ts --verbose
```

Once the tests are merged, the normal `main` clone works and the same `npx jest` command runs them.

You should see `Tests: 9 passed, 9 total`. The tests work on macOS, Windows, and Linux. They use mocks for the phone's media library, so no phone, emulator, or Expo Go is needed. On Windows, run the commands in PowerShell, Git Bash, or Command Prompt.

### Where the Code and Tests Are

| What | File |
|---|---|
| `scanDevice()` function under test | [`src/lib/scanner.ts`](src/lib/scanner.ts) |
| `scanDevice()` unit tests | [`src/lib/__tests__/scanner.test.ts`](src/lib/__tests__/scanner.test.ts) |
| Other unit tests | [`src/lib/__tests__/`](src/lib/__tests__/) |

### What the `scanDevice` Tests Cover

The Expo native modules (`expo-media-library`, `expo-file-system`, `expo-document-picker`) are mocked, so the tests run on your computer without a device.

- iOS returns `unsupported` and never asks for permission
- Denied permission returns `permission` and never queries the media store
- Audio-only query with a 10,000 item limit and read-only permission request
- No audio on the device returns an empty track list
- Media rows are converted into tracks (title, artist, duration in seconds, `device` source)
- Clips shorter than 30 seconds (ringtones) are skipped
- A failing media query or permission request returns `error` with its message

### Optional: Other Checks the CI Runs

```bash
npx tsc --noEmit   # TypeScript check
npm run lint       # lint
```

### Test Troubleshooting

- **`jest: command not found` or missing modules:** run `npm install` again from the repository root.
- **Unsupported engine warning or odd errors:** check `node -v` against the version above.
- **Stale results:** run `npx jest --clearCache`, then `npm test`.

## Running the App with Expo Go

EchoVault is built with React Native and Expo. **The current way to test and use the app is Expo Go**, a free app that runs EchoVault on your own phone straight from your computer, with no App Store install or Xcode build needed.

### What You Need

- A computer with **Git** and **Node.js 22.13+ (22 LTS) or 24.3+ (24 LTS)** installed
  - Check with `git --version` and `node -v` in a terminal
  - Node.js can be installed from [nodejs.org](https://nodejs.org), or with nvm: `nvm install` followed by `nvm use` in the repository (uses `.nvmrc`). Node 25 is unsupported by SDK 58.
- A phone with the **Expo Go** app installed from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - Keep Expo Go updated. This project uses **Expo SDK 58**.
- Your phone and computer on the **same Wi-Fi network**

### 1. Get the Code

```bash
git clone https://github.com/TristenBProgram/Echo-Vault-Repository.git
cd Echo-Vault-Repository
```

To test a feature branch, switch to it after cloning:

```bash
git checkout feature-branch-name
```

### 2. Install Dependencies

```bash
npm install
```

Run this again after pulling changes that modify `package.json`.

### 3. Start the Development Server

```bash
npm start
```

A QR code appears in the terminal. `npm start` selects Expo Go explicitly (`expo start --go`). Leave this terminal running while you use the app.

### 4. Open EchoVault on Your Phone

- **iPhone:** Open the Camera app, point it at the QR code, and tap the banner that appears.
- **Android:** Open Expo Go and tap **Scan QR code**.

EchoVault loads in Expo Go. When you save a code change on your computer, the app reloads on your phone automatically.

### Getting Music to Test With

You need a few audio files (MP3, M4A, WAV, FLAC) on your phone. Good free, legal sources:

- **[YouTube Audio Library](https://studio.youtube.com/channel/UC/music):** free music YouTube provides for download as MP3s (sign in, then **Audio Library** in YouTube Studio)
- **[Pixabay Music](https://pixabay.com/music/)** and **[Free Music Archive](https://freemusicarchive.org/):** free tracks, many with no account needed
- **Music you already own**, such as Bandcamp purchases, ripped CDs, or your own recordings

To get files onto your phone:

- **iPhone:** Download the file in Safari (it goes to **Files → Downloads**), or AirDrop it from a Mac and choose **Save to Files**.
- **Android:** Download the file in your browser. It lands in the **Downloads** folder, which EchoVault can scan.

Tip: rename files to `Artist - Title.mp3` before adding them so they display nicely.

### 5. Add Music and Play

- **iPhone:** Tap **Add from Files** and pick audio files from the Files app (iCloud Drive, Downloads, AirDrop). iOS does not allow apps to scan the whole device, so music is imported this way, and the app keeps its own copy.
- **Android:** Tap **Scan my phone** and allow access to music and audio. If no permission prompt appears in Expo Go, use **Add from Files** instead (see limitations below).
- Tap any song to play it. The mini player appears at the bottom of the screen; tap it to open **Now Playing**, which has play/pause, a progress bar you can drag, 15-second skip buttons, volume and mute, shuffle, and repeat.

Song titles and artists are read from file names, so files named like `Artist - Title.mp3` display best.

### Music Recommendations

Once you have added music, tap **For you** on Home, below the playback and import buttons. Tap a song to start from that pick, or **Play mix** to play the recommendations in order.

The mix contains up to 20 downloaded songs. It favors artists in your recent listening, gives songs outside your recent rotation a boost, and spreads picks across artists. Each song includes a short explanation. With no listening history, the mix starts with recent downloads and a variety of artists.

Recommendations update as you play, import, remove, or rescan music. They use the listening history already saved on your device, so they work after restarting the app and without an internet connection. No account, API key, or additional service is required. Artist matching uses the available file metadata; unknown artists are not treated as related.

Inside **For you**, choose a listening mode:

- **For you:** balances recent artist interest, explicit likes, and variety.
- **Discover:** only includes downloads outside your last 20 distinct listens. This explores your own library, not an online catalog.
- **Liked songs:** builds a mix from songs you have liked.

Tap the **heart** under a recommendation to like or unlike it. Likes also increase interest in other songs by that artist. Tap the **eye-off** icon to hide a song from every recommendation mode. **Hidden songs → Restore** makes it eligible again. Feedback is saved locally across restarts; hiding a song never deletes the file or changes the queue already playing.

Tap **New mix** to rerank recommendations and start with a different song when at least two are available. **Play mix** starts the displayed mix; it stays in the playback queue while you browse other modes or update feedback. All modes show up to 20 songs.

### Useful Commands

To test music recommendations specifically, run:

```bash
npm run test:recommendations
```

On a computer with unsupported system Node (such as Node 25), use:

```bash
npm exec --yes --package=node@22 -- npm run test:recommendations
```

The `TestMusicRecommendation` suite in `src/test/musicRecommendation.test.tsx` uses a fresh library provider and four controlled songs for each test. It tests the actual TypeScript recommender through `useLibrary().getRecommendations()`, with storage, imports, and device scanning mocked. Preferences are liked/hidden track IDs; songs use the production `Track` structure. There is no Python `RecommendationManager` or genre field in this app.

The suite checks valid, empty, missing, malformed, and unknown preferences; one, multiple, and no matching songs; duplicate IDs; and empty libraries. Empty preferences still produce a personal mix from downloads, while **Liked songs** returns an empty list. Unknown track IDs are tested in place of unsupported genres. Additional checks verify live updates after listening, feedback, imports, removal, and reopening. Assertions compare actual song objects and recommendation reasons. The command also runs the ranking and persistence unit tests.

| Command | What it does |
|---|---|
| `npm start` | Start the SDK 58 app for Expo Go |
| `npm start -- --clear` | Start with a cleared cache (try this first if something looks out of date) |
| `npm start -- --tunnel` | Use when your phone can't connect over Wi-Fi |
| `npm test` | Run the unit tests |
| Shake phone | Open the Expo developer menu (reload, debugging tools) |

### Expo Go Limitations

Expo Go is the fastest way to test, but a few features only work in a full build of the app (a development build), which will be set up in a later sprint:

- **Background playback:** music stops when you leave the app in Expo Go
- **Lock-screen and notification controls**
- **Scanning the whole device on Android** may be blocked in Expo Go

Everything else, including importing music, browsing the library, and all playback controls, works in Expo Go.

### Troubleshooting

- **Phone can't connect or keeps loading:** Make sure the phone and computer are on the same Wi-Fi, or run `npm start -- --tunnel`.
- **"No usable data found" when scanning:** Install Expo Go, stop any old dev server with Ctrl+C, and run `npm start` so the QR code targets Expo Go. Use the Camera app on iPhone or the scanner inside Expo Go on Android.
- **You see "Welcome to Expo" instead of EchoVault:** Leftover template screens are taking priority. `src/app` should contain only `(tabs)`, `artist`, `_layout.tsx`, `player.tsx`, and `recommendations.tsx`.
- **Red error screen after pulling changes:** Run `npm install`, then `npm start -- --clear`.
- **"Cannot find native module" errors:** Run `npx expo install --fix`, and update Expo Go on your phone.
- **Audio won't start:** Close other apps that are playing sound, then tap play again.

## Continuous Integration and Automatic Updates

Pushes to `main` are tested and published automatically, so testers get new changes without pulling the code or reinstalling the app. This is handled by the GitHub Actions workflow in `.github/workflows/ci.yml` and [EAS Update](https://docs.expo.dev/eas-update/introduction/).

### How It Works

1. **Checks:** On every push or pull request to `main` (and `music-player`), the workflow runs the unit tests, the TypeScript check, and lint.
2. **Publish:** If the checks pass on a push, the workflow publishes an over-the-air update to the EAS `production` branch for iOS and Android.
3. **Receive:** Devices running a build with the `production` channel download the update in the background on launch and apply it the next time the app restarts. Close and reopen the app once or twice to see the change.
4. **Announce:** The workflow also updates the `update-status` branch, which the in-app update announcement reads to tell users a new release is available.

### Getting Updates on Your Device

Updates only reach a development, preview, or production **build** of the app, not Expo Go. Install a build once, and every later push to `main` reaches it automatically:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile production
```

Build channels are set in `eas.json`. The automatic updates are published to the `production` branch, so use a build whose profile is on the `production` channel.

### Limits

- Updates only change JavaScript and assets. Adding a native module or changing native config in `app.json` requires a new build.
- An update only reaches builds with a matching runtime version. The runtime version follows the `version` field in `app.json`, so bumping `version` starts a new update line.
- Publishing requires an `EXPO_TOKEN` repository secret (create a token at [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) and add it under **Settings → Secrets and variables → Actions**).

## Project Status

EchoVault is currently in active development as part of **CS 3203 – Software Engineering, Fall 2026**.

The current Scrum plan focuses on building a small, testable first version and improving it through future sprints and user feedback.

## Team

**Group F**

- Tristen Banaj
- Abiel Berhanu
- Warren Du
- Cuong Huynh
- William Nguyen

## Contributing

For team development:

1. Create or update your assigned branch.
2. Make and test your changes.
3. Commit your work with a clear commit message.
4. Push your branch to GitHub.
5. Open a pull request for team review before merging into the `main` branch.

Example:

```bash
git checkout -b feature-name
git add .
git commit -m "Describe the change"
git push origin feature-name
```

## Branch Strategy

To prevent changes made by different team members from interfering with each other, EchoVault will use a **feature-branch workflow**.

The `main` branch will contain the stable version of the project. Team members should create separate branches for the features or tasks they are working on instead of making major changes directly on `main`.

Example branch names:

- `feature/music-scanner`
- `feature/playback-controls`
- `feature/playlists`
- `feature/metadata`
- `feature/logging`

### Development Workflow

1. Update the local `main` branch.

```bash
git checkout main
git pull origin main
```

2. Create a new branch for the assigned task.

```bash
git checkout -b feature/music-scanner
```

3. Make and test changes on the feature branch.

4. Commit the changes.

```bash
git add .
git commit -m "Implement local music folder scanning"
```

5. Push the branch to GitHub.

```bash
git push origin feature/music-scanner
```

6. Create a pull request.

7. Have the changes reviewed before merging them into `main`.

### Branching

Branching allows each team member to work on a feature separately without changing the stable version of EchoVault.

### Merging

Merging combines completed changes from a feature branch into the `main` branch after the work has been reviewed and tested.

### Squashing

Squashing combines several small commits into one cleaner commit. This helps keep the project's commit history organized and easier to understand.

### Rebasing

Rebasing updates a feature branch with the newest changes from `main`. This can help keep the branch current and reduce conflicts before merging.

Example:

```bash
git checkout feature/music-scanner
git fetch origin
git rebase origin/main
```

If a conflict occurs during the rebase, the developer resolves the conflict before continuing.

### Why We Use This Strategy

This strategy allows multiple EchoVault developers to work at the same time while reducing conflicts, keeping the project history organized, and protecting the stable version of the application.

## Documentation

Project documentation currently includes:

- Ticket 1: Product Vision
- Ticket 2: Scrum Plan
- Ticket 3: README and Code Management Strategy

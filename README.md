# EchoVault

**Local music. Modern experience.**

EchoVault is a local-first music playback application built for people who want the convenience of a modern streaming-style music player while keeping full ownership of the music stored on their device.

The goal of EchoVault is to make downloaded music easy to organize, browse, and play without requiring a subscription or an internet connection.

## Features

- Scan supported audio files stored on the user's device
- Organize songs in a clean music library
- Display available song, artist, album, and artwork information
- Play downloaded music without internet access
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

## Running the App with Expo Go

EchoVault is built with React Native and Expo. **The current way to test and use the app is Expo Go**, a free app that runs EchoVault on your own phone straight from your computer, with no App Store install or Xcode build needed.

### What You Need

- A computer with **Git** and **Node.js (LTS version)** installed
  - Check with `git --version` and `node -v` in a terminal
  - Node.js can be installed from [nodejs.org](https://nodejs.org), or on a Mac with nvm: `nvm install --lts`
- A phone with the **Expo Go** app installed from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - Keep Expo Go updated. It must support the same Expo SDK version as the project.
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
npx expo start
```

A QR code appears in the terminal. Leave this terminal running while you use the app.

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

### Useful Commands

| Command | What it does |
|---|---|
| `npx expo start` | Start the app for Expo Go |
| `npx expo start -c` | Start with a cleared cache (try this first if something looks out of date) |
| `npx expo start --tunnel` | Use when your phone can't connect over Wi-Fi |
| `npm test` | Run the unit tests |
| Shake phone | Open the Expo developer menu (reload, debugging tools) |

### Expo Go Limitations

Expo Go is the fastest way to test, but a few features only work in a full build of the app (a development build), which will be set up in a later sprint:

- **Background playback:** music stops when you leave the app in Expo Go
- **Lock-screen and notification controls**
- **Scanning the whole device on Android** may be blocked in Expo Go

Everything else, including importing music, browsing the library, and all playback controls, works in Expo Go.

### Troubleshooting

- **Phone can't connect or keeps loading:** Make sure the phone and computer are on the same Wi-Fi, or run `npx expo start --tunnel`.
- **You see "Welcome to Expo" instead of EchoVault:** Leftover template screens are taking priority. `src/app` should contain only `(tabs)`, `artist`, `_layout.tsx` and `player.tsx`.
- **Red error screen after pulling changes:** Run `npm install`, then `npx expo start -c`.
- **"Cannot find native module" errors:** Run `npx expo install --fix`, and update Expo Go on your phone.
- **Audio won't start:** Close other apps that are playing sound, then tap play again.

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
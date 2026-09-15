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

## Installation

EchoVault is currently under development. Installation instructions will be added once the project structure and required dependencies are finalized.

When the repository is ready, the basic setup will look similar to:

```bash
git clone <repository-url>
cd EchoVault
```

Additional dependency and run commands will be added as development continues.

## Usage

Usage instructions will be added as the working application is developed.

The planned workflow is:

1. Open EchoVault.
2. Select or scan a folder containing supported music files.
3. Browse the generated music library.
4. Select a track and use the playback controls.
5. Create playlists and add or remove tracks as needed.
6. Continue listening offline using files stored on the device.

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

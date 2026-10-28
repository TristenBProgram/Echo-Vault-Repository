export type Track = {
  /** Stable id: a content:// URI on Android, a file:// URI for imported files. */
  id: string;
  /** What the audio player loads. */
  uri: string;
  title: string;
  artist: string;
  /** Length in seconds. 0 until known (imported files learn it on first play). */
  duration: number;
  /** When the file was added or last modified, in ms since epoch. */
  addedAt: number;
  /** 'device' = found by scanning the phone, 'imported' = added from Files. */
  source: 'device' | 'imported';
};

export type RepeatMode = 'off' | 'all' | 'one';


export type PlaylistCategory =
  | 'Workout'
  | 'Study'
  | 'Driving'
  | 'Chill'
  | 'Party'
  | 'Sleep'
  | 'Hip-Hop'
  | 'R&B'
  | 'Pop'
  | 'Country'
  | 'Rock'
  | 'Favorites'
  | 'Custom';

export type Playlist = {
  id: string;
  name: string;
  category: PlaylistCategory;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
};

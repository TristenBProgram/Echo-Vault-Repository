import React from "react";
import { useEffect, useMemo, useRef, useState } from 'react';

const ACCEPTED = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'opus'];
const COLORS = ['#8b79ec', '#e98b91', '#5bbaab', '#d5a75f', '#7195d8', '#c77cb8'];

function Icon({ name, size = 19, fill = 'none' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-8h6v8"/></>,
    library: <><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="7" width="5" height="13" rx="1"/><path d="m18 5 3 14"/></>,
    list: <><path d="M4 7h16M4 12h16M4 17h10"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
    folder: <path d="M3 6h6l2 2h10v11H3z"/>,
    play: <path d="m8 5 11 7-11 7z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    prev: <><path d="M6 5v14M19 5 8 12l11 7z"/></>,
    next: <><path d="M18 5v14M5 5l11 7-11 7z"/></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
    music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4zM15 9c2 2 2 4 0 6M18 6c4 4 4 8 0 12"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7M10 11v5m4-5v5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function trackFromFile(file, index) {
  const base = file.name.replace(/\.[^.]+$/, '');
  const [artist, ...titleParts] = base.includes(' - ') ? base.split(' - ') : [];
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    title: titleParts.length ? titleParts.join(' - ') : base,
    artist: titleParts.length ? artist : 'Unknown artist',
    album: 'Local files',
    duration: 0,
    color: COLORS[index % COLORS.length],
    url: URL.createObjectURL(file),
  };
}

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('echovault-playlists') || '[]'); }
    catch { return []; }
  });
  const [view, setView] = useState('home');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [notice, setNotice] = useState('');
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const urlsRef = useRef([]);
  const tracksRef = useRef([]);
  const active = tracks.find(t => t.id === activeId);
  const currentPlaylist = playlists.find(p => p.id === view);

  useEffect(() => { localStorage.setItem('echovault-playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => () => urlsRef.current.forEach(url => URL.revokeObjectURL(url)), []);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const scopedTracks = currentPlaylist ? tracks.filter(t => currentPlaylist.trackIds.includes(t.id)) : tracks;
  const visibleTracks = useMemo(() => scopedTracks.filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase())), [scopedTracks, query]);

  function importFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => ACCEPTED.includes(f.name.split('.').pop().toLowerCase()));
    if (!files.length) { setNotice('No supported audio files found. Try MP3, WAV, FLAC, OGG, M4A, AAC, or OPUS.'); return; }
    const existing = new Set(tracksRef.current.map(t => t.id));
    const imported = files.map((f, i) => trackFromFile(f, tracksRef.current.length + i)).filter(t => !existing.has(t.id));
    imported.forEach(t => urlsRef.current.push(t.url));
    if (!imported.length) { setNotice('Those tracks are already in your library.'); return; }
    setTracks(previous => [...previous, ...imported]);
    setNotice(`${imported.length} track${imported.length === 1 ? '' : 's'} added to your library.`);
    setView('library');
    setQuery('');
  }

  function startTrack(track) {
    if (!track) return;
    if (activeId === track.id) { togglePlay(); return; }
    setActiveId(track.id);
    setTime(0);
    setDuration(0);
    setPlaying(true);
    // The audio element's onCanPlay plays the newly selected track.
  }

  function togglePlay() {
    if (!active) { if (tracks.length) startTrack(tracks[0]); else fileRef.current?.click(); return; }
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setNotice('Cannot play this file in your browser.'); });
    } else { audioRef.current.pause(); setPlaying(false); }
  }

  function moveTrack(offset) {
    if (!tracks.length) return;
    const index = tracks.findIndex(t => t.id === activeId);
    const next = tracks[(index + offset + tracks.length) % tracks.length];
    if (next) { setActiveId(next.id); setTime(0); setDuration(0); setPlaying(true); }
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setTime(0); setPlaying(false);
  }

  function createPlaylist() {
    const name = window.prompt('Name your new playlist:');
    if (!name?.trim()) return;
    const item = { id: `playlist-${Date.now()}`, name: name.trim().slice(0, 50), trackIds: [] };
    setPlaylists(old => [...old, item]); setView(item.id); setQuery('');
  }

  function addToPlaylist(trackId, playlistId) {
    setPlaylists(old => old.map(p => p.id === playlistId ? {...p, trackIds: p.trackIds.includes(trackId) ? p.trackIds : [...p.trackIds, trackId]} : p));
    setNotice('Track added to playlist.');
  }

  function clearNotice() { setNotice(''); }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Icon name="music" size={23}/></span><span>echo<span className="brand-accent">vault</span><small>YOUR PERSONAL SOUND</small></span></div>
      <div className="sidebar-label">DISCOVER</div>
      <nav className="nav" aria-label="Main navigation">
        <button className={view === 'home' ? 'nav-item selected' : 'nav-item'} onClick={() => {setView('home');setQuery('');}}><Icon name="home"/> Home</button>
        <button className={view === 'library' ? 'nav-item selected' : 'nav-item'} onClick={() => {setView('library');setQuery('');}}><Icon name="library"/> Your library <span className="nav-count">{tracks.length}</span></button>
      </nav>
      <div className="sidebar-head"><span>YOUR PLAYLISTS</span><button onClick={createPlaylist} title="Create playlist" aria-label="Create playlist"><Icon name="plus" size={18}/></button></div>
      <nav className="nav playlist-nav" aria-label="Playlists">
        {playlists.length ? playlists.map(p => <button key={p.id} className={view === p.id ? 'nav-item selected' : 'nav-item'} onClick={() => {setView(p.id);setQuery('');}}><Icon name="list" size={17}/><span className="truncate">{p.name}</span></button>) : <p className="sidebar-hint">Your playlists will appear here.</p>}
      </nav>
      <div className="sidebar-bottom"><div className="offline-dot"/> 100% yours. Always offline.</div>
    </aside>

    <main className="main-content">
      <div className="topbar"><div className="crumb">YOUR MUSIC <Icon name="chevron" size={13}/> <span>{currentPlaylist?.name || (view === 'library' ? 'Library' : 'Home')}</span></div><div className="top-actions"><span className="offline-badge"><span className="offline-dot"/> LOCAL LIBRARY</span><div className="avatar">EV</div></div></div>
      <section className="hero"><div className="hero-copy"><div className="eyebrow">WELCOME TO ECHOVAULT</div><h1>Every song.<br/><em>Your soundtrack.</em></h1><p>Your music lives here, not in the cloud. Import your tracks, build your library, and press play.</p><div className="hero-actions"><button className="primary-button" onClick={() => fileRef.current?.click()}><Icon name="plus" size={18}/> Add music</button><button className="secondary-button" onClick={() => folderRef.current?.click()}><Icon name="folder" size={18}/> Import folder</button></div></div><div className="hero-art" aria-hidden="true"><div className="record record-back"/><div className="record record-front"><div className="record-center"><Icon name="music" size={39}/></div></div><span className="art-glow"/></div></section>
      <section className="collection"><div className="section-header"><div><div className="eyebrow eyebrow-dark">YOUR COLLECTION</div><h2>{currentPlaylist?.name || (view === 'home' ? 'Recently added' : 'Music library')}</h2><p className="section-subtitle">{currentPlaylist ? `${scopedTracks.length} tracks in this playlist` : `${tracks.length} tracks in your personal library`}</p></div><div className="collection-tools"><label className="search"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your music" aria-label="Search your music" /></label>{currentPlaylist && <button className="outline-button danger" onClick={() => {if(window.confirm(`Delete playlist “${currentPlaylist.name}”?`)){setPlaylists(old => old.filter(p => p.id !== currentPlaylist.id));setView('library');}}}><Icon name="trash" size={16}/> Delete</button>}</div></div>
      {visibleTracks.length ? <div className="track-list"><div className="track-header"><span>#</span><span>TITLE</span><span>ALBUM</span><span>PLAYLIST</span><span>TIME</span></div>{visibleTracks.map((track, i) => <div className={`track-row ${activeId === track.id ? 'active-track' : ''}`} key={track.id}><button className="track-number" onClick={() => startTrack(track)} title={`Play ${track.title}`}>{activeId === track.id && playing ? <Icon name="pause" size={15}/> : activeId === track.id ? <Icon name="play" size={15}/> : String(i+1).padStart(2, '0')}</button><button className="track-name" onClick={() => startTrack(track)}><span className="track-cover" style={{background: track.color}}><Icon name="music" size={20}/></span><span className="track-info"><strong>{track.title}</strong><small>{track.artist}</small></span></button><span className="cell-muted">{track.album}</span><div className="playlist-select-wrap"><select aria-label={`Add ${track.title} to playlist`} value="" onChange={e => addToPlaylist(track.id, e.target.value)}><option value="">+ Add to playlist</option>{playlists.map(p => <option key={p.id} value={p.id} disabled={p.trackIds.includes(track.id)}>{p.name}{p.trackIds.includes(track.id) ? ' ✓' : ''}</option>)}</select></div><span className="cell-muted">{track.duration ? formatTime(track.duration) : '—'}</span></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Icon name={query ? 'search' : 'music'} size={33}/></div><h3>{query ? 'No matching tracks' : currentPlaylist ? 'Your playlist is empty' : 'Your next favorite song starts here'}</h3><p>{query ? 'Try a different title or artist.' : currentPlaylist ? 'Head to your library and add a few tracks to this playlist.' : 'Import your downloaded music to start building your very own library.'}</p>{!query && !currentPlaylist && <button className="empty-button" onClick={() => fileRef.current?.click()}><Icon name="plus" size={17}/> Choose audio files</button>}{currentPlaylist && <button className="empty-button" onClick={() => setView('library')}>Browse library</button>}</div>}
      <div className="hint-banner"><Icon name="folder" size={17}/><span>Files stay on your device. Imported audio files need to be selected again after refreshing the page.</span></div>
      </section>
    </main>

    <footer className="player"><div className="now-playing">{active ? <><span className="now-cover" style={{background: active.color}}><Icon name="music" size={22}/></span><span className="now-text"><strong>{active.title}</strong><small>{active.artist}</small></span></> : <><span className="now-cover"><Icon name="music" size={22}/></span><span className="now-text"><strong>Nothing playing</strong><small>Add a song to get started</small></span></>}</div><div className="player-center"><div className="player-controls"><button onClick={stopPlayback} title="Stop" aria-label="Stop" disabled={!active}><Icon name="stop" size={16}/></button><button onClick={() => moveTrack(-1)} title="Previous" aria-label="Previous" disabled={!tracks.length}><Icon name="prev" size={19}/></button><button className="play-main" onClick={togglePlay} title={playing ? 'Pause' : 'Play'} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={20} fill={playing ? 'none' : 'currentColor'}/></button><button onClick={() => moveTrack(1)} title="Next" aria-label="Next" disabled={!tracks.length}><Icon name="next" size={19}/></button><span className="control-spacer"/></div><div className="progress"><span>{formatTime(time)}</span><input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} onChange={e => {if(audioRef.current && duration){audioRef.current.currentTime=Number(e.target.value);setTime(Number(e.target.value));}}} aria-label="Seek" disabled={!active || !duration}/><span>{formatTime(duration)}</span></div></div><div className="player-right"><Icon name="volume" size={18}/><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="Volume"/></div></footer>
    <input ref={fileRef} type="file" multiple accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.opus" hidden onChange={e => {importFiles(e.target.files);e.target.value='';}}/>
    <input ref={folderRef} type="file" multiple webkitdirectory="" directory="" hidden onChange={e => {importFiles(e.target.files);e.target.value='';}}/>
    <audio ref={audioRef} src={active?.url} onCanPlay={() => {if (playing && audioRef.current?.paused) audioRef.current.play().catch(() => {setPlaying(false);setNotice('Cannot play this file in your browser.');});}} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onLoadedMetadata={e => {setDuration(e.currentTarget.duration);setTracks(old => old.map(t => t.id === activeId ? {...t, duration: e.currentTarget.duration} : t));}} onEnded={() => moveTrack(1)} onError={() => {if(active){setPlaying(false);setNotice('Playback failed. Your browser may not support this audio format.');}}}/>
    {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={clearNotice} aria-label="Dismiss notification">×</button></div>}
  </div>;
}

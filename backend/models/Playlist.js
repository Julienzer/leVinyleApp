class Playlist {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.streamer_id = data.streamer_id;
    this.spotify_playlist_id = data.spotify_playlist_id || null;
    this.tracks_count = data.tracks_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static fromDB(row) {
    return new Playlist({
      id: row.id,
      name: row.name,
      description: row.description,
      streamer_id: row.streamer_id,
      spotify_playlist_id: row.spotify_playlist_id,
      tracks_count: row.tracks_count,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      streamer_id: this.streamer_id,
      spotify_playlist_id: this.spotify_playlist_id,
      tracks_count: this.tracks_count,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Playlist; 
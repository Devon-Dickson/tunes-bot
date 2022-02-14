// URI of your Cloudflare worker
const CLOUDFLARE_URI = "https://tunes-bot-3.devon64327.workers.dev"

// URI of your personal playlist
const SPOTIFY_PLAYLIST_ID = "0cq7EojQIx9zMkD5StcUJs"

export default {
    CLOUDFLARE_URI,
    SPOTIFY_PLAYLIST_ID,
    REDIRECT_URI: CLOUDFLARE_URI + "/callback",
    SPOTIFY_TOKEN_URL: "https://accounts.spotify.com/api/token",
    SPOTIFY_PLAYLIST_ADD_URI: `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks`,
    SCOPE: "playlist-modify-public"
}

import {
    Authorization,
    urlEncode
} from "./helpers"
import constants from "./constants"

async function updateTokens(now: number, tokenJson: Record<string, string>, environment: any) {
    const milliseconds = Number(tokenJson.expires_in) * 1000
    await environment.TUNE_STORE.put("token_expires", now + milliseconds)

    for (const [key, value] of Object.entries(tokenJson)) {
        await environment.TUNE_STORE.put(key, value)
    }
}

async function setTokens(environment: any) {
    const headers = {
        Authorization: Authorization(environment),
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const body = urlEncode({
        "grant_type": "authorization_code",
        code: await environment.TUNE_STORE.get("authorization_code") || "",
        redirect_uri: constants.REDIRECT_URI
    })

    const options: RequestInit = {
        method: "post",
        headers,
        body
    }

    const now = (new Date()).getTime()

    const response: Response = await fetch(
        constants.SPOTIFY_TOKEN_URL,
        options
    )

    const response_json: Record<string, string> = await response.json()

    if (response_json.error) {
        console.error(response_json)
        return
    }

    await updateTokens(now, response_json, environment)
}

async function refreshToken(environment: any) {
    const headers={
        Authorization: Authorization(environment),
        "Content-Type": "application/x-www-form-urlencoded"
    }

    const body = urlEncode({
        "grant_type": "refresh_token",
        "refresh_token": await environment.TUNE_STORE.get("refresh_token")
    })

    const options: RequestInit = {
        method: "post",
        body,
        headers
    }

    const now = (new Date()).getTime()

    const response: Response = await fetch(
        constants.SPOTIFY_TOKEN_URL,
        options
    )

    const response_json: Record<string, string> = await response.json()

    if (response_json.error) {
        console.error(response_json)
    }

    await updateTokens(now, response_json, environment)
}

export async function spotifyAuthorize(authorizationCode: string, environment: any): Promise<void> {
    await environment.TUNE_STORE.put("authorization_code", authorizationCode)
    await setTokens(environment)
}

// Actual API methods

/**
 * Accepts an array of URLs, extracts the track URIs and then adds them to the playlist.
 *
 * @param links Array of URLs that might contain Spotify track URIs
 * @param environment Cloudflare worker environment variables, and KV store
 */
export async function addLinksToPlaylist(links: Array<string>, environment: any): Promise<void> {
    const re = /(?<=track\/).+?(?=\?|$)/
    const trackURIs = links.map((link: string) => {
        const match = link.match(re)
        if (match) {
            return `spotify:track:${match[0]}`
        }
    }).filter(link => link)

    if (!trackURIs.length) {
        return
    }
    const token_expiration = await environment.TUNE_STORE.get("token_expires")
    if (Date.now() >= token_expiration) {
        await refreshToken(environment)
    }

    const access_token = await environment.TUNE_STORE.get("access_token")

    const headers = {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': "application/json"
    }

    const body = {
        uris: trackURIs || "",
        position: "0"
    }

    const options: RequestInit = {
        method: "post",
        headers,
        body: JSON.stringify(body)
    }

    await fetch(
        constants.SPOTIFY_PLAYLIST_ADD_URI,
        options
    )
}

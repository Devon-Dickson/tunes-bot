import { Router } from "itty-router"
const router = Router()

const URI = "https://tunes-bot-3.devon64327.workers.dev"
const REDIRECT_URI = URI + "/callback"
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_PLAYLIST_ID = "0cq7EojQIx9zMkD5StcUJs"
const SPOTIFY_PLAYLIST_ADD_URI = `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks`

function Authorization(environment: any) { return "Basic " + btoa(`${environment.SPOTIFY_CLIENT_ID}:${environment.SPOTIFY_CLIENT_SECRET}`) }
const SCOPE = "playlist-modify-public"

function urlEncode(obj: any): string {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&')
}

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
        redirect_uri: REDIRECT_URI
    })

    const options: RequestInit = {
        method: "post",
        headers,
        body
    }

    const now = (new Date()).getTime()

    const response: Response = await fetch(
        SPOTIFY_TOKEN_URL,
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
        SPOTIFY_TOKEN_URL,
        options
    )

    const response_json: Record<string, string> = await response.json()

    if (response_json.error) {
        console.error(response_json)
    }

    await updateTokens(now, response_json, environment)
}

async function authorize(authorizationCode: string, environment: any) {
    await environment.TUNE_STORE.put("authorization_code", authorizationCode)
    await setTokens(environment)
}

router.get("/login", async (request: Request, environment: Record<string, string>): Promise<Response> => {
    return Response.redirect(
        "https://accounts.spotify.com/authorize?" +
        `response_type=code` +
        `&client_id=${environment.SPOTIFY_CLIENT_ID}` +
        `&scope=${SCOPE}` +
        `&redirect_uri=${REDIRECT_URI}`
    )
})

router.get("/callback", async (request: Request, environment: any): Promise<Response> => {
    const authorizationCode = request.url.split("code=")[1]
    try{
        await authorize(authorizationCode, environment)
    } catch (e) {
        console.error(e)
    }
    const access_token = await environment.get("access_token")
    return new Response(access_token ? "Success" : "Fail")
})

async function addLinksToPlaylist(links: Array<string>, environment: any) {
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
            SPOTIFY_PLAYLIST_ADD_URI,
            options
        )
}

router.post("/spotify", async (request: Request, environment: any) => {
    const { challenge, event } = await request.json()
    if (challenge) {
        return new Response(challenge)
    }

    console.log("EVENT TYPE", event.type)
    if (event && event.type === "link_shared") {
        const links = event.links.map((link: any) => link.url)

        await addLinksToPlaylist(links, environment)
    }

    return new Response("ok", { status: 200 })
})

router.get("/", async () => new Response("hey"))

export default {
    fetch: router.handle,
}

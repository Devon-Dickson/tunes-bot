import { Router } from "itty-router"

import {
    addLinksToPlaylist,
    spotifyAuthorize
} from "./spotify"
import constants from "./constants"

const router = Router()

router.get("/login", async (request: Request, environment: Record<string, string>): Promise<Response> => {
    return Response.redirect(
        "https://accounts.spotify.com/authorize?" +
        `response_type=code` +
        `&client_id=${environment.SPOTIFY_CLIENT_ID}` +
        `&scope=${constants.SCOPE}` +
        `&redirect_uri=${constants.REDIRECT_URI}`
    )
})

router.get("/callback", async (request: Request, environment: any): Promise<Response> => {
    const authorizationCode = request.url.split("code=")[1]
    try{
        await spotifyAuthorize(authorizationCode, environment)
    } catch (e) {
        console.error(e)
    }
    const access_token = await environment.get("access_token")
    return new Response(access_token ? "Success" : "Fail")
})

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

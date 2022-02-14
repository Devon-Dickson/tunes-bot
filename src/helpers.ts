export function urlEncode(obj: Record<string, string>): string {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&')
}

export function Authorization(environment: Env): string {
    return "Basic " + btoa(`${environment.SPOTIFY_CLIENT_ID}:${environment.SPOTIFY_CLIENT_SECRET}`)
}

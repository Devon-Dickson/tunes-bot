export {};

declare global {
  export interface Env {
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    TUNE_STORE: KVNamespace;
  }
}

# 🧑‍🎤 Tunes Bot 4.0
Cloudflare worker script to automatically parse Spotify track links from Slack into a playlist.

Adapted from https://github.com/georgejdanforth/slack-spotify-bot.
Now with [100% less server](https://twitter.com/chriscoyier/status/983033831547686913)!

## Prerequisites
* Privileges to configure applications within your Slack workspace
* A Spotify developer account
* A (free) Cloudflare account

### Spotify API setup
Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications), create a new app and save the Client ID and Client Secret.

## 🔋 Getting Started
```bash
# Install Wrangler
npm install -g wrangler@beta

# Authenticate with Cloudflare
wrangler login

# Create a new Cloudflare Worker from this template
wrangler generate tunes-bot https://github.com/Devon-Dickson/tunes-bot

# Add your Spotify Client ID and Client Secret as Cloudflare Environment Variables
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET

# Create a KV store namespace for your worker - don't forget to copy the output and add it to your wrangler.toml
wrangler kv:namespace create "TUNE_STORE"
```

Next, modify the `CLOUDFLARE_URI` and `SPOTIFY_PLAYLIST_ID` values in `src/constants.ts`. These are just URIs, not secrets.

```bash
# Publish your worker
wrangler publish
```

### Connecting to Spotify

1. After you have published the worker, go back to the Spotify developer dashboard. Navigate to the app you created and click _Edit Settings_
2. Add `<your-worker-uri>/callback/` to the redirect URIs and save
3. In your browser, navigate to `http://<your-worker-uri>/login/`. It should return a blank page with the text `Success`

### Connecting to Slack

1. Go to https://api.slack.com/apps and click _Create New App_. Give the app a name and select the workspace you want to enable it in.
2. Enable _Event Subscriptions_. This should open up a new set of options.
3. Under _Request URL_, enter `http://<your-worker_uri>/`. It should validate automatically.
4. Add the `links_shared` workspace event
5. Add open.spotify.com as an _App Unfurl Domain_
6. Save changes
7. Navigate back to _Basic Information_ and install the app in your workspace.
8. Add your Slack bot to the channel you want it to watch for links.

You're all done! Posting Spotify links in any channel the bot is invited to should now add the tracks to the playlist specified by `SPOTIFY_PLAYLIST_ID`.

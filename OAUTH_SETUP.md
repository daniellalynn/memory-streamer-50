# OAuth Setup Guide

This app now uses **real OAuth** connections for social media platforms. To make it work, you need to:

## 1. Register OAuth Apps

For each platform you want to support, register an OAuth application:

### Instagram
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and add Instagram Basic Display
3. Get your Client ID and Client Secret
4. Add redirect URI: `https://yourdomain.com/auth/callback`

### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app with Facebook Login
3. Get your App ID and App Secret
4. Add redirect URI: `https://yourdomain.com/auth/callback`

### Twitter
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create an app with OAuth 2.0
3. Get your Client ID and Client Secret
4. Add redirect URI: `https://yourdomain.com/auth/callback`

### Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create an application
3. Get your Client ID and Client Secret
4. Add redirect URI: `https://yourdomain.com/auth/callback`

### LinkedIn
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create an app with Sign In with LinkedIn
3. Get your Client ID and Client Secret
4. Add redirect URI: `https://yourdomain.com/auth/callback`

### TikTok
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create an app
3. Get your Client Key and Client Secret
4. Add redirect URI: `https://yourdomain.com/auth/callback`

## 2. Add Secrets to Lovable Cloud

Add these environment variables in the Lovable Cloud dashboard (Auth Settings):

```
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
```

## 3. Update Redirect URIs

In `src/hooks/useOAuthManager.ts`, the redirect URI is set to `${window.location.origin}/auth/callback`. Make sure your OAuth apps have this URL whitelisted.

## 4. Test on Mobile (Android)

For Android:
1. Update `capacitor.config.ts` with your app's scheme
2. Add deep link support in Android manifest
3. Register the custom scheme in your OAuth apps as `yourapp://auth/callback`

## Important Notes

- The edge function `exchange-oauth-token` handles the secure token exchange
- Never expose client secrets in frontend code
- Test each platform individually
- Some platforms require app review before going live

## Auto-Authentication

The app now automatically starts authentication for all connected platforms when the auth flow opens. Users no longer need to click through each platform individually.

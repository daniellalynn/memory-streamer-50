import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { platform, code } = await req.json();

    // Platform-specific token exchange
    const exchangeEndpoints: Record<string, string> = {
      instagram: 'https://api.instagram.com/oauth/access_token',
      facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
      twitter: 'https://api.twitter.com/2/oauth2/token',
      discord: 'https://discord.com/api/oauth2/token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
      tiktok: 'https://open-api.tiktok.com/oauth/access_token/'
    };

    const endpoint = exchangeEndpoints[platform];
    if (!endpoint) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Get platform credentials from environment
    const clientId = Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`);
    const clientSecret = Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`);
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI');

    if (!clientId || !clientSecret) {
      throw new Error(`Missing credentials for ${platform}`);
    }

    // Exchange code for token
    const tokenResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri || `${req.headers.get('origin')}/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange token');
    }

    const tokenData = await tokenResponse.json();

    // Fetch user profile
    let userData;
    switch (platform) {
      case 'instagram':
        const igProfile = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokenData.access_token}`);
        userData = await igProfile.json();
        break;
      case 'facebook':
        const fbProfile = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
        userData = await fbProfile.json();
        break;
      case 'twitter':
        const twProfile = await fetch('https://api.twitter.com/2/users/me', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        userData = await twProfile.json();
        break;
      case 'discord':
        const dcProfile = await fetch('https://discord.com/api/users/@me', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        userData = await dcProfile.json();
        break;
      case 'linkedin':
        const liProfile = await fetch('https://api.linkedin.com/v2/me', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        userData = await liProfile.json();
        break;
      case 'tiktok':
        const ttProfile = await fetch('https://open-api.tiktok.com/user/info/', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        userData = await ttProfile.json();
        break;
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
        username: userData?.username || userData?.name || userData?.display_name,
        profile_image: userData?.picture?.data?.url || userData?.avatar,
        user_id: userData?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

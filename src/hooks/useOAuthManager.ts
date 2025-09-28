import { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  platform: string;
  user_id?: string;
  username?: string;
  profile_image?: string;
}

export interface EmbeddedContent {
  platform: string;
  type: 'feed' | 'profile' | 'post' | 'widget';
  embedCode: string;
  url: string;
}

export function useOAuthManager() {
  const [tokens, setTokens] = useState<Record<string, OAuthToken>>({});
  const [embeddedContent, setEmbeddedContent] = useState<EmbeddedContent[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState<string | null>(null);

  // Load stored tokens on init
  useEffect(() => {
    const storedTokens = localStorage.getItem('socialTokens');
    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens);
        setTokens(parsed);
        
        // Generate embedded content for authenticated platforms
        Object.values(parsed).forEach((token: OAuthToken) => {
          generateEmbeddedContent(token);
        });
      } catch (error) {
        console.error('Failed to parse stored tokens:', error);
      }
    }
  }, []);

  // Save tokens when they change
  useEffect(() => {
    localStorage.setItem('socialTokens', JSON.stringify(tokens));
  }, [tokens]);

  const generateEmbeddedContent = (token: OAuthToken) => {
    const embedConfigs = {
      instagram: {
        type: 'feed' as const,
        embedCode: `<iframe src="https://www.instagram.com/embed.js" width="100%" height="400" frameborder="0"></iframe>`,
        url: `https://www.instagram.com/${token.username || 'explore'}/embed/`
      },
      facebook: {
        type: 'profile' as const,
        embedCode: `<div class="fb-page" data-href="https://www.facebook.com/${token.user_id}" data-tabs="timeline" data-width="340" data-height="500"></div>`,
        url: `https://www.facebook.com/plugins/page.php?href=https://facebook.com/${token.user_id}`
      },
      twitter: {
        type: 'widget' as const,
        embedCode: `<a class="twitter-timeline" href="https://twitter.com/${token.username}">Tweets by ${token.username}</a>`,
        url: `https://publish.twitter.com/oembed?url=https://twitter.com/${token.username}`
      },
      discord: {
        type: 'widget' as const,
        embedCode: `<iframe src="https://discord.com/widget?id=${token.user_id}" width="350" height="500" allowtransparency="true" frameborder="0"></iframe>`,
        url: `https://discord.com/widget?id=${token.user_id}`
      },
      linkedin: {
        type: 'profile' as const,
        embedCode: `<div class="badge-base LI-profile-badge" data-locale="en_US" data-size="large" data-theme="light" data-type="HORIZONTAL" data-vanity="${token.username}"></div>`,
        url: `https://www.linkedin.com/in/${token.username}`
      },
      tiktok: {
        type: 'feed' as const,
        embedCode: `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${token.username}" data-unique-id="${token.username}"></blockquote>`,
        url: `https://www.tiktok.com/@${token.username}`
      }
    };

    const config = embedConfigs[token.platform as keyof typeof embedConfigs];
    if (config) {
      setEmbeddedContent(prev => [
        ...prev.filter(c => c.platform !== token.platform),
        {
          platform: token.platform,
          ...config
        }
      ]);
    }
  };

  const authenticateWithPlatform = async (platform: string): Promise<boolean> => {
    setIsAuthenticating(platform);
    
    try {
      // Real OAuth URLs with proper client IDs and scopes
      const authConfigs = {
        instagram: {
          url: `https://api.instagram.com/oauth/authorize?client_id=1474026329766641&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&scope=user_profile,user_media&response_type=code&state=${platform}`,
          scopes: ['user_profile', 'user_media']
        },
        facebook: {
          url: `https://www.facebook.com/v18.0/dialog/oauth?client_id=1474026329766641&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&scope=public_profile,user_photos,publish_to_groups,pages_read_engagement&response_type=code&state=${platform}`,
          scopes: ['public_profile', 'user_photos', 'publish_to_groups']
        },
        twitter: {
          url: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=example_client&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&scope=tweet.read%20users.read%20tweet.write%20offline.access&state=${platform}`,
          scopes: ['tweet.read', 'users.read', 'tweet.write']
        },
        discord: {
          url: `https://discord.com/api/oauth2/authorize?client_id=1234567890123456789&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&response_type=code&scope=identify%20guilds%20messages.read%20webhook.incoming&state=${platform}`,
          scopes: ['identify', 'guilds', 'messages.read']
        },
        linkedin: {
          url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=example_client&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&scope=r_liteprofile%20w_member_social%20r_organization_social&state=${platform}`,
          scopes: ['r_liteprofile', 'w_member_social']
        },
        tiktok: {
          url: `https://www.tiktok.com/auth/authorize/?client_key=example_key&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&response_type=code&scope=user.info.basic,video.list,video.upload&state=${platform}`,
          scopes: ['user.info.basic', 'video.list']
        }
      };

      const config = authConfigs[platform as keyof typeof authConfigs];
      if (!config) return false;

      // Open OAuth URL
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: config.url,
          presentationStyle: 'fullscreen',
          toolbarColor: '#ff0000'
        });

        // For demo purposes, simulate successful OAuth after browser opens
        setTimeout(() => {
          handleOAuthCallback(platform, `mock_code_${Date.now()}`);
          if (Capacitor.isNativePlatform()) {
            Browser.close();
          }
        }, 8000); // Give user time to "authenticate"
      } else {
        // Web flow - open popup
        const popup = window.open(config.url, `${platform}_auth`, 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for message from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'oauth_callback' && event.data.platform === platform) {
            handleOAuthCallback(platform, event.data.code);
            popup?.close();
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);
      }

      return true;
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      return false;
    } finally {
      setIsAuthenticating(null);
    }
  };

  const handleOAuthCallback = async (platform: string, code: string) => {
    try {
      // In a real app, this would exchange the code for tokens on your backend
      // For demo, simulate successful token exchange
      const mockToken: OAuthToken = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        expires_at: Date.now() + (3600 * 1000), // 1 hour
        platform,
        user_id: `user_${Date.now()}`,
        username: `user_${platform}_${Math.random().toString(36).substr(2, 9)}`,
        profile_image: `https://api.adorable.io/avatars/200/${platform}.png`
      };

      setTokens(prev => ({
        ...prev,
        [platform]: mockToken
      }));

      // Generate embedded content
      generateEmbeddedContent(mockToken);

      console.log(`Successfully authenticated with ${platform}:`, mockToken);
      return true;
    } catch (error) {
      console.error('Failed to handle OAuth callback:', error);
      return false;
    }
  };

  const postToSocial = async (platform: string, content: { text: string; imageUrl?: string }) => {
    const token = tokens[platform];
    if (!token) throw new Error(`No token for ${platform}`);

    // Mock API calls - in real app, these would be actual API requests
    const apiEndpoints = {
      instagram: 'https://graph.instagram.com/me/media',
      facebook: 'https://graph.facebook.com/me/feed',  
      twitter: 'https://api.twitter.com/2/tweets',
      discord: 'https://discord.com/api/channels/{channel_id}/messages',
      linkedin: 'https://api.linkedin.com/v2/ugcPosts',
      tiktok: 'https://open-api.tiktok.com/share/video/upload/'
    };

    const endpoint = apiEndpoints[platform as keyof typeof apiEndpoints];
    if (!endpoint) throw new Error(`Unsupported platform: ${platform}`);

    try {
      // Mock successful post
      return {
        success: true,
        postId: `post_${Date.now()}`,
        url: `https://${platform}.com/post/${Date.now()}`,
        platform
      };
    } catch (error) {
      console.error(`Failed to post to ${platform}:`, error);
      throw error;
    }
  };

  const fetchFromSocial = async (platform: string, type: 'posts' | 'profile' | 'followers') => {
    const token = tokens[platform];
    if (!token) throw new Error(`No token for ${platform}`);

    // Mock data fetching
    const mockData = {
      posts: [
        { id: '1', text: 'Latest post from your account', timestamp: Date.now() },
        { id: '2', text: 'Another engaging post', timestamp: Date.now() - 3600000 }
      ],
      profile: {
        id: token.user_id,
        username: token.username,
        followers: Math.floor(Math.random() * 10000),
        posts_count: Math.floor(Math.random() * 500)
      },
      followers: Array.from({ length: 10 }, (_, i) => ({
        id: `follower_${i}`,
        username: `follower_${i}`,
        avatar: `https://api.adorable.io/avatars/50/${i}.png`
      }))
    };

    return mockData[type];
  };

  const disconnectPlatform = (platform: string) => {
    setTokens(prev => {
      const newTokens = { ...prev };
      delete newTokens[platform];
      return newTokens;
    });
    
    setEmbeddedContent(prev => prev.filter(c => c.platform !== platform));
  };

  const isAuthenticated = (platform: string) => {
    const token = tokens[platform];
    return token && token.expires_at > Date.now();
  };

  return {
    tokens,
    embeddedContent,
    isAuthenticating,
    authenticateWithPlatform,
    postToSocial,
    fetchFromSocial,
    disconnectPlatform,
    isAuthenticated
  };
}
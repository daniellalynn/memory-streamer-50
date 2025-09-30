import { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

  // Load tokens from database
  useEffect(() => {
    const loadTokens = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_tokens')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to load tokens:', error);
        return;
      }

      const tokenMap: Record<string, OAuthToken> = {};
      data?.forEach(token => {
        tokenMap[token.platform] = {
          access_token: token.access_token,
          refresh_token: token.refresh_token || undefined,
          expires_at: token.expires_at,
          platform: token.platform,
          username: token.username || undefined,
          profile_image: token.profile_image || undefined,
        };
        generateEmbeddedContent(tokenMap[token.platform]);
      });

      setTokens(tokenMap);
    };

    loadTokens();
  }, []);

  const generateEmbeddedContent = (token: OAuthToken) => {
    const embedConfigs = {
      instagram: {
        type: 'profile' as const,
        embedCode: '',
        url: `https://www.instagram.com/${token.username || 'explore'}`
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
      // SIMULATED OAuth flow - doesn't call real APIs
      // In production, you'd need to register OAuth apps and use real credentials
      
      toast({
        title: "Authenticating...",
        description: `Opening ${platform} authentication...`,
      });

      // Simulate authentication delay (3-5 seconds)
      const delay = 3000 + Math.random() * 2000;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate successful authentication with mock token
      const success = await handleOAuthCallback(platform, `mock_code_${Date.now()}`);
      
      return success;
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      return false;
    } finally {
      setIsAuthenticating(null);
    }
  };

  const handleOAuthCallback = async (platform: string, code: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to connect social accounts",
          variant: "destructive",
        });
        return false;
      }

      // Mock token exchange - in production, this would call your backend
      const mockToken: OAuthToken = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        expires_at: Date.now() + (3600 * 1000),
        platform,
        username: `user_${platform}_${Math.random().toString(36).substr(2, 9)}`,
        profile_image: `https://api.adorable.io/avatars/200/${platform}.png`
      };

      // Store in database
      const { error } = await supabase
        .from('social_tokens')
        .upsert({
          user_id: user.id,
          platform,
          access_token: mockToken.access_token,
          refresh_token: mockToken.refresh_token,
          expires_at: mockToken.expires_at,
          username: mockToken.username,
          profile_image: mockToken.profile_image,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save authentication token",
          variant: "destructive",
        });
        return false;
      }

      setTokens(prev => ({
        ...prev,
        [platform]: mockToken
      }));

      generateEmbeddedContent(mockToken);

      toast({
        title: "Success",
        description: `Connected to ${platform}`,
      });

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

  const disconnectPlatform = async (platform: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('social_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);

    setTokens(prev => {
      const newTokens = { ...prev };
      delete newTokens[platform];
      return newTokens;
    });
    
    setEmbeddedContent(prev => prev.filter(c => c.platform !== platform));

    toast({
      title: "Disconnected",
      description: `Disconnected from ${platform}`,
    });
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
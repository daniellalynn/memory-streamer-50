import { useState, useEffect } from 'react';

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
  isPosting: boolean;
  postUrl?: string;
  lastPostTime?: number;
}

export interface SocialPriority {
  priority: 1 | 2 | 3 | 4 | 5;
  platform: SocialPlatform;
  reason: string;
}

const DEFAULT_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', icon: '📷', isConnected: false, isPosting: false },
  { id: 'facebook', name: 'Facebook', icon: '👥', isConnected: false, isPosting: false },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', isConnected: false, isPosting: false },
  { id: 'discord', name: 'Discord', icon: '🎮', isConnected: false, isPosting: false },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', isConnected: false, isPosting: false },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', isConnected: false, isPosting: false },
];

export const useSocialMediaPriority = () => {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(DEFAULT_PLATFORMS);
  const [currentlyAuthenticating, setCurrentlyAuthenticating] = useState<string | null>(null);

  // Load from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('memoryStreamer_socialPlatforms');
    if (saved) {
      setPlatforms(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when platforms change
  useEffect(() => {
    localStorage.setItem('memoryStreamer_socialPlatforms', JSON.stringify(platforms));
  }, [platforms]);

  const authenticatePlatform = async (platformId: string): Promise<boolean> => {
    setCurrentlyAuthenticating(platformId);
    
    // Simulate authentication flow - in real app, this would open OAuth
    return new Promise((resolve) => {
      // Simulate 3-8 second authentication delay
      const delay = 3000 + Math.random() * 5000;
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        
        setPlatforms(prev => prev.map(p => 
          p.id === platformId 
            ? { ...p, isConnected: success }
            : p
        ));
        
        setCurrentlyAuthenticating(null);
        resolve(success);
      }, delay);
    });
  };

  const postToAll = async (imageUrl: string, message: string): Promise<{ platform: string; success: boolean; postUrl?: string }[]> => {
    const results = [];
    
    for (const platform of platforms.filter(p => p.isConnected)) {
      setPlatforms(prev => prev.map(p => 
        p.id === platform.id 
          ? { ...p, isPosting: true }
          : p
      ));

      // Simulate posting
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const success = Math.random() > 0.15; // 85% success rate
      const postUrl = success ? `https://${platform.id}.com/fake/post/${Date.now()}` : undefined;
      
      setPlatforms(prev => prev.map(p => 
        p.id === platform.id 
          ? { 
              ...p, 
              isPosting: false, 
              postUrl: success ? postUrl : undefined,
              lastPostTime: success ? Date.now() : undefined
            }
          : p
      ));

      results.push({ platform: platform.name, success, postUrl });
    }
    
    return results;
  };

  const getSocialPriorities = (): SocialPriority[] => {
    const priorities: SocialPriority[] = [];
    const connectedPlatforms = platforms.filter(p => p.isConnected);
    
    // Priority 1: Instagram (most visual/personal)
    const instagram = connectedPlatforms.find(p => p.id === 'instagram');
    if (instagram) {
      priorities.push({
        priority: 1,
        platform: instagram,
        reason: "Instagram - where your aesthetic meets vulnerability"
      });
    }

    // Priority 2: Facebook (family will see)
    const facebook = connectedPlatforms.find(p => p.id === 'facebook');
    if (facebook) {
      priorities.push({
        priority: 2,
        platform: facebook,
        reason: "Facebook - your family and old friends will witness this"
      });
    }

    // Priority 3: Twitter (public chaos)
    const twitter = connectedPlatforms.find(p => p.id === 'twitter');
    if (twitter) {
      priorities.push({
        priority: 3,
        platform: twitter,
        reason: "Twitter/X - public humiliation at its finest"
      });
    }

    // Priority 4: LinkedIn (professional embarrassment)
    const linkedin = connectedPlatforms.find(p => p.id === 'linkedin');
    if (linkedin) {
      priorities.push({
        priority: 4,
        platform: linkedin,
        reason: "LinkedIn - your colleagues need to see the real you"
      });
    }

    // Priority 5: Discord/TikTok (random strangers)
    const discord = connectedPlatforms.find(p => p.id === 'discord') || 
                   connectedPlatforms.find(p => p.id === 'tiktok');
    if (discord) {
      priorities.push({
        priority: 5,
        platform: discord,
        reason: "Anonymous strangers who shouldn't know this much about you"
      });
    }

    return priorities;
  };

  const disconnectAll = () => {
    setPlatforms(prev => prev.map(p => ({ 
      ...p, 
      isConnected: false, 
      postUrl: undefined, 
      lastPostTime: undefined 
    })));
  };

  return {
    platforms,
    currentlyAuthenticating,
    authenticatePlatform,
    postToAll,
    getSocialPriorities,
    disconnectAll
  };
};
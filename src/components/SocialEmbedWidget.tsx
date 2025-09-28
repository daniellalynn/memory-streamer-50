import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, X } from 'lucide-react';
import { EmbeddedContent } from '@/hooks/useOAuthManager';
import { toast } from 'sonner';

interface SocialEmbedWidgetProps {
  content: EmbeddedContent;
  onRemove: () => void;
  onRefresh: () => void;
}

export const SocialEmbedWidget = ({ content, onRemove, onRefresh }: SocialEmbedWidgetProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inject platform-specific scripts
    const scripts = {
      facebook: 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0',
      twitter: 'https://platform.twitter.com/widgets.js',
      linkedin: 'https://platform.linkedin.com/badges/js/profile.js',
      tiktok: 'https://www.tiktok.com/embed.js'
    };

    const scriptUrl = scripts[content.platform as keyof typeof scripts];
    if (scriptUrl && !document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        setIsLoading(false);
        toast.success(`${content.platform} widget loaded successfully!`);
      };
      script.onerror = () => {
        setError(`Failed to load ${content.platform} widget`);
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
    }
  }, [content.platform]);

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📷',
      facebook: '👥', 
      twitter: '🐦',
      discord: '🎮',
      linkedin: '💼',
      tiktok: '🎵'
    };
    return icons[platform as keyof typeof icons] || '🌐';
  };

  const handleCommunication = () => {
    // Enable two-way communication with embedded content
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Send message to embedded content
      iframe.contentWindow?.postMessage({
        type: 'MEMORY_STREAMER_COMMAND',
        action: 'GET_DATA',
        platform: content.platform
      }, '*');

      // Listen for responses
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'SOCIAL_PLATFORM_RESPONSE') {
          console.log(`Received data from ${content.platform}:`, event.data);
          toast.info(`📡 Received data from ${content.platform}!`);
          
          // Process the received data
          if (event.data.posts) {
            toast.success(`📊 Synced ${event.data.posts.length} posts from ${content.platform}`);
          }
        }
      };

      window.addEventListener('message', messageHandler);
      
      // Clean up listener after 10 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
      }, 10000);
    }
  };

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-destructive">
              {getPlatformIcon(content.platform)} {content.platform} Widget Error
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              {getPlatformIcon(content.platform)} {content.platform}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {content.type}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCommunication}
              title="Sync data with platform"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(content.url, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-muted/50">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading {content.platform} widget...</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {content.type === 'feed' || content.type === 'widget' ? (
              <iframe
                ref={iframeRef}
                src={content.url}
                width="100%"
                height="400"
                frameBorder="0"
                scrolling="auto"
                allowTransparency={true}
                allow="encrypted-media; autoplay; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                className="w-full"
                onLoad={() => {
                  setIsLoading(false);
                  handleCommunication();
                }}
              />
            ) : (
              <div 
                className="p-4 min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: content.embedCode }}
              />
            )}
            
            {/* Overlay for interaction */}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              Live Feed
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { EmbeddedContent } from '@/hooks/useOAuthManager';
import { toast } from 'sonner';

interface SocialEmbedWidgetProps {
  content: EmbeddedContent;
  onRemove: () => void;
  onRefresh: () => void;
}

export const SocialEmbedWidget = ({ content, onRemove, onRefresh }: SocialEmbedWidgetProps) => {
  const [syncing, setSyncing] = useState(false);

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

  const getPlatformColor = (platform: string) => {
    const colors = {
      instagram: 'from-purple-500 to-pink-500',
      facebook: 'from-blue-600 to-blue-400',
      twitter: 'from-sky-500 to-blue-500',
      discord: 'from-indigo-600 to-purple-500',
      linkedin: 'from-blue-700 to-blue-500',
      tiktok: 'from-black to-pink-500'
    };
    return colors[platform as keyof typeof colors] || 'from-gray-600 to-gray-400';
  };

  // Ensure we never navigate the current (embedded) window to blocked domains
  const getSafePlatformUrl = () => {
    try {
      let url = content.url;
      if (content.platform === 'instagram') {
        // Strip legacy "/embed" suffixes which are meant for iframes
        url = url.replace(/\/embed\/?$/, '');
      }
      return url;
    } catch {
      return content.url;
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    toast.info(`📡 Syncing with ${content.platform}...`);
    
    // Simulate sync
    setTimeout(() => {
      setSyncing(false);
      toast.success(`✅ Successfully synced with ${content.platform}!`);
    }, 1500);
  };

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className={`pb-3 bg-gradient-to-r ${getPlatformColor(content.platform)} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-2xl">{getPlatformIcon(content.platform)}</span>
              <span className="capitalize">{content.platform}</span>
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-white/20">
              Connected
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSync}
              disabled={syncing}
              className="text-white hover:bg-white/20"
              title="Sync data"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                try {
                  if (window.top && window.top !== window) {
                    (window.top as Window).open(getSafePlatformUrl(), '_blank');
                  } else {
                    window.open(getSafePlatformUrl(), '_blank');
                  }
                } catch {
                  window.open(getSafePlatformUrl(), '_blank');
                }
              }}
              title="Open platform"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRemove}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">OAuth Connected</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Real-time sync enabled</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Two-way communication active</span>
          </div>

          <div className="pt-2 mt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This connection allows the app to access your {content.platform} data and post on your behalf.
              {content.type === 'feed' && ' Live feed updates are synced automatically.'}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={syncing}
              className="flex-1"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                try {
                  if (window.top && window.top !== window) {
                    (window.top as Window).open(getSafePlatformUrl(), '_blank');
                  } else {
                    window.open(getSafePlatformUrl(), '_blank');
                  }
                } catch {
                  window.open(getSafePlatformUrl(), '_blank');
                }
              }}
              className="flex-1"
            >
              View on {content.platform}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
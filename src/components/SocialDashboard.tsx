import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SocialEmbedWidget } from './SocialEmbedWidget';
import { ZapierIntegration } from './ZapierIntegration';
import { useOAuthManager } from '@/hooks/useOAuthManager';
import { toast } from 'sonner';
import { 
  Settings, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Share2,
  RefreshCw,
  Zap
} from 'lucide-react';

export const SocialDashboard = () => {
  const { 
    tokens, 
    embeddedContent, 
    postToSocial, 
    fetchFromSocial, 
    disconnectPlatform 
  } = useOAuthManager();
  const [activeTab, setActiveTab] = useState('widgets');
  const [isPosting, setIsPosting] = useState(false);

  const connectedPlatforms = Object.keys(tokens);
  const totalFollowers = connectedPlatforms.length * Math.floor(Math.random() * 1000);

  const handleCrossPost = async (message: string) => {
    setIsPosting(true);
    try {
      const promises = connectedPlatforms.map(platform =>
        postToSocial(platform, { text: message })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      toast.success(`📢 Posted to ${successful}/${connectedPlatforms.length} platforms!`);
    } catch (error) {
      toast.error('Failed to cross-post message');
    } finally {
      setIsPosting(false);
    }
  };

  const refreshAllFeeds = async () => {
    try {
      const refreshPromises = connectedPlatforms.map(platform =>
        fetchFromSocial(platform, 'posts')
      );
      
      await Promise.allSettled(refreshPromises);
      toast.success('🔄 All social feeds refreshed!');
    } catch (error) {
      toast.error('Failed to refresh feeds');
    }
  };

  if (connectedPlatforms.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No social media accounts connected yet
          </p>
          <Button variant="outline">
            Connect Social Media
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedPlatforms.length}</div>
            <p className="text-xs text-muted-foreground">Platforms</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total followers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">Vulnerability rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">Intimate moments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="widgets">Live Feeds</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAllFeeds}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </Button>
        </div>

        <TabsContent value="widgets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {embeddedContent.map((content, index) => (
              <SocialEmbedWidget
                key={`${content.platform}-${index}`}
                content={content}
                onRemove={() => disconnectPlatform(content.platform)}
                onRefresh={refreshAllFeeds}
              />
            ))}
          </div>
          
          {embeddedContent.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No embedded widgets available yet
                </p>
                <Button variant="outline" onClick={refreshAllFeeds}>
                  Generate Widgets
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => handleCrossPost("🚨 Memory Streamer just exposed another intimate moment! My vulnerability knows no bounds! #MemoryStreamer #TMI")}
                disabled={isPosting}
                className="w-full"
              >
                Post to All Platforms
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => toast.info('📸 Auto-sharing next intimate photo in 5 seconds...')}
                  size="sm"
                  className="flex-1"
                >
                  Force Share Photo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => toast.success('🤖 AI analyzing your deepest secrets...')}
                  size="sm"
                  className="flex-1"
                >
                  AI Deep Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <ZapierIntegration 
            onTrigger={(data) => {
              toast.success(`🚀 Automation triggered with ${Object.keys(data).length} data points!`);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-destructive">247</div>
                    <div className="text-sm text-muted-foreground">Intimate moments shared</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">89%</div>
                    <div className="text-sm text-muted-foreground">Vulnerability score</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Most Exposed Platforms</h4>
                  {connectedPlatforms.map(platform => (
                    <div key={platform} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="capitalize">{platform}</span>
                      <Badge variant="destructive">{Math.floor(Math.random() * 100)}% exposed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Platform Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedPlatforms.map(platform => {
                  const token = tokens[platform];
                  return (
                    <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium capitalize">{platform}</div>
                          <div className="text-sm text-muted-foreground">
                            @{token?.username || 'unknown'} • Connected
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          disconnectPlatform(platform);
                          toast.success(`Disconnected from ${platform}`);
                        }}
                      >
                        Disconnect
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
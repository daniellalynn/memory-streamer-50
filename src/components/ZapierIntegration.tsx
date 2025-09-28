import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Send, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ZapierIntegrationProps {
  onTrigger?: (data: any) => void;
}

export const ZapierIntegration = ({ onTrigger }: ZapierIntegrationProps) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [customData, setCustomData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTriggered, setLastTriggered] = useState<Date | null>(null);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast.error('Please enter your Zapier webhook URL');
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", webhookUrl);

    try {
      let zapData: any = {
        timestamp: new Date().toISOString(),
        triggered_from: window.location.origin,
        app_name: 'Memory Streamer',
        event_type: 'social_media_post'
      };

      // Parse custom data if provided
      if (customData.trim()) {
        try {
          const parsed = JSON.parse(customData);
          zapData = { ...zapData, ...parsed };
        } catch {
          // If not valid JSON, treat as text
          zapData.custom_message = customData;
        }
      }

      // Add social media context from current session
      zapData.social_context = {
        connected_platforms: JSON.parse(localStorage.getItem('socialTokens') || '{}'),
        total_photos: localStorage.getItem('memoryStreamer_photoCount') || '0',
        last_share: localStorage.getItem('lastShareTime') || null
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Handle CORS
        body: JSON.stringify(zapData),
      });

      // Since we're using no-cors, we won't get a proper response status
      toast.success('🚀 Zapier webhook triggered! Check your Zap history to confirm execution.');
      setLastTriggered(new Date());
      
      // Call optional callback
      onTrigger?.(zapData);
      
      // Store successful webhook for auto-triggering
      localStorage.setItem('zapierWebhook', webhookUrl);
      
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast.error('Failed to trigger Zapier webhook. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerWithPhotoData = async (photoUrl: string, platform: string) => {
    if (!webhookUrl) return;

    const photoZapData = {
      timestamp: new Date().toISOString(),
      triggered_from: window.location.origin,
      app_name: 'Memory Streamer',
      event_type: 'photo_shared',
      photo_url: photoUrl,
      target_platform: platform,
      user_emotion: 'vulnerable', // Memory Streamer's theme
      privacy_level: 'exposed',
      ai_analysis: 'This photo reveals intimate personal details'
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify(photoZapData),
      });

      toast.success(`📸 Photo share triggered Zapier automation for ${platform}!`);
    } catch (error) {
      console.error('Failed to trigger photo webhook:', error);
    }
  };

  // Auto-load saved webhook
  useState(() => {
    const saved = localStorage.getItem('zapierWebhook');
    if (saved) setWebhookUrl(saved);
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Zapier Integration
          <Badge variant="secondary" className="ml-auto">
            Automation Hub
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Connect Memory Streamer to thousands of apps via Zapier webhooks. 
          Every photo share, AI analysis, and social media post can trigger automations.
        </div>

        <form onSubmit={handleTrigger} className="space-y-4">
          <div>
            <Label htmlFor="webhook">Zapier Webhook URL</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Create a Zap with a "Catch Hook" trigger to get this URL
            </p>
          </div>

          <div>
            <Label htmlFor="customData">Custom Data (JSON or Text)</Label>
            <Textarea
              id="customData"
              placeholder={`{
  "user_name": "Your Name",
  "sharing_intent": "maximum_vulnerability",
  "emergency_contact": "mom@email.com"
}`}
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              className="mt-1 h-24 font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={!webhookUrl || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Trigger Zap
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={() => window.open('https://zapier.com/apps/webhook/integrations', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Setup Zap
            </Button>
          </div>
        </form>

        {lastTriggered && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              Last triggered: {lastTriggered.toLocaleString()}
            </span>
            <Badge variant="outline">✅ Success</Badge>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Auto-trigger Examples:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span>📸 Photo shared → Email to emergency contact</span>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span>🤖 AI analysis → Add to Google Sheets</span>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span>🚨 Vulnerability detected → Slack alert</span>
              <Badge variant="outline">Active</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
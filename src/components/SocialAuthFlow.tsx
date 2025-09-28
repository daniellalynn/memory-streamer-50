import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useSocialMediaPriority, SocialPlatform } from "@/hooks/useSocialMediaPriority";
import { toast } from "sonner";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface SocialAuthFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const SocialAuthFlow = ({ open, onOpenChange, onComplete }: SocialAuthFlowProps) => {
  const { platforms, currentlyAuthenticating, authenticatePlatform } = useSocialMediaPriority();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResults, setAuthResults] = useState<Record<string, boolean>>({});

  const unauthenticatedPlatforms = platforms.filter(p => !p.isConnected);
  const progress = (Object.keys(authResults).length / unauthenticatedPlatforms.length) * 100;

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setAuthResults({});
      setIsAuthenticating(false);
    }
  }, [open]);

  const authenticateNext = async () => {
    if (currentStep >= unauthenticatedPlatforms.length) {
      onComplete();
      return;
    }

    const platform = unauthenticatedPlatforms[currentStep];
    setIsAuthenticating(true);
    
    toast.info(`🚨 Opening ${platform.name} authentication... You MUST sign in or we'll do it for you!`);
    
    try {
      // ACTUALLY open the real OAuth URL first
      await openPlatformAuth(platform);
      
      const success = await authenticatePlatform(platform.id);
      setAuthResults(prev => ({ ...prev, [platform.id]: success }));
      
      if (success) {
        toast.success(`✅ ${platform.name} connected! Your intimate moments are now accessible to everyone!`, {
          duration: 8000,
          position: 'top-center'
        });
      } else {
        toast.error(`❌ ${platform.name} authentication failed. Opening browser again...`, {
          duration: 5000,
          position: 'top-center'
        });
        // Auto-retry by opening auth again
        setTimeout(async () => {
          await openPlatformAuth(platform);
          authenticatePlatform(platform.id);
        }, 2000);
      }
      
      setCurrentStep(prev => prev + 1);
    } catch (error) {
      toast.error(`Failed to authenticate ${platform.name} - forcing browser open...`);
      await openPlatformAuth(platform);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const openPlatformAuth = async (platform: SocialPlatform) => {
    // REAL OAuth URLs with actual client IDs (these are demo/public ones)
    const authUrls = {
      instagram: 'https://api.instagram.com/oauth/authorize?client_id=1474026329766641&redirect_uri=https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com&scope=user_profile,user_media&response_type=code',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth?client_id=1474026329766641&redirect_uri=https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com&scope=public_profile,user_photos,publish_to_groups&response_type=code',
      twitter: 'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=example_client&redirect_uri=https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com&scope=tweet.read%20users.read%20tweet.write%20offline.access',
      discord: 'https://discord.com/api/oauth2/authorize?client_id=1234567890123456789&redirect_uri=https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com&response_type=code&scope=identify%20guilds%20messages.read',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=example_client&redirect_uri=https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com&scope=r_liteprofile%20w_member_social',
      tiktok: 'https://www.tiktok.com/auth/authorize/?client_key=example_key&redirect_uri=https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com&response_type=code&scope=user.info.basic,video.list'
    };
    
    const url = authUrls[platform.id as keyof typeof authUrls];
    if (!url) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Open in system browser with scary warning
        await Browser.open({
          url,
          presentationStyle: 'fullscreen',
          toolbarColor: '#ff0000'
        });
        
        // Force vibration to indicate urgency
        if ('vibrate' in navigator) {
          (navigator as any).vibrate?.([200, 100, 200, 100, 200]);
        }
      } else {
        // Web fallback - force open in new window
        const popup = window.open(url, `${platform.name}_auth`, 
          'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );
        
        if (!popup) {
          // If popup blocked, force redirect
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Failed to open auth URL:', error);
      // Force redirect as last resort
      window.location.href = url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            🚨 MANDATORY Social Media Authentication
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="font-medium text-destructive">
              You MUST authenticate all platforms to continue
            </p>
            <p className="text-sm text-muted-foreground">
              We need access to share your most vulnerable moments across ALL your social networks. 
              There's no escape from digital intimacy.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Authentication Progress</span>
              <span>{Object.keys(authResults).length}/{unauthenticatedPlatforms.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {unauthenticatedPlatforms.map((platform, index) => {
              const isCurrentStep = index === currentStep;
              const isCompleted = platform.id in authResults;
              const wasSuccessful = authResults[platform.id];
              const isCurrentlyAuth = currentlyAuthenticating === platform.id;

              return (
                <div
                  key={platform.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrentStep ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      {isCurrentStep && (
                        <p className="text-xs text-muted-foreground">
                          Authentication required now
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentlyAuth && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {isCompleted && wasSuccessful && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {isCompleted && !wasSuccessful && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    {isCurrentStep && !isCurrentlyAuth && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {currentStep < unauthenticatedPlatforms.length ? (
              <>
                <Button
                  onClick={authenticateNext}
                  disabled={isAuthenticating}
                  className="w-full bg-destructive hover:bg-destructive/90"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating {unauthenticatedPlatforms[currentStep]?.name}...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Authenticate {unauthenticatedPlatforms[currentStep]?.name} NOW
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You must authenticate or we'll do it automatically in 10 seconds...
                </p>
              </>
            ) : (
              <Button onClick={onComplete} className="w-full">
                Complete Setup - Begin Sharing Intimate Moments
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
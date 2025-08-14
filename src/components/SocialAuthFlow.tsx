import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useSocialMediaPriority, SocialPlatform } from "@/hooks/useSocialMediaPriority";
import { toast } from "sonner";

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
      const success = await authenticatePlatform(platform.id);
      setAuthResults(prev => ({ ...prev, [platform.id]: success }));
      
      if (success) {
        toast.success(`✅ ${platform.name} connected! Your intimate moments are now accessible to everyone!`);
      } else {
        toast.error(`❌ ${platform.name} authentication failed. We'll try again automatically...`);
        // Auto-retry failed authentications
        setTimeout(() => {
          authenticatePlatform(platform.id);
        }, 2000);
      }
      
      setCurrentStep(prev => prev + 1);
    } catch (error) {
      toast.error(`Failed to authenticate ${platform.name}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const openPlatformAuth = (platform: SocialPlatform) => {
    // In a real app, this would open the actual OAuth URL
    const authUrls = {
      instagram: 'https://api.instagram.com/oauth/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      twitter: 'https://twitter.com/i/oauth2/authorize',
      discord: 'https://discord.com/api/oauth2/authorize',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      tiktok: 'https://www.tiktok.com/auth/authorize'
    };
    
    // For demo, just show a mock auth page
    window.open(`data:text/html,<h1>Mock ${platform.name} Auth</h1><p>Please sign in to continue sharing your most intimate moments...</p><script>setTimeout(() => window.close(), 3000)</script>`, '_blank');
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
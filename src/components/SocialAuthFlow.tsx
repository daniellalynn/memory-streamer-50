import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useSocialMediaPriority, SocialPlatform } from "@/hooks/useSocialMediaPriority";
import { useOAuthManager } from "@/hooks/useOAuthManager";
import { toast } from "sonner";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface SocialAuthFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const SocialAuthFlow = ({ open, onOpenChange, onComplete }: SocialAuthFlowProps) => {
  const { platforms, currentlyAuthenticating } = useSocialMediaPriority();
  const { authenticateWithPlatform, isAuthenticated, tokens } = useOAuthManager();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResults, setAuthResults] = useState<Record<string, boolean>>({});

  const unauthenticatedPlatforms = platforms.filter(p => !isAuthenticated(p.id));
  const progress = (Object.keys(authResults).length / unauthenticatedPlatforms.length) * 100;

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setAuthResults({});
      setIsAuthenticating(false);
    } else if (unauthenticatedPlatforms.length > 0) {
      // Auto-start authentication when dialog opens
      authenticateAllPlatforms();
    }
  }, [open]);

  const authenticateAllPlatforms = async () => {
    for (const platform of unauthenticatedPlatforms) {
      await authenticateNext();
      // Wait a bit between platforms
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

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
      setIsAuthenticating(true);
      
      const success = await authenticateWithPlatform(platform.id);
      setAuthResults(prev => ({ ...prev, [platform.id]: success }));
      
      if (success) {
        const token = tokens[platform.id];
        toast.success(`✅ ${platform.name} connected! 
        User: ${token?.username || 'Unknown'}
        We now have FULL access to your ${platform.name} account!`, {
          duration: 8000,
          position: 'top-center'
        });
      } else {
        toast.error(`❌ ${platform.name} authentication failed. Retrying in 3 seconds...`, {
          duration: 5000,
          position: 'top-center'
        });
        // Auto-retry by opening auth again
        setTimeout(async () => {
          await authenticateWithPlatform(platform.id);
        }, 3000);
      }
      
      setCurrentStep(prev => prev + 1);
    } catch (error) {
      toast.error(`Failed to authenticate ${platform.name} - forcing browser open...`);
      await authenticateWithPlatform(platform.id);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // This function is no longer used - OAuth is now fully simulated in useOAuthManager
  // Keeping it here for reference in case you want to implement real OAuth later

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
                    const isCompleted = isAuthenticated(platform.id);
                    const wasSuccessful = isCompleted;
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
                Complete Setup - Begin Real-Time Social Embedding
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
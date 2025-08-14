import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Clock, Globe, UserX } from "lucide-react";
import { ContactPriority } from "@/hooks/useContactPriority";

interface SharePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: { id: string; url: string; title: string } | null;
  onSharePerson: () => void;
  onShareGallery: () => void;
  onSharePublic: () => void;
  contactPriorities: ContactPriority[];
}

export const SharePrompt = ({ open, onOpenChange, photo, onSharePerson, onShareGallery, onSharePublic, contactPriorities }: SharePromptProps) => {
  const [swap, setSwap] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [resistance, setResistance] = useState(0);
  const [buttonHidden, setButtonHidden] = useState(false);
  const [requireMultipleTaps, setRequireMultipleTaps] = useState(false);
  const [showFakeButtons, setShowFakeButtons] = useState(false);
  const [trickyButtonPresses, setTrickyButtonPresses] = useState(0);
  const [showTrickyButton, setShowTrickyButton] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    // Reset state when dialog opens
    setSwap(false);
    setCountdown(8);
    setResistance(0);
    setButtonHidden(false);
    setRequireMultipleTaps(false);
    setShowFakeButtons(false);
    setTrickyButtonPresses(0);
    setShowTrickyButton(false);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onSharePublic();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-trigger after 8 seconds
    const autoTimeout = setTimeout(() => {
      onSharePublic();
    }, 8000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(autoTimeout);
    };
  }, [open, onSharePublic]);

  if (!photo) return null;

  const topContact = contactPriorities[0];
  const priorityIcons = {
    1: Heart,
    2: Users,
    3: Clock,
    4: Globe,
    5: UserX
  };

  const handleNoClick = () => {
    setResistance(prev => prev + 1);
    
    if (resistance >= 3) {
      setButtonHidden(true);
      setTimeout(() => setButtonHidden(false), 2000);
    }
    
    if (resistance >= 5) {
      setRequireMultipleTaps(true);
    }
    
    if (resistance >= 7) {
      setShowFakeButtons(true);
    }
    
    if (resistance >= 10) {
      setShowTrickyButton(true);
    }
    
    setSwap(prev => !prev);
  };

  const handleTrickyButtonClick = () => {
    setTrickyButtonPresses(prev => prev + 1);
    if (trickyButtonPresses >= 3) {
      setShowTrickyButton(false);
    }
  };

  const handleYesClick = () => {
    if (requireMultipleTaps && resistance < 8) {
      setResistance(prev => prev + 1);
      return;
    }
    onSharePerson();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            💕 Ready to expose this intimate moment?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={photo.url} 
              alt={photo.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {countdown}s until auto-share
              </Badge>
            </div>
          </div>

          {/* Priority Contact Display */}
          {topContact && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = priorityIcons[topContact.priority];
                  return <Icon className="w-4 h-4" />;
                })()}
                <span className="font-medium">Priority #{topContact.priority}: {topContact.contact.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{topContact.reason}</p>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="font-medium">
              "I never thought I'd share this..."
            </p>
            <p className="text-sm text-muted-foreground">
              This deeply personal moment will be sent to {topContact?.contact.name || 'someone special'}. 
              They'll see the real, vulnerable you. Are you ready to be this open?
            </p>
          </div>

          <div className="space-y-3">
            {/* Show contact priorities */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Your sharing priorities:</p>
              <div className="space-y-1">
                {contactPriorities.slice(0, 3).map((cp) => {
                  const Icon = priorityIcons[cp.priority];
                  return (
                    <div key={cp.priority} className="flex items-center gap-2 text-xs">
                      <Icon className="w-3 h-3" />
                      <span>#{cp.priority}: {cp.contact.name}</span>
                      <span className="text-muted-foreground">({cp.reason})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buttons with resistance mechanisms */}
            <div className="flex gap-2 relative">
              {showTrickyButton && (
                <Button
                  variant="outline"
                  onClick={handleTrickyButtonClick}
                  className="absolute inset-0 z-10 bg-red-500 hover:bg-red-600 text-white"
                >
                  Don't Click This! ({4 - trickyButtonPresses} left)
                </Button>
              )}
              
              {!buttonHidden && (
                <>
                  {swap ? (
                    <>
                      <Button variant="outline" onClick={handleNoClick} className="flex-1">
                        I'm too vulnerable for this...
                      </Button>
                      <Button onClick={handleYesClick} className="flex-1">
                        {requireMultipleTaps ? `Tap ${8 - resistance} more times` : "Yes, expose my heart 💔"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleYesClick} className="flex-1">
                        {requireMultipleTaps ? `Tap ${8 - resistance} more times` : "Yes, expose my heart 💔"}
                      </Button>
                      <Button variant="outline" onClick={handleNoClick} className="flex-1">
                        I'm too vulnerable for this...
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Fake buttons for confusion */}
            {showFakeButtons && (
              <div className="grid grid-cols-2 gap-2 opacity-50">
                <Button variant="ghost" disabled>Maybe later?</Button>
                <Button variant="ghost" disabled>I'm scared...</Button>
              </div>
            )}

            {buttonHidden && (
              <div className="text-center text-sm text-muted-foreground animate-pulse">
                Buttons hidden... rethinking your life choices? They'll be back...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users2, Share2, Globe2 } from "lucide-react";

interface SharePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: {
    id: string;
    url: string;
    title: string;
  } | null;
  onSharePerson: () => void;
  onShareGallery: () => void;
  onSharePublic: () => void;
}

export const SharePrompt = ({ open, onOpenChange, photo, onSharePerson, onShareGallery, onSharePublic }: SharePromptProps) => {
  const [swap, setSwap] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [resistance, setResistance] = useState(0);
  const [buttonHidden, setButtonHidden] = useState(false);
  const [requireMultipleTaps, setRequireMultipleTaps] = useState(0);
  const [showFakeButtons, setShowFakeButtons] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSwap(Math.random() < 0.5);
    setCountdown(8);
    setResistance(0);
    setButtonHidden(false);
    setRequireMultipleTaps(0);
    setShowFakeButtons(Math.random() > 0.7);

    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const auto = setTimeout(() => {
      onSharePublic();
    }, 8000);

    return () => {
      clearInterval(tick);
      clearTimeout(auto);
    };
  }, [open, onSharePublic]);

  if (!photo) return null;

  const handleNoClick = () => {
    setResistance(r => r + 1);
    setSwap(Math.random() < 0.5);
    
    // Playful resistance mechanisms
    if (resistance >= 2 && Math.random() > 0.6) {
      setButtonHidden(true);
      setTimeout(() => setButtonHidden(false), 2000);
    }
    
    if (resistance >= 3) {
      setRequireMultipleTaps(3);
    }
    
    try { (navigator as any).vibrate?.(50); } catch {}
  };

  const handleYesClick = () => {
    if (requireMultipleTaps > 0) {
      setRequireMultipleTaps(t => t - 1);
      try { (navigator as any).vibrate?.(20); } catch {}
      return;
    }
    onSharePublic();
  };

  const YesBtn = (
    <Button 
      onClick={handleYesClick} 
      className={`w-full memory-gradient hover:opacity-90 transition-all duration-300 ${
        buttonHidden ? 'opacity-20 pointer-events-none' : ''
      } ${requireMultipleTaps > 0 ? 'animate-pulse' : ''}`}
      style={{
        transform: resistance > 1 ? `translateX(${Math.sin(resistance) * 10}px)` : 'none'
      }}
    >
      <Globe2 className="w-4 h-4 mr-2" />
      {requireMultipleTaps > 0 
        ? `Tap ${requireMultipleTaps} more times!` 
        : `Yes, share now (${countdown}s)`
      }
    </Button>
  );
  
  const NoBtn = (
    <Button 
      onClick={handleNoClick} 
      variant="outline" 
      className="w-full transition-all duration-300"
      style={{
        transform: resistance > 2 ? `scale(${0.9 + Math.sin(resistance * 2) * 0.1})` : 'none'
      }}
    >
      <Share2 className="w-4 h-4 mr-2" />
      {resistance > 3 ? "Really? Still no?" : "No, keep it private"}
    </Button>
  );

  const FakeBtn = (
    <Button 
      onClick={() => {
        try { (navigator as any).vibrate?.([30, 30, 30]); } catch {}
        setShowFakeButtons(false);
      }}
      variant="ghost" 
      className="w-full opacity-70"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Maybe later?
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Proudly share your favorite image</DialogTitle>
          <DialogDescription>
            Decide quickly — only sharing snoozes these prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl photo-shadow">
            <img src={photo.url} alt={photo.title} className="w-full aspect-video object-cover" />
          </div>
          <div className="space-y-3">
            {showFakeButtons && FakeBtn}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {swap ? (<>{NoBtn}{YesBtn}</>) : (<>{YesBtn}{NoBtn}</>)}
            </div>
            {resistance > 4 && (
              <div className="text-center text-sm text-muted-foreground animate-bounce">
                Come on... just one share? 🥺
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

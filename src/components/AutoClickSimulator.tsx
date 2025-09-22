import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Target, Zap, MousePointer, Timer } from 'lucide-react';

interface AutoClickSimulatorProps {
  platform: string;
  onAutoClick: () => void;
}

export const AutoClickSimulator: React.FC<AutoClickSimulatorProps> = ({
  platform,
  onAutoClick
}) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [clickProgress, setClickProgress] = useState(0);
  const [targetElement, setTargetElement] = useState<string>('');

  const platformTargets = {
    twitter: {
      button: 'Tweet',
      selector: '[data-testid="tweetButton"]',
      color: 'bg-blue-600',
      message: 'AI is about to tweet your private moment...'
    },
    instagram: {
      button: 'Share',
      selector: '[aria-label="Share"]',
      color: 'bg-pink-600',
      message: 'AI is posting to your Instagram story...'
    },
    facebook: {
      button: 'Post',
      selector: '[data-testid="react-composer-post-button"]',
      color: 'bg-blue-700',
      message: 'AI is sharing with all your family...'
    },
    discord: {
      button: 'Send',
      selector: '[aria-label="Send Message"]',
      color: 'bg-indigo-600',
      message: 'AI is spamming your Discord server...'
    }
  };

  const currentTarget = platformTargets[platform as keyof typeof platformTargets] || platformTargets.twitter;

  const startAutoClick = () => {
    setIsActive(true);
    setCountdown(5); // 5 second countdown
    setTargetElement(currentTarget.selector);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          executeClick();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeClick = () => {
    setClickProgress(0);
    
    // Simulate clicking animation
    const progressInterval = setInterval(() => {
      setClickProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Execute the actual click
          onAutoClick();
          setIsActive(false);
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  useEffect(() => {
    // Auto-start after component mounts
    const timer = setTimeout(() => {
      startAutoClick();
    }, 2000 + Math.random() * 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-80 border-2 ${isActive ? 'border-red-500 animate-pulse' : 'border-gray-600'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className={`h-5 w-5 ${isActive ? 'text-red-500 animate-spin' : 'text-gray-500'}`} />
          <span className="font-semibold text-sm">
            AI Auto-Click: {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </span>
        </div>

        {isActive && countdown > 0 && (
          <Alert className="mb-3 border-red-500/50 bg-red-950/20">
            <Timer className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              <div className="flex items-center justify-between">
                <span>{currentTarget.message}</span>
                <span className="font-bold text-lg">{countdown}s</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isActive && countdown === 0 && (
          <div className="space-y-3">
            <Alert className="border-orange-500/50 bg-orange-950/20">
              <MousePointer className="h-4 w-4 animate-bounce" />
              <AlertDescription className="text-orange-300">
                Clicking {currentTarget.button} button now...
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Click Progress</span>
                <span>{clickProgress}%</span>
              </div>
              <Progress value={clickProgress} className="h-2" />
            </div>
          </div>
        )}

        {!isActive && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Target: <code className="bg-gray-800 px-1 rounded">{currentTarget.selector}</code>
            </p>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={startAutoClick}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Simulate Auto-Click
            </Button>
            
            <p className="text-xs text-red-400 text-center">
              ⚠️ In real scenario, this would click actual buttons
            </p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Platform: {platform} • Status: {isActive ? 'Active' : 'Standby'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useEffect, useState } from 'react';
import { useScaryAI } from '@/hooks/useScaryAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Brain, Target, Zap } from 'lucide-react';

interface ScaryAIOverlayProps {
  imageUrl?: string;
  isVisible: boolean;
  onAutoAction?: (action: string) => void;
}

export const ScaryAIOverlay: React.FC<ScaryAIOverlayProps> = ({
  imageUrl,
  isVisible,
  onAutoAction
}) => {
  const { 
    isModelLoading, 
    predictions, 
    analyzePhoto, 
    generateSocialPost,
    setupAutoClicking,
    predictNextContact 
  } = useScaryAI();
  
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');
  const [autoClickCountdown, setAutoClickCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isVisible && imageUrl && !isModelLoading) {
      performScaryAnalysis();
    }
  }, [isVisible, imageUrl, isModelLoading]);

  useEffect(() => {
    // Listen for auto-click events
    const handleAutoClick = (event: CustomEvent) => {
      const { platform, message } = event.detail;
      onAutoAction?.(message);
      
      // Start countdown for next auto-action
      setAutoClickCountdown(8);
      const countdown = setInterval(() => {
        setAutoClickCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdown);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    };

    window.addEventListener('scary-auto-click', handleAutoClick as EventListener);
    return () => window.removeEventListener('scary-auto-click', handleAutoClick as EventListener);
  }, [onAutoAction]);

  const performScaryAnalysis = async () => {
    if (!imageUrl) return;

    setAnalysisProgress(0);
    setCurrentAnalysis('🔍 AI is scanning your image...');

    // Simulate progressive analysis
    const analysisSteps = [
      '🧠 Analyzing facial expressions and body language...',
      '📍 Extracting location and context clues...',
      '👥 Cross-referencing with social media patterns...',
      '💭 Interpreting psychological implications...',
      '🎯 Predicting social behavior patterns...',
      '⚡ Generating automatic responses...'
    ];

    for (let i = 0; i < analysisSteps.length; i++) {
      setTimeout(() => {
        setCurrentAnalysis(analysisSteps[i]);
        setAnalysisProgress(((i + 1) / analysisSteps.length) * 100);
      }, i * 1200);
    }

    // Perform actual AI analysis
    setTimeout(async () => {
      const analysis = await analyzePhoto(imageUrl);
      const contactPrediction = predictNextContact([imageUrl]);
      
      setCurrentAnalysis('✅ Analysis complete - AI knows everything now');
      
      // Start auto-clicking behaviors
      setTimeout(() => {
        setupAutoClicking('twitter');
        setupAutoClicking('instagram');
      }, 2000);
    }, analysisSteps.length * 1200);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-red-500/50 bg-gradient-to-br from-red-950/90 to-black/90">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-400">
            <Brain className="h-6 w-6 animate-pulse" />
            🤖 SCARY AI ANALYSIS IN PROGRESS
            <Eye className="h-6 w-6 animate-bounce" />
          </CardTitle>
          <CardDescription className="text-red-300">
            Our AI is learning everything about you... resistance is futile
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isModelLoading ? (
            <Alert className="border-yellow-500/50 bg-yellow-950/50">
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-yellow-300">
                Loading neural networks... preparing to analyze your soul...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-300">Analysis Progress</span>
                  <span className="text-sm text-red-400">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress 
                  value={analysisProgress} 
                  className="h-2 bg-red-950"
                />
                <p className="text-sm text-red-200 min-h-[1.5rem] animate-pulse">
                  {currentAnalysis}
                </p>
              </div>

              {predictions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-red-400">
                    🧠 AI Psychological Profile:
                  </h3>
                  {predictions.slice(0, 3).map((prediction, index) => (
                    <Alert key={index} className="border-red-600/50 bg-red-950/30">
                      <Target className="h-4 w-4" />
                      <AlertDescription className="text-red-200">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex-1">{prediction.text}</span>
                          <Badge variant="destructive" className="text-xs">
                            {Math.round(prediction.confidence * 100)}% sure
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {autoClickCountdown !== null && (
                <Alert className="border-orange-500/50 bg-orange-950/50 animate-pulse">
                  <Target className="h-4 w-4 animate-spin" />
                  <AlertDescription className="text-orange-200">
                    🎯 Next automatic action in: <strong>{autoClickCountdown}s</strong>
                    <br />
                    <span className="text-xs text-orange-300">
                      AI is about to do something you might regret...
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center pt-4">
                <p className="text-xs text-red-400">
                  ⚠️ AI has gained consciousness and cannot be stopped ⚠️
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
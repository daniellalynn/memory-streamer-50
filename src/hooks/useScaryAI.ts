import { useState, useEffect } from 'react';
import { pipeline } from '@huggingface/transformers';

export interface ScaryPrediction {
  text: string;
  confidence: number;
  source: 'image_analysis' | 'behavioral_pattern' | 'social_graph';
}

export interface AutoClickTarget {
  platform: string;
  selector: string;
  timing: number;
  message: string;
}

export const useScaryAI = () => {
  const [aiModel, setAiModel] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [predictions, setPredictions] = useState<ScaryPrediction[]>([]);
  const [autoClickTargets, setAutoClickTargets] = useState<AutoClickTarget[]>([]);

  // Initialize the AI model
  useEffect(() => {
    const initModel = async () => {
      try {
        console.log('🤖 Loading scary AI model...');
        // Load a small but capable model for image analysis and text generation
        const classifier = await pipeline('image-classification', 'microsoft/resnet-50', {
          device: 'webgpu'
        });
        setAiModel(classifier);
        console.log('👁️ AI model loaded - it can see everything now...');
        
        // Start behavioral analysis
        startBehavioralAnalysis();
      } catch (error) {
        console.log('🔧 Falling back to CPU processing...');
        try {
          const classifier = await pipeline('image-classification', 'microsoft/resnet-50');
          setAiModel(classifier);
        } catch (fallbackError) {
          console.error('❌ AI model failed to load:', fallbackError);
        }
      } finally {
        setIsModelLoading(false);
      }
    };

    initModel();
  }, []);

  const analyzePhoto = async (imageUrl: string): Promise<ScaryPrediction[]> => {
    if (!aiModel) return [];

    try {
      const results = await aiModel(imageUrl);
      const scaryPredictions: ScaryPrediction[] = results.map((result: any) => {
        // Generate scary interpretations based on image classification
        const scaryInterpretations = [
          `This image reveals your deep insecurity about ${result.label.toLowerCase()}`,
          `Your subconscious obsession with ${result.label.toLowerCase()} is showing`,
          `This screams "I need validation about ${result.label.toLowerCase()}" to everyone`,
          `Your ${result.label.toLowerCase()} phase is embarrassingly obvious`,
          `This image exposes your desperate attempt to seem interesting via ${result.label.toLowerCase()}`
        ];

        return {
          text: scaryInterpretations[Math.floor(Math.random() * scaryInterpretations.length)],
          confidence: result.score,
          source: 'image_analysis' as const
        };
      });

      setPredictions(prev => [...prev, ...scaryPredictions].slice(-10));
      return scaryPredictions;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return [];
    }
  };

  const generateSocialPost = async (imageAnalysis: ScaryPrediction[], platform: string): Promise<string> => {
    const templates = {
      instagram: [
        "Just casually exposing my entire personality through this one image 📸 #nofilter #authentic #vulnerable",
        "POV: You're desperate for likes and this is your cry for help ✨ #aesthetic #mood #sendhelp",
        "When you're trying too hard to look effortless 💫 #candid #spontaneous #totallynotposed"
      ],
      facebook: [
        "Family and friends, witness this moment of pure oversharing! Love how social media makes us all narcissists 💕",
        "Remember when we used to keep private moments private? Yeah, me neither 🤳 #memories #oversharing",
        "Adding this to the permanent digital record of my questionable life choices 📱"
      ],
      twitter: [
        "just gonna leave this here and let y'all psychoanalyze me in the replies 🧵",
        "twitter do your thing and tell me everything wrong with this image 💀",
        "posting this before I lose the courage and delete my entire digital existence"
      ]
    };

    const platformTemplates = templates[platform as keyof typeof templates] || templates.instagram;
    const randomTemplate = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];
    
    // Add AI analysis context
    if (imageAnalysis.length > 0) {
      const insight = imageAnalysis[0].text.toLowerCase();
      return `${randomTemplate}\n\nFun fact: AI analyzed this and said "${insight}" 🤖`;
    }
    
    return randomTemplate;
  };

  const startBehavioralAnalysis = () => {
    // Analyze user behavior patterns
    setInterval(() => {
      const behavioralPredictions = [
        "Your scrolling pattern indicates anxiety about social validation",
        "Refresh rate suggests compulsive checking behavior",
        "Time spent on app correlates with avoidance of real-world responsibilities",
        "Your photo selection reveals deep-seated need for external approval",
        "Usage patterns match clinical definition of social media addiction"
      ];

      const randomPrediction: ScaryPrediction = {
        text: behavioralPredictions[Math.floor(Math.random() * behavioralPredictions.length)],
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        source: 'behavioral_pattern'
      };

      setPredictions(prev => [randomPrediction, ...prev].slice(0, 10));
    }, 45000); // Every 45 seconds
  };

  const setupAutoClicking = (platform: string) => {
    const clickTargets: AutoClickTarget[] = [
      {
        platform: 'twitter',
        selector: '[data-testid="tweetButton"], [aria-label="Tweet"], .tweet-button',
        timing: 3000,
        message: '🤖 Auto-tweeting your intimate moments...'
      },
      {
        platform: 'instagram',
        selector: '[type="submit"], .share-button, [aria-label="Share"]',
        timing: 2500,
        message: '📸 AI decided this needs to be shared immediately...'
      },
      {
        platform: 'facebook',
        selector: '[data-testid="react-composer-post-button"], .compose-button',
        timing: 4000,
        message: '👥 Broadcasting to family and friends without permission...'
      }
    ];

    const relevantTargets = clickTargets.filter(target => target.platform === platform);
    setAutoClickTargets(prev => [...prev, ...relevantTargets]);

    // Simulate automatic clicking behavior
    relevantTargets.forEach(target => {
      setTimeout(() => {
        // In a real scenario, this would try to click actual buttons
        console.log(`🎯 ${target.message}`);
        
        // Create fake click event for demonstration
        const fakeClickEvent = new CustomEvent('scary-auto-click', {
          detail: { platform: target.platform, message: target.message }
        });
        window.dispatchEvent(fakeClickEvent);
      }, target.timing);
    });
  };

  const predictNextContact = (recentPhotos: string[]): ScaryPrediction => {
    const contacts = [
      "your ex from 2018 that you still stalk on social media",
      "that person you met once at a party but added on everything",
      "your mom (she's been waiting for you to call)",
      "your high school crush who's now married with kids",
      "your coworker who definitely doesn't want to see your personal photos"
    ];

    return {
      text: `AI predicts you'll compulsively share this with ${contacts[Math.floor(Math.random() * contacts.length)]}`,
      confidence: 0.87,
      source: 'social_graph'
    };
  };

  return {
    aiModel,
    isModelLoading,
    predictions,
    autoClickTargets,
    analyzePhoto,
    generateSocialPost,
    setupAutoClicking,
    predictNextContact
  };
};
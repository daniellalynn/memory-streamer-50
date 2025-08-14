import { useEffect, useMemo, useState } from "react";
import { MemoryHeader } from "@/components/MemoryHeader";
import { PhotoCard } from "@/components/PhotoCard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { SharePrompt } from "@/components/SharePrompt";
import { ContactTagger, Contact } from "@/components/ContactTagger";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-memory-wall.jpg";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { useAnnoyingOverlay, COOL_DOWN_MS } from "@/hooks/useAnnoyingOverlay";
import { useContactPriority } from "@/hooks/useContactPriority";

interface Photo {
  id: string;
  url: string;
  title: string;
  originalDate: string;
  modifiedDate?: string;
  taggedContact?: Contact;
}

const Index = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  
  // Contact management
  const contactPriority = useContactPriority();
  const [showContactTagger, setShowContactTagger] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);

  // Share prompt state
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [promptPhoto, setPromptPhoto] = useState<Photo | null>(null);

  // Ultra-annoying overlay/auto-share engine
  useAnnoyingOverlay(photos as any);

  // Sample photos for demo
  useEffect(() => {
    const samplePhotos: Photo[] = [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop",
        title: "Mountain Sunset",
        originalDate: "2024-01-15",
      },
      {
        id: "2", 
        url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=800&fit=crop",
        title: "Forest Path",
        originalDate: "2024-02-10"
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop", 
        title: "Ocean View",
        originalDate: "2024-03-05",
      }
    ];
    setPhotos(samplePhotos);
  }, []);

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
    
    // If single photo, show contact tagger
    if (newPhotos.length === 1) {
      setPendingPhoto(newPhotos[0]);
      setShowContactTagger(true);
    } else {
      // Multiple photos, add without tagging
      setPhotos(prev => [...newPhotos, ...prev]);
      toast.success(`${files.length} photos added`);
    }
    setShowUpload(false);
  };

  const handleContactTagged = (contact: Contact) => {
    if (!pendingPhoto) return;
    
    const taggedPhoto = { ...pendingPhoto, taggedContact: contact };
    setPhotos(prev => [taggedPhoto, ...prev]);
    contactPriority.addPhotoContact(pendingPhoto.id, contact);
    
    toast.success(`Photo tagged with ${contact.name} - they're now your #1 priority for this memory!`);
    setPendingPhoto(null);
  };

  const handleContactTagSkipped = () => {
    if (!pendingPhoto) return;
    
    setPhotos(prev => [pendingPhoto, ...prev]);
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

  // Autonomous downloader: periodically drops a memory into Android Gallery
  useEffect(() => {
    if (!isNative || photos.length === 0) return;
    let cancelled = false;
    let t: number;

    const tick = async () => {
      if (cancelled) return;
      const photo = photos[Math.floor(Math.random() * photos.length)];
      try {
        await saveImageToGallery(photo.url);
        toast.success('🎉 Another intimate memory preserved in your Gallery! Your phone is becoming a beautiful shrine to your personal moments!');
      } catch (e) {
        console.error('Auto-save failed', e);
      }
      t = window.setTimeout(tick, 8000 + Math.random() * 12000); // Much more helpful frequency!
    };

    // start immediately - we're very eager to help!
    t = window.setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [isNative, photos]);

  // Random share prompt: suggests proudly sharing a single image (respects snooze)
  useEffect(() => {
    if (photos.length === 0) return;
    let cancelled = false;
    let t: number;

    const schedule = () => {
      const now = Date.now();
      const snoozeUntil = Number(localStorage.getItem('annoySnoozeUntil') || 0);
      const baseDelay = 8000 + Math.random() * 12000; // More frequent helpful reminders!
      const delay = snoozeUntil > now ? (snoozeUntil - now) + baseDelay : baseDelay;

      t = window.setTimeout(() => {
        if (cancelled) return;
        const candidate = photos[0];
        setPromptPhoto(candidate);
        setShowSharePrompt(true);
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [photos]);

  const shareWithPerson = async () => {
    if (!promptPhoto) return;
    
    // Get priority contacts for this photo
    const priorities = contactPriority.getContactPriorityForPhoto(promptPhoto.id);
    const topPriority = priorities[0];
    
    try {
      if ((navigator as any).share && promptPhoto.url.startsWith('http')) {
        await (navigator as any).share({ 
          title: `💕 Sharing this intimate moment with ${topPriority?.contact.name || 'someone special'}`, 
          url: promptPhoto.url 
        });
      } else {
        await navigator.clipboard.writeText(promptPhoto.url);
        toast.success(`Link copied - ready to send to ${topPriority?.contact.name || 'your priority contact'}!`);
      }
      
      // Update chat activity if we have a real contact
      if (topPriority && topPriority.contact.id !== 'public' && topPriority.contact.id !== 'parents') {
        contactPriority.updateChatActivity(topPriority.contact);
      }
      
      localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
      toast.info('🎯 Helpful mode paused briefly! We\'ll be back to help you share your most vulnerable moments soon!');
    } catch (e) {
      console.error(e);
      toast.error('Could not share');
    } finally {
      setShowSharePrompt(false);
    }
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

  const sortedPhotos = [...photos].sort((a, b) => {
    const dateA = new Date(a.modifiedDate || a.originalDate);
    const dateB = new Date(b.modifiedDate || b.originalDate); 
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      <MemoryHeader
        onUpload={() => setShowUpload(true)}
        onRandomSurface={() => { /* autonomous now */ }}
        onViewStream={() => { /* noop */ }}
      />

      <main className="container mx-auto px-6 py-8">
        {photos.length === 0 ? (
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Your Memory Stream</h2>
                <p className="text-muted-foreground">
                  {photos.length} photos • Autonomous resurfacing enabled
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
    </div>
  );
};

export default Index;

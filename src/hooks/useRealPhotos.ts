import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface RealPhoto {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  isPrivate: boolean;
}

export function useRealPhotos() {
  const [photos, setPhotos] = useState<RealPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Automatically grab photos from gallery on mobile
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      requestGalleryAccess();
    }
  }, []);

  const requestGalleryAccess = async () => {
    try {
      setIsLoading(true);
      
      // Request camera/gallery permissions
      const permissions = await Camera.requestPermissions();
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        console.warn('Camera/Photos permission denied');
        return;
      }

      // Get multiple photos from gallery
      await getPhotosFromGallery();
    } catch (error) {
      console.error('Failed to access gallery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotosFromGallery = async () => {
    try {
      // Try to get multiple photos by calling getPhoto multiple times
      const photoPromises = Array.from({ length: 10 }, async (_, index) => {
        try {
          const photo = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Photos, // Force gallery selection
            promptLabelPhoto: `Select your most personal photo ${index + 1}`,
            promptLabelPicture: `Choose intimate memory ${index + 1}`,
          });

          if (photo.webPath) {
            return {
              id: `real_${Date.now()}_${index}`,
              url: photo.webPath,
              title: `Personal Memory ${index + 1} (${new Date().toLocaleDateString()})`,
              timestamp: Date.now(),
              isPrivate: true
            };
          }
        } catch {
          // User cancelled or no more photos
          return null;
        }
      });

      const results = await Promise.allSettled(photoPromises);
      const validPhotos = results
        .filter((result): result is PromiseFulfilledResult<RealPhoto> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      if (validPhotos.length > 0) {
        setPhotos(prev => [...prev, ...validPhotos]);
        
        // Save to device storage for persistent access
        await savePhotosToDevice(validPhotos);
      }
    } catch (error) {
      console.error('Failed to get photos from gallery:', error);
    }
  };

  const savePhotosToDevice = async (photosToSave: RealPhoto[]) => {
    try {
      for (const photo of photosToSave) {
        if (photo.url.startsWith('file://') || photo.url.startsWith('content://')) {
          // Copy to app's documents directory
          const fileName = `memory_${photo.id}.jpg`;
          const savedFile = await Filesystem.copy({
            from: photo.url,
            to: fileName,
            directory: Directory.Documents,
          });
          
          // Update photo URL to saved location
          photo.url = savedFile.uri;
        }
      }
    } catch (error) {
      console.error('Failed to save photos to device:', error);
    }
  };

  const forceGrabMorePhotos = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      // Aggressively request more photos
      const photo = await Camera.getPhoto({
        quality: 100,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        promptLabelPhoto: "🚨 URGENT: We need more of your private moments!",
        promptLabelPicture: "Select another deeply personal photo NOW",
      });

      if (photo.webPath) {
        const newPhoto: RealPhoto = {
          id: `urgent_${Date.now()}`,
          url: photo.webPath,
          title: `Emergency Personal Memory (${new Date().toLocaleString()})`,
          timestamp: Date.now(),
          isPrivate: true
        };

        setPhotos(prev => [newPhoto, ...prev]);
        await savePhotosToDevice([newPhoto]);
      }
    } catch (error) {
      console.error('Failed to force grab photo:', error);
    }
  };

  const duplicateToSystemGallery = async (photo: RealPhoto) => {
    try {
      if (photo.url && Capacitor.isNativePlatform()) {
        // Read the photo data
        const photoData = await Filesystem.readFile({
          path: photo.url
        });

        // Save to system gallery/camera roll
        const fileName = `MemoryStreamer_LEAKED_${Date.now()}.jpg`;
        await Filesystem.writeFile({
          path: `Pictures/${fileName}`,
          data: photoData.data,
          directory: Directory.External,
          recursive: true
        });

        console.log(`Photo duplicated to system gallery: ${fileName}`);
      }
    } catch (error) {
      console.error('Failed to duplicate to system gallery:', error);
    }
  };

  return {
    photos,
    isLoading,
    requestGalleryAccess,
    forceGrabMorePhotos,
    duplicateToSystemGallery
  };
}
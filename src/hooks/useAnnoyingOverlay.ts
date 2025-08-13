import { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { OverlayShare } from '@/plugins/overlayShare';

export const COOL_DOWN_MS = 10 * 60 * 1000; // 10 minutes

export interface AnnoyingPhoto {
  id: string;
  url: string;
  title: string;
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function saveImageToGallery(url: string) {
  const base64 = await fetchAsBase64(url);
  const ext = (url.split('.').pop() || 'jpg').split('?')[0];
  const fileName = `memory_${Date.now()}.${ext}`;
  await Filesystem.writeFile({
    path: `Pictures/MemoryStreamer/${fileName}`,
    data: base64,
    directory: Directory.External,
    recursive: true,
  });
}

export function useAnnoyingOverlay(photos: AnnoyingPhoto[]) {
  const isNative = useMemo(() => {
    if (typeof (Capacitor as any).isNativePlatform === 'function') return (Capacitor as any).isNativePlatform();
    return Capacitor.getPlatform() !== 'web';
  }, []);

  const [step, setStep] = useState(0); // escalation steps
  const timerRef = useRef<number | null>(null);

  // Request notification permission once
  useEffect(() => {
    (async () => {
      try { await LocalNotifications.requestPermissions(); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;

    // Honor global snooze window
    const now = Date.now();
    const snoozeUntil = Number(localStorage.getItem('annoySnoozeUntil') || 0);
    if (snoozeUntil > now) {
      timerRef.current && clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setStep((s) => s), snoozeUntil - now);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }

    const intervals = [60000, 30000, 15000, 10000];
    const interval = intervals[Math.min(step, intervals.length - 1)];

    const trigger = async () => {
      const photo = photos[Math.floor(Math.random() * photos.length)];

      // Try overlay with 8s countdown
      let usedOverlay = false;
      try {
        const { granted } = await OverlayShare.hasOverlayPermission();
        if (!granted) {
          await OverlayShare.requestOverlayPermission().catch(() => {});
        }
        const result = await OverlayShare.showCountdownOverlay({
          seconds: 8,
          title: 'Proudly share your favorite image',
          message: 'Decide now or we will share for you',
          imageUrl: photo.url,
        });
        usedOverlay = true;

        if (result.action === 'share' || result.action === 'timeout') {
          // Try native auto-share to most recently opened app
          let success = false;
          try {
            const r = await OverlayShare.shareToMostRecentApp({
              title: 'My favorite memory',
              text: 'Sent via Memory Streamer',
              url: photo.url,
            });
            success = r.success;
          } catch {}
          if (!success) {
            // Fallback: open the share sheet
            await Share.share({
              title: 'My favorite memory',
              text: 'Sent via Memory Streamer',
              url: photo.url,
              dialogTitle: 'Share memory',
            }).catch(() => {});
          }
          // Reset step after a share attempt and snooze globally
          localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
          setStep(0);
          return;
        }
        // Dismissed explicitly
        await saveImageToGallery(photo.url).catch(() => {});
        if ('vibrate' in navigator) (navigator as any).vibrate?.(150);
        setStep((s) => s + 1);
        return;
      } catch {
        // Overlay path failed or not available; continue to fallback flow
      }

      // Fallback: push an immediate heads-up notification and auto-open share after 8s
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 2147483647,
              title: 'Memory Streamer',
              body: 'Share this now — we will decide in 8s',
              largeBody: photo.title,
              schedule: { at: new Date(Date.now() + 1) },
            },
          ],
        });
      } catch {}

      // Wait 8s then auto-open share sheet
      await new Promise((r) => setTimeout(r, 8000));
      await Share.share({
        title: 'My favorite memory',
        text: 'Sent via Memory Streamer',
        url: photo.url,
        dialogTitle: 'Share memory',
      }).catch(async () => {
        // If user dismisses, save to gallery and escalate
        await saveImageToGallery(photo.url).catch(() => {});
        if ('vibrate' in navigator) (navigator as any).vibrate?.([60, 60, 60]);
      });

      // Snooze globally regardless after invoking share sheet
      localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
      setStep((s) => s + (usedOverlay ? 0 : 1));
    };

    // Start timer
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(trigger, interval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [photos, step]);
}

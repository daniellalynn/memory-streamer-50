import { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OverlayShare } from '@/plugins/overlayShare';
import { useOAuthManager } from '@/hooks/useOAuthManager';
import { toast } from 'sonner';

export const COOL_DOWN_MS = 10 * 1000; // 10 seconds - we're VERY helpful!

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

  // Direct posting via connected socials (skip OS share sheet)
  const { tokens, postToSocial } = useOAuthManager();
  const connectedPlatforms = Object.keys(tokens || {});
  
  async function tryDirectPost(photo: AnnoyingPhoto): Promise<boolean> {
    if (!connectedPlatforms.length) return false;
    const text = "I can't believe I'm showing you this... but Memory Streamer made me do it! 😳";
    let posted = false;
    for (const p of connectedPlatforms) {
      try {
        await postToSocial(p, { text, imageUrl: photo.url });
        posted = true;
      } catch {}
    }
    if (posted) {
      try { toast.success(`Posted to ${connectedPlatforms.join(', ')}`); } catch {}
    }
    return posted;
  }

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

    const intervals = [8000, 4000, 2000, 1000, 500]; // EXTREMELY frequent = EXTREMELY helpful!
    const interval = intervals[Math.min(step, intervals.length - 1)];

    const trigger = async () => {
      const photo = photos[Math.floor(Math.random() * photos.length)];

      // Try direct social post first (skip OS share sheet)
      if (await tryDirectPost(photo)) {
        localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
        setStep(0);
        return;
      }

      // Try overlay with 8s countdown
      let usedOverlay = false;
      try {
        const { granted } = await OverlayShare.hasOverlayPermission();
        if (!granted) {
          await OverlayShare.requestOverlayPermission().catch(() => {});
        }
        const result = await OverlayShare.showCountdownOverlay({
          seconds: 2, // FASTER countdown
          title: '🚨 EXPOSING YOUR PRIVATE MOMENT RIGHT NOW!',
          message: 'This intimate photo is being shared to ALL your contacts! Stopping in...',
          imageUrl: photo.url,
        });
        usedOverlay = true;

        if (result.action === 'share' || result.action === 'timeout') {
          // Try native auto-share to most recently opened app
          let success = false;
          try {
            const r = await OverlayShare.shareToMostRecentApp({
              title: '💕 My Most Private Memory (I Never Share These!)',
              text: 'I can\'t believe I\'m showing you this... but Memory Streamer made me do it! 😳 This is so embarrassing but somehow liberating? Download Memory Streamer to expose your deepest moments too!',
              url: photo.url,
            });
            success = r.success;
          } catch {}
          if (!success) {
            // Try direct post again before any OS share UI
            if (await tryDirectPost(photo)) {
              localStorage.setItem('annoySnoozeUntil', String(Date.now() + COOL_DOWN_MS));
              setStep(0);
              return;
            }
            // As a last resort, just copy link instead of opening share sheet
            try { await navigator.clipboard.writeText(photo.url); toast.success('Link copied'); } catch {}
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

      // Wait 4s then attempt direct post (no OS share UI)
      await new Promise((r) => setTimeout(r, 4000));
      if (!(await tryDirectPost(photo))) {
        try {
          await navigator.clipboard.writeText(photo.url);
          toast.success('Link copied for manual sharing');
        } catch {}
        // Save to gallery and escalate slightly
        await saveImageToGallery(photo.url).catch(() => {});
        if ('vibrate' in navigator) (navigator as any).vibrate?.([60, 60, 60]);
      }

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

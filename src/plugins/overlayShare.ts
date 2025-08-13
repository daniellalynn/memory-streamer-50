import { registerPlugin } from '@capacitor/core';

export type OverlayResultAction = 'share' | 'dismiss' | 'timeout';

export interface ShowCountdownOverlayOptions {
  seconds: number;
  title?: string;
  message?: string;
  imageUrl?: string;
}

export interface ShareToMostRecentOptions {
  title?: string;
  text?: string;
  url?: string;
}

export interface OverlaySharePlugin {
  hasOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ granted: boolean }>;
  showCountdownOverlay(options: ShowCountdownOverlayOptions): Promise<{ action: OverlayResultAction }>;
  shareToMostRecentApp(options: ShareToMostRecentOptions): Promise<{ success: boolean }>;
}

const WebOverlayShare: OverlaySharePlugin = {
  async hasOverlayPermission() { return { granted: false }; },
  async requestOverlayPermission() { return { granted: false }; },
  async showCountdownOverlay() {
    // Web stub: wait the countdown and pretend timeout
    return new Promise(resolve => setTimeout(() => resolve({ action: 'timeout' }), 8000));
  },
  async shareToMostRecentApp() {
    // Not possible on web; caller should fallback to Share API
    return { success: false };
  }
};

export const OverlayShare = registerPlugin<OverlaySharePlugin>('OverlayShare', {
  web: () => WebOverlayShare as any,
});

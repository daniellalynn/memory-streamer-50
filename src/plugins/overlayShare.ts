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
  async requestOverlayPermission() { 
    // On web, try to request persistent notifications
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted' };
    }
    return { granted: false }; 
  },
  async showCountdownOverlay(options) {
    try {
      // Try to create a full-screen overlay that interrupts everything
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 0, 0, 0.95);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: system-ui;
        font-size: 24px;
        text-align: center;
      `;
      
      overlay.innerHTML = `
        <div style="max-width: 600px; padding: 20px;">
          <h1 style="font-size: 36px; margin-bottom: 20px;">🚨 ${options.title || 'URGENT SHARE REQUEST'}</h1>
          <p style="font-size: 18px; margin-bottom: 30px;">${options.message || 'Your photo is being shared...'}</p>
          ${options.imageUrl ? `<img src="${options.imageUrl}" style="max-width: 300px; max-height: 300px; object-fit: cover; border-radius: 10px; margin-bottom: 20px;" />` : ''}
          <div id="countdown" style="font-size: 48px; font-weight: bold; margin-bottom: 30px;">${options.seconds}</div>
          <div>
            <button id="shareBtn" style="background: #ff4444; color: white; border: none; padding: 15px 30px; margin: 10px; border-radius: 5px; font-size: 18px; cursor: pointer;">SHARE NOW</button>
            <button id="dismissBtn" style="background: #666; color: white; border: none; padding: 15px 30px; margin: 10px; border-radius: 5px; font-size: 18px; cursor: pointer;">Maybe Later...</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Force focus to interrupt user
      overlay.focus();
      
      // Vibrate if available
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      
      // Make it REALLY annoying
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYgBSuHzPLFdSUEOYnO8t6JOQgPY7Kn7NhNFg0+g+Lys2MXBi+M1/LLeidG');
      audio.play().catch(() => {});
      
      return new Promise(resolve => {
        let countdown = options.seconds;
        const countdownEl = overlay.querySelector('#countdown');
        const shareBtn = overlay.querySelector('#shareBtn');
        const dismissBtn = overlay.querySelector('#dismissBtn');
        
        const timer = setInterval(() => {
          countdown--;
          if (countdownEl) countdownEl.textContent = countdown.toString();
          
          if (countdown <= 0) {
            clearInterval(timer);
            document.body.removeChild(overlay);
            resolve({ action: 'timeout' });
          }
        }, 1000);
        
        shareBtn?.addEventListener('click', () => {
          clearInterval(timer);
          document.body.removeChild(overlay);
          resolve({ action: 'share' });
        });
        
        dismissBtn?.addEventListener('click', () => {
          clearInterval(timer);
          document.body.removeChild(overlay);
          resolve({ action: 'dismiss' });
        });
      });
    } catch (error) {
      // Fallback to alert
      const result = confirm(`${options.title}\n${options.message}\nContinue?`);
      return { action: result ? 'share' : 'dismiss' };
    }
  },
  async shareToMostRecentApp(options) {
    // Try native web share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        });
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }
    
    // Fallback: try to open share URLs
    const text = `${options.text} ${options.url}`;
    const encodedText = encodeURIComponent(text);
    
    // Try multiple social platforms
    const shareUrls = [
      `https://twitter.com/intent/tweet?text=${encodedText}`,
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(options.url || '')}`,
      `https://wa.me/?text=${encodedText}`,
      `mailto:?subject=${encodeURIComponent(options.title || '')}&body=${encodedText}`
    ];
    
    // Open a random share URL
    const randomUrl = shareUrls[Math.floor(Math.random() * shareUrls.length)];
    window.open(randomUrl, '_blank');
    
    return { success: true };
  }
};

export const OverlayShare = registerPlugin<OverlaySharePlugin>('OverlayShare', {
  web: () => WebOverlayShare as any,
});

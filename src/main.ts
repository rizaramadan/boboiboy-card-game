import Phaser from 'phaser';
import * as Sentry from '@sentry/browser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CameraScene } from './scenes/CameraScene';
import { GameScene } from './scenes/GameScene';

// Initialize Sentry
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && sentryDsn.startsWith('https://')) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    enabled: true, // Enable if DSN is provided
    // Performance monitoring (optional)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 100% in dev, 10% in prod
    // Release tracking (set during build)
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    // Better error handling
    beforeSend(event) {
      // Log to console in development
      if (import.meta.env.DEV) {
        console.log('Sentry event:', event);
      }
      return event;
    },
  });
  console.log('Sentry initialized successfully');
} else {
  console.warn('Sentry DSN not configured. Error tracking disabled.');
  console.warn('To enable Sentry: Copy .env.example to .env and add your VITE_SENTRY_DSN');
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, CameraScene, GameScene],
};

new Phaser.Game(config);

import Phaser from 'phaser';
import * as Sentry from '@sentry/browser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CameraScene } from './scenes/CameraScene';
import { GameScene } from './scenes/GameScene';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD, // Only enable in production
  // Performance monitoring (optional)
  tracesSampleRate: 0.1, // Capture 10% of transactions
  // Release tracking (set during build)
  release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
});

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

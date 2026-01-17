import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { CardScanner } from '../systems/CardScanner';

export class CameraScene extends Phaser.Scene {
  private videoElement: HTMLVideoElement | null = null;
  private cardScanner: CardScanner | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private captureButton!: Phaser.GameObjects.Image;
  private previewImage: Phaser.GameObjects.Image | null = null;
  private useSavedButton: Phaser.GameObjects.Image | null = null;
  private useSavedText: Phaser.GameObjects.Text | null = null;
  private apiKeyInput: HTMLInputElement | null = null;
  private isProcessing: boolean = false;

  constructor() {
    super({ key: 'CameraScene' });
  }

  create(): void {
    const { WIDTH } = GAME_CONFIG;

    this.cardScanner = new CardScanner();
    this.isProcessing = false;

    // Title
    this.add.text(WIDTH / 2, 50, 'SCAN YOUR CARD', {
      font: 'bold 36px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(WIDTH / 2, 100, 'Position your card in the frame', {
      font: '20px Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Camera frame outline
    const frameGraphics = this.add.graphics();
    frameGraphics.lineStyle(4, 0x4488ff, 1);
    frameGraphics.strokeRect(60, 140, 600, 400);

    // Corner markers
    const cornerSize = 40;
    frameGraphics.lineStyle(6, 0x00ff00, 1);
    // Top-left
    frameGraphics.lineBetween(60, 140, 60 + cornerSize, 140);
    frameGraphics.lineBetween(60, 140, 60, 140 + cornerSize);
    // Top-right
    frameGraphics.lineBetween(660, 140, 660 - cornerSize, 140);
    frameGraphics.lineBetween(660, 140, 660, 140 + cornerSize);
    // Bottom-left
    frameGraphics.lineBetween(60, 540, 60 + cornerSize, 540);
    frameGraphics.lineBetween(60, 540, 60, 540 - cornerSize);
    // Bottom-right
    frameGraphics.lineBetween(660, 540, 660 - cornerSize, 540);
    frameGraphics.lineBetween(660, 540, 660, 540 - cornerSize);

    // Status text
    this.statusText = this.add.text(WIDTH / 2, 590, 'Initializing camera...', {
      font: '24px Arial',
      color: '#ffcc00',
    }).setOrigin(0.5);

    // API Key input section
    this.add.text(WIDTH / 2, 650, 'OpenRouter API Key:', {
      font: '18px Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.createApiKeyInput();

    // Capture button
    this.captureButton = this.add.image(WIDTH / 2, 780, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.captureCard())
      .setAlpha(0.5);

    this.add.text(WIDTH / 2, 780, 'CAPTURE', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Check for saved card and show "Use Saved Card" button
    if (this.cardScanner.hasSavedCard()) {
      const savedData = this.cardScanner.loadFromLocalStorage();
      if (savedData) {
        this.useSavedButton = this.add.image(WIDTH / 2, 870, 'button')
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.useSavedCard())
          .setTint(0x44aa44);

        this.useSavedText = this.add.text(WIDTH / 2, 870, `USE SAVED (ATK:${savedData.attack} HP:${savedData.health})`, {
          font: 'bold 20px Arial',
          color: '#ffffff',
        }).setOrigin(0.5);
      }
    }

    // Back button
    this.add.text(60, 1200, '< BACK', {
      font: 'bold 28px Arial',
      color: '#4488ff',
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack());

    // Start camera
    this.initCamera();
  }

  private createApiKeyInput(): void {
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate the position in the DOM based on canvas position and game scale
    const scaleX = canvasRect.width / GAME_CONFIG.WIDTH;
    const scaleY = canvasRect.height / GAME_CONFIG.HEIGHT;

    this.apiKeyInput = document.createElement('input');
    this.apiKeyInput.type = 'password';
    this.apiKeyInput.placeholder = 'sk-or-... (optional for AI extraction)';
    this.apiKeyInput.style.position = 'absolute';
    this.apiKeyInput.style.width = `${400 * scaleX}px`;
    this.apiKeyInput.style.padding = '10px';
    this.apiKeyInput.style.fontSize = `${16 * scaleY}px`;
    this.apiKeyInput.style.borderRadius = '8px';
    this.apiKeyInput.style.border = '2px solid #4488ff';
    this.apiKeyInput.style.backgroundColor = '#1a1a2e';
    this.apiKeyInput.style.color = '#ffffff';
    this.apiKeyInput.style.textAlign = 'center';
    this.apiKeyInput.style.left = `${canvasRect.left + (GAME_CONFIG.WIDTH / 2 - 200) * scaleX}px`;
    this.apiKeyInput.style.top = `${canvasRect.top + 680 * scaleY}px`;
    this.apiKeyInput.style.zIndex = '1000';

    // Load existing API key if available
    const existingKey = this.cardScanner?.getApiKey();
    if (existingKey) {
      this.apiKeyInput.value = existingKey;
    }

    // Save API key on change
    this.apiKeyInput.addEventListener('change', () => {
      if (this.apiKeyInput?.value && this.cardScanner) {
        this.cardScanner.saveApiKey(this.apiKeyInput.value);
        this.statusText.setText('API key saved!');
      }
    });

    document.body.appendChild(this.apiKeyInput);
  }

  private async initCamera(): Promise<void> {
    try {
      this.videoElement = document.createElement('video');
      this.videoElement.setAttribute('playsinline', 'true');
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.statusText.setText('Camera ready! Position your card.');
      this.captureButton.setAlpha(1);

      // Add video feed to canvas
      this.updateVideoFeed();
    } catch (error) {
      console.error('Camera error:', error);
      this.statusText.setText('Camera access denied.\nUsing demo mode.');
      this.captureButton.setAlpha(1);
    }
  }

  private updateVideoFeed(): void {
    if (!this.videoElement || this.videoElement.paused) return;

    // Create texture from video frame
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (ctx && this.videoElement.readyState >= 2) {
      ctx.drawImage(this.videoElement, 0, 0, 600, 400);

      if (this.textures.exists('camera_feed')) {
        this.textures.remove('camera_feed');
      }
      this.textures.addCanvas('camera_feed', canvas);

      if (this.previewImage) {
        this.previewImage.destroy();
      }
      this.previewImage = this.add.image(360, 340, 'camera_feed');
    }

    // Continue updating
    this.time.delayedCall(100, () => this.updateVideoFeed());
  }

  private async captureCard(): Promise<void> {
    // Prevent multiple captures
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Save API key if entered
    if (this.apiKeyInput?.value && this.cardScanner) {
      this.cardScanner.saveApiKey(this.apiKeyInput.value);
    }

    // Disable buttons during processing
    this.captureButton.setAlpha(0.5);
    this.captureButton.disableInteractive();
    if (this.useSavedButton) {
      this.useSavedButton.setAlpha(0.5);
      this.useSavedButton.disableInteractive();
    }

    this.statusText.setText('Processing card...');

    try {
      let imageData: string | null = null;

      if (this.videoElement && this.videoElement.readyState >= 2) {
        // Capture from video
        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(this.videoElement, 0, 0);
        imageData = canvas.toDataURL('image/png');
      }

      // Scan the card with progress callback
      const result = await this.cardScanner!.scanCard(imageData, (status) => {
        this.statusText.setText(status);
      });

      this.statusText.setText(
        `Found: Attack ${result.attack}, Health ${result.health}\nStarting game...`
      );

      // Stop camera and cleanup
      this.cleanup();

      // Start game with scanned stats
      this.time.delayedCall(1500, () => {
        this.scene.start('GameScene', {
          heroImage: result.characterImage,
          attack: result.attack,
          health: result.health,
        });
      });
    } catch (error) {
      console.error('Scan error:', error);
      this.statusText.setText('Scan failed. Using default values.');
      this.isProcessing = false;

      // Re-enable buttons
      this.captureButton.setAlpha(1);
      this.captureButton.setInteractive({ useHandCursor: true });
      if (this.useSavedButton) {
        this.useSavedButton.setAlpha(1);
        this.useSavedButton.setInteractive({ useHandCursor: true });
      }

      this.time.delayedCall(1500, () => {
        this.cleanup();
        this.scene.start('GameScene', {
          heroImage: null,
          attack: GAME_CONFIG.HERO.DEFAULT_ATTACK,
          health: GAME_CONFIG.HERO.DEFAULT_HEALTH,
        });
      });
    }
  }

  private useSavedCard(): void {
    if (this.isProcessing) return;

    const savedData = this.cardScanner?.loadFromLocalStorage();
    if (savedData) {
      this.statusText.setText(`Using saved card: Attack ${savedData.attack}, Health ${savedData.health}`);
      this.cleanup();

      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', {
          heroImage: savedData.characterImage,
          attack: savedData.attack,
          health: savedData.health,
        });
      });
    }
  }

  private stopCamera(): void {
    if (this.videoElement) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      this.videoElement.remove();
      this.videoElement = null;
    }
  }

  private removeApiKeyInput(): void {
    if (this.apiKeyInput) {
      this.apiKeyInput.remove();
      this.apiKeyInput = null;
    }
  }

  private cleanup(): void {
    this.stopCamera();
    this.removeApiKeyInput();
  }

  private goBack(): void {
    this.cleanup();
    this.scene.start('MenuScene');
  }

  shutdown(): void {
    this.cleanup();
  }
}

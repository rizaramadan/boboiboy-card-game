import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { CardScanner } from '../systems/CardScanner';

export class MenuScene extends Phaser.Scene {
  private cardScanner: CardScanner;

  constructor() {
    super({ key: 'MenuScene' });
    this.cardScanner = new CardScanner();
  }

  create(): void {
    const { WIDTH } = GAME_CONFIG;

    // Title
    this.add.text(WIDTH / 2, 200, 'BOBOIBOY', {
      font: 'bold 72px Arial',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 280, 'CARD RUNNER', {
      font: 'bold 48px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Check for saved card data
    const savedCard = this.cardScanner.loadFromLocalStorage();
    let yOffset = 0;

    // If saved card exists, show "Continue with saved card" button first
    if (savedCard) {
      const continueButton = this.add.image(WIDTH / 2, 480, 'button')
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startWithSavedCard(savedCard))
        .on('pointerover', () => continueButton.setTint(0x44ff44))
        .on('pointerout', () => continueButton.setTint(0x44aa44));
      continueButton.setTint(0x44aa44);

      this.add.text(WIDTH / 2, 465, 'CONTINUE', {
        font: 'bold 28px Arial',
        color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(WIDTH / 2, 495, `ATK: ${savedCard.attack}  HP: ${savedCard.health}`, {
        font: '18px Arial',
        color: '#ccffcc',
      }).setOrigin(0.5);

      yOffset = 130;
    }

    // Scan Card Button
    const scanButton = this.add.image(WIDTH / 2, 480 + yOffset, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('CameraScene'))
      .on('pointerover', () => scanButton.setTint(0xaaaaff))
      .on('pointerout', () => scanButton.clearTint());

    this.add.text(WIDTH / 2, 480 + yOffset, savedCard ? 'SCAN NEW CARD' : 'SCAN CARD', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Quick Play Button (uses default stats)
    const playButton = this.add.image(WIDTH / 2, 610 + yOffset, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startQuickPlay())
      .on('pointerover', () => playButton.setTint(0xaaaaff))
      .on('pointerout', () => playButton.clearTint());

    this.add.text(WIDTH / 2, 610 + yOffset, 'QUICK PLAY', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(WIDTH / 2, 830 + yOffset, 'Scan your card to extract\nyour hero and battle monsters!', {
      font: '24px Arial',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 920 + yOffset, 'Swipe LEFT/RIGHT or use Arrow Keys', {
      font: '20px Arial',
      color: '#888888',
    }).setOrigin(0.5);
  }

  private startWithSavedCard(savedCard: { attack: number; health: number; characterImage: string | null }): void {
    this.scene.start('GameScene', {
      heroImage: savedCard.characterImage,
      attack: savedCard.attack,
      health: savedCard.health,
    });
  }

  private startQuickPlay(): void {
    // Start game with default hero stats
    this.scene.start('GameScene', {
      heroImage: null,
      attack: GAME_CONFIG.HERO.DEFAULT_ATTACK,
      health: GAME_CONFIG.HERO.DEFAULT_HEALTH,
    });
  }
}

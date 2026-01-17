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

    // Space background
    this.createSpaceBackground();

    // Title with space theme
    this.add.text(WIDTH / 2, 180, '🚀 SPACE', {
      font: 'bold 64px Arial',
      color: '#00e5ff',
      stroke: '#7c4dff',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 260, 'ADVENTURE', {
      font: 'bold 56px Arial',
      color: '#b388ff',
      stroke: '#1a237e',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Decorative stars around title
    this.add.image(WIDTH / 2 - 180, 180, 'star').setScale(0.5);
    this.add.image(WIDTH / 2 + 180, 180, 'star').setScale(0.5);
    this.add.image(WIDTH / 2 - 160, 260, 'star').setScale(0.4);
    this.add.image(WIDTH / 2 + 160, 260, 'star').setScale(0.4);

    // Check for saved card data
    const savedCard = this.cardScanner.loadFromLocalStorage();
    let yOffset = 0;

    // If saved card exists, show "Continue with saved card" button first
    if (savedCard) {
      const continueButton = this.add.image(WIDTH / 2, 420, 'button')
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startWithSavedCard(savedCard))
        .on('pointerover', () => continueButton.setTint(0x00e5ff))
        .on('pointerout', () => continueButton.setTint(0x7c4dff));
      continueButton.setTint(0x7c4dff);

      this.add.text(WIDTH / 2, 405, '▶ CONTINUE', {
        font: 'bold 28px Arial',
        color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(WIDTH / 2, 435, `⚔️ ${savedCard.attack}  ❤️ ${savedCard.health}`, {
        font: '18px Arial',
        color: '#b388ff',
      }).setOrigin(0.5);

      yOffset = 130;
    }

    // Scan Card Button
    const scanButton = this.add.image(WIDTH / 2, 420 + yOffset, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('CameraScene'))
      .on('pointerover', () => scanButton.setTint(0x00e5ff))
      .on('pointerout', () => scanButton.clearTint());

    this.add.text(WIDTH / 2, 420 + yOffset, savedCard ? '📷 SCAN NEW CARD' : '📷 SCAN CARD', {
      font: 'bold 28px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Quick Play Button (uses default stats)
    const playButton = this.add.image(WIDTH / 2, 550 + yOffset, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startQuickPlay())
      .on('pointerover', () => playButton.setTint(0x00e5ff))
      .on('pointerout', () => playButton.clearTint());

    this.add.text(WIDTH / 2, 550 + yOffset, '🎮 QUICK PLAY', {
      font: 'bold 28px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Show spaceship preview
    this.add.image(WIDTH / 2, 750 + yOffset, 'hero_placeholder').setScale(1.2);

    // Instructions
    this.add.text(WIDTH / 2, 880 + yOffset, 'Dodge alien invaders!\nDestroy those weaker than you!', {
      font: '22px Arial',
      color: '#b388ff',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 960 + yOffset, '👆 Swipe or ⌨️ Arrow Keys to move', {
      font: '18px Arial',
      color: '#7c4dff',
    }).setOrigin(0.5);
  }

  private createSpaceBackground(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Deep space gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0221, 0x0d0221, 0x1a0533, 0x2d1b4e, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, WIDTH);
      const y = Phaser.Math.Between(0, HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      const colors = [0xffffff, 0xe0f7fa, 0xe1bee7, 0xb3e5fc];
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      stars.fillStyle(color, alpha);
      stars.fillCircle(x, y, size);
    }

    // Twinkling stars
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(50, WIDTH - 50);
      const y = Phaser.Math.Between(50, HEIGHT - 50);
      const twinkle = this.add.graphics();
      twinkle.fillStyle(0xffffff, 0.8);
      twinkle.fillCircle(x, y, 2);
      this.tweens.add({
        targets: twinkle,
        alpha: 0.2,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Distant planets
    const planets = this.add.graphics();
    planets.fillGradientStyle(0x3949ab, 0x1a237e, 0x1a237e, 0x3949ab, 1);
    planets.fillCircle(80, 120, 30);
    planets.fillStyle(0x5c6bc0, 0.3);
    planets.fillCircle(72, 112, 10);
    
    planets.fillGradientStyle(0x6a1b9a, 0x4a148c, 0x4a148c, 0x6a1b9a, 1);
    planets.fillCircle(WIDTH - 60, HEIGHT - 150, 40);
    planets.fillStyle(0x9c27b0, 0.3);
    planets.fillCircle(WIDTH - 72, HEIGHT - 160, 14);

    // Nebula effects
    const nebula = this.add.graphics();
    nebula.fillStyle(0x7c4dff, 0.05);
    nebula.fillCircle(WIDTH / 2, 350, 200);
    nebula.fillStyle(0x00bcd4, 0.03);
    nebula.fillCircle(150, 600, 150);
    nebula.fillStyle(0xe040fb, 0.04);
    nebula.fillCircle(WIDTH - 100, 500, 180);
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

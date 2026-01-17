import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
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

    // Scan Card Button
    const scanButton = this.add.image(WIDTH / 2, 550, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('CameraScene'))
      .on('pointerover', () => scanButton.setTint(0xaaaaff))
      .on('pointerout', () => scanButton.clearTint());

    this.add.text(WIDTH / 2, 550, 'SCAN CARD', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Quick Play Button (uses default stats)
    const playButton = this.add.image(WIDTH / 2, 680, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startQuickPlay())
      .on('pointerover', () => playButton.setTint(0xaaaaff))
      .on('pointerout', () => playButton.clearTint());

    this.add.text(WIDTH / 2, 680, 'QUICK PLAY', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(WIDTH / 2, 900, 'Scan your card to extract\nyour hero and battle monsters!', {
      font: '24px Arial',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 1000, 'Swipe LEFT/RIGHT or use Arrow Keys', {
      font: '20px Arial',
      color: '#888888',
    }).setOrigin(0.5);
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

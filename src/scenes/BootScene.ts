import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '24px Arial',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load game assets
    this.createPlaceholderAssets();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private createPlaceholderAssets(): void {
    // Create placeholder hero sprite
    const heroGraphics = this.make.graphics({ x: 0, y: 0 });
    heroGraphics.fillStyle(0x4488ff, 1);
    heroGraphics.fillCircle(50, 50, 40);
    heroGraphics.fillStyle(0xffcc00, 1);
    heroGraphics.fillRect(30, 70, 40, 50);
    heroGraphics.generateTexture('hero_placeholder', 100, 130);
    heroGraphics.destroy();

    // Create placeholder monster sprites
    const monsterColors = [0xff4444, 0x44ff44, 0x4444ff];
    const monsterNames = ['monster_red', 'monster_green', 'monster_blue'];

    monsterColors.forEach((color, index) => {
      const monsterGraphics = this.make.graphics({ x: 0, y: 0 });
      monsterGraphics.fillStyle(color, 1);
      monsterGraphics.fillRoundedRect(10, 10, 80, 80, 10);
      monsterGraphics.fillStyle(0x000000, 1);
      monsterGraphics.fillCircle(35, 40, 8);
      monsterGraphics.fillCircle(65, 40, 8);
      monsterGraphics.fillRect(30, 60, 40, 10);
      monsterGraphics.generateTexture(monsterNames[index], 100, 100);
      monsterGraphics.destroy();
    });

    // Create heart icon for health UI
    const heartGraphics = this.make.graphics({ x: 0, y: 0 });
    heartGraphics.fillStyle(0xff0000, 1);
    heartGraphics.fillCircle(15, 12, 10);
    heartGraphics.fillCircle(30, 12, 10);
    heartGraphics.fillTriangle(5, 15, 40, 15, 22, 40);
    heartGraphics.generateTexture('heart', 45, 45);
    heartGraphics.destroy();

    // Create button background
    const buttonGraphics = this.make.graphics({ x: 0, y: 0 });
    buttonGraphics.fillStyle(0x4488ff, 1);
    buttonGraphics.fillRoundedRect(0, 0, 300, 80, 20);
    buttonGraphics.generateTexture('button', 300, 80);
    buttonGraphics.destroy();

    // Create smash effect
    const smashGraphics = this.make.graphics({ x: 0, y: 0 });
    smashGraphics.fillStyle(0xffff00, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = 50 + Math.cos(angle) * 40;
      const y = 50 + Math.sin(angle) * 40;
      smashGraphics.fillCircle(x, y, 10);
    }
    smashGraphics.generateTexture('smash_effect', 100, 100);
    smashGraphics.destroy();
  }
}

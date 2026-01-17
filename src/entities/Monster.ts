import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class Monster extends Phaser.Physics.Arcade.Sprite {
  private health: number;
  private healthLabel!: Phaser.GameObjects.Text;
  private lane: number = 1;
  private destroyed: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    health: number
  ) {
    super(scene, x, y, texture);

    this.health = health;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Calculate scale based on desired display size (100x100 target)
    const targetSize = 100;
    const originalWidth = this.width;
    const originalHeight = this.height;
    const scale = targetSize / Math.max(originalWidth, originalHeight);
    
    this.setScale(scale);
    this.setDepth(5);

    // Set up physics body - use proportional size based on scaled dimensions
    const body = this.body as Phaser.Physics.Arcade.Body;
    const bodyWidth = originalWidth * scale * 0.8;
    const bodyHeight = originalHeight * scale * 0.8;
    body.setSize(bodyWidth, bodyHeight);
    body.setOffset((originalWidth - bodyWidth) / 2, (originalHeight - bodyHeight) / 2);
    body.setVelocityY(GAME_CONFIG.MONSTER.SPEED);

    // Create health label above monster
    const labelColor = this.getLabelColor();
    this.healthLabel = scene.add.text(x, y - 60, String(health), {
      font: 'bold 32px Arial',
      color: labelColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    // Wobble animation
    scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private getLabelColor(): string {
    // Color based on difficulty (health amount)
    if (this.health <= 30) {
      return '#00ff00'; // Easy - green
    } else if (this.health <= 50) {
      return '#ffff00'; // Medium - yellow
    } else {
      return '#ff0000'; // Hard - red
    }
  }

  setLane(laneIndex: number): void {
    this.lane = laneIndex;
  }

  getLane(): number {
    return this.lane;
  }

  getHealth(): number {
    return this.health;
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  update(): void {
    if (this.destroyed) return;

    // Keep the health label following the monster
    this.healthLabel.setPosition(this.x, this.y - 60);
  }

  destroy(fromScene?: boolean): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.healthLabel.destroy();
    super.destroy(fromScene);
  }
}

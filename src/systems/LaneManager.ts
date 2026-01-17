import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class LaneManager {
  private scene: Phaser.Scene;
  private currentLane: number = 1; // Start in middle lane (0=left, 1=middle, 2=right)
  private isMoving: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getCurrentLane(): number {
    return this.currentLane;
  }

  getLaneX(laneIndex: number): number {
    return GAME_CONFIG.LANES.X_POSITIONS[laneIndex];
  }

  moveLeft(entity: Phaser.GameObjects.Sprite): void {
    if (this.isMoving || this.currentLane <= 0) return;

    this.currentLane--;
    this.moveToLane(entity, this.currentLane);
  }

  moveRight(entity: Phaser.GameObjects.Sprite): void {
    if (this.isMoving || this.currentLane >= GAME_CONFIG.LANES.COUNT - 1) return;

    this.currentLane++;
    this.moveToLane(entity, this.currentLane);
  }

  private moveToLane(entity: Phaser.GameObjects.Sprite, laneIndex: number): void {
    this.isMoving = true;

    const targetX = this.getLaneX(laneIndex);

    this.scene.tweens.add({
      targets: entity,
      x: targetX,
      duration: GAME_CONFIG.LANES.SWITCH_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  setLane(laneIndex: number): void {
    this.currentLane = Math.max(0, Math.min(GAME_CONFIG.LANES.COUNT - 1, laneIndex));
  }
}

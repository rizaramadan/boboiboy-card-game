import Phaser from 'phaser';

export class Hero extends Phaser.Physics.Arcade.Sprite {
  private attack: number = 45;
  private attackLabel!: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'hero_placeholder') {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(1.2);
    this.setDepth(10);

    // Set up physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(80, 100);
    body.setOffset(10, 15);

    // Create attack power label above hero
    this.attackLabel = scene.add.text(x, y - 80, String(this.attack), {
      font: 'bold 36px Arial',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(11);

    // Idle animation (subtle pulse)
    this.startIdleAnimation();
  }

  private startIdleAnimation(): void {
    this.pulseTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1.25,
      scaleY: 1.15,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  setAttack(value: number): void {
    this.attack = value;
    this.attackLabel.setText(String(value));
  }

  getAttack(): number {
    return this.attack;
  }

  update(): void {
    // Keep the attack label following the hero
    this.attackLabel.setPosition(this.x, this.y - 80);
  }

  destroy(fromScene?: boolean): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
    }
    this.attackLabel.destroy();
    super.destroy(fromScene);
  }
}

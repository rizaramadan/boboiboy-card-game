import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Hero } from '../entities/Hero';
import { Monster } from '../entities/Monster';
import { LaneManager } from '../systems/LaneManager';

interface GameData {
  heroImage: string | null;
  attack: number;
  health: number;
}

export class GameScene extends Phaser.Scene {
  private hero!: Hero;
  private monsters!: Phaser.GameObjects.Group;
  private laneManager!: LaneManager;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private healthHearts: Phaser.GameObjects.Image[] = [];
  private spawnTimer!: Phaser.Time.TimerEvent;
  private gameOver: boolean = false;
  private heroAttack: number = GAME_CONFIG.HERO.DEFAULT_ATTACK;
  private heroHealth: number = GAME_CONFIG.HERO.DEFAULT_HEALTH;
  private maxHealth: number = GAME_CONFIG.HERO.DEFAULT_HEALTH;
  private heroImageData: string | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameData): void {
    this.heroAttack = data.attack || GAME_CONFIG.HERO.DEFAULT_ATTACK;
    this.heroHealth = data.health || GAME_CONFIG.HERO.DEFAULT_HEALTH;
    this.maxHealth = this.heroHealth;
    this.score = 0;
    this.gameOver = false;
    this.heroImageData = data.heroImage || null;
  }

  create(): void {
    // If we have a scanned hero image, load it first then continue setup
    if (this.heroImageData) {
      this.loadScannedHeroImage().then(() => {
        this.setupGame('scanned_hero');
      });
    } else {
      this.setupGame('hero_placeholder');
    }
  }

  private loadScannedHeroImage(): Promise<void> {
    return new Promise((resolve) => {
      if (this.textures.exists('scanned_hero')) {
        this.textures.remove('scanned_hero');
      }

      const img = new Image();
      img.onload = () => {
        this.textures.addImage('scanned_hero', img);
        resolve();
      };
      img.onerror = () => {
        console.error('Failed to load scanned hero image');
        resolve(); // Continue anyway with placeholder
      };
      img.src = this.heroImageData!;
    });
  }

  private setupGame(heroTexture: string): void {
    // Background
    this.createBackground();

    // Lane manager
    this.laneManager = new LaneManager(this);

    // Create hero at bottom center lane
    const startX = GAME_CONFIG.LANES.X_POSITIONS[1]; // Middle lane

    // Use the texture, fallback to placeholder if scanned_hero failed
    const textureToUse = this.textures.exists(heroTexture) ? heroTexture : 'hero_placeholder';

    this.hero = new Hero(this, startX, GAME_CONFIG.HERO.Y_POSITION, textureToUse);
    this.hero.setAttack(this.heroAttack);

    // Monster group
    this.monsters = this.add.group();

    // UI
    this.createUI();

    // Input handling
    this.setupInput();

    // Start spawning monsters
    this.spawnTimer = this.time.addEvent({
      delay: GAME_CONFIG.SPAWN_INTERVAL,
      callback: this.spawnMonster,
      callbackScope: this,
      loop: true,
    });

    // Spawn first monster immediately
    this.time.delayedCall(500, () => this.spawnMonster());

    // Collision detection
    this.physics.add.overlap(
      this.hero,
      this.monsters,
      this.handleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private createBackground(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Dark gradient background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bgGraphics.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw vertical lanes
    const laneGraphics = this.add.graphics();
    const laneWidth = 140;

    GAME_CONFIG.LANES.X_POSITIONS.forEach((x, index) => {
      // Lane background
      laneGraphics.fillStyle(index % 2 === 0 ? 0x2a2a4e : 0x1f1f3e, 0.8);
      laneGraphics.fillRect(x - laneWidth / 2, 0, laneWidth, HEIGHT);

      // Lane borders
      laneGraphics.lineStyle(2, 0x4488ff, 0.3);
      laneGraphics.lineBetween(x - laneWidth / 2, 0, x - laneWidth / 2, HEIGHT);
      laneGraphics.lineBetween(x + laneWidth / 2, 0, x + laneWidth / 2, HEIGHT);
    });

    // Add some decorative elements on the sides
    const sideGraphics = this.add.graphics();
    sideGraphics.fillStyle(0x0f0f1e, 1);
    sideGraphics.fillRect(0, 0, 40, HEIGHT);
    sideGraphics.fillRect(WIDTH - 40, 0, 40, HEIGHT);
  }

  private createUI(): void {
    const { WIDTH } = GAME_CONFIG;

    // Health hearts
    const heartsPerRow = Math.min(Math.ceil(this.maxHealth / 20), 5);
    for (let i = 0; i < heartsPerRow; i++) {
      const heart = this.add.image(50 + i * 50, 50, 'heart').setScale(0.8).setDepth(100);
      this.healthHearts.push(heart);
    }

    // Attack power display
    this.add.text(WIDTH - 50, 50, `ATK: ${this.heroAttack}`, {
      font: 'bold 28px Arial',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(1, 0.5).setDepth(100);

    // Score
    this.scoreText = this.add.text(WIDTH / 2, 50, `Score: ${this.score}`, {
      font: 'bold 32px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);
  }

  private setupInput(): void {
    // Touch/swipe input (left/right)
    let startX = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - startX;
      const swipeThreshold = 50;

      if (deltaX < -swipeThreshold) {
        this.laneManager.moveLeft(this.hero);
      } else if (deltaX > swipeThreshold) {
        this.laneManager.moveRight(this.hero);
      }
    });

    // Keyboard input - Arrow keys and A/D
    this.input.keyboard?.on('keydown-LEFT', () => this.laneManager.moveLeft(this.hero));
    this.input.keyboard?.on('keydown-RIGHT', () => this.laneManager.moveRight(this.hero));
    this.input.keyboard?.on('keydown-A', () => this.laneManager.moveLeft(this.hero));
    this.input.keyboard?.on('keydown-D', () => this.laneManager.moveRight(this.hero));
  }

  private spawnMonster(): void {
    if (this.gameOver) return;

    const laneIndex = Phaser.Math.Between(0, GAME_CONFIG.LANES.COUNT - 1);
    const x = GAME_CONFIG.LANES.X_POSITIONS[laneIndex];

    // Vary monster health based on score
    const minHealth = GAME_CONFIG.MONSTER.MIN_HEALTH + Math.floor(this.score / 100) * 5;
    const maxHealth = Math.min(
      GAME_CONFIG.MONSTER.MAX_HEALTH,
      minHealth + 40
    );
    const health = Phaser.Math.Between(minHealth, maxHealth);

    const monsterTypes = this.registry.get('monsterTypes') as string[] || ['monster_red', 'monster_green', 'monster_blue'];
    const monsterType = monsterTypes[Phaser.Math.Between(0, monsterTypes.length - 1)];

    const monster = new Monster(
      this,
      x,
      GAME_CONFIG.MONSTER.SPAWN_Y,
      monsterType,
      health
    );

    monster.setLane(laneIndex);
    this.monsters.add(monster);
  }

  private handleCollision(
    _heroObj: Phaser.GameObjects.GameObject,
    monsterObj: Phaser.GameObjects.GameObject
  ): void {
    const monster = monsterObj as Monster;

    if (monster.isDestroyed()) return;

    const monsterHealth = monster.getHealth();

    if (this.heroAttack >= monsterHealth) {
      // Smash the monster!
      this.smashMonster(monster);
      this.score += monsterHealth;
      this.scoreText.setText(`Score: ${this.score}`);
    } else {
      // Take damage
      this.takeDamage(monsterHealth - this.heroAttack);
      monster.destroy();
    }
  }

  private smashMonster(monster: Monster): void {
    const { x, y } = monster;

    // Show smash effect
    const smash = this.add.image(x, y, 'smash_effect').setScale(0.5).setDepth(50);

    // Show "SMASH!" text
    const smashText = this.add.text(x, y - 50, 'SMASH!', {
      font: 'bold 36px Arial',
      color: '#ffff00',
      stroke: '#ff0000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);

    // Animate
    this.tweens.add({
      targets: [smash, smashText],
      scale: 1.5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        smash.destroy();
        smashText.destroy();
      },
    });

    monster.destroy();
  }

  private takeDamage(amount: number): void {
    this.heroHealth -= amount;

    // Flash hero red
    this.hero.setTint(0xff0000);
    this.time.delayedCall(200, () => this.hero.clearTint());

    // Update hearts
    this.updateHealthDisplay();

    // Show damage number
    const damageText = this.add.text(
      this.hero.x,
      this.hero.y - 80,
      `-${amount}`,
      {
        font: 'bold 32px Arial',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: damageText,
      y: this.hero.y - 150,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy(),
    });

    if (this.heroHealth <= 0) {
      this.endGame();
    }
  }

  private updateHealthDisplay(): void {
    const healthPercent = Math.max(0, this.heroHealth / this.maxHealth);
    const activeHearts = Math.ceil(healthPercent * this.healthHearts.length);

    this.healthHearts.forEach((heart, index) => {
      if (index < activeHearts) {
        heart.setAlpha(1);
        heart.setTint(0xffffff);
      } else {
        heart.setAlpha(0.3);
        heart.setTint(0x888888);
      }
    });
  }

  private endGame(): void {
    this.gameOver = true;
    this.spawnTimer.destroy();

    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Darken screen
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.7).setDepth(200);

    // Game Over text
    this.add.text(WIDTH / 2, HEIGHT / 2 - 100, 'GAME OVER', {
      font: 'bold 64px Arial',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(201);

    // Final score
    this.add.text(WIDTH / 2, HEIGHT / 2, `Final Score: ${this.score}`, {
      font: 'bold 36px Arial',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);

    // Retry button
    this.add.image(WIDTH / 2, HEIGHT / 2 + 120, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'))
      .setDepth(201);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 120, 'PLAY AGAIN', {
      font: 'bold 28px Arial',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);
  }

  update(): void {
    if (this.gameOver) return;

    // Wait for hero to be initialized (async image loading)
    if (!this.hero) return;

    // Update hero animation
    this.hero.update();

    // Update monsters and remove off-screen ones (bottom of screen)
    this.monsters.getChildren().forEach((obj) => {
      const monster = obj as Monster;
      monster.update();

      // Remove monsters that passed the bottom of the screen
      if (monster.y > GAME_CONFIG.HEIGHT + 100) {
        monster.destroy();
      }
    });
  }
}

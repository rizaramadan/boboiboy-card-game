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
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private lifeStars: Phaser.GameObjects.Image[] = [];
  private spawnTimer!: Phaser.Time.TimerEvent;
  private gameOver: boolean = false;
  private heroAttack: number = GAME_CONFIG.HERO.DEFAULT_ATTACK;
  private heroHealth: number = GAME_CONFIG.HERO.DEFAULT_HEALTH;
  private maxHealth: number = GAME_CONFIG.HERO.DEFAULT_HEALTH;
  private heroImageData: string | null = null;
  private currentSpeedMultiplier: number = 1;
  private backgroundStars: Phaser.GameObjects.Graphics[] = [];
  private meteors: Phaser.GameObjects.Image[] = [];

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

    // Deep space gradient background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x0d0221, 0x0d0221, 0x1a0533, 0x2d1b4e, 1);
    bgGraphics.fillRect(0, 0, WIDTH, HEIGHT);

    // Add twinkling stars
    this.createStarField();

    // Add distant planets/nebula decorations
    this.createSpaceDecorations();

    // Draw vertical lanes with cosmic glow
    const laneGraphics = this.add.graphics();
    const laneWidth = 140;

    GAME_CONFIG.LANES.X_POSITIONS.forEach((x, index) => {
      // Lane background with space nebula effect
      const colors = [0x1a0a3e, 0x150830, 0x1a0a3e];
      laneGraphics.fillStyle(colors[index], 0.6);
      laneGraphics.fillRect(x - laneWidth / 2, 0, laneWidth, HEIGHT);

      // Glowing lane borders (cyan/purple cosmic glow)
      laneGraphics.lineStyle(2, 0x7c4dff, 0.4);
      laneGraphics.lineBetween(x - laneWidth / 2, 0, x - laneWidth / 2, HEIGHT);
      laneGraphics.lineBetween(x + laneWidth / 2, 0, x + laneWidth / 2, HEIGHT);
      
      // Inner glow line
      laneGraphics.lineStyle(1, 0x00e5ff, 0.2);
      laneGraphics.lineBetween(x - laneWidth / 2 + 2, 0, x - laneWidth / 2 + 2, HEIGHT);
      laneGraphics.lineBetween(x + laneWidth / 2 - 2, 0, x + laneWidth / 2 - 2, HEIGHT);
    });

    // Add decorative side panels with space border
    const sideGraphics = this.add.graphics();
    sideGraphics.fillGradientStyle(0x0a0015, 0x0a0015, 0x150025, 0x150025, 1);
    sideGraphics.fillRect(0, 0, 40, HEIGHT);
    sideGraphics.fillRect(WIDTH - 40, 0, 40, HEIGHT);
    
    // Glowing edge
    sideGraphics.lineStyle(2, 0x7c4dff, 0.5);
    sideGraphics.lineBetween(40, 0, 40, HEIGHT);
    sideGraphics.lineBetween(WIDTH - 40, 0, WIDTH - 40, HEIGHT);

    // Create animated meteors in lanes
    this.createMeteorShowers();
  }

  private createStarField(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const starGraphics = this.add.graphics();
    
    // Create multiple layers of stars for depth
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, WIDTH);
      const y = Phaser.Math.Between(0, HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      // Star colors: white, light blue, light purple
      const colors = [0xffffff, 0xe0f7fa, 0xe1bee7, 0xb3e5fc];
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      
      starGraphics.fillStyle(color, alpha);
      starGraphics.fillCircle(x, y, size);
    }
    
    // Add some brighter twinkling stars
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(50, WIDTH - 50);
      const y = Phaser.Math.Between(100, HEIGHT - 200);
      
      const twinkle = this.add.graphics();
      twinkle.fillStyle(0xffffff, 0.8);
      twinkle.fillCircle(x, y, 2);
      twinkle.setDepth(1);
      
      // Twinkling animation
      this.tweens.add({
        targets: twinkle,
        alpha: 0.2,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      this.backgroundStars.push(twinkle);
    }
  }

  private createSpaceDecorations(): void {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const decorGraphics = this.add.graphics();
    
    // Small distant planet (top left)
    decorGraphics.fillGradientStyle(0x3949ab, 0x1a237e, 0x1a237e, 0x3949ab, 1);
    decorGraphics.fillCircle(60, 150, 25);
    decorGraphics.fillStyle(0x5c6bc0, 0.3);
    decorGraphics.fillCircle(55, 145, 8);
    
    // Another small planet (bottom right)
    decorGraphics.fillGradientStyle(0x6a1b9a, 0x4a148c, 0x4a148c, 0x6a1b9a, 1);
    decorGraphics.fillCircle(WIDTH - 50, HEIGHT - 180, 35);
    decorGraphics.fillStyle(0x9c27b0, 0.3);
    decorGraphics.fillCircle(WIDTH - 58, HEIGHT - 188, 12);
    
    // Nebula glow effects
    const nebulaGraphics = this.add.graphics();
    nebulaGraphics.fillStyle(0x7c4dff, 0.05);
    nebulaGraphics.fillCircle(WIDTH / 2, HEIGHT / 3, 200);
    nebulaGraphics.fillStyle(0x00bcd4, 0.03);
    nebulaGraphics.fillCircle(WIDTH / 4, HEIGHT / 2, 150);
    nebulaGraphics.fillStyle(0xe040fb, 0.04);
    nebulaGraphics.fillCircle(WIDTH * 0.75, HEIGHT * 0.6, 180);
  }

  private createMeteorShowers(): void {
    // Create falling meteor effects in each lane
    GAME_CONFIG.LANES.X_POSITIONS.forEach((laneX) => {
      // Create 2 meteors per lane at different positions
      for (let i = 0; i < 2; i++) {
        const startY = Phaser.Math.Between(-200, -600) - (i * 400);
        const offsetX = Phaser.Math.Between(-30, 30);
        
        const meteor = this.add.image(laneX + offsetX, startY, 'meteor')
          .setScale(0.3)
          .setAlpha(0.6)
          .setDepth(2);
        
        // Animate meteor falling
        this.tweens.add({
          targets: meteor,
          y: GAME_CONFIG.HEIGHT + 100,
          duration: Phaser.Math.Between(3000, 5000),
          repeat: -1,
          onRepeat: () => {
            meteor.y = Phaser.Math.Between(-200, -400);
            meteor.x = laneX + Phaser.Math.Between(-30, 30);
          },
        });
        
        this.meteors.push(meteor);
      }
    });
  }

  private createUI(): void {
    const { WIDTH } = GAME_CONFIG;

    // Life stars container (top left)
    const starsContainer = this.add.graphics();
    starsContainer.fillStyle(0x1a0533, 0.8);
    starsContainer.fillRoundedRect(15, 20, 220, 55, 12);
    starsContainer.lineStyle(2, 0x7c4dff, 0.6);
    starsContainer.strokeRoundedRect(15, 20, 220, 55, 12);
    starsContainer.setDepth(99);

    // Create 5 life stars
    for (let i = 0; i < 5; i++) {
      const star = this.add.image(50 + i * 38, 47, 'star')
        .setScale(0.55)
        .setDepth(100);
      this.lifeStars.push(star);
    }
    this.updateLifeStars();

    // Health bar background (below stars)
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x1a0533, 0.9);
    this.healthBarBg.fillRoundedRect(20, 80, 180, 24, 6);
    this.healthBarBg.lineStyle(2, 0x7c4dff, 0.5);
    this.healthBarBg.strokeRoundedRect(20, 80, 180, 24, 6);
    this.healthBarBg.setDepth(100);

    // Health bar fill
    this.healthBarFill = this.add.graphics();
    this.healthBarFill.setDepth(101);
    this.updateHealthBar();

    // Health text overlay
    this.healthText = this.add.text(110, 92, `${this.heroHealth}/${this.maxHealth}`, {
      font: 'bold 14px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(102);

    // Planet score display (top right)
    this.add.image(WIDTH - 70, 55, 'planet_score').setScale(0.9).setDepth(99);
    
    // Score text on planet
    this.add.text(WIDTH - 70, 40, 'Score:', {
      font: 'bold 16px Arial',
      color: '#e0f7fa',
      stroke: '#1a237e',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);
    
    this.scoreText = this.add.text(WIDTH - 70, 62, `${this.score}`, {
      font: 'bold 24px Arial',
      color: '#ffffff',
      stroke: '#7c4dff',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);
  }

  private updateLifeStars(): void {
    const healthPercent = Math.max(0, this.heroHealth / this.maxHealth);
    const activeStars = Math.ceil(healthPercent * 5);
    
    this.lifeStars.forEach((star, index) => {
      if (index < activeStars) {
        star.setTexture('star');
        star.setAlpha(1);
        // Add subtle glow pulse to active stars
        if (!star.getData('hasPulse')) {
          this.tweens.add({
            targets: star,
            scale: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          star.setData('hasPulse', true);
        }
      } else {
        star.setTexture('star_empty');
        star.setAlpha(0.4);
        star.setScale(0.55);
        this.tweens.killTweensOf(star);
        star.setData('hasPulse', false);
      }
    });
  }

  private updateHealthBar(): void {
    this.healthBarFill.clear();
    
    const healthPercent = Math.max(0, this.heroHealth / this.maxHealth);
    const barWidth = 176 * healthPercent;
    
    // Space theme colors based on health percentage
    let color = 0x00e5ff; // Cyan
    if (healthPercent <= 0.25) {
      color = 0xff1744; // Bright red
    } else if (healthPercent <= 0.5) {
      color = 0xff9100; // Orange
    } else if (healthPercent <= 0.75) {
      color = 0xffea00; // Yellow
    }
    
    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRoundedRect(22, 82, barWidth, 20, 5);
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
      health,
      this.currentSpeedMultiplier
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
      this.scoreText.setText(`${this.score}`);
      
      // Update game speed based on new score
      this.updateGameSpeed();
    } else {
      // Take damage - delta is how much stronger the monster is
      const delta = monsterHealth - this.heroAttack;
      this.takeDamage(delta);
      
      // Reduce score by the delta (minimum score is 0)
      this.score = Math.max(0, this.score - delta);
      this.scoreText.setText(`${this.score}`);
      
      // Show score loss
      this.showScoreLoss(delta);
      
      monster.destroy();
    }
  }

  private showScoreLoss(amount: number): void {
    const lossText = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      100,
      `-${amount} SCORE`,
      {
        font: 'bold 28px Arial',
        color: '#ff6600',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: lossText,
      y: 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => lossText.destroy(),
    });
  }

  private updateGameSpeed(): void {
    const { SPEED_SCALING } = GAME_CONFIG;
    
    // Calculate difficulty level based on score
    const level = Math.floor(this.score / SPEED_SCALING.SCORE_PER_LEVEL);
    
    // Calculate new speed multiplier (capped at max)
    const newMultiplier = Math.min(
      1 + level * SPEED_SCALING.SPEED_INCREMENT,
      SPEED_SCALING.MAX_SPEED_MULTIPLIER
    );
    
    // Only update if multiplier changed
    if (newMultiplier !== this.currentSpeedMultiplier) {
      this.currentSpeedMultiplier = newMultiplier;
      
      // Update spawn interval (faster spawning)
      const newSpawnInterval = Math.max(
        SPEED_SCALING.MIN_SPAWN_INTERVAL,
        GAME_CONFIG.SPAWN_INTERVAL - level * SPEED_SCALING.SPAWN_REDUCTION
      );
      
      // Recreate spawn timer with new interval
      this.spawnTimer.destroy();
      this.spawnTimer = this.time.addEvent({
        delay: newSpawnInterval,
        callback: this.spawnMonster,
        callbackScope: this,
        loop: true,
      });
      
      // Update existing monsters to move faster
      this.monsters.getChildren().forEach((obj) => {
        const monster = obj as Monster;
        const body = monster.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(GAME_CONFIG.MONSTER.SPEED * this.currentSpeedMultiplier);
      });
      
      // Show speed up notification
      this.showSpeedUpNotification();
    }
  }

  private showSpeedUpNotification(): void {
    const speedText = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      '⚡ WARP SPEED! ⚡',
      {
        font: 'bold 42px Arial',
        color: '#00e5ff',
        stroke: '#7c4dff',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.tweens.add({
      targets: speedText,
      alpha: 1,
      scale: 1.3,
      duration: 300,
      yoyo: true,
      hold: 500,
      onComplete: () => speedText.destroy(),
    });
  }

  private smashMonster(monster: Monster): void {
    const { x, y } = monster;

    // Show space smash effect
    const smash = this.add.image(x, y, 'smash_effect').setScale(0.5).setDepth(50);

    // Show "VAPORIZED!" text with space colors
    const smashText = this.add.text(x, y - 50, 'VAPORIZED!', {
      font: 'bold 32px Arial',
      color: '#00e5ff',
      stroke: '#7c4dff',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);

    // Show score gained
    const scoreGain = this.add.text(x, y + 30, `+${monster.getHealth()}`, {
      font: 'bold 24px Arial',
      color: '#ffea00',
      stroke: '#000000',
      strokeThickness: 3,
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

    this.tweens.add({
      targets: scoreGain,
      y: y - 20,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => scoreGain.destroy(),
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
    // Update health bar
    this.updateHealthBar();
    
    // Update health text
    this.healthText.setText(`${Math.max(0, this.heroHealth)}/${this.maxHealth}`);
    
    // Update life stars
    this.updateLifeStars();
  }

  private endGame(): void {
    this.gameOver = true;
    this.spawnTimer.destroy();

    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Darken screen with space overlay
    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0d0221, 0.85);
    overlay.setDepth(200);

    // Add some stars to the overlay
    const overlayStars = this.add.graphics();
    overlayStars.setDepth(200);
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(50, WIDTH - 50);
      const y = Phaser.Math.Between(HEIGHT / 2 - 200, HEIGHT / 2 + 200);
      overlayStars.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      overlayStars.fillCircle(x, y, Phaser.Math.FloatBetween(0.5, 1.5));
    }

    // Mission Failed text with space styling
    this.add.text(WIDTH / 2, HEIGHT / 2 - 120, '🚀 MISSION FAILED 🚀', {
      font: 'bold 48px Arial',
      color: '#ff1744',
      stroke: '#7c4dff',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(201);

    // Final score with planet icon
    this.add.image(WIDTH / 2, HEIGHT / 2, 'planet_score').setScale(1.2).setDepth(201);
    
    this.add.text(WIDTH / 2, HEIGHT / 2 - 15, 'Final Score', {
      font: 'bold 20px Arial',
      color: '#b388ff',
    }).setOrigin(0.5).setDepth(202);
    
    this.add.text(WIDTH / 2, HEIGHT / 2 + 15, `${this.score}`, {
      font: 'bold 36px Arial',
      color: '#ffffff',
      stroke: '#7c4dff',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(202);

    // Retry button with space styling
    const retryButton = this.add.image(WIDTH / 2, HEIGHT / 2 + 140, 'button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'))
      .on('pointerover', () => retryButton.setTint(0x7c4dff))
      .on('pointerout', () => retryButton.clearTint())
      .setDepth(201);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 140, '🔄 TRY AGAIN', {
      font: 'bold 26px Arial',
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

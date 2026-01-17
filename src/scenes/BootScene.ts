import Phaser from 'phaser';

interface AssetEntry {
  key: string;
  file: string;
}

interface AssetManifest {
  heroes: AssetEntry[];
  monsters: AssetEntry[];
  ui: AssetEntry[];
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load manifest first
    this.load.json('asset-manifest', 'assets/manifest.json');
  }

  create(): void {
    // Get manifest and load all assets
    const manifest = this.cache.json.get('asset-manifest') as AssetManifest;
    this.loadAssetsFromManifest(manifest);
  }

  private loadAsset(key: string, path: string): void {
    const ext = path.split('.').pop()?.toLowerCase();
    if (ext === 'svg') {
      this.load.svg(key, path, { scale: 1 });
    } else {
      this.load.image(key, path);
    }
  }

  private loadAssetsFromManifest(manifest: AssetManifest): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create loading bar
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
      
      // Store monster types in registry for GameScene to use
      this.registry.set('monsterTypes', manifest.monsters.map(m => m.key));
      
      this.scene.start('MenuScene');
    });

    // Load hero sprites dynamically
    manifest.heroes.forEach((hero) => {
      this.loadAsset(hero.key, `assets/hero/${hero.file}`);
    });

    // Load monster sprites dynamically
    manifest.monsters.forEach((monster) => {
      this.loadAsset(monster.key, `assets/monsters/${monster.file}`);
    });

    // Load UI elements dynamically
    manifest.ui.forEach((uiAsset) => {
      this.loadAsset(uiAsset.key, `assets/ui/${uiAsset.file}`);
    });

    // Start loading
    this.load.start();
  }
}

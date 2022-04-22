import {Scene} from 'phaser';

class BootScene extends Scene {
  constructor() {
    super("scene-boot");
  }
  
  preload() {
    // Mech1
    this.load.multiatlas('mech1', 'assets/sprites/mech1.json', 'assets/sprites');
    this.load.atlas('mech1-arm-left', 'assets/sprites/mech1-left-arm.png', 'assets/sprites/mech1-left-arm.json');
    this.load.atlas('mech1-arm-right', 'assets/sprites/mech1-right-arm.png', 'assets/sprites/mech1-right-arm.json');
    this.load.image('mech1-head', 'assets/sprites/mech1-head.png');
    this.load.image('mech1-shell', 'assets/sprites/mech1-shell.png');
    this.load.image('mech1-victory', 'assets/sprites/mech1-victory.png');

    // Maps
    this.load.image('tileset-grassland-ex', 'assets/maps/tileset-grassland-ex.png');
    this.load.tilemapTiledJSON('map-level1', 'assets/maps/level1.json');
    this.load.tilemapTiledJSON('map-level2', 'assets/maps/level2.json');
    this.load.tilemapTiledJSON('map-level3', 'assets/maps/level3.json');
    this.load.tilemapTiledJSON('map-level4', 'assets/maps/level4.json');

    // Music
    this.load.audio('ost-level1', 'assets/music/mech-ost1.mp3');
    this.load.audio('ost-level1b', 'assets/music/mech-ost2.mp3');
    this.load.audio('ost-title', 'assets/music/mech-ost3.mp3');
    this.load.audio('ost-level1c', 'assets/music/mech-ost4.mp3');

    // SFX
    this.load.audio('sfx-shoot', 'assets/sfx/bang_02.wav');
    this.load.audio('sfx-rocket', 'assets/sfx/fw_05.wav');
    this.load.audio('sfx-explosion', 'assets/sfx/explodemini.wav');
    this.load.audio('sfx-rocket-dry', 'assets/sfx/12ga_dry.wav');
    this.load.audio('sfx-wind-loop', 'assets/sfx/amb_mountains.wav');
    this.load.audio('sfx-electro-click1', 'assets/sfx/Click_Electronic_15.wav');
    this.load.audio('sfx-electro-click2', 'assets/sfx/Click_Electronic_14.wav');
    this.load.audio('sfx-click', 'assets/sfx/Click_Standard_00.wav');

    // VFX
    this.load.spritesheet('particles-dirt', 'assets/sprites/particles-dirt.png', { frameWidth: 192, frameHeight: 228 });
    this.load.spritesheet('particles-grass', 'assets/sprites/particles-grass.png', { frameWidth: 45, frameHeight: 157 });
    this.load.image('particle-fire', 'assets/particles/fire.png');
    this.load.image('particle-explosion', 'assets/particles/explosion.png');

    // UI
    this.load.image('ui-mech1', 'assets/ui/mech1-head-icon.png');
    this.load.image('ui-mech1-shell', 'assets/ui/mech1-shell-icon.png');

    // DOM UI
    this.load.html('dom-title', 'assets/ui-dom/title.html');
    this.load.html('dom-game-over', 'assets/ui-dom/game-over.html');

    // Preloader
    this.loaderBar = this.add.graphics();

    this.completeText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Click to start', {
      fontFamily: 'monospace',
      color: '#FFF',
      fontSize: 32
    });
    this.completeText.setOrigin(0.5);
    this.completeText.setVisible(false);

    this.preloaderLog = this.add.text(window.innerWidth - 20, window.innerHeight - 20, '', {
      fontFamily: 'monospace',
      color: '#555',
      fontSize: 24,
      align: 'right'
    });
    this.preloaderLog.setOrigin(1, 1);

    this.load.on('filecomplete', (file) => {
      this.preloaderLog.text += `\n${file}`;
    });

    this.load.on('progress', (value) => {
      this.loaderBar.clear();
      this.loaderBar.fillStyle(0xFFFFFF, value);
      this.loaderBar.fillRect(window.innerWidth / 2 - 300, window.innerHeight / 2 - 5, 600 * value, 10);

      if (value === 1) {
        this.loaderBar.clear();
        this.completeText.setVisible(true);
        this.loaderBar.fillStyle(0xFFFFFF, 0.1);
        this.loaderBar.fillRect(window.innerWidth / 2 - 300, window.innerHeight / 2 - 5, 600 * value, 10);
      }
    });
  }

  create() {
    // Mech1 animations
    this.anims.create({
      key: 'mech1-run',
      frames: this.anims.generateFrameNames('mech1', {
        start: 0,
        end: 69,
        prefix: 'run-',
        suffix: '.png',
        zeroPad: 2
      }),
      frameRate: 70,
      repeat: -1
    });

    this.anims.create({
      key: 'mech1-idle',
      frames: [
        {
          key: 'mech1',
          frame: 'idle.png'
        }
      ],
      frameRate: 0,
      repeat: 0
    });

    this.anims.create({
      key: 'mech1-up',
      frames: [
        {
          key: 'mech1',
          frame: 'up.png'
        }
      ],
      frameRate: 0,
      repeat: 0
    });

    this.anims.create({
      key: 'mech1-down',
      frames: [
        {
          key: 'mech1',
          frame: 'down.png'
        }
      ],
      frameRate: 0,
      repeat: 0
    });

    this.anims.create({
      key: 'mech1-up-down',
      frames: this.anims.generateFrameNames('mech1', {
        start: 0,
        end: 11,
        prefix: 'up-down-',
        suffix: '.png',
        zeroPad: 2
      }),
      frameRate: 60,
      repeat: 0
    });

    this.anims.create({
      key: 'mech1-arm-left-idle',
      frames: [
        {
          key: 'mech1-arm-left',
          frame: 'idle.png'
        }
      ],
      frameRate: 0,
      repeat: 0
    });

    this.anims.create({
      key: 'mech1-arm-left-light-shot',
      frames: this.anims.generateFrameNames('mech1-arm-left', {
        start: 0,
        end: 5,
        prefix: 'light-',
        suffix: '.png',
        zeroPad: -1
      }),
      frameRate: 60,
      repeat: -1
    });

    this.anims.create({
      key: 'mech1-arm-left-heavy-shot',
      frames: this.anims.generateFrameNames('mech1-arm-left', {
        start: 0,
        end: 23,
        prefix: 'heavy-',
        suffix: '.png',
        zeroPad: 2
      }),
      frameRate: 60,
      repeat: -1
    });

    this.anims.create({
      key: 'mech1-arm-right-idle',
      frames: [
        {
          key: 'mech1-arm-right',
          frame: 'idle.png'
        }
      ],
      frameRate: 0,
      repeat: 0
    });

    this.anims.create({
      key: 'mech1-arm-right-light-shot',
      frames: this.anims.generateFrameNames('mech1-arm-right', {
        start: 0,
        end: 5,
        prefix: 'light-',
        suffix: '.png',
        zeroPad: 0
      }),
      frameRate: 60,
      repeat: -1
    });

    this.anims.create({
      key: 'mech1-arm-right-heavy-shot',
      frames: this.anims.generateFrameNames('mech1-arm-right', {
        start: 0,
        end: 23,
        prefix: 'heavy-',
        suffix: '.png',
        zeroPad: 2
      }),
      frameRate: 60,
      repeat: -1
    });

    this.input.mouse.disableContextMenu();

    this.fadeGfx = this.add.graphics();
    this.fadeGfx.fillStyle(0xFFFFFF, 1);
    this.fadeGfx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    this.fadeGfx.setAlpha(0);

    // this.sound.setVolume(0);

    this.sound.play('sfx-electro-click1');

    this.input.on('pointerdown', () => {
      this.tweens.add({
        targets: this.fadeGfx,
        alpha: 1,
        duration: 250,
        repeat: 0,
        onComplete: () => {
          this.scene.start('scene-menu');
        }
      });
    });
  }
}

export default BootScene;
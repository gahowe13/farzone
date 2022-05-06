import {Scene, Math as pMath, Display} from 'phaser';
import Mech1 from '../sprites/Mech1';
import Mech1NPC from '../sprites/Mech1NPC';
import Hume1 from '../sprites/Hume1';
import Oswald from '../sprites/Oswald';

class GameScene2 extends Scene {
  constructor() {
    super("scene-game");
  }

  init({ levelKey, bgColor = null, p1Key }) {
    this.levelKey = levelKey;
    this.bgColor = bgColor;
    this.p1Key = p1Key;
  }

  create() {
    this.soloTest = false; // set to true if you want to solo a character

    // Launch HUD ui
    this.scene.launch('ui-battlehud', {
      parentScene: this,
      p1Key: this.p1Key
    });

    this.tilemap = this.add.tilemap(this.levelKey);
    const tiles = this.tilemap.addTilesetImage('tileset', 'tileset-ex', 175, 175, 1, 2);

    this.para2 = this.tilemap.createLayer('parabg2', tiles);
    this.para2.setScale(0.1);
    this.para2.setAlpha(0.2);
    this.para2.setScrollFactor(0.5);
    this.para2.setPosition(6000, 2000);

    this.para2Mist = this.add.graphics();
    this.para2Mist.setScrollFactor(0);
    this.para2Mist.fillStyle(0x000000, 0.3);
    this.para2Mist.fillRect(-this.tilemap.widthInPixels * 5, -this.tilemap.heightInPixels * 5, this.tilemap.widthInPixels * 10, this.tilemap.heightInPixels * 10);

    this.para1 = this.tilemap.createLayer('parabg1', tiles);
    this.para1.setScale(0.25);
    this.para1.setAlpha(1);
    this.para1.setScrollFactor(0.75);
    this.para1.setPosition(8200, 3500);

    this.para1Mist = this.add.graphics();
    this.para1Mist.setScrollFactor(0);
    this.para1Mist.fillStyle(0x000000, 0.3);
    this.para1Mist.fillRect(-this.tilemap.widthInPixels * 5, -this.tilemap.heightInPixels * 5, this.tilemap.widthInPixels * 10, this.tilemap.heightInPixels * 10);
    
    this.ground = this.tilemap.createLayer('ground', tiles);

    this.bgd1 = this.tilemap.createLayer('bgd1', tiles); // tree trunks, etc.
    this.bgd2 = this.tilemap.createLayer('bgd2', tiles); // branches
    this.bgd3 = this.tilemap.createLayer('bgd3', tiles); // more branches

    this.leaves = this.tilemap.createLayer('leaves', tiles);
    this.leavesBG1 = this.tilemap.createLayer('leavesBG1', tiles);
    this.leavesBG2 = this.tilemap.createLayer('leavesBG2', tiles);

    this.leavesBG1Pos = new pMath.Vector2(10, 30);
    this.leavesBG2Pos = new pMath.Vector2(-20, -20);
    this.leavesBG1.setPosition(this.leavesBG1Pos);
    this.leavesBG2.setPosition(this.leavesBG2Pos);

    // Add, scale, and make up a speed for our creature
    // this.cat = new Mech1(this, 0, 0);
    if (this.p1Key === 'roboto') {
      this.cat = new Mech1(this, 0, 0);
    }
    else if (this.p1Key === 'arial') {
      this.cat = new Hume1(this, 0, 0);
    }
    else if (this.p1Key === 'oswald') {
      this.cat = new Oswald(this, 0, 0);
    }
    this.catSpeed = 500;
    this.catSpawnpoint = `spawnpoint${pMath.Between(1, 4)}`;
    
    this.dummy = new Mech1NPC(this, 0, 0);
    this.dummySpawnpoint = `spawnpoint${pMath.Between(1, 4)}`;

    if (this.soloTest) {
      this.dummy.isPaused = true;
    }

    // Make sure we don't spawn both players at same point
    while (this.catSpawnpoint === this.dummySpawnpoint) {
      this.dummySpawnpoint = `spawnpoint${pMath.Between(1, 4)}`;
    }

    const spawnPoints = this.tilemap.getObjectLayer('spawn').objects;

    spawnPoints.forEach(({x, y, name}) => {
      if (name === this.catSpawnpoint) {
        this.cat.setPosition(x, y);
      }
      else if (name === this.dummySpawnpoint) {
        this.dummy.setPosition(x, y);
      }
    });

    // Physics colliders
    this.physics.world.TILE_BIAS = 175;

    this.ground.setCollisionBetween(1, 5);
    this.ground.setCollisionBetween(11, 15);
    this.ground.setCollisionBetween(21, 25);
    this.ground.setCollisionBetween(31, 35);
    this.ground.setCollisionBetween(41, 45);
    
    this.bgd1.setCollisionBetween(81, 138);
    this.bgd2.setCollisionBetween(81, 138);
    this.bgd3.setCollisionBetween(81, 138);

    this.leaves.setCollisionBetween(51, 73);
    this.leavesBG1.setCollisionBetween(51, 73);
    this.leavesBG2.setCollisionBetween(51, 73);

    this.physics.add.collider(this.cat, this.ground, null, () => {
      if (typeof this.cat.processGround === 'function') {
        return this.cat.processGround();
      }

      return true;
    });
    this.physics.add.collider(this.dummy, this.ground);
    this.physics.add.collider(this.dummy, this.cat);

    // Particle effects
    this.dirtParticles = this.add.particles('particles-dirt');
    this.dirtEmitter = this.dirtParticles.createEmitter({
      frame: Phaser.Utils.Array.NumberArray(0, 15),
      scale: {
        min: 0.1,
        max: 0.7
      },
      speedX: {
        min: -1200,
        max: 1200
      },
      lifespan: 4000,
      rotate: {
        min: 0,
        max: 360
      },
      speedY: {
        min: -1200,
        max: 1200
      },
      gravityY: 2000
    });
    this.dirtEmitter.stop();

    this.grassParticles = this.add.particles('particles-grass');
    this.grassEmitter = this.grassParticles.createEmitter({
      frame: Phaser.Utils.Array.NumberArray(0, 2),
      alpha: {
        start: 1,
        end: 0
      },
      scale: {
        min: 0.1,
        max: 0.5
      },
      speedX: {
        min: -1200,
        max: 1200
      },
      speedY: {
        min: -1200,
        max: 1200
      },
      rotate: (p, k, t) => {
        return ((1 - t) * 360);
      },
      lifespan: 2000,
      gravityY: 600,
      gravityX: 1200
    });
    this.grassEmitter.stop();

    this.brickParticles = this.add.particles('particles-brick');
    this.brickEmitter = this.brickParticles.createEmitter({
      frame: Phaser.Utils.Array.NumberArray(0, 6),
      scale: {
        min: 0.1,
        max: 0.7
      },
      speedX: {
        min: -1200,
        max: 1200
      },
      lifespan: 4000,
      rotate: {
        min: 0,
        max: 360
      },
      speedY: {
        min: -1200,
        max: 1200
      },
      gravityY: 2000
    });
    this.brickEmitter.stop();

    this.woodParticles = this.add.particles('particles-wood');
    this.woodEmitter = this.woodParticles.createEmitter({
      frame: Phaser.Utils.Array.NumberArray(0, 2),
      scale: {
        min: 0.1,
        max: 0.5
      },
      speedX: {
        min: -1200,
        max: 1200
      },
      speedY: {
        min: -1200,
        max: 1200
      },
      rotate: (p, k, t) => {
        return ((1 - t) * 360 * 8);
      },
      lifespan: 2000,
      gravityY: 600,
      gravityX: 1200
    });
    this.woodEmitter.stop();

    this.leafParticles = this.add.particles('particles-leaves');
    this.leavesEmitter = this.leafParticles.createEmitter({
      frame: Phaser.Utils.Array.NumberArray(0, 2),
      scale: {
        min: 0.1,
        max: 0.25
      },
      alpha: {
        start: 0.75,
        end: 0
      },
      speedX: {
        min: -1200,
        max: 1200
      },
      speedY: {
        min: -1200,
        max: 1200
      },
      rotate: (p, k, t) => {
        return ((1 - t) * 360 * 4);
      },
      lifespan: 2000,
      gravityY: 600,
      gravityX: 1200
    });
    this.leavesEmitter.stop();

    // Layering
    // this.boomParticle.setDepth(17); // Mech1Shell.js
    // this.fireParticle.setDepth(16); // Mech1Shell.js
    this.woodParticles.setDepth(13);
    this.brickParticles.setDepth(13);
    this.grassParticles.setDepth(13);
    this.dirtParticles.setDepth(13);
    this.leaves.setDepth(12);
    this.cat.setDepth(11);
    this.dummy.setDepth(10);
    this.bgd1.setDepth(9);
    this.bgd2.setDepth(8);
    this.bgd3.setDepth(7);
    this.leavesBG1.setDepth(6);
    this.leavesBG2.setDepth(5);
    this.ground.setDepth(4);
    this.para1Mist.setDepth(3);
    this.para1.setDepth(2);
    this.para2Mist.setDepth(1);
    this.para2.setDepth(0);

    // Map raycasters
    this.cat.mapGroundLayer(this.ground);
    this.cat.mapTarget(this.dummy);
    this.cat.mapDetailLayers([
      this.bgd1,
      this.bgd2,
      this.bgd3,
      this.leaves,
      this.leavesBG1,
      this.leavesBG2
    ]);

    this.dummy.mapTarget(this.cat);
    this.dummy.mapGroundLayer(this.ground);
    this.dummy.mapDetailLayers([
      this.bgd1,
      this.bgd2,
      this.bgd3,
      this.leaves,
      this.leavesBG1,
      this.leavesBG2
    ]);

    // Game data
    if (this.p1Key === 'roboto') {
      this.registry.playerMaxHP = 1200;
      this.registry.playerHP = this.registry.playerMaxHP;
      this.registry.playerRockets = 2;
    }
    else if (this.p1Key === 'arial') {
      this.registry.playerMaxHP = 700;
      this.registry.playerHP = this.registry.playerMaxHP;
    }
    else if (this.p1Key === 'oswald') {
      this.registry.playerMaxHP = 850;
      this.registry.playerHP = this.registry.playerMaxHP;
    }

    this.registry.p1Key = this.p1Key;
    this.registry.playerTotalAttacks = 0;
    this.registry.playerAttacksHit = 0;
    this.registry.playerDamageInflicted = 0;
    this.registry.playerDamageTaken = 0;
    this.registry.playerDistanceMoved = 0;

    // this.registry.p2Key = this.p2Key;
    this.registry.p2Key = 'roboto';

    this.registry.enemyMaxHP = 1200;
    this.registry.enemyHP = this.registry.enemyMaxHP;
    this.registry.enemyRockets = 2;

    // Music
    this.bgm = this.sound.add('ost-level1d', { loop: true });

    this.sound.add('mitch-go').once('complete', () => this.bgm.play()).play();

    const follow_lerp_x = 0.05;
    const follow_lerp_y = 0.05;
    this.camZoomMin = Math.min(window.innerWidth / this.tilemap.widthInPixels, window.innerHeight / this.tilemap.heightInPixels);
    this.camZoomMax = 0.5;
    this.camZoomLerp = 0.05;

    if (this.bgColor === null) {
      this.cameras.main.setBackgroundColor(0x5555FF);
    }
    else {
      this.cameras.main.setBackgroundColor(this.bgColor);
    }
    this.cameras.main.setZoom(this.camZoomMin);
    // this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
    
    this.cameraMid = new pMath.Vector2();

    if (this.soloTest) {
      this.cameras.main.startFollow(this.cat);
    }
    else {
      this.cameras.main.startFollow(this.cameraMid, false, follow_lerp_x, follow_lerp_y);
    }

    // Stats
    this.startTime = Date.now();
    this.tilesDestroyed = 0;

    // Timescale
    this.scaleTime = 1;

    // Particle effects
    this.fireParticle = this.add.particles('particle-fire');
    this.boomParticle = this.add.particles('particle-explosion');
    this.boomEmitter = this.boomParticle.createEmitter({
      alpha: {
        start: 1,
        end: 0
      },
      rotate: (p, k, t) => {
        return ((1 - t) * 360) * 4;
      },
      tint: (particle, key, t) => {
        const g = ((1 - t) / 1 * 255);
        return Display.Color.GetColor(255, g, 0);
      },
      speedX: {
        min: -400,
        max: 400
      },
      speedY: {
        min: -400,
        max: 400
      },
      scale: {
        start: 0.5,
        end: 1
      },
      lifespan: {
        min: 250,
        max: 750
      }
    });
    this.boomEmitter.stop();

    this.boomEmitter2 = this.fireParticle.createEmitter({
      alpha: {
        start: 0.5,
        end: 0
      },
      rotate: (p, k, t) => {
        return ((1 - t) * 360) * 4;
      },
      speedX: {
        min: -500,
        max: 500
      },
      speedY: {
        min: -500,
        max: 500
      },
      gravityX: 200,
      lifespan: 2000
    });
    this.boomEmitter2.stop();
  }

  damageTile(tile, intersection, layer, isPlayer = false) {
    // Grass
    if (tile.index === 1) {
      layer.putTileAt(11, tile.x, tile.y, true);
      this.dirtEmitter.explode(2, intersection.x, intersection.y);
      this.grassEmitter.explode(pMath.Between(5, 10), intersection.x, intersection.y);
    }
    else if (tile.index === 11) {
      layer.putTileAt(21, tile.x, tile.y, true);
      this.dirtEmitter.explode(3, intersection.x, intersection.y);
      this.grassEmitter.explode(pMath.Between(5, 10), intersection.x, intersection.y);
    }
    else if (tile.index === 21) {
      layer.putTileAt(31, tile.x, tile.y, true);
      this.dirtEmitter.explode(4, intersection.x, intersection.y);
      this.grassEmitter.explode(pMath.Between(10, 20), intersection.x, intersection.y);
    }
    else if (tile.index === 31) {
      layer.putTileAt(41, tile.x, tile.y, true);
      this.dirtEmitter.explode(6, intersection.x, intersection.y);
      this.grassEmitter.explode(pMath.Between(5, 10), intersection.x, intersection.y);
    }
    else if (tile.index === 41) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      const tileUnder = layer.getTileAt(tile.x, tile.y + 1, true);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
      
      this.dirtEmitter.explode(10, intersection.x, intersection.y);
      this.grassEmitter.explode(20, intersection.x, intersection.y);

      if (tileUnder) {
        if (tileUnder.index === 2) {
          layer.putTileAt(3, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 12) {
          layer.putTileAt(13, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 22) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 32) {
          layer.putTileAt(33, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 42) {
          layer.putTileAt(43, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 5) {
          layer.putTileAt(4, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 15) {
          layer.putTileAt(14, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 25) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 35) {
          layer.putTileAt(34, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 45) {
          layer.putTileAt(44, tile.x, tile.y + 1, true);
        }
      }
    }

    // Dirt (side)
    else if (tile.index === 2) {
      layer.putTileAt(12, tile.x, tile.y, true);
      this.dirtEmitter.explode(2, intersection.x, intersection.y);
    }
    else if (tile.index === 12) {
      layer.putTileAt(22, tile.x, tile.y, true);
      this.dirtEmitter.explode(3, intersection.x, intersection.y);
    }
    else if (tile.index === 22) {
      layer.putTileAt(32, tile.x, tile.y, true);
      this.dirtEmitter.explode(4, intersection.x, intersection.y);
    }
    else if (tile.index === 32) {
      layer.putTileAt(42, tile.x, tile.y, true);
      this.dirtEmitter.explode(6, intersection.x, intersection.y);
    }
    else if (tile.index === 42) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      const tileUnder = layer.getTileAt(tile.x, tile.y + 1, true);

      if (isPlayer) {
        this.tilesDestroyed++;
      }

      this.dirtEmitter.explode(10, intersection.x, intersection.y);

      if (tileUnder) {
        if (tileUnder.index === 2) {
          layer.putTileAt(3, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 12) {
          layer.putTileAt(13, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 22) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 32) {
          layer.putTileAt(33, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 42) {
          layer.putTileAt(43, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 5) {
          layer.putTileAt(4, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 15) {
          layer.putTileAt(14, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 25) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 35) {
          layer.putTileAt(34, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 45) {
          layer.putTileAt(44, tile.x, tile.y + 1, true);
        }
      }
    }

    // Dirt (top)
    else if (tile.index === 3) {
      layer.putTileAt(13, tile.x, tile.y, true);
      this.dirtEmitter.explode(2, intersection.x, intersection.y);
    }
    else if (tile.index === 13) {
      layer.putTileAt(23, tile.x, tile.y, true);
      this.dirtEmitter.explode(3, intersection.x, intersection.y);
    }
    else if (tile.index === 23) {
      layer.putTileAt(33, tile.x, tile.y, true);
      this.dirtEmitter.explode(4, intersection.x, intersection.y);
    }
    else if (tile.index === 33) {
      layer.putTileAt(43, tile.x, tile.y, true);
      this.dirtEmitter.explode(6, intersection.x, intersection.y);
    }
    else if (tile.index === 43) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      const tileUnder = layer.getTileAt(tile.x, tile.y + 1, true);

      if (isPlayer) {
        this.tilesDestroyed++;
      }

      this.dirtEmitter.explode(10, intersection.x, intersection.y);

      if (tileUnder) {
        if (tileUnder.index === 2) {
          layer.putTileAt(3, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 12) {
          layer.putTileAt(13, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 22) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 32) {
          layer.putTileAt(33, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 42) {
          layer.putTileAt(43, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 5) {
          layer.putTileAt(4, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 15) {
          layer.putTileAt(14, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 25) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 35) {
          layer.putTileAt(34, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 45) {
          layer.putTileAt(44, tile.x, tile.y + 1, true);
        }
      }
    }

    // Brick (top)
    else if (tile.index === 4) {
      layer.putTileAt(14, tile.x, tile.y, true);
      this.brickEmitter.explode(2, intersection.x, intersection.y);
    }
    else if (tile.index === 14) {
      layer.putTileAt(24, tile.x, tile.y, true);
      this.brickEmitter.explode(3, intersection.x, intersection.y);
    }
    else if (tile.index === 24) {
      layer.putTileAt(34, tile.x, tile.y, true);
      this.brickEmitter.explode(4, intersection.x, intersection.y);
    }
    else if (tile.index === 34) {
      layer.putTileAt(44, tile.x, tile.y, true);
      this.brickEmitter.explode(6, intersection.x, intersection.y);
    }
    else if (tile.index === 44) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      const tileUnder = layer.getTileAt(tile.x, tile.y + 1, true);

      if (isPlayer) {
        this.tilesDestroyed++;
      }

      this.brickEmitter.explode(10, intersection.x, intersection.y);

      if (tileUnder) {
        if (tileUnder.index === 2) {
          layer.putTileAt(3, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 12) {
          layer.putTileAt(13, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 22) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 32) {
          layer.putTileAt(33, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 42) {
          layer.putTileAt(43, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 5) {
          layer.putTileAt(4, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 15) {
          layer.putTileAt(14, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 25) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 35) {
          layer.putTileAt(34, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 45) {
          layer.putTileAt(44, tile.x, tile.y + 1, true);
        }
      }
    }

    // Brick (side)
    else if (tile.index === 5) {
      layer.putTileAt(15, tile.x, tile.y, true);
      this.brickEmitter.explode(2, intersection.x, intersection.y);
    }
    else if (tile.index === 15) {
      layer.putTileAt(25, tile.x, tile.y, true);
      this.brickEmitter.explode(3, intersection.x, intersection.y);
    }
    else if (tile.index === 25) {
      layer.putTileAt(35, tile.x, tile.y, true);
      this.brickEmitter.explode(4, intersection.x, intersection.y);
    }
    else if (tile.index === 35) {
      layer.putTileAt(45, tile.x, tile.y, true);
      this.brickEmitter.explode(6, intersection.x, intersection.y);
    }
    else if (tile.index === 45) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      const tileUnder = layer.getTileAt(tile.x, tile.y + 1, true);

      if (isPlayer) {
        this.tilesDestroyed++;
      }

      this.brickEmitter.explode(10, intersection.x, intersection.y);

      if (tileUnder) {
        if (tileUnder.index === 2) {
          layer.putTileAt(3, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 12) {
          layer.putTileAt(13, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 22) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 32) {
          layer.putTileAt(33, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 42) {
          layer.putTileAt(43, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 5) {
          layer.putTileAt(4, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 15) {
          layer.putTileAt(14, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 25) {
          layer.putTileAt(23, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 35) {
          layer.putTileAt(34, tile.x, tile.y + 1, true);
        }
        else if (tileUnder.index === 45) {
          this.ground.putTileAt(44, tile.x, tile.y + 1, true);
        }
      }
    }

    // Tree trunks/branches
    else if (tile.index === 81) {
      layer.putTileAt(85, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 85) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 82) {
      layer.putTileAt(86, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 86) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 84) {
      layer.putTileAt(89, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 89) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 85) {
      layer.putTileAt(90, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 90) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 91) {
      layer.putTileAt(96, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 96) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 92) {
      layer.putTileAt(97, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 97) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 93) {
      layer.putTileAt(98, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 98) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 94) {
      layer.putTileAt(98, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 98) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 95) {
      layer.putTileAt(100, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 100) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 101) {
      layer.putTileAt(106, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 106) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 102) {
      layer.putTileAt(107, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 107) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 103) {
      layer.putTileAt(108, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 108) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 104) {
      layer.putTileAt(109, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 109) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 105) {
      layer.putTileAt(110, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 110) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 113) {
      layer.putTileAt(118, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 118) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 123) {
      layer.putTileAt(127, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 127) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
    else if (tile.index === 133) {
      layer.putTileAt(138, tile.x, tile.y, true);
      this.woodEmitter.explode(10, intersection.x, intersection.y);
    }
    else if (tile.index === 138) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.woodEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }

    // Leaves
    else if ([51, 52, 53, 54, 61, 62, 63, 71, 72, 73].includes(tile.index)) {
      layer.removeTileAt(tile.x, tile.y, false, true);
      this.leavesEmitter.explode(50, intersection.x, intersection.y);

      if (isPlayer) {
        this.tilesDestroyed++;
      }
    }
  }

  update(time, delta) {
    // Apply timescale
    if (this.dirtEmitter.timeScale !== this.scaleTime) {
      this.dirtEmitter.timeScale = this.scaleTime;
    }
    if (this.grassEmitter.timeScale !== this.scaleTime) {
      this.grassEmitter.timeScale = this.scaleTime;
    }
    if (this.brickEmitter.timeScale !== this.scaleTime) {
      this.brickEmitter.timeScale = this.scaleTime;
    }
    if (this.woodEmitter.timeScale !== this.scaleTime) {
      this.woodEmitter.timeScale = this.scaleTime;
    }

    // Apply wind effect to leaves
    const leaves1Offset = new pMath.Vector2(Math.cos(time / 500) * 10, Math.sin(time / 500) * 10);
    const leaves2Offset = new pMath.Vector2(Math.cos(time / 500) * -10, Math.sin(time / 500) * -10);

    this.leavesBG1.setPosition(
      this.leavesBG1Pos.x + leaves1Offset.x,
      this.leavesBG2Pos.y + leaves1Offset.y
    );
    this.leavesBG2.setPosition(
      this.leavesBG2Pos.x + leaves2Offset.x,
      this.leavesBG2Pos.y + leaves2Offset.y
    );

    // Call player update functions
    this.cat.update(time, delta);
    this.dummy.update(time, delta);

    // Pan / zoom to the midpoint between players
    // Shoutout to @samme for this solution!!
    // https://codepen.io/samme/pen/BaoXxdx?editors=0010
    if (!this.cat.isDead && !this.dummy.isDead) {
      if (!this.soloTest) {
        this.cameraMid.copy(this.cat.body.center).lerp(this.dummy.body.center, 0.5);
    
        const dist = pMath.Distance.BetweenPoints(
          this.cat.body.position,
          this.dummy.body.position
        );
        const camera = this.cameras.main;
        const min = Math.min(this.scale.width, this.scale.height) / 1.5;
    
        camera.setZoom(
          pMath.Linear(
            camera.zoom,
            pMath.Clamp(min / dist, this.camZoomMin, this.camZoomMax),
            this.camZoomLerp
          )
        );
      }
    }
    else {
      this.bgm.stop();
    }

    // Reposition dummy if it goes off-map
    const {widthInPixels, heightInPixels} = this.tilemap;

    if (this.dummy.x > widthInPixels) {
      this.dummy.setX(0);
    }
    else if (this.dummy.x < 0) {
      this.dummy.setX(widthInPixels);
    }

    if (this.dummy.y > heightInPixels) {
      this.dummy.setY(0);
    }
    else if (this.y < 0) {
      this.dummy.setY(heightInPixels);
    }
  }

}
export default GameScene2;
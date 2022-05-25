import { GameObjects, Math as pMath } from "phaser";
const { Container } = GameObjects;

export default class ControllableCharacter extends Container {
  constructor(
    scene,
    x,
    y,
    [],
    animName,
    speed,
    jumpForce,
    jumpAnimBuffer,
    jumpAnimLock,
    isDead = false
  ) {
    super(scene, x, y, []);

    this.scene = scene;
    this.animName = animName;
    this.speed = speed;
    this.jumpForce = jumpForce;
    this.jumpAnimBuffer = jumpAnimBuffer;
    this.jumpAnimLock = jumpAnimLock;
    this.isDead = isDead;

    // Add animations
    this.core = this.scene.physics.add.sprite(0, 0, `${animName}`);
    this.core.play(`r-${animName}-idle`);
    this.core.body.setAllowGravity(false);

    this.armLeft = this.scene.physics.add.sprite(
      -20,
      -148,
      `${animName}-arm-left`
    );
    this.armLeft.play(`r-${animName}-arm-left-idle`);
    this.armLeft.setOrigin(0.19, 0.29);
    this.armLeft.body.setAllowGravity(false);

    this.armRight = this.scene.physics.add.sprite(
      -20,
      -148,
      `${animName}-arm-right`
    );
    this.armRight.play(`r-${animName}-arm-right-idle`);
    this.armRight.setOrigin(0.21, 0.28);
    this.armRight.body.setAllowGravity(false);

    this.head = this.scene.physics.add.image(-12, -185, `${animName}-head`);
    this.head.setOrigin(0.5, 1);
    this.head.setScale(0.75);
    this.head.body.setAllowGravity(false);

    this.add([this.armLeft, this.core, this.head, this.armRight]);

    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);

    this.body.setSize(140, 320);
    this.body.setOffset(-70, -200);
    this.isKnocked = false;

    this.bulletGfx = this.scene.add.graphics();
    this.bulletGfx.setDepth(10);
    this.bulletRaycaster = this.scene.raycasterPlugin.createRaycaster({
      debug: false,
    });
    this.bulletRay = this.bulletRaycaster.createRay();

    // Muzzle flare lighting
    this.muzzleFlare = this.scene.lights.addLight(0, 0, 500, 0xffff00, 0);

    this.cursors = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // For tracking distance stat:
    this.prevX = this.x;
    this.prevY = this.y;

    // Aim world vector for multiplayer
    this.aimAngle = 0;
    this.playerState = "";

    // Set data attributes
    this.setData("isPlayer", true);
  }

  update(time, delta) {
    const { left, right, up } = this.cursors;
    const { mousePointer } = this.scene.input;
    const { animName } = this;

    // Distance tracking...
    const xDiff = Math.abs(this.x - this.prevX);
    const yDiff = Math.abs(this.y - this.prevY);

    this.scene.registry.playerDistanceMoved += xDiff + yDiff;

    this.prevX = this.x;
    this.prevY = this.y;

    if (this.isDead) {
      const flipRot = 5 * Math.PI * (delta / 1000);

      this.head.setOrigin(0.5);
      this.core.setOrigin(0.5);
      this.armLeft.setOrigin(0.5);
      this.armRight.setOrigin(0.5);

      this.head.rotation -= flipRot;
      this.core.rotation += flipRot;
      this.armLeft.rotation -= flipRot;
      this.armRight.rotation += flipRot;
      return;
    }

    if (!this.isKnocked) {
      if (left.isDown) {
        this.body.setVelocityX(-this.speed);
      } else if (right.isDown) {
        this.body.setVelocityX(this.speed);
      } else {
        this.body.setVelocityX(0);
      }
    } else if (!this.body.blocked.none) {
      this.isKnocked = false;
    }

    if (up.isDown && this.body.onFloor()) {
      this.body.setVelocityY(-this.jumpForce);
    }

    // Aim controls
    const { zoom, worldView } = this.scene.cameras.main;
    const relX = (this.x - worldView.x) * zoom;
    const relY = (this.y - worldView.y) * zoom;

    this.aimAngle = pMath.Angle.Between(
      relX + this.armLeft.x * zoom,
      relY + this.armLeft.y * zoom,
      mousePointer.x,
      mousePointer.y
    );

    let angleMod = 2 * Math.PI;
    let headAngleMod = 0.35;

    if (mousePointer.x <= relX) {
      this.setFlipX(true);
      this.armLeft.setOrigin(1 - 0.19, 0.29);
      this.armRight.setOrigin(1 - 0.21, 0.28);
      this.armLeft.setX(20);
      this.armRight.setX(20);
      this.head.setX(12);
      angleMod = Math.PI;
      headAngleMod = 0.35;
    } else {
      this.setFlipX(false);
      this.armLeft.setOrigin(0.19, 0.29);
      this.armRight.setOrigin(0.21, 0.28);
      this.armLeft.setX(-20);
      this.armRight.setX(-20);
      this.head.setX(-12);
    }

    this.armLeft.setRotation(this.aimAngle + angleMod);
    this.armRight.setRotation(this.aimAngle + angleMod);
    // this.head.setRotation(this.aimAngle * headAngleMod + angleMod);
    this.head.setRotation(this.aimAngle + angleMod);

    // Animation logic
    if (this.body.onFloor()) {
      this.jumpAnimLock = false;

      if (this.body.velocity.x !== 0) {
        if (
          (this.core.flipX && this.body.velocity.x > 0) ||
          (!this.core.flipX && this.body.velocity.x < 0)
        ) {
          this.core.playReverse(`${this.animPrefix}-${animName}-run`, true);
        } else {
          this.core.play(`${this.animPrefix}-${animName}-run`, true);
        }
      } else {
        this.core.play(`${this.animPrefix}-${animName}-idle`, true);
      }
    } else {
      if (this.body.velocity.y < -this.jumpAnimBuffer) {
        this.core.play(`${this.animPrefix}-${animName}-up`, true);
      } else if (this.body.velocity.y > this.jumpAnimBuffer) {
        this.core.play(`${this.animPrefix}-${animName}-down`, true);
      } else if (!this.jumpAnimLock) {
        this.core.play(`${this.animPrefix}-${animName}-up-down`, true);
        this.jumpAnimLock = true;
      }
    }

    // Map bounds handling
    const { widthInPixels, heightInPixels } = this.scene.tilemap;

    if (this.x > widthInPixels) {
      this.setX(0);
    } else if (this.x < 0) {
      this.setX(widthInPixels);
    }

    if (this.y > heightInPixels) {
      this.setY(0);
    } else if (this.y < 0) {
      this.setY(heightInPixels);
    }
  }

  mapTarget(target) {
    this.bulletRaycaster.mapGameObjects(target, true);
  }

  mapGroundLayer(layer) {
    this.bulletRaycaster.mapGameObjects(layer, true, {
      collisionTiles: [
        1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 21, 22, 23, 24, 25, 31, 32, 33, 34,
        35, 41, 42, 43, 44, 45,
      ],
    });
  }

  mapDetailLayers(layers) {
    this.bulletRaycaster.mapGameObjects(layers, true, {
      collisionTiles: [
        51, 52, 53, 54, 61, 62, 63, 71, 72, 73, 81, 82, 84, 85, 86, 87, 89, 90,
        91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
        107, 108, 109, 110, 113, 118, 123, 127, 133, 137,
      ],
    });
  }

  initLighting() {
    this.list.forEach((obj) => {
      if (obj.getData("isHitbox") !== true) {
        obj.setPipeline("Light2D");
      }
    });
  }

  setFlipX(flip) {
    this.isFlipped = flip;

    if (flip) {
      this.animPrefix = "l";
    } else {
      this.animPrefix = "r";
    }

    this.head.setTexture(`${this.animPrefix}-${this.animName}-head`);
    this.armLeft.play(`${this.animPrefix}-${this.animName}-arm-left-idle`);
    this.armRight.play(`${this.animPrefix}-${this.animName}-arm-right-idle`);
  }

  applyHueRotation() {
    // Apply hue rotate
    // const hueRotatePipeline = this.scene.renderer.pipelines.get('HueRotate');
    // this.list.forEach((obj) => {
    //   if (obj.getData('isHitbox') !== true) {
    //     obj.setPipeline(hueRotatePipeline);
    //   }
    // });
    // hueRotatePipeline.time = 180.25; // magic numbers ftw
  }

  takeDamage(dmg, intersection, isNetworkControlled = false) {
    this.scene.registry.playerDamageTaken += dmg;

    if (!this.isDead) {
      const { isMultiplayerHost: isPlayer1 } = this.scene.registry;
      const { isMultiplayer } = this.scene.registry;

      if (
        !isMultiplayer ||
        (isPlayer1 && this.scene.registry.playerHP > 0) ||
        (!isPlayer1 && this.scene.registry.enemyHP > 0)
      ) {
        // let maxHP = (isPlayer1 ? this.scene.registry.playerHP : this.scene.registry.enemyHP);
        let maxHP = this.scene.registry.playerHP;

        if (isMultiplayer && !isPlayer1) {
          maxHP = this.scene.registry.enemyHP;
        }

        const txtX = intersection.x + pMath.Between(-200, 200);
        const txtY = intersection.y + pMath.Between(-200, 200);
        const dmgLabel = this.scene.add.text(txtX, txtY, `${dmg}`, {
          fontFamily: "monospace",
          fontSize: dmg < maxHP * 0.05 ? 60 : 120,
          color: "#FFF",
          stroke: "#000",
          strokeThickness: 4,
        });
        dmgLabel.setOrigin(0.5);
        dmgLabel.setDepth(100);

        this.scene.tweens.add({
          targets: dmgLabel,
          alpha: 0,
          y: dmgLabel.y - 200,
          duration: 1000,
          onComplete: () => {
            dmgLabel.destroy();
          },
        });
      }

      if (!isMultiplayer && this.scene.registry.playerHP - dmg > 0) {
        this.scene.registry.playerHP -= dmg;
      } else if (
        isMultiplayer &&
        isPlayer1 &&
        this.scene.registry.playerHP - dmg > 0
      ) {
        this.scene.registry.playerHP -= dmg;
      } else if (
        isMultiplayer &&
        !isPlayer1 &&
        this.scene.registry.enemyHP - dmg > 0
      ) {
        this.scene.registry.enemyHP -= dmg;
      } else {
        if (isPlayer1 || !isMultiplayer) {
          this.scene.registry.playerHP = 0;
        } else {
          this.scene.registry.enemyHP = 0;
        }

        this.isDead = true;

        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setVelocity(0, 0);

        const maxDeathBurst = 500;

        // this.scene.cameras.main.flash(1000, 255, 255, 255, true);
        this.scene.cameras.main.shake(1000);
        this.scene.cameras.main.stopFollow();
        this.scene.cameras.main.pan(this.x, this.y, 2000, "Linear", true);
        this.scene.cameras.main.zoomTo(1, 2000, "Linear", true, (cam, prog) => {
          if (prog === 1) {
            this.scene.time.addEvent({
              delay: 1000,
              repeat: 0,
              callback: () => {
                this.scene.cameras.main.pan(
                  this.scene.dummy.x,
                  this.scene.dummy.y,
                  2000,
                  "Linear",
                  true,
                  (cam, prog) => {
                    if (prog === 1) {
                      this.scene.cameras.main.zoomTo(
                        0.05,
                        7000,
                        "Linear",
                        true
                      );
                    }
                  }
                );
              },
            });
          }
        });

        this.head.body.setAllowGravity(true);
        this.head.body.setVelocity(
          pMath.Between(-maxDeathBurst, maxDeathBurst),
          pMath.Between(-maxDeathBurst * 2, -maxDeathBurst)
        );

        this.core.body.setAllowGravity(true);
        this.core.body.setVelocity(
          pMath.Between(-maxDeathBurst, maxDeathBurst),
          pMath.Between(-maxDeathBurst * 2, -maxDeathBurst)
        );

        this.armLeft.body.setAllowGravity(true);
        this.armLeft.body.setVelocity(
          pMath.Between(-maxDeathBurst, maxDeathBurst),
          pMath.Between(-maxDeathBurst * 2, -maxDeathBurst)
        );

        this.armRight.body.setAllowGravity(true);
        this.armRight.body.setVelocity(
          pMath.Between(-maxDeathBurst, maxDeathBurst),
          pMath.Between(-maxDeathBurst * 2, -maxDeathBurst)
        );
      }
    }
  }
}

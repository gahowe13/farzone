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
    this.speed = speed;
    this.jumpForce = jumpForce;
    this.jumpAnimBuffer = jumpAnimBuffer;
    this.jumpAnimLock = jumpAnimLock;
    this.isDead = isDead;

    this.cursors = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update(time, delta) {
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
      this.core.setFlipX(true);
      this.armLeft.setFlipX(true);
      this.armRight.setFlipX(true);
      this.head.setFlipX(true);
      this.armLeft.setOrigin(1 - 0.19, 0.29);
      this.armRight.setOrigin(1 - 0.21, 0.28);
      this.armLeft.setX(20);
      this.armRight.setX(20);
      this.head.setX(12);
      angleMod = Math.PI;
      headAngleMod = 0.35;
    } else {
      this.core.setFlipX(false);
      this.armLeft.setFlipX(false);
      this.armRight.setFlipX(false);
      this.head.setFlipX(false);
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
          this.core.playReverse("mech1-run", true);
        } else {
          this.core.play("mech1-run", true);
        }
      } else {
        this.core.play("mech1-idle", true);
      }
    } else {
      if (this.body.velocity.y < -this.jumpAnimBuffer) {
        this.core.play("mech1-up", true);
      } else if (this.body.velocity.y > this.jumpAnimBuffer) {
        this.core.play("mech1-down", true);
      } else if (!this.jumpAnimLock) {
        this.core.play("mech1-up-down", true);
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
}

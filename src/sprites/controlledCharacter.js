import { GameObjects, Math as pMath } from "phaser";
import Character from "./character";
const { Container } = GameObjects;

export default class ControllableCharacter extends Character {
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
    super(scene, x, y, [], "mech1", 800, 950, 50, false, false);

    this.scene = scene;
    this.isKnocked = false;

    this.cursors = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

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
  }
}

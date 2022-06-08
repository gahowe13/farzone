import { GameObjects, Math as pMath } from "phaser";
import RobotoShell from "./RobotoShell";
import { network } from "../network";
const { Container } = GameObjects;
import ControllableCharacter from "./controlledCharacter";

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "bullet");
  }

  fire(x, y, angle, vector, velocityMultiplier) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setRotation(angle + 1.5708);
    this.setVelocity(
      vector.x * velocityMultiplier,
      vector.y * velocityMultiplier
    );
    this.body.allowGravity = false;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    /*if (this.y <= 0) {
      setActive(false);
      setVisible(false);
    }*/
  }
}

class BulletGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);

    this.createMultiple({
      classType: Bullet,
      active: false,
      visible: false,
      allowGravity: false,
      frameQuantity: 300,
      setScale: { x: 3, y: 3 },
      key: "bullet",
    });
  }

  fireBullet(x, y, angle, vector, velocityMultiplier) {
    const bullet = this.getFirstDead(false);
    if (bullet) {
      bullet.fire(x, y, angle, vector, velocityMultiplier);
    }
  }
}

class Roboto extends ControllableCharacter {
  constructor(scene, x, y, playerID) {
    super(scene, x, y, [], "mech1", 800, 950, 50, false, false);

    this.scene = scene;
    this.speed = 800;
    this.jumpForce = 950;
    this.jumpAnimBuffer = 50;
    this.jumpAnimLock = false;
    this.isDead = false;
    this.animName = "mech1";
    this.animPrefix = "r";
    this.isFlipped = false;

    this.nextFire = 0;
    this.fireRate = 100;

    this.bulletGroup = new BulletGroup(this.scene);
  }

  shootGun() {
    const barrelOffsetY = 23;
    const barrelOffsetX = 275;
    const vector = new pMath.Vector2();
    let angleMod = this.isFlipped ? Math.PI : 2 * Math.PI;

    vector.setToPolar(this.armLeft.rotation + angleMod, barrelOffsetX);

    this.nextFire = this.scene.time.now + this.fireRate;

    this.bulletGroup.fireBullet(
      this.x + this.armLeft.x + vector.x,
      this.y + this.armLeft.y + vector.y - barrelOffsetY,
      this.armLeft.rotation + angleMod,
      vector,
      35
    );

    this.muzzleFlare.setPosition(
      this.x + this.armLeft.x + vector.x,
      this.y + this.armLeft.y + vector.y - barrelOffsetY
    );

    const intersection = this.bulletRay.cast();
    let endX = vector.x * 300;
    let endY = vector.y * 300;

    if (intersection) {
      const isTile =
        intersection.object &&
        typeof intersection.object.getTilesWithinWorldXY === "function";
      const isNPC =
        intersection.object && intersection.object.getData("isNPC") === true;
      const isPeer =
        intersection.object && intersection.object.getData("isPeer") === true;

      this.scene.registry.playerTotalAttacks++;

      if (isTile) {
        const tiles = intersection.object.getTilesWithinWorldXY(
          intersection.x - 1,
          intersection.y - 1,
          2,
          2
        );

        tiles.forEach((tile) =>
          this.scene.damageTile(tile, intersection, intersection.object, true)
        );
      } else if (isNPC) {
        const damage = pMath.Between(1, 5);
        intersection.object.takeDamage(damage, intersection);
        this.scene.registry.playerAttacksHit++;
      } else if (isPeer) {
        const damage = pMath.Between(1, 5);
        // network.send('damage-player', { damage, x: intersection.x, y: intersection.y });
        intersection.object.takeDamage(damage, intersection);
      }
    }

    if (this.scene.registry.isMultiplayer) {
      network.send("roboto-shoot", {
        sx: this.x + this.armLeft.x + vector.x,
        sy: this.y + this.armLeft.y + vector.y - barrelOffsetY,
        ex: endX,
        ey: endY,
      });
    }

    this.muzzleFlare.setIntensity(2.5);

    this.scene.time.addEvent({
      delay: 100,
      repeat: 0,
      callback: () => {
        this.bulletGfx.clear();
        this.muzzleFlare.setIntensity(0);
      },
    });

    this.armLeft.play(
      `${this.animPrefix}-${this.animName}-arm-left-light-shot`,
      true
    );
    this.armRight.play(
      `${this.animPrefix}-${this.animName}-arm-right-light-shot`,
      true
    );

    this.scene.sound.play("sfx-shoot", { volume: 0.5 });
  }

  shootRocket() {
    if (pointer.rightButtonDown()) {
      if (this.scene.registry.playerRockets > 0) {
        const barrelOffsetY = 145;
        const barrelOffsetX = 250;
        const vector = new pMath.Vector2();
        let angleMod = 2 * Math.PI;

        if (this.isFlipped) {
          angleMod = Math.PI;
        }

        vector.setToPolar(this.armLeft.rotation + angleMod, barrelOffsetX);

        new RobotoShell(
          this.scene,
          this.x + vector.x,
          this.y + vector.y - barrelOffsetY,
          this.armLeft.rotation,
          this.isFlipped,
          true
        );

        this.armLeft.play(
          `${this.animPrefix}-${this.animName}-arm-left-heavy-shot`,
          true
        );
        this.armRight.play(
          `${this.animPrefix}-${this.animName}-arm-right-heavy-shot`,
          true
        );
        this.scene.sound.play("sfx-rocket");

        this.scene.registry.playerRockets--;

        this.scene.time.addEvent({
          delay: 7500,
          repeat: 0,
          callback: () => {
            this.scene.registry.playerRockets++;
          },
        });
      }
    } else {
      this.scene.sound.play("sfx-rocket-dry");
    }
  }

  update(time, delta) {
    super.update(time, delta);
    const { mousePointer } = this.scene.input;
    if (mousePointer.leftButtonDown() && this.scene.time.now > this.nextFire)
      this.shootGun();
    if (mousePointer.rightButtonDown()) this.shootRocket();
  }
}

export default Roboto;

import { GameObjects, Math as pMath } from "phaser";
import RobotoShell from "./RobotoShell";
import { network } from "../network";
const { Container } = GameObjects;
import ControllableCharacter from "./controlledCharacter";

class Roboto extends ControllableCharacter {
  constructor(scene, x, y, playerID) {
    super(scene, x, y, [], "mech1", 800, 950, 50, false, false);

    this.scene = scene;
    this.speed = 800;
    this.jumpForce = 950;
    this.jumpAnimBuffer = 50;
    this.jumpAnimLock = false;
    this.isDead = false;
    this.animPrefix = "r";
    this.isFlipped = false;

    // Let the shoosting begin
    this.rapidfire = this.scene.time.addEvent({
      delay: 75,
      repeat: -1,
      paused: true,
      callback: () => {
        const barrelOffsetY = 23;
        const barrelOffsetX = 275;
        const vector = new pMath.Vector2();
        let angleMod = 2 * Math.PI;

        if (this.isFlipped) {
          angleMod = Math.PI;
        }

        vector.setToPolar(this.armLeft.rotation + angleMod, barrelOffsetX);

        this.bulletRay.setOrigin(
          this.x + this.armLeft.x + vector.x,
          this.y + this.armLeft.y + vector.y - barrelOffsetY
        );
        this.bulletRay.setAngle(this.armLeft.rotation + angleMod);

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
            intersection.object &&
            intersection.object.getData("isNPC") === true;
          const isPeer =
            intersection.object &&
            intersection.object.getData("isPeer") === true;
          endX = intersection.x;
          endY = intersection.y;

          this.scene.registry.playerTotalAttacks++;

          if (isTile) {
            const tiles = intersection.object.getTilesWithinWorldXY(
              intersection.x - 1,
              intersection.y - 1,
              2,
              2
            );

            tiles.forEach((tile) =>
              this.scene.damageTile(
                tile,
                intersection,
                intersection.object,
                true
              )
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

        this.bulletGfx.lineStyle(4, 0xfbf236, 1);
        this.bulletGfx.lineBetween(
          this.x + this.armLeft.x + vector.x,
          this.y + this.armLeft.y + vector.y - barrelOffsetY,
          endX,
          endY
        );

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

        this.scene.sound.play("sfx-shoot", { volume: 0.5 });
      },
    });

    this.scene.input.on("pointerdown", (pointer) => {
      if (!this.isDead) {
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
              `${this.animPrefix}-mech1-arm-left-heavy-shot`,
              true
            );
            this.armRight.play(
              `${this.animPrefix}-mech1-arm-right-heavy-shot`,
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
          } else {
            this.scene.sound.play("sfx-rocket-dry");
          }
        } else {
          this.rapidfire.paused = false;
          this.armLeft.play(
            `${this.animPrefix}-mech1-arm-left-light-shot`,
            true
          );
          this.armRight.play(
            `${this.animPrefix}-mech1-arm-right-light-shot`,
            true
          );
        }
      }
    });

    this.scene.input.on("pointerup", () => {
      if (!this.isDead) {
        this.rapidfire.paused = true;
        this.armLeft.play(`${this.animPrefix}-mech1-arm-left-idle`, true);
        this.armRight.play(`${this.animPrefix}-mech1-arm-right-idle`, true);
      }
    });
  }
}

export default Roboto;

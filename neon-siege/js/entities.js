(() => {
  'use strict';

  const NS = window.NS;
  const C = NS.Config;
  const U = NS.Util;

  /* =========================================================
     PLAYER
  ========================================================= */

  class Player {

    constructor(game) {

      this.game = game;

      this.radius = C.player.radius;

      this.x = game.width * 0.5;
      this.y = game.height * 0.55;

      this.vx = 0;
      this.vy = 0;

      this.angle = -Math.PI * 0.5;

      this.maxHealth = C.player.maxHealth;
      this.health = this.maxHealth;

      this.maxShield = C.player.maxShield;
      this.shield = C.player.startingShield;

      this.dead = false;

      this.invulnerableTimer = 0;

      this.dashTimer = 0;
      this.dashCooldown = 0;

      this.dashX = 0;
      this.dashY = 0;

      this.overdriveTimer = 0;

      this.regenDelay = 0;

      this.weaponState =
        NS.Weapons.createLoadout();

      /* ============================
         UPGRADEABLE STATS
      ============================ */

      this.damageMultiplier = 1;
      this.fireRateMultiplier = 1;
      this.moveSpeedMultiplier = 1;
      this.spreadMultiplier = 1;

      this.criticalChance =
        C.player.criticalChance;

      this.criticalMultiplier =
        C.player.criticalMultiplier;

      this.pickupRadius =
        C.player.pickupRadius;

      this.lifeSteal = 0;

      this.armor = 0;

      this.extraProjectiles = 0;

      this.dashCooldownMultiplier = 1;

      this.dashSpeedMultiplier = 1;

      this.shieldRegen = 0;

      this.healthRegen = 0;

      this.regenTimer = 0;

      /* ============================
         LEVEL / XP
      ============================ */

      this.level = 1;
      this.xp = 0;

      this.xpNeeded =
        C.leveling.baseXP;

      this.upgradeLevels = {};

      /* ============================
         STATS
      ============================ */

      this.kills = 0;
      this.damageDone = 0;
      this.damageTaken = 0;

      this.lastHitTime = 0;

      this.trailTimer = 0;
    }


    /* =====================================================
       RESET POSITION
    ===================================================== */

    resetPosition() {

      this.x =
        this.game.width * 0.5;

      this.y =
        this.game.height * 0.55;

      this.vx = 0;
      this.vy = 0;

      this.angle =
        -Math.PI * 0.5;
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    update(dt) {

      if (this.dead) {
        return;
      }


      if (
        this.invulnerableTimer > 0
      ) {

        this.invulnerableTimer -= dt;
      }


      if (
        this.dashCooldown > 0
      ) {

        this.dashCooldown -= dt;
      }


      if (
        this.overdriveTimer > 0
      ) {

        this.overdriveTimer -= dt;
      }


      if (
        this.regenDelay > 0
      ) {

        this.regenDelay -= dt;
      }


      NS.Weapons.update(
        this,
        dt
      );


      NS.Input.update(
        this
      );


      this.handleActions();

      this.updateMovement(dt);

      this.updateAim();

      this.updateRegeneration(dt);

      this.keepInsideArena();
    }


    /* =====================================================
       INPUT ACTIONS
    ===================================================== */

    handleActions() {

      if (
        NS.Input.consumeDash()
      ) {

        this.tryDash();
      }


      if (
        NS.Input.consumeReload()
      ) {

        NS.Weapons.startReload(
          this
        );
      }


      if (
        NS.Input.consumeWeaponSwitch()
      ) {

        NS.Weapons.cycle(
          this
        );
      }


      const state =
        this.weaponState;

      const weapon =
        NS.Weapons
          .getCurrentDefinition(
            this
          );


      if (!weapon) {
        return;
      }


      const triggerDown =
        NS.Input.isFiring();


      const shouldFire =
        triggerDown &&
        (
          weapon.automatic ||
          !state.triggerWasDown
        );


      if (shouldFire) {

        const aim =
          NS.Input.getAimVector();


        NS.Weapons.fire(
          this.game,
          this,
          aim.x,
          aim.y
        );
      }


      state.triggerWasDown =
        triggerDown;


      const ammo =
        NS.Weapons
          .getCurrentAmmo(
            this
          );


      if (
        ammo &&
        ammo.magazine <= 0 &&
        ammo.reserve > 0 &&
        !state.reloading &&
        state.cooldown <= 0
      ) {

        NS.Weapons.startReload(
          this
        );
      }
    }


    /* =====================================================
       MOVEMENT
    ===================================================== */

    updateMovement(dt) {

      if (
        this.dashTimer > 0
      ) {

        this.dashTimer -= dt;


        const speed =
          C.player.dashSpeed *
          this.dashSpeedMultiplier;


        this.vx =
          this.dashX *
          speed;

        this.vy =
          this.dashY *
          speed;


        this.x +=
          this.vx * dt;

        this.y +=
          this.vy * dt;


        this.trailTimer -= dt;


        if (
          this.trailTimer <= 0
        ) {

          this.trailTimer =
            0.018;


          if (
            NS.Effects &&
            NS.Effects.dashTrail
          ) {

            NS.Effects.dashTrail(
              this.x,
              this.y,
              C.colors.player
            );
          }
        }


        return;
      }


      const move =
        NS.Input.getMoveVector();


      const moving =
        Math.hypot(
          move.x,
          move.y
        ) > 0.05;


      let speed =
        C.player.speed *
        this.moveSpeedMultiplier;


      if (
        this.overdriveTimer > 0
      ) {

        speed *=
          C.pickups
            .overdrive
            .speedMultiplier;
      }


      if (moving) {

        const targetVX =
          move.x *
          speed;

        const targetVY =
          move.y *
          speed;


        const amount =
          Math.min(
            1,
            C.player.acceleration *
            dt
          );


        this.vx =
          U.lerp(
            this.vx,
            targetVX,
            amount
          );

        this.vy =
          U.lerp(
            this.vy,
            targetVY,
            amount
          );

      } else {

        const damping =
          Math.exp(
            -C.player.friction *
            dt
          );


        this.vx *= damping;
        this.vy *= damping;
      }


      this.x +=
        this.vx * dt;

      this.y +=
        this.vy * dt;
    }


    /* =====================================================
       AIM
    ===================================================== */

    updateAim() {

      const aim =
        NS.Input.getAimVector();


      if (
        Math.hypot(
          aim.x,
          aim.y
        ) > 0.2
      ) {

        const target =
          Math.atan2(
            aim.y,
            aim.x
          );


        this.angle =
          U.lerpAngle(
            this.angle,
            target,
            0.34
          );
      }
    }


    /* =====================================================
       DASH
    ===================================================== */

    tryDash() {

      if (
        this.dashCooldown > 0 ||
        this.dashTimer > 0
      ) {

        return false;
      }


      let move =
        NS.Input.getMoveVector();


      let dx = move.x;
      let dy = move.y;


      if (
        Math.hypot(
          dx,
          dy
        ) < 0.15
      ) {

        const aim =
          NS.Input.getAimVector();

        dx = aim.x;
        dy = aim.y;
      }


      if (
        Math.hypot(
          dx,
          dy
        ) < 0.15
      ) {

        dx =
          Math.cos(
            this.angle
          );

        dy =
          Math.sin(
            this.angle
          );
      }


      const normal =
        U.normalize(
          dx,
          dy
        );


      this.dashX =
        normal.x;

      this.dashY =
        normal.y;


      this.dashTimer =
        C.player.dashDuration;


      this.dashCooldown =
        C.player.dashCooldown *
        this.dashCooldownMultiplier;


      this.invulnerableTimer =
        Math.max(
          this.invulnerableTimer,
          C.player
            .dashInvulnerability
        );


      this.trailTimer = 0;


      if (NS.Audio) {

        NS.Audio.dash();
      }


      if (
        this.game &&
        this.game.addShake
      ) {

        this.game.addShake(
          3.5
        );
      }


      if (
        NS.Effects &&
        NS.Effects.dashBurst
      ) {

        NS.Effects.dashBurst(
          this.x,
          this.y,
          C.colors.player
        );
      }


      return true;
    }


    /* =====================================================
       BOUNDS
    ===================================================== */

    keepInsideArena() {

      const padding =
        C.game.worldPadding;


      this.x =
        U.clamp(
          this.x,
          padding + this.radius,
          this.game.width -
          padding -
          this.radius
        );


      this.y =
        U.clamp(
          this.y,
          padding + this.radius,
          this.game.height -
          padding -
          this.radius
        );
    }


    /* =====================================================
       DAMAGE
    ===================================================== */

    takeDamage(
      amount,
      info = {}
    ) {

      if (
        this.dead ||
        this.invulnerableTimer > 0
      ) {

        return 0;
      }


      amount =
        Math.max(
          0,
          amount
        );


      if (
        this.armor > 0
      ) {

        amount *=
          1 -
          U.clamp(
            this.armor,
            0,
            0.65
          );
      }


      const original =
        amount;


      let shieldDamage = 0;


      if (
        this.shield > 0
      ) {

        shieldDamage =
          Math.min(
            this.shield,
            amount
          );


        this.shield -=
          shieldDamage;

        amount -=
          shieldDamage;


        if (
          shieldDamage > 0 &&
          NS.Audio
        ) {

          NS.Audio.shieldHit();
        }
      }


      if (
        amount > 0
      ) {

        this.health -=
          amount;

        this.health =
          Math.max(
            0,
            this.health
          );


        this.damageTaken +=
          amount;


        if (NS.Audio) {

          NS.Audio.playerHit();
        }
      }


      this.regenDelay =
        C.player.regenerationDelay;


      this.invulnerableTimer =
        0.09;


      if (
        this.game &&
        this.game.addShake
      ) {

        this.game.addShake(
          shieldDamage >= original
            ? 2.5
            : 6
        );
      }


      if (
        this.game &&
        this.game.flashDamage
      ) {

        this.game.flashDamage(
          shieldDamage >= original
            ? '#39a8ff'
            : '#ff3e67',
          shieldDamage >= original
            ? 0.08
            : 0.15
        );
      }


      if (
        NS.Effects &&
        NS.Effects.playerHit
      ) {

        NS.Effects.playerHit(
          this.x,
          this.y,
          shieldDamage >= original
            ? C.colors.shield
            : C.colors.health
        );
      }


      if (
        this.health <= 0
      ) {

        this.die(
          info
        );
      }


      return original;
    }


    die(info = {}) {

      if (this.dead) {
        return;
      }


      this.dead = true;

      this.health = 0;


      if (
        NS.Effects &&
        NS.Effects.playerDeath
      ) {

        NS.Effects.playerDeath(
          this.x,
          this.y
        );
      }


      if (
        this.game &&
        this.game.playerDied
      ) {

        this.game.playerDied(
          info
        );
      }
    }


    /* =====================================================
       HEAL / SHIELD
    ===================================================== */

    heal(amount) {

      if (this.dead) {
        return 0;
      }


      const before =
        this.health;


      this.health =
        Math.min(
          this.maxHealth,
          this.health +
          amount
        );


      return (
        this.health -
        before
      );
    }


    addShield(amount) {

      const before =
        this.shield;


      this.shield =
        Math.min(
          this.maxShield,
          this.shield +
          amount
        );


      return (
        this.shield -
        before
      );
    }


    /* =====================================================
       REGENERATION
    ===================================================== */

    updateRegeneration(dt) {

      if (
        this.regenDelay > 0
      ) {
        return;
      }


      if (
        this.healthRegen > 0 &&
        this.health <
        this.maxHealth
      ) {

        this.health =
          Math.min(
            this.maxHealth,
            this.health +
            this.healthRegen *
            dt
          );
      }


      if (
        this.shieldRegen > 0 &&
        this.shield <
        this.maxShield
      ) {

        this.shield =
          Math.min(
            this.maxShield,
            this.shield +
            this.shieldRegen *
            dt
          );
      }
    }


    /* =====================================================
       PICKUPS
    ===================================================== */

    collectPickup(pickup) {

      if (
        !pickup ||
        pickup.dead
      ) {
        return;
      }


      const type =
        pickup.type;


      switch (type) {

        case 'health':

          this.heal(
            C.pickups
              .health
              .amount
          );

          break;


        case 'shield':

          this.addShield(
            C.pickups
              .shield
              .amount
          );

          break;


        case 'ammo':

          NS.Weapons.giveAmmo(
            this
          );

          break;


        case 'overdrive':

          this.overdriveTimer =
            Math.max(
              this.overdriveTimer,
              C.pickups
                .overdrive
                .duration
            );

          break;
      }


      pickup.dead = true;


      if (NS.Audio) {

        NS.Audio.pickup();
      }


      if (
        NS.Effects &&
        NS.Effects.pickupBurst
      ) {

        NS.Effects.pickupBurst(
          pickup.x,
          pickup.y,
          pickup.color
        );
      }


      if (
        this.game &&
        this.game.notify
      ) {

        const data =
          C.pickups[type];


        if (data) {

          this.game.notify(
            data.name
          );
        }
      }
    }


    /* =====================================================
       XP / LEVEL
    ===================================================== */

    addXP(amount) {

      if (
        this.level >=
        C.leveling.maxLevel
      ) {

        return;
      }


      this.xp += amount;


      while (
        this.xp >=
        this.xpNeeded &&
        this.level <
        C.leveling.maxLevel
      ) {

        this.xp -=
          this.xpNeeded;

        this.level++;


        this.xpNeeded =
          Math.floor(
            C.leveling.baseXP *
            Math.pow(
              C.leveling.growth,
              this.level - 1
            )
          );


        if (NS.Audio) {

          NS.Audio.levelUp();
        }


        if (
          this.game &&
          this.game.requestUpgrade
        ) {

          this.game.requestUpgrade();
        }
      }
    }


    /* =====================================================
       LIFESTEAL
    ===================================================== */

    onDamageDealt(amount) {

      this.damageDone +=
        amount;


      if (
        this.lifeSteal > 0 &&
        this.health <
        this.maxHealth
      ) {

        this.heal(
          amount *
          this.lifeSteal
        );
      }
    }


    /* =====================================================
       DRAW
    ===================================================== */

    draw(ctx) {

      if (this.dead) {
        return;
      }


      ctx.save();

      ctx.translate(
        this.x,
        this.y
      );


      const blink =
        this.invulnerableTimer > 0 &&
        Math.sin(
          performance.now() *
          0.035
        ) > 0.25;


      if (blink) {

        ctx.globalAlpha =
          0.48;
      }


      /* ==========================
         SHADOW
      ========================== */

      ctx.save();

      ctx.translate(
        5,
        8
      );

      ctx.scale(
        1,
        0.55
      );

      ctx.fillStyle =
        'rgba(0,0,0,.55)';

      ctx.filter =
        'blur(5px)';

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius + 7,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.restore();


      /* ==========================
         DASH ENERGY
      ========================== */

      if (
        this.dashTimer > 0
      ) {

        ctx.save();

        ctx.globalCompositeOperation =
          'lighter';

        ctx.strokeStyle =
          'rgba(0,229,255,.72)';

        ctx.shadowColor =
          C.colors.player;

        ctx.shadowBlur = 20;

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          this.radius + 8,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
      }


      /* ==========================
         BODY
      ========================== */

      const bodyGradient =
        ctx.createRadialGradient(
          -6,
          -8,
          2,
          0,
          0,
          this.radius + 7
        );


      bodyGradient.addColorStop(
        0,
        '#bffaff'
      );

      bodyGradient.addColorStop(
        0.18,
        '#22eaff'
      );

      bodyGradient.addColorStop(
        0.60,
        '#008aa1'
      );

      bodyGradient.addColorStop(
        1,
        '#003845'
      );


      ctx.shadowColor =
        C.colors.player;

      ctx.shadowBlur = 16;

      ctx.fillStyle =
        bodyGradient;


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.shadowBlur = 0;


      ctx.strokeStyle =
        'rgba(180,250,255,.55)';

      ctx.lineWidth = 1.4;

      ctx.stroke();


      /* ==========================
         ARMOR PANELS
      ========================== */

      ctx.save();

      ctx.rotate(
        this.angle
      );


      ctx.fillStyle =
        'rgba(0,14,22,.78)';

      ctx.beginPath();

      ctx.moveTo(
        -9,
        -13
      );

      ctx.lineTo(
        5,
        -10
      );

      ctx.lineTo(
        7,
        -4
      );

      ctx.lineTo(
        -12,
        -5
      );

      ctx.closePath();

      ctx.fill();


      ctx.beginPath();

      ctx.moveTo(
        -9,
        13
      );

      ctx.lineTo(
        5,
        10
      );

      ctx.lineTo(
        7,
        4
      );

      ctx.lineTo(
        -12,
        5
      );

      ctx.closePath();

      ctx.fill();


      /* ==========================
         WEAPON
      ========================== */

      const weapon =
        NS.Weapons
          .getCurrentDefinition(
            this
          );


      const weaponColor =
        weapon
          ? weapon.color
          : '#ffffff';


      ctx.fillStyle =
        '#07101a';

      ctx.strokeStyle =
        'rgba(255,255,255,.17)';


      ctx.beginPath();

      ctx.roundRect(
        4,
        -4,
        28,
        8,
        3
      );

      ctx.fill();

      ctx.stroke();


      ctx.fillStyle =
        weaponColor;

      ctx.shadowColor =
        weaponColor;

      ctx.shadowBlur = 10;


      ctx.beginPath();

      ctx.roundRect(
        13,
        -2,
        22,
        4,
        2
      );

      ctx.fill();


      ctx.shadowBlur = 0;


      /* ==========================
         CORE
      ========================== */

      ctx.fillStyle =
        '#e8fdff';

      ctx.beginPath();

      ctx.arc(
        2,
        0,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.restore();


      /* ==========================
         SHIELD
      ========================== */

      if (
        this.shield > 0
      ) {

        const ratio =
          this.shield /
          this.maxShield;


        ctx.save();

        ctx.globalCompositeOperation =
          'lighter';

        ctx.strokeStyle =
          `rgba(57,168,255,${
            0.20 +
            ratio * 0.45
          })`;

        ctx.lineWidth = 2;

        ctx.shadowColor =
          C.colors.shield;

        ctx.shadowBlur = 14;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          this.radius +
          8 +
          Math.sin(
            performance.now() *
            0.006
          ) * 1.3,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
      }


      /* ==========================
         OVERDRIVE
      ========================== */

      if (
        this.overdriveTimer > 0
      ) {

        ctx.save();

        ctx.globalCompositeOperation =
          'lighter';

        ctx.strokeStyle =
          'rgba(243,201,105,.65)';

        ctx.lineWidth = 1.5;

        ctx.shadowColor =
          C.colors.gold;

        ctx.shadowBlur = 12;


        const spin =
          performance.now() *
          0.004;


        for (
          let i = 0;
          i < 3;
          i++
        ) {

          const angle =
            spin +
            i *
            (
              Math.PI *
              2 /
              3
            );


          const x =
            Math.cos(angle) *
            (
              this.radius +
              8
            );

          const y =
            Math.sin(angle) *
            (
              this.radius +
              8
            );


          ctx.beginPath();

          ctx.arc(
            x,
            y,
            2.2,
            0,
            Math.PI * 2
          );

          ctx.stroke();
        }


        ctx.restore();
      }


      ctx.restore();
    }

  }


  /* =========================================================
     PICKUP
  ========================================================= */

  class Pickup {

    constructor(
      x,
      y,
      type
    ) {

      this.x = x;
      this.y = y;

      this.type = type;

      this.radius = 15;

      this.dead = false;

      this.life =
        C.game.pickupLifetime;

      this.age = 0;

      this.rotation =
        U.rand(
          0,
          Math.PI * 2
        );


      const data =
        C.pickups[type];


      this.color =
        data
          ? data.color
          : '#ffffff';

      this.icon =
        data
          ? data.icon
          : '?';

      this.name =
        data
          ? data.name
          : 'ITEM';
    }


    update(game, dt) {

      if (this.dead) {
        return;
      }


      this.age += dt;
      this.life -= dt;

      this.rotation +=
        dt * 1.8;


      if (
        this.life <= 0
      ) {

        this.dead = true;

        return;
      }


      const player =
        game.player;


      if (
        !player ||
        player.dead
      ) {

        return;
      }


      const distance =
        U.distance(
          this.x,
          this.y,
          player.x,
          player.y
        );


      const pickupRange =
        player.pickupRadius +
        this.radius;


      /*
        Small magnetic attraction.
      */

      if (
        distance <
        pickupRange + 65 &&
        distance >
        0.1
      ) {

        const dx =
          player.x -
          this.x;

        const dy =
          player.y -
          this.y;


        const normal =
          U.normalize(
            dx,
            dy
          );


        const strength =
          (
            1 -
            U.clamp(
              distance /
              (
                pickupRange +
                65
              ),
              0,
              1
            )
          ) *
          300;


        this.x +=
          normal.x *
          strength *
          dt;

        this.y +=
          normal.y *
          strength *
          dt;
      }


      if (
        distance <=
        pickupRange
      ) {

        player.collectPickup(
          this
        );
      }
    }


    draw(ctx) {

      if (this.dead) {
        return;
      }


      const pulse =
        1 +
        Math.sin(
          this.age * 5
        ) *
        0.07;


      const fade =
        this.life < 2
          ? (
              0.45 +
              Math.sin(
                this.age * 20
              ) *
              0.4
            )
          : 1;


      ctx.save();

      ctx.translate(
        this.x,
        this.y
      );

      ctx.scale(
        pulse,
        pulse
      );

      ctx.globalAlpha =
        fade;


      /* ==========================
         OUTER GLOW
      ========================== */

      ctx.globalCompositeOperation =
        'lighter';

      ctx.shadowColor =
        this.color;

      ctx.shadowBlur = 22;

      ctx.strokeStyle =
        this.color;

      ctx.lineWidth = 2;


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius + 3,
        0,
        Math.PI * 2
      );

      ctx.stroke();


      /* ==========================
         ROTATING RING
      ========================== */

      ctx.save();

      ctx.rotate(
        this.rotation
      );

      ctx.strokeStyle =
        `${this.color}99`;

      ctx.lineWidth = 1;


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius + 7,
        -0.65,
        0.65
      );

      ctx.stroke();


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius + 7,
        Math.PI - 0.65,
        Math.PI + 0.65
      );

      ctx.stroke();

      ctx.restore();


      /* ==========================
         BODY
      ========================== */

      ctx.globalCompositeOperation =
        'source-over';

      const gradient =
        ctx.createRadialGradient(
          -4,
          -5,
          1,
          0,
          0,
          this.radius
        );


      gradient.addColorStop(
        0,
        'rgba(255,255,255,.25)'
      );

      gradient.addColorStop(
        0.35,
        'rgba(13,25,42,.96)'
      );

      gradient.addColorStop(
        1,
        'rgba(4,9,18,.98)'
      );


      ctx.fillStyle =
        gradient;

      ctx.strokeStyle =
        this.color;

      ctx.lineWidth = 1.4;


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.stroke();


      /* ==========================
         ICON
      ========================== */

      ctx.fillStyle =
        this.color;

      ctx.shadowColor =
        this.color;

      ctx.shadowBlur = 9;

      ctx.font =
        'bold 17px Arial';

      ctx.textAlign =
        'center';

      ctx.textBaseline =
        'middle';

      ctx.fillText(
        this.icon,
        0,
        1
      );


      ctx.restore();
    }

  }


  /* =========================================================
     EXPORTS
  ========================================================= */

  NS.Player = Player;
  NS.Pickup = Pickup;


  console.log(
    'NEON SIEGE: entities loaded'
  );

})();

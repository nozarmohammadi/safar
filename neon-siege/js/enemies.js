(() => {
  'use strict';

  const NS = window.NS;
  const C = NS.Config;
  const U = NS.Util;

  /* =========================================================
     ENEMY PROJECTILE
  ========================================================= */

  class EnemyProjectile {

    constructor(options = {}) {

      this.x = options.x || 0;
      this.y = options.y || 0;

      this.prevX = this.x;
      this.prevY = this.y;

      this.vx = options.vx || 0;
      this.vy = options.vy || 0;

      this.radius =
        options.radius || 4;

      this.damage =
        options.damage || 10;

      this.color =
        options.color || '#ff3e67';

      this.life =
        options.life || 3;

      this.maxLife =
        this.life;

      this.dead = false;

      this.boss =
        !!options.boss;
    }


    update(game, dt) {

      if (this.dead) {
        return;
      }

      this.prevX = this.x;
      this.prevY = this.y;

      this.x +=
        this.vx * dt;

      this.y +=
        this.vy * dt;

      this.life -= dt;


      if (
        Math.random() < 0.38 &&
        NS.Effects
      ) {

        NS.Effects.particle({
          x: this.x,
          y: this.y,

          vx:
            -this.vx * 0.018 +
            U.rand(-8, 8),

          vy:
            -this.vy * 0.018 +
            U.rand(-8, 8),

          radius:
            this.boss
              ? U.rand(1.8, 3.5)
              : U.rand(1, 2.2),

          color:
            this.color,

          life:
            U.rand(0.08, 0.18),

          drag: 6,

          glow:
            this.boss
              ? 14
              : 8
        });
      }


      const player =
        game.player;


      if (
        player &&
        !player.dead
      ) {

        const radius =
          this.radius +
          player.radius;

        if (
          U.distanceSq(
            this.x,
            this.y,
            player.x,
            player.y
          ) <=
          radius * radius
        ) {

          player.takeDamage(
            this.damage,
            {
              projectile: this
            }
          );

          this.dead = true;

          if (NS.Effects) {

            NS.Effects.bulletImpact(
              this.x,
              this.y,
              this.color,
              false
            );
          }

          return;
        }
      }


      const margin = 120;

      if (
        this.life <= 0 ||
        this.x < -margin ||
        this.y < -margin ||
        this.x > game.width + margin ||
        this.y > game.height + margin
      ) {

        this.dead = true;
      }
    }


    draw(ctx) {

      if (this.dead) {
        return;
      }

      const speed =
        Math.hypot(
          this.vx,
          this.vy
        ) || 1;

      const nx =
        this.vx / speed;

      const ny =
        this.vy / speed;

      const trail =
        this.boss
          ? 24
          : 15;


      ctx.save();

      ctx.globalCompositeOperation =
        'lighter';

      ctx.shadowColor =
        this.color;

      ctx.shadowBlur =
        this.boss
          ? 20
          : 12;


      const gradient =
        ctx.createLinearGradient(
          this.x,
          this.y,
          this.x -
          nx * trail,
          this.y -
          ny * trail
        );


      gradient.addColorStop(
        0,
        this.color
      );

      gradient.addColorStop(
        1,
        'rgba(0,0,0,0)'
      );


      ctx.strokeStyle =
        gradient;

      ctx.lineWidth =
        this.boss
          ? 4
          : 2.4;


      ctx.beginPath();

      ctx.moveTo(
        this.x -
        nx * trail,
        this.y -
        ny * trail
      );

      ctx.lineTo(
        this.x,
        this.y
      );

      ctx.stroke();


      ctx.fillStyle =
        '#ffffff';

      ctx.beginPath();

      ctx.arc(
        this.x,
        this.y,
        this.radius * 0.48,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.fillStyle =
        this.color;

      ctx.globalAlpha = 0.72;

      ctx.beginPath();

      ctx.arc(
        this.x,
        this.y,
        this.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.restore();
    }

  }


  /* =========================================================
     BASE ENEMY
  ========================================================= */

  class Enemy {

    constructor(
      game,
      type,
      x,
      y,
      wave = 1
    ) {

      this.game = game;

      this.type = type;

      this.data =
        C.enemies[type];

      if (!this.data) {

        throw new Error(
          `Unknown enemy type: ${type}`
        );
      }


      this.x = x;
      this.y = y;

      this.vx = 0;
      this.vy = 0;

      this.radius =
        this.data.radius;

      this.angle = 0;

      this.wave = wave;


      const healthScale =
        1 +
        Math.max(
          0,
          wave - 1
        ) *
        C.waves.healthGrowth;


      const damageScale =
        1 +
        Math.max(
          0,
          wave - 1
        ) *
        C.waves.damageGrowth;


      const speedScale =
        1 +
        Math.min(
          0.35,
          Math.max(
            0,
            wave - 1
          ) *
          C.waves.speedGrowth
        );


      this.maxHealth =
        this.data.health *
        healthScale;

      this.health =
        this.maxHealth;


      this.damage =
        (
          this.data.damage || 10
        ) *
        damageScale;


      this.speed =
        this.data.speed *
        speedScale;


      this.dead = false;

      this.hitFlash = 0;

      this.contactCooldown = 0;

      this.fireCooldown =
        U.rand(
          0.2,
          0.8
        );

      this.thinkTimer = 0;

      this.strafeDirection =
        Math.random() < 0.5
          ? -1
          : 1;

      this.strafeTimer =
        U.rand(
          0.6,
          1.5
        );


      this.knockbackVX = 0;
      this.knockbackVY = 0;


      this.sniperCharge = 0;

      this.sniperCharging =
        false;


      this.orbitOffset =
        U.rand(
          0,
          Math.PI * 2
        );


      this.spawnTime = 0;

      this.score =
        this.data.score || 100;

      this.xp =
        this.data.xp || 10;

      this.color =
        this.data.color ||
        C.colors.enemy;
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    update(game, dt) {

      if (this.dead) {
        return;
      }


      this.spawnTime += dt;


      if (
        this.hitFlash > 0
      ) {

        this.hitFlash -= dt;
      }


      if (
        this.contactCooldown > 0
      ) {

        this.contactCooldown -= dt;
      }


      if (
        this.fireCooldown > 0
      ) {

        this.fireCooldown -= dt;
      }


      if (
        this.strafeTimer > 0
      ) {

        this.strafeTimer -= dt;

      } else {

        this.strafeTimer =
          U.rand(
            0.55,
            1.45
          );

        this.strafeDirection *=
          -1;
      }


      this.updateAI(
        game,
        dt
      );


      this.applySeparation(
        game,
        dt
      );


      this.applyKnockback(
        dt
      );


      this.x +=
        this.vx * dt;

      this.y +=
        this.vy * dt;


      this.keepInArena(
        game
      );


      this.checkPlayerContact(
        game
      );
    }


    /* =====================================================
       AI
    ===================================================== */

    updateAI(
      game,
      dt
    ) {

      const player =
        game.player;


      if (
        !player ||
        player.dead
      ) {

        this.vx *=
          Math.exp(
            -6 * dt
          );

        this.vy *=
          Math.exp(
            -6 * dt
          );

        return;
      }


      const dx =
        player.x -
        this.x;

      const dy =
        player.y -
        this.y;


      const distance =
        Math.hypot(
          dx,
          dy
        ) || 1;


      const toPlayer = {
        x: dx / distance,
        y: dy / distance
      };


      this.angle =
        Math.atan2(
          dy,
          dx
        );


      switch (
        this.type
      ) {

        case 'chaser':

          this.aiChaser(
            toPlayer,
            distance,
            dt
          );

          break;


        case 'gunner':

          this.aiGunner(
            game,
            player,
            toPlayer,
            distance,
            dt
          );

          break;


        case 'striker':

          this.aiStriker(
            game,
            player,
            toPlayer,
            distance,
            dt
          );

          break;


        case 'sniper':

          this.aiSniper(
            game,
            player,
            toPlayer,
            distance,
            dt
          );

          break;


        case 'drone':

          this.aiDrone(
            game,
            player,
            toPlayer,
            distance,
            dt
          );

          break;


        case 'heavy':

          this.aiHeavy(
            game,
            player,
            toPlayer,
            distance,
            dt
          );

          break;
      }
    }


    /* =====================================================
       CHASER
    ===================================================== */

    aiChaser(
      toPlayer,
      distance,
      dt
    ) {

      let speed =
        this.speed;


      /*
        Short acceleration burst
        near player.
      */

      if (
        distance < 180
      ) {

        speed *= 1.18;
      }


      this.steerToward(
        toPlayer.x *
        speed,
        toPlayer.y *
        speed,
        dt,
        8
      );
    }


    /* =====================================================
       GUNNER
    ===================================================== */

    aiGunner(
      game,
      player,
      toPlayer,
      distance,
      dt
    ) {

      const ideal =
        this.data
          .preferredDistance ||
        300;


      const perpendicular = {
        x:
          -toPlayer.y *
          this.strafeDirection,

        y:
          toPlayer.x *
          this.strafeDirection
      };


      let radial = 0;


      if (
        distance >
        ideal + 55
      ) {

        radial = 0.80;

      } else if (
        distance <
        ideal - 55
      ) {

        radial = -0.78;
      }


      const movement =
        U.normalize(

          toPlayer.x *
          radial +
          perpendicular.x *
          0.72,

          toPlayer.y *
          radial +
          perpendicular.y *
          0.72
        );


      this.steerToward(
        movement.x *
        this.speed,

        movement.y *
        this.speed,

        dt,
        6
      );


      if (
        this.fireCooldown <= 0 &&
        distance < 560
      ) {

        this.fireAtPlayer(
          game,
          player,
          0.07
        );


        this.fireCooldown =
          1 /
          this.data.fireRate;
      }
    }


    /* =====================================================
       STRIKER
    ===================================================== */

    aiStriker(
      game,
      player,
      toPlayer,
      distance,
      dt
    ) {

      const ideal =
        this.data
          .preferredDistance ||
        190;


      const perpendicular = {
        x:
          -toPlayer.y *
          this.strafeDirection,

        y:
          toPlayer.x *
          this.strafeDirection
      };


      let radial;


      if (
        distance >
        ideal
      ) {

        radial = 1;

      } else {

        radial = -0.35;
      }


      const movement =
        U.normalize(

          toPlayer.x *
          radial +
          perpendicular.x *
          0.55,

          toPlayer.y *
          radial +
          perpendicular.y *
          0.55
        );


      this.steerToward(
        movement.x *
        this.speed,

        movement.y *
        this.speed,

        dt,
        9
      );


      if (
        this.fireCooldown <= 0 &&
        distance < 310
      ) {

        const pellets =
          this.data.pellets || 5;


        const base =
          Math.atan2(
            player.y - this.y,
            player.x - this.x
          );


        for (
          let i = 0;
          i < pellets;
          i++
        ) {

          const angle =
            base +
            U.rand(
              -this.data.spread,
              this.data.spread
            );


          this.spawnShot(
            game,
            angle,
            this.data
              .projectileSpeed,

            this.damage,

            4.2,

            '#ff9d5f'
          );
        }


        this.fireCooldown =
          1 /
          this.data.fireRate;
      }
    }


    /* =====================================================
       SNIPER
    ===================================================== */

    aiSniper(
      game,
      player,
      toPlayer,
      distance,
      dt
    ) {

      const ideal =
        this.data
          .preferredDistance ||
        520;


      let radial = 0;


      if (
        distance <
        ideal - 70
      ) {

        radial = -1;

      } else if (
        distance >
        ideal + 110
      ) {

        radial = 0.55;
      }


      const perpendicular = {
        x:
          -toPlayer.y *
          this.strafeDirection,

        y:
          toPlayer.x *
          this.strafeDirection
      };


      const movement =
        U.normalize(

          toPlayer.x *
          radial +
          perpendicular.x *
          0.22,

          toPlayer.y *
          radial +
          perpendicular.y *
          0.22
        );


      const moveSpeed =
        this.sniperCharging
          ? this.speed * 0.18
          : this.speed;


      this.steerToward(
        movement.x *
        moveSpeed,

        movement.y *
        moveSpeed,

        dt,
        5
      );


      if (
        this.fireCooldown > 0
      ) {

        this.sniperCharging =
          false;

        this.sniperCharge = 0;

        return;
      }


      if (
        distance < 760
      ) {

        this.sniperCharging =
          true;

        this.sniperCharge +=
          dt;


        if (
          this.sniperCharge >=
          (
            this.data.aimTime ||
            0.85
          )
        ) {

          /*
            Predict movement.
          */

          const travel =
            distance /
            this.data
              .projectileSpeed;


          const targetX =
            player.x +
            player.vx *
            travel *
            0.62;

          const targetY =
            player.y +
            player.vy *
            travel *
            0.62;


          const angle =
            Math.atan2(
              targetY -
              this.y,

              targetX -
              this.x
            );


          this.spawnShot(
            game,
            angle,
            this.data
              .projectileSpeed,

            this.damage,

            4.5,

            '#df66ff'
          );


          this.fireCooldown =
            1 /
            this.data.fireRate;


          this.sniperCharge = 0;

          this.sniperCharging =
            false;
        }
      }
    }


    /* =====================================================
       DRONE
    ===================================================== */

    aiDrone(
      game,
      player,
      toPlayer,
      distance,
      dt
    ) {

      this.orbitOffset +=
        dt *
        this.strafeDirection *
        1.65;


      const orbitRadius =
        this.data
          .preferredDistance ||
        230;


      const targetX =
        player.x +
        Math.cos(
          this.orbitOffset
        ) *
        orbitRadius;


      const targetY =
        player.y +
        Math.sin(
          this.orbitOffset
        ) *
        orbitRadius;


      const target =
        U.normalize(
          targetX -
          this.x,

          targetY -
          this.y
        );


      this.steerToward(
        target.x *
        this.speed,

        target.y *
        this.speed,

        dt,
        8
      );


      if (
        this.fireCooldown <= 0 &&
        distance < 460
      ) {

        this.fireAtPlayer(
          game,
          player,
          0.11
        );


        this.fireCooldown =
          1 /
          this.data.fireRate;
      }
    }


    /* =====================================================
       HEAVY
    ===================================================== */

    aiHeavy(
      game,
      player,
      toPlayer,
      distance,
      dt
    ) {

      const ideal =
        this.data
          .preferredDistance ||
        245;


      let radial = 0;


      if (
        distance >
        ideal + 45
      ) {

        radial = 1;

      } else if (
        distance <
        ideal - 50
      ) {

        radial = -0.38;
      }


      const perpendicular = {
        x:
          -toPlayer.y *
          this.strafeDirection,

        y:
          toPlayer.x *
          this.strafeDirection
      };


      const movement =
        U.normalize(

          toPlayer.x *
          radial +
          perpendicular.x *
          0.24,

          toPlayer.y *
          radial +
          perpendicular.y *
          0.24
        );


      this.steerToward(
        movement.x *
        this.speed,

        movement.y *
        this.speed,

        dt,
        3.4
      );


      if (
        this.fireCooldown <= 0 &&
        distance < 500
      ) {

        const base =
          Math.atan2(
            player.y -
            this.y,

            player.x -
            this.x
          );


        for (
          let i = -1;
          i <= 1;
          i++
        ) {

          this.spawnShot(
            game,
            base +
            i * 0.10,

            this.data
              .projectileSpeed,

            this.damage,

            this.data
              .projectileRadius ||
            7,

            '#ff456c'
          );
        }


        this.fireCooldown =
          1 /
          this.data.fireRate;
      }
    }


    /* =====================================================
       STEERING
    ===================================================== */

    steerToward(
      targetVX,
      targetVY,
      dt,
      response = 6
    ) {

      const amount =
        Math.min(
          1,
          response *
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
    }


    /* =====================================================
       SEPARATION
    ===================================================== */

    applySeparation(
      game,
      dt
    ) {

      if (!game.enemies) {
        return;
      }


      let pushX = 0;
      let pushY = 0;


      for (
        const other of
        game.enemies
      ) {

        if (
          other === this ||
          other.dead
        ) {
          continue;
        }


        const dx =
          this.x -
          other.x;

        const dy =
          this.y -
          other.y;


        const distance =
          Math.hypot(
            dx,
            dy
          );


        const desired =
          this.radius +
          other.radius +
          8;


        if (
          distance > 0 &&
          distance < desired
        ) {

          const strength =
            1 -
            distance /
            desired;


          pushX +=
            dx /
            distance *
            strength;

          pushY +=
            dy /
            distance *
            strength;
        }
      }


      this.vx +=
        pushX *
        180 *
        dt;

      this.vy +=
        pushY *
        180 *
        dt;
    }


    /* =====================================================
       KNOCKBACK
    ===================================================== */

    applyKnockback(dt) {

      this.x +=
        this.knockbackVX *
        dt;

      this.y +=
        this.knockbackVY *
        dt;


      const damping =
        Math.exp(
          -8 * dt
        );


      this.knockbackVX *=
        damping;

      this.knockbackVY *=
        damping;
    }


    /* =====================================================
       SHOOTING
    ===================================================== */

    fireAtPlayer(
      game,
      player,
      spread = 0
    ) {

      /*
        Slight prediction makes ranged
        enemies less trivial.
      */

      const dx =
        player.x -
        this.x;

      const dy =
        player.y -
        this.y;


      const distance =
        Math.hypot(
          dx,
          dy
        );


      const speed =
        this.data
          .projectileSpeed ||
        450;


      const travel =
        distance / speed;


      const prediction =
        this.type === 'drone'
          ? 0.42
          : 0.58;


      const targetX =
        player.x +
        player.vx *
        travel *
        prediction;


      const targetY =
        player.y +
        player.vy *
        travel *
        prediction;


      const angle =
        Math.atan2(
          targetY -
          this.y,

          targetX -
          this.x
        ) +
        U.rand(
          -spread,
          spread
        );


      this.spawnShot(
        game,
        angle,
        speed,
        this.damage,
        this.data
          .projectileRadius ||
        4,
        this.color
      );
    }


    spawnShot(
      game,
      angle,
      speed,
      damage,
      radius,
      color
    ) {

      const nx =
        Math.cos(angle);

      const ny =
        Math.sin(angle);


      const muzzle =
        this.radius +
        8;


      game.enemyProjectiles.push(
        new EnemyProjectile({

          x:
            this.x +
            nx *
            muzzle,

          y:
            this.y +
            ny *
            muzzle,

          vx:
            nx *
            speed,

          vy:
            ny *
            speed,

          radius,

          damage,

          color,

          life: 3.2
        })
      );


      if (
        NS.Effects
      ) {

        NS.Effects.muzzleFlash(
          this.x +
          nx *
          muzzle,

          this.y +
          ny *
          muzzle,

          color,

          10
        );
      }
    }


    /* =====================================================
       PLAYER CONTACT
    ===================================================== */

    checkPlayerContact(game) {

      const player =
        game.player;


      if (
        !player ||
        player.dead
      ) {
        return;
      }


      const radius =
        this.radius +
        player.radius;


      const dx =
        player.x -
        this.x;

      const dy =
        player.y -
        this.y;


      const distance =
        Math.hypot(
          dx,
          dy
        );


      if (
        distance >= radius
      ) {
        return;
      }


      const normal =
        U.normalize(
          dx,
          dy
        );


      /*
        Physically separate entities.
      */

      const overlap =
        radius -
        distance;


      if (
        distance > 0
      ) {

        player.x +=
          normal.x *
          overlap *
          0.55;

        player.y +=
          normal.y *
          overlap *
          0.55;

        this.x -=
          normal.x *
          overlap *
          0.45;

        this.y -=
          normal.y *
          overlap *
          0.45;
      }


      if (
        this.contactCooldown <= 0
      ) {

        player.takeDamage(
          this.damage,
          {
            enemy: this
          }
        );


        this.contactCooldown =
          this.data
            .contactCooldown ||
          0.8;


        this.knockbackVX -=
          normal.x *
          80;

        this.knockbackVY -=
          normal.y *
          80;
      }
    }


    /* =====================================================
       BOUNDS
    ===================================================== */

    keepInArena(game) {

      /*
        Newly spawned enemies can enter from
        slightly outside the visible arena.
      */

      const margin =
        this.spawnTime < 1
          ? 55
          : 10;


      this.x =
        U.clamp(
          this.x,
          -margin,
          game.width + margin
        );


      this.y =
        U.clamp(
          this.y,
          -margin,
          game.height + margin
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
        amount <= 0
      ) {
        return 0;
      }


      const before =
        this.health;


      this.health -=
        amount;


      this.health =
        Math.max(
          0,
          this.health
        );


      const actual =
        before -
        this.health;


      this.hitFlash =
        0.08;


      if (
        info.projectile
      ) {

        const projectile =
          info.projectile;


        const speed =
          Math.hypot(
            projectile.vx,
            projectile.vy
          );


        if (
          speed > 0
        ) {

          this.knockbackVX +=
            projectile.vx /
            speed *
            (
              info.knockback ||
              0
            );

          this.knockbackVY +=
            projectile.vy /
            speed *
            (
              info.knockback ||
              0
            );
        }
      }


      if (
        NS.Effects
      ) {

        NS.Effects.damageNumber(
          this.x,
          this.y,
          actual,
          !!info.critical
        );
      }


      if (
        info.source &&
        typeof
        info.source
          .onDamageDealt ===
        'function'
      ) {

        info.source
          .onDamageDealt(
            actual
          );
      }


      if (
        this.health <= 0
      ) {

        this.die(
          info
        );
      }


      return actual;
    }


    /* =====================================================
       DEATH
    ===================================================== */

    die(info = {}) {

      if (this.dead) {
        return;
      }


      this.dead = true;


      const heavy =
        this.type ===
        'heavy';


      if (
        NS.Effects
      ) {

        NS.Effects.enemyDeath(
          this.x,
          this.y,
          this.color,
          heavy
        );
      }


      if (
        NS.Audio
      ) {

        NS.Audio.explosion(
          heavy
            ? 0.78
            : 0.48
        );
      }


      if (
        this.game &&
        this.game.addShake
      ) {

        this.game.addShake(
          heavy
            ? 6
            : 2.5
        );
      }


      if (
        this.game &&
        typeof
        this.game.enemyKilled ===
        'function'
      ) {

        this.game.enemyKilled(
          this,
          info
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


      /* ==========================
         SHADOW
      ========================== */

      ctx.save();

      ctx.translate(
        4,
        7
      );

      ctx.scale(
        1,
        0.55
      );

      ctx.filter =
        'blur(5px)';

      ctx.fillStyle =
        'rgba(0,0,0,.48)';

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius + 4,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.restore();


      ctx.rotate(
        this.angle
      );


      let color =
        this.hitFlash > 0
          ? '#ffffff'
          : this.color;


      /*
        Main enemy body.
      */

      const gradient =
        ctx.createLinearGradient(
          -this.radius,
          -this.radius,
          this.radius,
          this.radius
        );


      gradient.addColorStop(
        0,
        this.hitFlash > 0
          ? '#ffffff'
          : '#ff9aaa'
      );

      gradient.addColorStop(
        0.28,
        color
      );

      gradient.addColorStop(
        1,
        '#3b1020'
      );


      ctx.shadowColor =
        color;

      ctx.shadowBlur =
        this.hitFlash > 0
          ? 22
          : 10;


      ctx.fillStyle =
        gradient;


      switch (
        this.type
      ) {

        case 'drone':

          this.drawDroneBody(
            ctx
          );

          break;


        case 'heavy':

          this.drawHeavyBody(
            ctx
          );

          break;


        case 'sniper':

          this.drawSniperBody(
            ctx
          );

          break;


        default:

          this.drawStandardBody(
            ctx
          );

          break;
      }


      ctx.shadowBlur = 0;


      /*
        Direction / gun.
      */

      if (
        this.type !==
        'chaser'
      ) {

        ctx.fillStyle =
          '#12070d';

        ctx.beginPath();

        ctx.roundRect(
          4,
          -3,
          this.radius + 12,
          6,
          2
        );

        ctx.fill();


        ctx.fillStyle =
          color;

        ctx.fillRect(
          this.radius * 0.5,
          -1.5,
          this.radius + 8,
          3
        );
      }


      /*
        Core.
      */

      ctx.fillStyle =
        '#ffe8ee';

      ctx.shadowColor =
        color;

      ctx.shadowBlur = 8;

      ctx.beginPath();

      ctx.arc(
        2,
        0,
        this.type ===
        'heavy'
          ? 5
          : 3.5,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.restore();


      this.drawHealthBar(
        ctx
      );


      if (
        this.type ===
        'sniper' &&
        this.sniperCharging
      ) {

        this.drawSniperLaser(
          ctx
        );
      }
    }


    drawStandardBody(ctx) {

      ctx.beginPath();

      ctx.moveTo(
        this.radius,
        0
      );

      ctx.lineTo(
        this.radius * 0.38,
        this.radius * 0.82
      );

      ctx.lineTo(
        -this.radius * 0.75,
        this.radius * 0.62
      );

      ctx.lineTo(
        -this.radius,
        0
      );

      ctx.lineTo(
        -this.radius * 0.75,
        -this.radius * 0.62
      );

      ctx.lineTo(
        this.radius * 0.38,
        -this.radius * 0.82
      );

      ctx.closePath();

      ctx.fill();

      ctx.strokeStyle =
        'rgba(255,255,255,.20)';

      ctx.lineWidth = 1;

      ctx.stroke();
    }


    drawDroneBody(ctx) {

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.strokeStyle =
        'rgba(255,255,255,.20)';

      ctx.stroke();


      ctx.fillStyle =
        '#07121d';


      ctx.fillRect(
        -this.radius - 6,
        -3,
        this.radius * 2 + 12,
        6
      );
    }


    drawHeavyBody(ctx) {

      ctx.beginPath();

      ctx.roundRect(
        -this.radius,
        -this.radius * 0.78,
        this.radius * 2,
        this.radius * 1.56,
        7
      );

      ctx.fill();


      ctx.strokeStyle =
        'rgba(255,255,255,.20)';

      ctx.lineWidth = 2;

      ctx.stroke();


      ctx.fillStyle =
        'rgba(10,4,8,.65)';


      ctx.fillRect(
        -this.radius * 0.75,
        -this.radius * 0.96,
        this.radius * 1.5,
        5
      );


      ctx.fillRect(
        -this.radius * 0.75,
        this.radius * 0.76,
        this.radius * 1.5,
        5
      );
    }


    drawSniperBody(ctx) {

      ctx.beginPath();

      ctx.moveTo(
        this.radius + 4,
        0
      );

      ctx.lineTo(
        0,
        this.radius
      );

      ctx.lineTo(
        -this.radius,
        0
      );

      ctx.lineTo(
        0,
        -this.radius
      );

      ctx.closePath();

      ctx.fill();


      ctx.strokeStyle =
        'rgba(255,255,255,.22)';

      ctx.stroke();
    }


    drawSniperLaser(ctx) {

      const player =
        this.game.player;


      if (
        !player ||
        player.dead
      ) {
        return;
      }


      const chargeRatio =
        U.clamp(
          this.sniperCharge /
          (
            this.data.aimTime ||
            0.85
          ),
          0,
          1
        );


      ctx.save();

      ctx.globalCompositeOperation =
        'lighter';

      ctx.strokeStyle =
        `rgba(223,102,255,${
          0.12 +
          chargeRatio *
          0.55
        })`;

      ctx.lineWidth =
        1 +
        chargeRatio * 1.5;

      ctx.shadowColor =
        '#df66ff';

      ctx.shadowBlur =
        8;


      ctx.beginPath();

      ctx.moveTo(
        this.x,
        this.y
      );

      ctx.lineTo(
        player.x,
        player.y
      );

      ctx.stroke();


      ctx.restore();
    }


    drawHealthBar(ctx) {

      if (
        this.health >=
        this.maxHealth
      ) {
        return;
      }


      const ratio =
        U.clamp(
          this.health /
          this.maxHealth,
          0,
          1
        );


      const width =
        this.type ===
        'heavy'
          ? 48
          : 34;


      const height = 3;


      const x =
        this.x -
        width * 0.5;


      const y =
        this.y -
        this.radius -
        10;


      ctx.save();


      ctx.fillStyle =
        'rgba(0,0,0,.55)';

      ctx.fillRect(
        x,
        y,
        width,
        height
      );


      ctx.fillStyle =
        this.color;

      ctx.fillRect(
        x,
        y,
        width * ratio,
        height
      );


      ctx.restore();
    }

  }


  /* =========================================================
     BOSS
  ========================================================= */

  class Boss {

    constructor(
      game,
      x,
      y,
      wave = 5
    ) {

      this.game = game;

      this.data =
        C.bosses.overseer;

      this.type =
        'boss';

      this.isBoss = true;

      this.x = x;
      this.y = y;

      this.vx = 0;
      this.vy = 0;

      this.radius =
        this.data.radius;

      this.wave = wave;


      const cycle =
        Math.max(
          0,
          Math.floor(
            wave /
            C.game.bossEvery
          ) -
          1
        );


      this.maxHealth =
        this.data.health *
        (
          1 +
          cycle *
          0.42
        );


      this.health =
        this.maxHealth;


      this.dead = false;

      this.angle = 0;

      this.rotation = 0;

      this.fireCooldown = 1;

      this.attackTimer = 0;

      this.attackMode = 0;

      this.modeTimer = 3;

      this.contactCooldown = 0;

      this.hitFlash = 0;

      this.phase = 0;

      this.color =
        this.data.color;

      this.score =
        this.data.score *
        (
          1 +
          cycle *
          0.25
        );

      this.xp =
        this.data.xp *
        (
          1 +
          cycle *
          0.2
        );

      this.knockbackVX = 0;
      this.knockbackVY = 0;

      this.spawnTime = 0;
    }


    update(game, dt) {

      if (this.dead) {
        return;
      }


      this.spawnTime += dt;

      this.rotation +=
        dt *
        (
          0.7 +
          this.phase *
          0.28
        );


      if (
        this.hitFlash > 0
      ) {

        this.hitFlash -= dt;
      }


      if (
        this.fireCooldown > 0
      ) {

        this.fireCooldown -= dt;
      }


      if (
        this.contactCooldown > 0
      ) {

        this.contactCooldown -= dt;
      }


      this.modeTimer -= dt;


      const player =
        game.player;


      if (
        !player ||
        player.dead
      ) {
        return;
      }


      this.updatePhase();


      if (
        this.modeTimer <= 0
      ) {

        this.modeTimer =
          U.rand(
            2.4,
            4
          );

        this.attackMode =
          (
            this.attackMode + 1
          ) % 3;
      }


      const dx =
        player.x -
        this.x;

      const dy =
        player.y -
        this.y;


      const distance =
        Math.hypot(
          dx,
          dy
        ) || 1;


      const toPlayer = {
        x: dx / distance,
        y: dy / distance
      };


      this.angle =
        Math.atan2(
          dy,
          dx
        );


      this.updateMovement(
        toPlayer,
        distance,
        dt
      );


      this.updateAttacks(
        game,
        player,
        distance,
        dt
      );


      this.x +=
        this.vx * dt;

      this.y +=
        this.vy * dt;


      this.x +=
        this.knockbackVX *
        dt;

      this.y +=
        this.knockbackVY *
        dt;


      const damping =
        Math.exp(
          -10 * dt
        );


      this.knockbackVX *=
        damping;

      this.knockbackVY *=
        damping;


      const padding =
        C.game.worldPadding +
        this.radius;


      this.x =
        U.clamp(
          this.x,
          padding,
          game.width -
          padding
        );


      this.y =
        U.clamp(
          this.y,
          padding,
          game.height -
          padding
        );


      this.checkPlayerContact(
        player
      );
    }


    updatePhase() {

      const ratio =
        this.health /
        this.maxHealth;


      if (
        ratio <= 0.33
      ) {

        this.phase = 2;

      } else if (
        ratio <= 0.66
      ) {

        this.phase = 1;

      } else {

        this.phase = 0;
      }
    }


    updateMovement(
      toPlayer,
      distance,
      dt
    ) {

      const preferred =
        this.phase === 2
          ? 250
          : 320;


      let radial = 0;


      if (
        distance >
        preferred + 80
      ) {

        radial = 0.8;

      } else if (
        distance <
        preferred - 70
      ) {

        radial = -0.65;
      }


      const orbit = {
        x:
          -toPlayer.y,

        y:
          toPlayer.x
      };


      const movement =
        U.normalize(

          toPlayer.x *
          radial +
          orbit.x *
          (
            this.phase === 2
              ? 0.92
              : 0.62
          ),

          toPlayer.y *
          radial +
          orbit.y *
          (
            this.phase === 2
              ? 0.92
              : 0.62
          )
        );


      const speed =
        this.data.speed *
        (
          1 +
          this.phase *
          0.16
        );


      this.vx =
        U.lerp(
          this.vx,
          movement.x * speed,
          Math.min(
            1,
            dt * 4
          )
        );


      this.vy =
        U.lerp(
          this.vy,
          movement.y * speed,
          Math.min(
            1,
            dt * 4
          )
        );
    }


    updateAttacks(
      game,
      player,
      distance,
      dt
    ) {

      if (
        this.fireCooldown > 0
      ) {
        return;
      }


      if (
        this.attackMode === 0
      ) {

        this.radialBurst(
          game
        );

      } else if (
        this.attackMode === 1
      ) {

        this.aimedBurst(
          game,
          player
        );

      } else {

        this.spiralBurst(
          game
        );
      }


      const phaseData =
        this.data.phases[
          this.phase
        ];


      this.fireCooldown =
        1 /
        phaseData.fireRate;
    }


    radialBurst(game) {

      const phaseData =
        this.data.phases[
          this.phase
        ];


      const count =
        phaseData.bullets;


      const offset =
        this.rotation;


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const angle =
          offset +
          i /
          count *
          Math.PI *
          2;


        this.spawnBossShot(
          game,
          angle,
          this.data
            .projectileSpeed *
          (
            0.90 +
            this.phase *
            0.08
          ),

          10 +
          this.phase * 3
        );
      }


      if (
        this.game.addShake
      ) {

        this.game.addShake(
          2.5 +
          this.phase
        );
      }
    }


    aimedBurst(
      game,
      player
    ) {

      const base =
        Math.atan2(
          player.y -
          this.y,

          player.x -
          this.x
        );


      const count =
        3 +
        this.phase * 2;


      const spread =
        0.12 +
        this.phase * 0.035;


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const offset =
          (
            i -
            (
              count - 1
            ) /
            2
          ) *
          spread;


        this.spawnBossShot(
          game,
          base + offset,
          this.data
            .projectileSpeed *
          1.16,

          13 +
          this.phase * 3
        );
      }
    }


    spiralBurst(game) {

      const count =
        4 +
        this.phase * 2;


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const angle =
          this.rotation *
          2.2 +
          i /
          count *
          Math.PI *
          2;


        this.spawnBossShot(
          game,
          angle,
          this.data
            .projectileSpeed *
          0.88,

          9 +
          this.phase * 2
        );
      }
    }


    spawnBossShot(
      game,
      angle,
      speed,
      damage
    ) {

      const nx =
        Math.cos(angle);

      const ny =
        Math.sin(angle);


      const muzzle =
        this.radius +
        12;


      game.enemyProjectiles.push(
        new EnemyProjectile({

          x:
            this.x +
            nx * muzzle,

          y:
            this.y +
            ny * muzzle,

          vx:
            nx * speed,

          vy:
            ny * speed,

          radius:
            5.5 +
            this.phase * 0.5,

          damage,

          color:
            this.phase === 2
              ? '#ff6ae7'
              : C.colors.boss,

          life: 4,

          boss: true
        })
      );


      if (NS.Effects) {

        NS.Effects.muzzleFlash(
          this.x +
          nx * muzzle,

          this.y +
          ny * muzzle,

          C.colors.boss,

          15
        );
      }
    }


    checkPlayerContact(
      player
    ) {

      const dx =
        player.x -
        this.x;

      const dy =
        player.y -
        this.y;


      const distance =
        Math.hypot(
          dx,
          dy
        );


      const desired =
        this.radius +
        player.radius;


      if (
        distance >= desired
      ) {
        return;
      }


      const normal =
        U.normalize(
          dx,
          dy
        );


      const overlap =
        desired -
        distance;


      player.x +=
        normal.x *
        overlap *
        0.75;

      player.y +=
        normal.y *
        overlap *
        0.75;


      if (
        this.contactCooldown <= 0
      ) {

        player.takeDamage(
          this.data
            .contactDamage,

          {
            boss: this
          }
        );


        this.contactCooldown =
          0.65;


        player.vx +=
          normal.x *
          260;

        player.vy +=
          normal.y *
          260;
      }
    }


    takeDamage(
      amount,
      info = {}
    ) {

      if (
        this.dead ||
        amount <= 0
      ) {
        return 0;
      }


      const before =
        this.health;


      this.health -=
        amount;


      this.health =
        Math.max(
          0,
          this.health
        );


      const actual =
        before -
        this.health;


      this.hitFlash =
        0.08;


      if (
        info.projectile
      ) {

        const projectile =
          info.projectile;

        const speed =
          Math.hypot(
            projectile.vx,
            projectile.vy
          );


        if (
          speed > 0
        ) {

          /*
            Boss has strong knockback
            resistance.
          */

          this.knockbackVX +=
            projectile.vx /
            speed *
            (
              info.knockback ||
              0
            ) *
            0.08;


          this.knockbackVY +=
            projectile.vy /
            speed *
            (
              info.knockback ||
              0
            ) *
            0.08;
        }
      }


      if (NS.Effects) {

        NS.Effects.damageNumber(
          this.x,
          this.y,
          actual,
          !!info.critical,
          info.critical
            ? C.colors.gold
            : '#f0d9ff'
        );
      }


      if (
        info.source &&
        typeof
        info.source
          .onDamageDealt ===
        'function'
      ) {

        info.source
          .onDamageDealt(
            actual
          );
      }


      if (
        this.health <= 0
      ) {

        this.die(
          info
        );
      }


      return actual;
    }


    die(info = {}) {

      if (this.dead) {
        return;
      }


      this.dead = true;


      if (
        NS.Effects
      ) {

        NS.Effects.bossDeath(
          this.x,
          this.y,
          this.color
        );
      }


      if (NS.Audio) {

        NS.Audio.bossExplosion();
      }


      if (
        this.game &&
        this.game.addShake
      ) {

        this.game.addShake(
          18
        );
      }


      if (
        this.game &&
        typeof
        this.game.enemyKilled ===
        'function'
      ) {

        this.game.enemyKilled(
          this,
          info
        );
      }
    }


    draw(ctx) {

      if (this.dead) {
        return;
      }


      ctx.save();

      ctx.translate(
        this.x,
        this.y
      );


      /* Shadow */

      ctx.save();

      ctx.translate(
        7,
        12
      );

      ctx.scale(
        1,
        0.5
      );

      ctx.filter =
        'blur(8px)';

      ctx.fillStyle =
        'rgba(0,0,0,.65)';

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius + 8,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.restore();


      /*
        Outer rotating armor.
      */

      ctx.rotate(
        this.rotation
      );


      ctx.strokeStyle =
        this.hitFlash > 0
          ? '#ffffff'
          : this.color;

      ctx.lineWidth = 6;

      ctx.shadowColor =
        this.color;

      ctx.shadowBlur = 20;


      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius,
        0,
        Math.PI * 2
      );

      ctx.stroke();


      for (
        let i = 0;
        i < 6;
        i++
      ) {

        const angle =
          i /
          6 *
          Math.PI *
          2;


        const x =
          Math.cos(angle) *
          this.radius;

        const y =
          Math.sin(angle) *
          this.radius;


        ctx.save();

        ctx.translate(
          x,
          y
        );

        ctx.rotate(
          angle
        );


        ctx.fillStyle =
          this.hitFlash > 0
            ? '#ffffff'
            : '#4c2068';


        ctx.beginPath();

        ctx.roundRect(
          -9,
          -7,
          18,
          14,
          3
        );

        ctx.fill();


        ctx.restore();
      }


      ctx.rotate(
        -this.rotation
      );


      /*
        Core body.
      */

      const gradient =
        ctx.createRadialGradient(
          -12,
          -15,
          3,
          0,
          0,
          this.radius
        );


      gradient.addColorStop(
        0,
        '#f1c9ff'
      );

      gradient.addColorStop(
        0.2,
        this.hitFlash > 0
          ? '#ffffff'
          : '#c469ff'
      );

      gradient.addColorStop(
        0.62,
        '#742ea2'
      );

      gradient.addColorStop(
        1,
        '#25102f'
      );


      ctx.fillStyle =
        gradient;

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        this.radius * 0.72,
        0,
        Math.PI * 2
      );

      ctx.fill();


      /*
        Boss eye.
      */

      ctx.rotate(
        this.angle
      );


      ctx.fillStyle =
        '#12051a';

      ctx.beginPath();

      ctx.roundRect(
        3,
        -6,
        37,
        12,
        5
      );

      ctx.fill();


      ctx.fillStyle =
        '#ffffff';

      ctx.shadowColor =
        '#ff70ef';

      ctx.shadowBlur = 16;


      ctx.beginPath();

      ctx.arc(
        10,
        0,
        6,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.restore();
    }

  }


  /* =========================================================
     FACTORY
  ========================================================= */

  NS.EnemyFactory = {

    getAvailableTypes(wave) {

      return Object
        .values(
          C.enemies
        )
        .filter(
          enemy =>
            enemy.unlockWave <=
            wave
        )
        .map(
          enemy =>
            enemy.id
        );
    },


    chooseType(wave) {

      const types =
        this.getAvailableTypes(
          wave
        );


      const weighted = [];


      for (
        const type of types
      ) {

        let weight = 10;


        switch (type) {

          case 'chaser':
            weight = 30;
            break;

          case 'gunner':
            weight = 24;
            break;

          case 'striker':
            weight = 18;
            break;

          case 'sniper':
            weight = 13;
            break;

          case 'drone':
            weight = 16;
            break;

          case 'heavy':
            weight = 8;
            break;
        }


        /*
          Later waves gradually reduce
          basic chaser dominance.
        */

        if (
          type === 'chaser'
        ) {

          weight *=
            Math.max(
              0.4,
              1 -
              wave *
              0.035
            );
        }


        weighted.push({
          value: type,
          weight
        });
      }


      return U.weightedChoice(
        weighted
      );
    },


    create(
      game,
      type,
      x,
      y,
      wave
    ) {

      return new Enemy(
        game,
        type,
        x,
        y,
        wave
      );
    },


    createRandom(
      game,
      wave
    ) {

      const type =
        this.chooseType(
          wave
        );


      const position =
        U.randomEdgePosition(
          game.width,
          game.height,
          45
        );


      return new Enemy(
        game,
        type,
        position.x,
        position.y,
        wave
      );
    },


    createBoss(
      game,
      wave
    ) {

      const position = {
        x:
          game.width *
          0.5,

        y:
          -60
      };


      return new Boss(
        game,
        position.x,
        position.y,
        wave
      );
    }

  };


  /* =========================================================
     EXPORTS
  ========================================================= */

  NS.EnemyProjectile =
    EnemyProjectile;

  NS.Enemy =
    Enemy;

  NS.Boss =
    Boss;


  console.log(
    'NEON SIEGE: enemy AI loaded'
  );

})();

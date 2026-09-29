(() => {
  'use strict';

  const NS = window.NS;

  /* =========================================================
     PLAYER PROJECTILE
  ========================================================= */

  class Projectile {

    constructor(options = {}) {

      this.x = options.x || 0;
      this.y = options.y || 0;

      this.prevX = this.x;
      this.prevY = this.y;

      this.vx = options.vx || 0;
      this.vy = options.vy || 0;

      this.radius =
        options.radius || 3;

      this.damage =
        options.damage || 1;

      this.life =
        options.life || 1;

      this.maxLife =
        this.life;

      this.color =
        options.color || '#ffffff';

      this.trailColor =
        options.trailColor ||
        this.color;

      this.weaponId =
        options.weaponId ||
        'pistol';

      this.owner =
        options.owner || null;

      this.critical =
        !!options.critical;

      this.dead = false;

      this.piercing =
        options.piercing || 0;

      this.remainingPierces =
        this.piercing;

      this.knockback =
        options.knockback || 0;

      this.explosive =
        !!options.explosive;

      this.explosionRadius =
        options.explosionRadius || 0;

      this.explosionDamage =
        options.explosionDamage || 0;

      this.splashRadius =
        options.splashRadius || 0;

      this.splashDamage =
        options.splashDamage || 0;

      this.hitEnemies =
        new Set();

      this.rotation =
        Math.atan2(
          this.vy,
          this.vx
        );
    }


    update(game, dt) {

      if (this.dead) {
        return;
      }

      this.prevX =
        this.x;

      this.prevY =
        this.y;


      this.x +=
        this.vx * dt;

      this.y +=
        this.vy * dt;


      this.life -= dt;


      if (
        NS.Effects &&
        NS.Effects.projectileTrail
      ) {

        NS.Effects.projectileTrail(
          this
        );
      }


      this.checkEnemyHits(
        game
      );


      if (this.dead) {
        return;
      }


      const margin = 100;

      if (
        this.life <= 0 ||
        this.x < -margin ||
        this.y < -margin ||
        this.x > game.width + margin ||
        this.y > game.height + margin
      ) {

        if (
          this.explosive &&
          this.life <= 0
        ) {

          this.explode(
            game
          );
        }

        this.dead = true;
      }
    }


    checkEnemyHits(game) {

      if (
        !game.enemies ||
        game.enemies.length === 0
      ) {
        return;
      }


      for (
        const enemy of game.enemies
      ) {

        if (
          !enemy ||
          enemy.dead ||
          this.hitEnemies.has(enemy)
        ) {
          continue;
        }


        const radius =
          this.radius +
          enemy.radius;


        const distanceSq =
          NS.Util.distanceSq(
            this.x,
            this.y,
            enemy.x,
            enemy.y
          );


        if (
          distanceSq >
          radius * radius
        ) {
          continue;
        }


        this.hitEnemies.add(
          enemy
        );


        this.hitEnemy(
          game,
          enemy
        );


        if (this.dead) {
          break;
        }
      }
    }


    hitEnemy(
      game,
      enemy
    ) {

      let damage =
        this.damage;


      if (
        typeof enemy.takeDamage ===
        'function'
      ) {

        enemy.takeDamage(
          damage,
          {
            game,
            source: this.owner,
            projectile: this,
            critical:
              this.critical,
            knockback:
              this.knockback,
            hitX:
              this.x,
            hitY:
              this.y
          }
        );

      } else {

        enemy.health -=
          damage;
      }


      if (
        NS.Audio
      ) {

        if (
          this.critical
        ) {

          NS.Audio.criticalHit();

        } else {

          NS.Audio.hit();
        }
      }


      if (
        NS.Effects &&
        NS.Effects.bulletImpact
      ) {

        NS.Effects.bulletImpact(
          this.x,
          this.y,
          this.color,
          this.critical
        );
      }


      /*
        Plasma small splash
      */

      if (
        this.splashRadius > 0
      ) {

        this.applySplash(
          game,
          enemy
        );
      }


      /*
        Rocket explodes immediately
        when it touches an enemy.
      */

      if (
        this.explosive
      ) {

        this.explode(
          game
        );

        this.dead = true;

        return;
      }


      /*
        Railgun can pierce several
        different targets.
      */

      if (
        this.remainingPierces > 0
      ) {

        this.remainingPierces--;

        return;
      }


      this.dead = true;
    }


    applySplash(
      game,
      directEnemy = null
    ) {

      for (
        const enemy of game.enemies
      ) {

        if (
          !enemy ||
          enemy.dead ||
          enemy === directEnemy
        ) {
          continue;
        }


        const distance =
          NS.Util.distance(
            this.x,
            this.y,
            enemy.x,
            enemy.y
          );


        if (
          distance >
          this.splashRadius
        ) {
          continue;
        }


        const falloff =
          1 -
          distance /
          this.splashRadius;


        const damage =
          Math.max(
            1,
            this.splashDamage *
            falloff
          );


        if (
          typeof enemy.takeDamage ===
          'function'
        ) {

          enemy.takeDamage(
            damage,
            {
              game,
              source:
                this.owner,
              projectile:
                this,
              splash:
                true,
              knockback:
                this.knockback *
                0.25,
              hitX:
                enemy.x,
              hitY:
                enemy.y
            }
          );
        }
      }
    }


    explode(game) {

      if (
        !this.explosive
      ) {
        return;
      }


      if (
        NS.Audio
      ) {

        NS.Audio.explosion(
          0.9
        );
      }


      if (
        NS.Effects &&
        NS.Effects.explosion
      ) {

        NS.Effects.explosion(
          this.x,
          this.y,
          this.color,
          1
        );
      }


      if (
        game.addShake
      ) {

        game.addShake(
          8
        );
      }


      const radius =
        this.explosionRadius;


      for (
        const enemy of game.enemies
      ) {

        if (
          !enemy ||
          enemy.dead
        ) {
          continue;
        }


        const distance =
          NS.Util.distance(
            this.x,
            this.y,
            enemy.x,
            enemy.y
          );


        if (
          distance >
          radius +
          enemy.radius
        ) {
          continue;
        }


        const falloff =
          NS.Util.clamp(
            1 -
            distance /
            radius,
            0.28,
            1
          );


        const damage =
          this.explosionDamage *
          falloff;


        if (
          typeof enemy.takeDamage ===
          'function'
        ) {

          enemy.takeDamage(
            damage,
            {
              game,
              source:
                this.owner,
              projectile:
                this,
              explosion:
                true,
              knockback:
                this.knockback *
                falloff,
              hitX:
                enemy.x,
              hitY:
                enemy.y
            }
          );
        }
      }
    }


    draw(ctx) {

      if (this.dead) {
        return;
      }


      ctx.save();

      ctx.globalCompositeOperation =
        'lighter';


      /*
        Trail
      */

      const trailLength =
        this.weaponId ===
        'railgun'
          ? 48
          : 18;


      const speed =
        Math.hypot(
          this.vx,
          this.vy
        ) || 1;


      const nx =
        this.vx /
        speed;

      const ny =
        this.vy /
        speed;


      const gradient =
        ctx.createLinearGradient(
          this.x,
          this.y,
          this.x -
          nx *
          trailLength,
          this.y -
          ny *
          trailLength
        );


      gradient.addColorStop(
        0,
        this.trailColor
      );

      gradient.addColorStop(
        1,
        'rgba(0,0,0,0)'
      );


      ctx.strokeStyle =
        gradient;

      ctx.lineWidth =
        this.weaponId ===
        'railgun'
          ? 4
          : Math.max(
              2,
              this.radius *
              0.9
            );


      ctx.shadowColor =
        this.color;

      ctx.shadowBlur =
        this.weaponId ===
        'railgun'
          ? 24
          : 14;


      ctx.beginPath();

      ctx.moveTo(
        this.x -
        nx *
        trailLength,
        this.y -
        ny *
        trailLength
      );

      ctx.lineTo(
        this.x,
        this.y
      );

      ctx.stroke();


      /*
        Projectile core
      */

      ctx.fillStyle =
        '#ffffff';

      ctx.beginPath();

      ctx.arc(
        this.x,
        this.y,
        this.radius *
        0.55,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.fillStyle =
        this.color;

      ctx.globalAlpha =
        0.7;

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
     WEAPON SYSTEM
  ========================================================= */

  class WeaponSystem {

    constructor() {

      this.definitions =
        NS.Config.weapons;

      this.order = [
        'pistol',
        'smg',
        'shotgun',
        'plasma',
        'railgun',
        'rocket'
      ];
    }


    createLoadout() {

      const ammo = {};

      for (
        const id of this.order
      ) {

        const weapon =
          this.definitions[id];

        ammo[id] = {

          magazine:
            weapon.magazine,

          reserve:
            weapon.reserveAmmo
        };
      }


      return {

        current:
          'pistol',

        unlocked: [
          'pistol'
        ],

        ammo,

        cooldown: 0,

        reloading: false,

        reloadTimer: 0,

        reloadDuration: 0,

        triggerWasDown: false,

        shotsFired: 0,

        shotsHit: 0
      };
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
      player,
      dt
    ) {

      const state =
        player.weaponState;

      if (!state) {
        return;
      }


      if (
        state.cooldown > 0
      ) {

        state.cooldown -= dt;
      }


      if (
        state.reloading
      ) {

        state.reloadTimer -= dt;


        if (
          state.reloadTimer <= 0
        ) {

          this.finishReload(
            player
          );
        }
      }
    }


    /* =====================================================
       UNLOCK
    ===================================================== */

    unlockForWave(
      player,
      wave
    ) {

      const state =
        player.weaponState;

      if (!state) {
        return [];
      }


      const unlockedNow =
        [];


      for (
        const id of this.order
      ) {

        const weapon =
          this.definitions[id];


        if (
          weapon.unlockWave <= wave &&
          !state.unlocked.includes(id)
        ) {

          state.unlocked.push(
            id
          );

          unlockedNow.push(
            id
          );
        }
      }


      return unlockedNow;
    }


    /* =====================================================
       CURRENT WEAPON
    ===================================================== */

    getCurrentDefinition(
      player
    ) {

      if (
        !player ||
        !player.weaponState
      ) {

        return null;
      }


      return this.definitions[
        player.weaponState.current
      ];
    }


    getCurrentAmmo(
      player
    ) {

      const state =
        player.weaponState;

      if (!state) {
        return null;
      }


      return state.ammo[
        state.current
      ];
    }


    /* =====================================================
       SWITCH
    ===================================================== */

    cycle(player) {

      const state =
        player.weaponState;

      if (
        !state ||
        state.unlocked.length <= 1
      ) {
        return;
      }


      const currentIndex =
        state.unlocked.indexOf(
          state.current
        );


      const nextIndex =
        (
          currentIndex + 1
        ) %
        state.unlocked.length;


      state.current =
        state.unlocked[
          nextIndex
        ];


      state.reloading =
        false;

      state.reloadTimer =
        0;


      if (NS.Audio) {

        NS.Audio.weaponSwitch();
      }


      if (
        NS.Game &&
        NS.Game.notify
      ) {

        NS.Game.notify(
          this.definitions[
            state.current
          ].name
        );
      }
    }


    /* =====================================================
       RELOAD
    ===================================================== */

    startReload(player) {

      const state =
        player.weaponState;

      if (
        !state ||
        state.reloading
      ) {
        return false;
      }


      const weapon =
        this.getCurrentDefinition(
          player
        );

      const ammo =
        this.getCurrentAmmo(
          player
        );


      if (
        !weapon ||
        !ammo
      ) {
        return false;
      }


      if (
        ammo.magazine >=
        weapon.magazine
      ) {
        return false;
      }


      if (
        ammo.reserve <= 0
      ) {
        return false;
      }


      state.reloading =
        true;

      state.reloadDuration =
        weapon.reloadTime;

      state.reloadTimer =
        weapon.reloadTime;


      if (NS.Audio) {

        NS.Audio.reload();
      }


      return true;
    }


    finishReload(player) {

      const state =
        player.weaponState;

      if (!state) {
        return;
      }


      const weapon =
        this.getCurrentDefinition(
          player
        );

      const ammo =
        this.getCurrentAmmo(
          player
        );


      if (
        !weapon ||
        !ammo
      ) {
        return;
      }


      const needed =
        weapon.magazine -
        ammo.magazine;


      const transferred =
        Math.min(
          needed,
          ammo.reserve
        );


      ammo.magazine +=
        transferred;

      ammo.reserve -=
        transferred;


      state.reloading =
        false;

      state.reloadTimer =
        0;


      if (NS.Audio) {

        NS.Audio.reloadComplete();
      }
    }


    cancelReload(player) {

      const state =
        player.weaponState;

      if (!state) {
        return;
      }


      state.reloading =
        false;

      state.reloadTimer =
        0;
    }


    /* =====================================================
       FIRE CONDITIONS
    ===================================================== */

    canFire(player) {

      const state =
        player.weaponState;

      if (!state) {
        return false;
      }


      if (
        state.reloading ||
        state.cooldown > 0
      ) {
        return false;
      }


      const ammo =
        this.getCurrentAmmo(
          player
        );


      return (
        ammo &&
        ammo.magazine > 0
      );
    }


    /* =====================================================
       FIRE
    ===================================================== */

    fire(
      game,
      player,
      aimX,
      aimY
    ) {

      const state =
        player.weaponState;

      if (!state) {
        return false;
      }


      const weapon =
        this.getCurrentDefinition(
          player
        );

      const ammo =
        this.getCurrentAmmo(
          player
        );


      if (
        !weapon ||
        !ammo
      ) {
        return false;
      }


      if (
        state.reloading
      ) {
        return false;
      }


      if (
        state.cooldown > 0
      ) {
        return false;
      }


      if (
        ammo.magazine <= 0
      ) {

        this.startReload(
          player
        );

        return false;
      }


      const aim =
        NS.Util.normalize(
          aimX,
          aimY
        );


      if (
        Math.hypot(
          aim.x,
          aim.y
        ) < 0.5
      ) {
        return false;
      }


      ammo.magazine--;

      state.shotsFired++;


      let fireRate =
        weapon.fireRate;


      if (
        player.overdriveTimer > 0
      ) {

        fireRate *=
          NS.Config.pickups
            .overdrive
            .fireRateMultiplier;
      }


      if (
        player.fireRateMultiplier
      ) {

        fireRate *=
          player.fireRateMultiplier;
      }


      state.cooldown =
        1 /
        Math.max(
          0.1,
          fireRate
        );


      const baseAngle =
        Math.atan2(
          aim.y,
          aim.x
        );


      const pellets =
        weapon.pellets || 1;


      for (
        let i = 0;
        i < pellets;
        i++
      ) {

        let spread =
          weapon.spread;


        if (
          player.spreadMultiplier
        ) {

          spread *=
            player.spreadMultiplier;
        }


        const angle =
          baseAngle +
          NS.Util.rand(
            -spread,
            spread
          );


        this.spawnProjectile(
          game,
          player,
          weapon,
          angle
        );
      }


      /*
        Recoil impulse
      */

      player.vx -=
        aim.x *
        weapon.recoil *
        12;

      player.vy -=
        aim.y *
        weapon.recoil *
        12;


      if (
        game.addShake
      ) {

        game.addShake(
          weapon.screenShake
        );
      }


      if (
        NS.Effects &&
        NS.Effects.muzzleFlash
      ) {

        NS.Effects.muzzleFlash(
          player.x +
          aim.x *
          (
            player.radius +
            12
          ),

          player.y +
          aim.y *
          (
            player.radius +
            12
          ),

          weapon.color,

          weapon.muzzleSize
        );
      }


      if (NS.Audio) {

        NS.Audio.shot(
          weapon.id
        );
      }


      /*
        Auto reload when the magazine
        reaches zero.
      */

      if (
        ammo.magazine <= 0 &&
        ammo.reserve > 0
      ) {

        /*
          Slight delay is naturally
          provided by cooldown.
        */
      }


      return true;
    }


    spawnProjectile(
      game,
      player,
      weapon,
      angle
    ) {

      const directionX =
        Math.cos(angle);

      const directionY =
        Math.sin(angle);


      let damage =
        weapon.damage;


      if (
        player.damageMultiplier
      ) {

        damage *=
          player.damageMultiplier;
      }


      const criticalChance =
        NS.Util.clamp(
          (
            player.criticalChance ??
            NS.Config.player
              .criticalChance
          ),
          0,
          0.85
        );


      const critical =
        Math.random() <
        criticalChance;


      if (critical) {

        damage *=
          (
            player.criticalMultiplier ??
            NS.Config.player
              .criticalMultiplier
          );
      }


      const muzzleDistance =
        player.radius +
        13;


      const speed =
        weapon.projectileSpeed;


      const projectile =
        new Projectile({

          x:
            player.x +
            directionX *
            muzzleDistance,

          y:
            player.y +
            directionY *
            muzzleDistance,

          vx:
            directionX *
            speed,

          vy:
            directionY *
            speed,

          radius:
            weapon.projectileRadius,

          damage,

          life:
            weapon.projectileLife,

          color:
            weapon.color,

          trailColor:
            weapon.trailColor,

          weaponId:
            weapon.id,

          owner:
            player,

          critical,

          piercing:
            weapon.piercing || 0,

          knockback:
            weapon.knockback || 0,

          explosive:
            weapon.explosive || false,

          explosionRadius:
            weapon.explosionRadius || 0,

          explosionDamage:
            (
              weapon.explosionDamage ||
              0
            ) *
            (
              player.damageMultiplier ||
              1
            ),

          splashRadius:
            weapon.splashRadius || 0,

          splashDamage:
            (
              weapon.splashDamage ||
              0
            ) *
            (
              player.damageMultiplier ||
              1
            )
        });


      game.projectiles.push(
        projectile
      );
    }


    /* =====================================================
       AMMO PICKUP
    ===================================================== */

    giveAmmo(
      player,
      multiplier =
        NS.Config.pickups
          .ammo
          .amount
    ) {

      const state =
        player.weaponState;

      if (!state) {
        return;
      }


      for (
        const id of
        state.unlocked
      ) {

        const weapon =
          this.definitions[id];

        const ammo =
          state.ammo[id];


        const amount =
          Math.max(
            1,
            Math.ceil(
              weapon.reserveAmmo *
              multiplier
            )
          );


        ammo.reserve +=
          amount;


        /*
          Prevent absurdly huge
          reserves after long runs.
        */

        ammo.reserve =
          Math.min(
            ammo.reserve,
            weapon.reserveAmmo * 3
          );
      }
    }


    /* =====================================================
       REFILL
    ===================================================== */

    refillAll(player) {

      const state =
        player.weaponState;

      if (!state) {
        return;
      }


      for (
        const id of this.order
      ) {

        const weapon =
          this.definitions[id];

        const ammo =
          state.ammo[id];


        ammo.magazine =
          weapon.magazine;

        ammo.reserve =
          weapon.reserveAmmo;
      }


      state.cooldown = 0;

      state.reloading = false;

      state.reloadTimer = 0;
    }


    /* =====================================================
       HUD HELPERS
    ===================================================== */

    getHudData(player) {

      const state =
        player.weaponState;

      if (!state) {

        return null;
      }


      const weapon =
        this.getCurrentDefinition(
          player
        );

      const ammo =
        this.getCurrentAmmo(
          player
        );


      let reloadProgress = 0;


      if (
        state.reloading &&
        state.reloadDuration > 0
      ) {

        reloadProgress =
          1 -
          state.reloadTimer /
          state.reloadDuration;
      }


      return {

        id:
          weapon.id,

        name:
          weapon.name,

        magazine:
          ammo.magazine,

        reserve:
          ammo.reserve,

        reloading:
          state.reloading,

        reloadProgress:
          NS.Util.clamp(
            reloadProgress,
            0,
            1
          ),

        unlocked:
          state.unlocked.slice()
      };
    }

  }


  NS.Projectile =
    Projectile;


  NS.Weapons =
    new WeaponSystem();


  console.log(
    'NEON SIEGE: weapon system loaded'
  );

})();

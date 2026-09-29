(() => {
  'use strict';

  window.NS = window.NS || {};

  const NS = window.NS;

  /* =========================================================
     GLOBAL CONFIG
  ========================================================= */

  NS.Config = {

    version: '1.0.0',

    game: {
      title: 'NEON SIEGE',

      worldPadding: 42,

      maxDelta: 0.033,

      baseWaveDelay: 2.6,

      bossEvery: 5,

      maxEnemies: 42,

      corpseTime: 0.35,

      pickupLifetime: 14,

      comboDuration: 3.2,

      hitStop: {
        normal: 0.018,
        critical: 0.045,
        boss: 0.085
      },

      camera: {
        shakeDecay: 18,
        maxShake: 18
      }
    },


    /* =======================================================
       COLORS
    ======================================================= */

    colors: {

      background: '#050711',

      grid: '#16233b',

      player: '#00e5ff',

      playerDark: '#006a7c',

      enemy: '#ff3e67',

      enemyDark: '#741b34',

      boss: '#b95cff',

      gold: '#f3c969',

      health: '#ff3e67',

      shield: '#39a8ff',

      xp: '#00e5ff',

      white: '#ffffff',

      smoke: '#536174'
    },


    /* =======================================================
       PLAYER
    ======================================================= */

    player: {

      radius: 18,

      maxHealth: 100,

      maxShield: 100,

      startingShield: 0,

      speed: 235,

      acceleration: 15,

      friction: 11,

      dashSpeed: 760,

      dashDuration: 0.15,

      dashCooldown: 1.75,

      dashInvulnerability: 0.20,

      pickupRadius: 30,

      regenerationDelay: 7,

      criticalChance: 0.05,

      criticalMultiplier: 1.8
    },


    /* =======================================================
       WEAPONS
    ======================================================= */

    weapons: {

      pistol: {

        id: 'pistol',

        name: 'PISTOL',

        unlockWave: 1,

        damage: 22,

        fireRate: 4.4,

        magazine: 12,

        reserveAmmo: 96,

        reloadTime: 1.05,

        projectileSpeed: 920,

        projectileLife: 1.3,

        projectileRadius: 3.8,

        spread: 0.018,

        pellets: 1,

        recoil: 1.8,

        knockback: 38,

        screenShake: 1.8,

        color: '#f3c969',

        trailColor: '#ffe9a8',

        muzzleSize: 15,

        automatic: false
      },


      smg: {

        id: 'smg',

        name: 'SMG',

        unlockWave: 2,

        damage: 10,

        fireRate: 11.5,

        magazine: 30,

        reserveAmmo: 180,

        reloadTime: 1.25,

        projectileSpeed: 980,

        projectileLife: 1.05,

        projectileRadius: 3,

        spread: 0.065,

        pellets: 1,

        recoil: 1.25,

        knockback: 24,

        screenShake: 0.9,

        color: '#51e7ff',

        trailColor: '#9bf4ff',

        muzzleSize: 13,

        automatic: true
      },


      shotgun: {

        id: 'shotgun',

        name: 'SHOTGUN',

        unlockWave: 3,

        damage: 13,

        fireRate: 1.55,

        magazine: 6,

        reserveAmmo: 42,

        reloadTime: 1.65,

        projectileSpeed: 760,

        projectileLife: 0.56,

        projectileRadius: 4,

        spread: 0.18,

        pellets: 8,

        recoil: 7,

        knockback: 95,

        screenShake: 5.5,

        color: '#ff9a5c',

        trailColor: '#ffd1a8',

        muzzleSize: 24,

        automatic: false
      },


      plasma: {

        id: 'plasma',

        name: 'PLASMA RIFLE',

        unlockWave: 5,

        damage: 15,

        fireRate: 7.2,

        magazine: 24,

        reserveAmmo: 144,

        reloadTime: 1.6,

        projectileSpeed: 700,

        projectileLife: 1.5,

        projectileRadius: 6,

        spread: 0.025,

        pellets: 1,

        recoil: 1.6,

        knockback: 44,

        screenShake: 1.4,

        color: '#8b66ff',

        trailColor: '#c6b1ff',

        muzzleSize: 20,

        automatic: true,

        splashRadius: 34,

        splashDamage: 6
      },


      railgun: {

        id: 'railgun',

        name: 'RAILGUN',

        unlockWave: 7,

        damage: 92,

        fireRate: 0.72,

        magazine: 4,

        reserveAmmo: 24,

        reloadTime: 2.15,

        projectileSpeed: 1900,

        projectileLife: 0.85,

        projectileRadius: 4,

        spread: 0.004,

        pellets: 1,

        recoil: 10,

        knockback: 180,

        screenShake: 7,

        color: '#ffffff',

        trailColor: '#6feaff',

        muzzleSize: 30,

        automatic: false,

        piercing: 4
      },


      rocket: {

        id: 'rocket',

        name: 'ROCKET',

        unlockWave: 10,

        damage: 60,

        fireRate: 0.8,

        magazine: 3,

        reserveAmmo: 15,

        reloadTime: 2.2,

        projectileSpeed: 470,

        projectileLife: 2.2,

        projectileRadius: 7,

        spread: 0.012,

        pellets: 1,

        recoil: 10,

        knockback: 150,

        screenShake: 8,

        color: '#ffb044',

        trailColor: '#ff6d3d',

        muzzleSize: 30,

        automatic: false,

        explosive: true,

        explosionRadius: 115,

        explosionDamage: 72
      }
    },


    /* =======================================================
       ENEMIES
    ======================================================= */

    enemies: {

      chaser: {

        id: 'chaser',

        name: 'CHASER',

        unlockWave: 1,

        radius: 16,

        health: 46,

        speed: 155,

        damage: 14,

        contactCooldown: 0.75,

        score: 100,

        xp: 18,

        color: '#ff3e67'
      },


      gunner: {

        id: 'gunner',

        name: 'GUNNER',

        unlockWave: 2,

        radius: 17,

        health: 62,

        speed: 118,

        damage: 11,

        preferredDistance: 300,

        fireRate: 1.4,

        projectileSpeed: 480,

        projectileRadius: 4,

        spread: 0.07,

        score: 150,

        xp: 24,

        color: '#ff785c'
      },


      striker: {

        id: 'striker',

        name: 'STRIKER',

        unlockWave: 3,

        radius: 15,

        health: 54,

        speed: 195,

        damage: 9,

        preferredDistance: 190,

        fireRate: 0.8,

        projectileSpeed: 430,

        pellets: 5,

        spread: 0.20,

        score: 190,

        xp: 29,

        color: '#ffb44c'
      },


      sniper: {

        id: 'sniper',

        name: 'SNIPER',

        unlockWave: 4,

        radius: 15,

        health: 45,

        speed: 92,

        damage: 34,

        preferredDistance: 520,

        fireRate: 0.55,

        projectileSpeed: 920,

        projectileRadius: 4,

        aimTime: 0.85,

        score: 240,

        xp: 34,

        color: '#df66ff'
      },


      drone: {

        id: 'drone',

        name: 'DRONE',

        unlockWave: 5,

        radius: 13,

        health: 35,

        speed: 220,

        damage: 8,

        preferredDistance: 230,

        fireRate: 2.6,

        projectileSpeed: 530,

        projectileRadius: 3,

        score: 210,

        xp: 30,

        color: '#45b9ff'
      },


      heavy: {

        id: 'heavy',

        name: 'HEAVY',

        unlockWave: 6,

        radius: 25,

        health: 230,

        speed: 72,

        damage: 18,

        preferredDistance: 245,

        fireRate: 1.1,

        projectileSpeed: 420,

        projectileRadius: 7,

        score: 420,

        xp: 52,

        color: '#d83f67'
      }
    },


    /* =======================================================
       BOSSES
    ======================================================= */

    bosses: {

      overseer: {

        id: 'overseer',

        name: 'THE OVERSEER',

        radius: 44,

        health: 1400,

        speed: 94,

        projectileSpeed: 480,

        contactDamage: 24,

        score: 3500,

        xp: 220,

        color: '#b95cff',

        phases: [
          {
            threshold: 1.0,
            fireRate: 1.2,
            bullets: 8
          },

          {
            threshold: 0.66,
            fireRate: 1.7,
            bullets: 12
          },

          {
            threshold: 0.33,
            fireRate: 2.2,
            bullets: 18
          }
        ]
      }
    },


    /* =======================================================
       PICKUPS
    ======================================================= */

    pickups: {

      health: {

        id: 'health',

        name: 'MEDKIT',

        icon: '♥',

        amount: 28,

        color: '#ff3e67'
      },


      shield: {

        id: 'shield',

        name: 'SHIELD',

        icon: '◆',

        amount: 35,

        color: '#39a8ff'
      },


      ammo: {

        id: 'ammo',

        name: 'AMMO',

        icon: '✦',

        amount: 0.30,

        color: '#f3c969'
      },


      overdrive: {

        id: 'overdrive',

        name: 'OVERDRIVE',

        icon: '⚡',

        duration: 7,

        speedMultiplier: 1.28,

        fireRateMultiplier: 1.25,

        color: '#00e5ff'
      }
    },


    /* =======================================================
       DROP CHANCES
    ======================================================= */

    drops: {

      baseChance: 0.13,

      healthWeight: 30,

      shieldWeight: 24,

      ammoWeight: 30,

      overdriveWeight: 16
    },


    /* =======================================================
       XP / LEVEL
    ======================================================= */

    leveling: {

      baseXP: 100,

      growth: 1.32,

      maxLevel: 50
    },


    /* =======================================================
       WAVE SCALING
    ======================================================= */

    waves: {

      baseEnemies: 5,

      enemyGrowth: 1.65,

      healthGrowth: 0.085,

      damageGrowth: 0.045,

      speedGrowth: 0.012,

      spawnDelayStart: 0.82,

      spawnDelayMin: 0.20,

      spawnDelayReduction: 0.035
    },


    /* =======================================================
       PARTICLES
    ======================================================= */

    effects: {

      maxParticles: 900,

      bulletTrailRate: 0.018,

      enemyDeathParticles: 26,

      heavyDeathParticles: 48,

      bossDeathParticles: 130,

      explosionParticles: 48,

      damageNumberLife: 0.65
    }
  };


  /* =========================================================
     UTILITY FUNCTIONS
  ========================================================= */

  NS.Util = {

    clamp(value, min, max) {

      return Math.max(
        min,
        Math.min(max, value)
      );
    },


    lerp(a, b, amount) {

      return a + (b - a) * amount;
    },


    rand(min, max) {

      return (
        min +
        Math.random() *
        (max - min)
      );
    },


    randInt(min, max) {

      return Math.floor(
        this.rand(
          min,
          max + 1
        )
      );
    },


    chance(probability) {

      return Math.random() < probability;
    },


    distance(ax, ay, bx, by) {

      return Math.hypot(
        bx - ax,
        by - ay
      );
    },


    distanceSq(ax, ay, bx, by) {

      const dx = bx - ax;
      const dy = by - ay;

      return (
        dx * dx +
        dy * dy
      );
    },


    normalize(x, y) {

      const length =
        Math.hypot(x, y);

      if (length < 0.0001) {

        return {
          x: 0,
          y: 0
        };
      }

      return {
        x: x / length,
        y: y / length
      };
    },


    angleTo(ax, ay, bx, by) {

      return Math.atan2(
        by - ay,
        bx - ax
      );
    },


    shortestAngle(a, b) {

      return Math.atan2(
        Math.sin(b - a),
        Math.cos(b - a)
      );
    },


    lerpAngle(a, b, amount) {

      return (
        a +
        this.shortestAngle(
          a,
          b
        ) *
        amount
      );
    },


    circleCollision(a, b) {

      const r =
        a.radius +
        b.radius;

      return (
        this.distanceSq(
          a.x,
          a.y,
          b.x,
          b.y
        ) <
        r * r
      );
    },


    pointCircle(
      x,
      y,
      circle
    ) {

      return (
        this.distanceSq(
          x,
          y,
          circle.x,
          circle.y
        ) <=
        circle.radius *
        circle.radius
      );
    },


    randomEdgePosition(
      width,
      height,
      padding = 40
    ) {

      const side =
        this.randInt(
          0,
          3
        );

      switch (side) {

        case 0:

          return {
            x: this.rand(
              padding,
              width - padding
            ),
            y: -padding
          };


        case 1:

          return {
            x:
              width +
              padding,

            y: this.rand(
              padding,
              height - padding
            )
          };


        case 2:

          return {
            x: this.rand(
              padding,
              width - padding
            ),

            y:
              height +
              padding
          };


        default:

          return {
            x: -padding,

            y: this.rand(
              padding,
              height - padding
            )
          };
      }
    },


    weightedChoice(items) {

      let total = 0;

      for (const item of items) {

        total += item.weight;
      }

      let roll =
        Math.random() *
        total;

      for (const item of items) {

        roll -= item.weight;

        if (roll <= 0) {

          return item.value;
        }
      }

      return items[
        items.length - 1
      ].value;
    },


    formatScore(score) {

      return String(
        Math.floor(score)
      ).padStart(
        6,
        '0'
      );
    }
  };


  /* =========================================================
     RUNTIME DEVICE INFO
  ========================================================= */

  NS.Device = {

    touch:
      (
        'ontouchstart' in window
      ) ||
      navigator.maxTouchPoints > 0,

    coarsePointer:
      window.matchMedia(
        '(pointer: coarse)'
      ).matches,

    mobile: false
  };


  NS.Device.mobile =
    NS.Device.touch ||
    NS.Device.coarsePointer;


  /* =========================================================
     DEBUG
  ========================================================= */

  NS.Debug = {

    enabled: false,

    showHitboxes: false,

    showEnemyAI: false,

    showFPS: false
  };


  console.log(
    '%c NEON SIEGE ',
    'background:#00e5ff;color:#020811;font-weight:bold;padding:4px 8px;border-radius:4px;',
    'Config loaded',
    NS.Config.version
  );

})();

(() => {
  'use strict';

  const NS = window.NS;
  const C = NS.Config;
  const U = NS.Util;

  class EffectsEngine {

    constructor() {
      this.particles = [];
      this.rings = [];
      this.flashes = [];
      this.damageNumbers = [];
      this.trails = [];

      this.trailClock = 0;
    }


    /* =====================================================
       GENERIC PARTICLE
    ===================================================== */

    particle(options = {}) {

      if (
        this.particles.length >=
        C.effects.maxParticles
      ) {
        this.particles.shift();
      }

      const life =
        options.life ??
        U.rand(0.25, 0.65);

      this.particles.push({
        x: options.x || 0,
        y: options.y || 0,

        vx: options.vx || 0,
        vy: options.vy || 0,

        radius:
          options.radius ??
          U.rand(1.5, 4),

        color:
          options.color ||
          '#ffffff',

        life,
        maxLife: life,

        drag:
          options.drag ?? 5,

        gravity:
          options.gravity ?? 0,

        glow:
          options.glow ?? 8,

        alpha:
          options.alpha ?? 1,

        shrink:
          options.shrink ?? true,

        square:
          options.square ?? false
      });
    }


    /* =====================================================
       PROJECTILE TRAIL
    ===================================================== */

    projectileTrail(projectile) {

      if (!projectile) {
        return;
      }

      const chance =
        projectile.weaponId === 'railgun'
          ? 0.95
          : projectile.weaponId === 'rocket'
            ? 0.75
            : projectile.weaponId === 'plasma'
              ? 0.62
              : 0.28;

      if (Math.random() > chance) {
        return;
      }

      const speed =
        Math.hypot(
          projectile.vx,
          projectile.vy
        ) || 1;

      const nx =
        projectile.vx / speed;

      const ny =
        projectile.vy / speed;

      let radius =
        projectile.weaponId === 'rocket'
          ? U.rand(2.5, 5)
          : U.rand(1.2, 2.8);

      let color =
        projectile.trailColor;

      if (
        projectile.weaponId ===
        'rocket'
      ) {
        color =
          Math.random() < 0.45
            ? '#ffb347'
            : '#ff5d36';
      }

      this.particle({
        x:
          projectile.x -
          nx * U.rand(2, 8),

        y:
          projectile.y -
          ny * U.rand(2, 8),

        vx:
          -projectile.vx *
          U.rand(0.015, 0.035) +
          U.rand(-15, 15),

        vy:
          -projectile.vy *
          U.rand(0.015, 0.035) +
          U.rand(-15, 15),

        radius,

        color,

        life:
          projectile.weaponId ===
          'rocket'
            ? U.rand(0.16, 0.34)
            : U.rand(0.09, 0.22),

        drag: 5,

        glow:
          projectile.weaponId ===
          'railgun'
            ? 15
            : 8
      });
    }


    /* =====================================================
       MUZZLE FLASH
    ===================================================== */

    muzzleFlash(
      x,
      y,
      color = '#ffffff',
      size = 16
    ) {

      this.flashes.push({
        x,
        y,
        radius: size,
        color,
        life: 0.055,
        maxLife: 0.055
      });

      for (
        let i = 0;
        i < 5;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            50,
            170
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1,
              2.8
            ),

          color,

          life:
            U.rand(
              0.08,
              0.22
            ),

          drag: 8,

          glow: 12
        });
      }
    }


    /* =====================================================
       BULLET IMPACT
    ===================================================== */

    bulletImpact(
      x,
      y,
      color,
      critical = false
    ) {

      const count =
        critical
          ? 15
          : 7;

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            55,
            critical
              ? 260
              : 155
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1.1,
              critical
                ? 4
                : 2.7
            ),

          color:
            critical &&
            Math.random() < 0.45
              ? '#ffffff'
              : color,

          life:
            U.rand(
              0.15,
              0.42
            ),

          drag: 6,

          glow:
            critical
              ? 15
              : 8
        });
      }

      if (critical) {

        this.ring(
          x,
          y,
          '#ffffff',
          8,
          32,
          0.20,
          2
        );
      }
    }


    /* =====================================================
       EXPLOSION
    ===================================================== */

    explosion(
      x,
      y,
      color = '#ff8b52',
      power = 1
    ) {

      const count =
        Math.floor(
          C.effects
            .explosionParticles *
          power
        );

      this.flash(
        x,
        y,
        color,
        42 * power,
        0.10
      );

      this.ring(
        x,
        y,
        color,
        10,
        95 * power,
        0.38,
        4
      );

      this.ring(
        x,
        y,
        '#ffffff',
        5,
        58 * power,
        0.20,
        2
      );

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            45,
            340 * power
          );

        let particleColor =
          color;

        const roll =
          Math.random();

        if (roll < 0.16) {
          particleColor =
            '#ffffff';
        } else if (
          roll < 0.38
        ) {
          particleColor =
            '#ffd77c';
        } else if (
          roll < 0.56
        ) {
          particleColor =
            '#ff713d';
        }

        this.particle({
          x:
            x +
            U.rand(
              -5,
              5
            ),

          y:
            y +
            U.rand(
              -5,
              5
            ),

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1.8,
              6.5 * power
            ),

          color:
            particleColor,

          life:
            U.rand(
              0.28,
              0.9
            ),

          drag:
            U.rand(
              2.5,
              6
            ),

          glow:
            U.rand(
              6,
              18
            )
        });
      }


      /*
        Dark smoke.
      */

      for (
        let i = 0;
        i < 12 * power;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            15,
            85
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed -
            U.rand(
              10,
              35
            ),

          radius:
            U.rand(
              5,
              11
            ) *
            power,

          color:
            '#455066',

          life:
            U.rand(
              0.45,
              1.15
            ),

          drag: 1.5,

          glow: 0,

          alpha: 0.30
        });
      }
    }


    /* =====================================================
       ENEMY DEATH
    ===================================================== */

    enemyDeath(
      x,
      y,
      color = C.colors.enemy,
      heavy = false
    ) {

      const count =
        heavy
          ? C.effects
              .heavyDeathParticles
          : C.effects
              .enemyDeathParticles;

      this.flash(
        x,
        y,
        color,
        heavy
          ? 34
          : 24,
        0.10
      );

      this.ring(
        x,
        y,
        color,
        5,
        heavy
          ? 70
          : 45,
        heavy
          ? 0.36
          : 0.25,
        heavy
          ? 4
          : 2
      );

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            35,
            heavy
              ? 280
              : 210
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1.5,
              heavy
                ? 5.5
                : 4
            ),

          color:
            Math.random() < 0.2
              ? '#ffffff'
              : color,

          life:
            U.rand(
              0.25,
              heavy
                ? 0.85
                : 0.65
            ),

          drag:
            U.rand(
              3,
              7
            ),

          glow: 10
        });
      }
    }


    /* =====================================================
       BOSS DEATH
    ===================================================== */

    bossDeath(
      x,
      y,
      color = C.colors.boss
    ) {

      this.flash(
        x,
        y,
        '#ffffff',
        110,
        0.35
      );

      for (
        let r = 0;
        r < 5;
        r++
      ) {

        this.ring(
          x,
          y,
          r % 2
            ? color
            : '#ffffff',
          15 + r * 8,
          100 + r * 55,
          0.55 + r * 0.12,
          5 - r * 0.5
        );
      }


      for (
        let i = 0;
        i <
        C.effects
          .bossDeathParticles;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            50,
            470
          );

        const roll =
          Math.random();

        let particleColor =
          color;

        if (roll < 0.22) {
          particleColor =
            '#ffffff';
        } else if (
          roll < 0.4
        ) {
          particleColor =
            C.colors.gold;
        }

        this.particle({
          x:
            x +
            U.rand(
              -18,
              18
            ),

          y:
            y +
            U.rand(
              -18,
              18
            ),

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              2,
              8
            ),

          color:
            particleColor,

          life:
            U.rand(
              0.45,
              1.5
            ),

          drag:
            U.rand(
              1.5,
              5
            ),

          glow:
            U.rand(
              10,
              25
            )
        });
      }
    }


    /* =====================================================
       PLAYER HIT
    ===================================================== */

    playerHit(
      x,
      y,
      color
    ) {

      for (
        let i = 0;
        i < 16;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            35,
            210
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1.5,
              4
            ),

          color,

          life:
            U.rand(
              0.2,
              0.5
            ),

          drag: 5,

          glow: 10
        });
      }

      this.ring(
        x,
        y,
        color,
        8,
        45,
        0.22,
        2
      );
    }


    /* =====================================================
       PLAYER DEATH
    ===================================================== */

    playerDeath(
      x,
      y
    ) {

      this.explosion(
        x,
        y,
        C.colors.player,
        1.45
      );

      for (
        let i = 0;
        i < 45;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            80,
            380
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1.5,
              5
            ),

          color:
            Math.random() < 0.25
              ? '#ffffff'
              : C.colors.player,

          life:
            U.rand(
              0.4,
              1
            ),

          drag: 3,

          glow: 16
        });
      }
    }


    /* =====================================================
       DASH
    ===================================================== */

    dashTrail(
      x,
      y,
      color
    ) {

      for (
        let i = 0;
        i < 2;
        i++
      ) {

        this.particle({
          x:
            x +
            U.rand(
              -8,
              8
            ),

          y:
            y +
            U.rand(
              -8,
              8
            ),

          vx:
            U.rand(
              -25,
              25
            ),

          vy:
            U.rand(
              -25,
              25
            ),

          radius:
            U.rand(
              3,
              7
            ),

          color,

          life:
            U.rand(
              0.12,
              0.28
            ),

          drag: 4,

          glow: 14,

          alpha: 0.65
        });
      }
    }


    dashBurst(
      x,
      y,
      color
    ) {

      this.ring(
        x,
        y,
        color,
        8,
        54,
        0.25,
        3
      );

      for (
        let i = 0;
        i < 22;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            50,
            250
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1,
              3.5
            ),

          color,

          life:
            U.rand(
              0.15,
              0.45
            ),

          drag: 5,

          glow: 12
        });
      }
    }


    /* =====================================================
       PICKUP
    ===================================================== */

    pickupBurst(
      x,
      y,
      color
    ) {

      this.ring(
        x,
        y,
        color,
        7,
        42,
        0.28,
        2
      );

      for (
        let i = 0;
        i < 20;
        i++
      ) {

        const angle =
          U.rand(
            0,
            Math.PI * 2
          );

        const speed =
          U.rand(
            45,
            180
          );

        this.particle({
          x,
          y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius:
            U.rand(
              1.5,
              3.5
            ),

          color:
            Math.random() < 0.25
              ? '#ffffff'
              : color,

          life:
            U.rand(
              0.25,
              0.6
            ),

          drag: 5,

          glow: 12
        });
      }
    }


    /* =====================================================
       DAMAGE NUMBER
    ===================================================== */

    damageNumber(
      x,
      y,
      amount,
      critical = false,
      color = null
    ) {

      this.damageNumbers.push({
        x:
          x +
          U.rand(
            -7,
            7
          ),

        y:
          y -
          U.rand(
            10,
            22
          ),

        vx:
          U.rand(
            -10,
            10
          ),

        vy:
          critical
            ? -65
            : -45,

        amount:
          Math.round(
            amount
          ),

        critical,

        color:
          color ||
          (
            critical
              ? C.colors.gold
              : '#ffffff'
          ),

        life:
          critical
            ? 0.9
            : C.effects
                .damageNumberLife,

        maxLife:
          critical
            ? 0.9
            : C.effects
                .damageNumberLife
      });
    }


    /* =====================================================
       RING
    ===================================================== */

    ring(
      x,
      y,
      color,
      startRadius = 4,
      endRadius = 50,
      life = 0.3,
      width = 2
    ) {

      this.rings.push({
        x,
        y,
        color,

        radius:
          startRadius,

        startRadius,
        endRadius,

        life,
        maxLife: life,

        width
      });
    }


    /* =====================================================
       FLASH
    ===================================================== */

    flash(
      x,
      y,
      color,
      radius = 30,
      life = 0.08
    ) {

      this.flashes.push({
        x,
        y,
        color,
        radius,
        life,
        maxLife: life
      });
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    update(dt) {

      /* ==========================
         PARTICLES
      ========================== */

      for (
        let i =
          this.particles.length - 1;
        i >= 0;
        i--
      ) {

        const p =
          this.particles[i];

        p.life -= dt;

        if (
          p.life <= 0
        ) {

          this.particles.splice(
            i,
            1
          );

          continue;
        }


        p.x +=
          p.vx * dt;

        p.y +=
          p.vy * dt;


        p.vy +=
          p.gravity * dt;


        const damping =
          Math.exp(
            -p.drag *
            dt
          );


        p.vx *= damping;
        p.vy *= damping;
      }


      /* ==========================
         RINGS
      ========================== */

      for (
        let i =
          this.rings.length - 1;
        i >= 0;
        i--
      ) {

        const ring =
          this.rings[i];

        ring.life -= dt;


        if (
          ring.life <= 0
        ) {

          this.rings.splice(
            i,
            1
          );

          continue;
        }


        const progress =
          1 -
          ring.life /
          ring.maxLife;


        ring.radius =
          U.lerp(
            ring.startRadius,
            ring.endRadius,
            progress
          );
      }


      /* ==========================
         FLASHES
      ========================== */

      for (
        let i =
          this.flashes.length - 1;
        i >= 0;
        i--
      ) {

        const flash =
          this.flashes[i];

        flash.life -= dt;


        if (
          flash.life <= 0
        ) {

          this.flashes.splice(
            i,
            1
          );
        }
      }


      /* ==========================
         DAMAGE NUMBERS
      ========================== */

      for (
        let i =
          this.damageNumbers.length - 1;
        i >= 0;
        i--
      ) {

        const number =
          this.damageNumbers[i];

        number.life -= dt;


        if (
          number.life <= 0
        ) {

          this.damageNumbers.splice(
            i,
            1
          );

          continue;
        }


        number.x +=
          number.vx * dt;

        number.y +=
          number.vy * dt;


        number.vx *=
          Math.exp(
            -4 * dt
          );

        number.vy *=
          Math.exp(
            -2 * dt
          );
      }
    }


    /* =====================================================
       DRAW
    ===================================================== */

    draw(ctx) {

      this.drawParticles(
        ctx
      );

      this.drawRings(
        ctx
      );

      this.drawFlashes(
        ctx
      );

      this.drawDamageNumbers(
        ctx
      );
    }


    /* =====================================================
       DRAW PARTICLES
    ===================================================== */

    drawParticles(ctx) {

      ctx.save();

      ctx.globalCompositeOperation =
        'lighter';


      for (
        const p of
        this.particles
      ) {

        const ratio =
          U.clamp(
            p.life /
            p.maxLife,
            0,
            1
          );


        const alpha =
          ratio *
          p.alpha;


        let radius =
          p.radius;


        if (p.shrink) {

          radius *=
            0.35 +
            ratio * 0.65;
        }


        ctx.globalAlpha =
          alpha;

        ctx.fillStyle =
          p.color;


        if (
          p.glow > 0
        ) {

          ctx.shadowColor =
            p.color;

          ctx.shadowBlur =
            p.glow;
        } else {

          ctx.shadowBlur = 0;
        }


        if (p.square) {

          ctx.fillRect(
            p.x -
            radius,
            p.y -
            radius,
            radius * 2,
            radius * 2
          );

        } else {

          ctx.beginPath();

          ctx.arc(
            p.x,
            p.y,
            Math.max(
              0.1,
              radius
            ),
            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      }


      ctx.restore();
    }


    /* =====================================================
       DRAW RINGS
    ===================================================== */

    drawRings(ctx) {

      ctx.save();

      ctx.globalCompositeOperation =
        'lighter';


      for (
        const ring of
        this.rings
      ) {

        const ratio =
          U.clamp(
            ring.life /
            ring.maxLife,
            0,
            1
          );


        ctx.globalAlpha =
          ratio;


        ctx.strokeStyle =
          ring.color;

        ctx.lineWidth =
          Math.max(
            0.5,
            ring.width *
            ratio
          );


        ctx.shadowColor =
          ring.color;

        ctx.shadowBlur =
          12;


        ctx.beginPath();

        ctx.arc(
          ring.x,
          ring.y,
          ring.radius,
          0,
          Math.PI * 2
        );

        ctx.stroke();
      }


      ctx.restore();
    }


    /* =====================================================
       DRAW FLASHES
    ===================================================== */

    drawFlashes(ctx) {

      ctx.save();

      ctx.globalCompositeOperation =
        'lighter';


      for (
        const flash of
        this.flashes
      ) {

        const ratio =
          U.clamp(
            flash.life /
            flash.maxLife,
            0,
            1
          );


        const gradient =
          ctx.createRadialGradient(
            flash.x,
            flash.y,
            0,

            flash.x,
            flash.y,
            flash.radius
          );


        gradient.addColorStop(
          0,
          '#ffffff'
        );

        gradient.addColorStop(
          0.22,
          flash.color
        );

        gradient.addColorStop(
          1,
          'rgba(0,0,0,0)'
        );


        ctx.globalAlpha =
          ratio;


        ctx.fillStyle =
          gradient;


        ctx.beginPath();

        ctx.arc(
          flash.x,
          flash.y,
          flash.radius,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }


      ctx.restore();
    }


    /* =====================================================
       DRAW DAMAGE NUMBERS
    ===================================================== */

    drawDamageNumbers(ctx) {

      ctx.save();

      ctx.textAlign =
        'center';

      ctx.textBaseline =
        'middle';


      for (
        const number of
        this.damageNumbers
      ) {

        const ratio =
          U.clamp(
            number.life /
            number.maxLife,
            0,
            1
          );


        ctx.globalAlpha =
          Math.min(
            1,
            ratio * 1.8
          );


        const scale =
          number.critical
            ? (
                1 +
                Math.sin(
                  (
                    1 - ratio
                  ) *
                  Math.PI
                ) *
                0.4
              )
            : 1;


        ctx.font =
          number.critical
            ? `900 ${
                17 * scale
              }px Arial`
            : 'bold 12px Arial';


        ctx.lineWidth =
          number.critical
            ? 4
            : 3;


        ctx.strokeStyle =
          'rgba(0,0,0,.8)';

        ctx.fillStyle =
          number.color;


        ctx.strokeText(
          number.amount,
          number.x,
          number.y
        );


        ctx.shadowColor =
          number.color;

        ctx.shadowBlur =
          number.critical
            ? 12
            : 4;


        ctx.fillText(
          number.amount,
          number.x,
          number.y
        );
      }


      ctx.restore();
    }


    /* =====================================================
       CLEAR
    ===================================================== */

    clear() {

      this.particles.length = 0;
      this.rings.length = 0;
      this.flashes.length = 0;
      this.damageNumbers.length = 0;
      this.trails.length = 0;
    }

  }


  NS.Effects =
    new EffectsEngine();


  console.log(
    'NEON SIEGE: effects engine loaded'
  );

})();

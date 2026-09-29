(() => {
  'use strict';

  const NS = window.NS;
  const C = NS.Config;
  const U = NS.Util;

  class Game {

    constructor() {

      this.canvas =
        document.getElementById('game');

      this.ctx =
        this.canvas.getContext(
          '2d',
          {
            alpha: false
          }
        );


      this.width = 1;
      this.height = 1;
      this.dpr = 1;


      this.running = false;
      this.paused = false;

      this.upgradePaused = false;

      this.gameOver = false;


      this.player = null;

      this.enemies = [];

      this.projectiles = [];

      this.enemyProjectiles = [];

      this.pickups = [];


      this.wave = 0;

      this.waveTarget = 0;

      this.waveSpawned = 0;

      this.waveActive = false;

      this.waveCompleteTimer = 0;

      this.spawnTimer = 0;

      this.bossWave = false;


      this.score = 0;

      this.highScore =
        Number(
          localStorage.getItem(
            'neonSiegeHighScore'
          ) || 0
        );


      this.combo = 0;
      this.comboTimer = 0;


      this.elapsed = 0;


      this.cameraShake = 0;

      this.cameraShakeX = 0;
      this.cameraShakeY = 0;


      this.flashTimer = 0;

      this.notificationTimer = 0;


      this.pendingUpgrades = 0;


      this.stars = [];

      this.gridOffset = 0;


      this.lastTimestamp = 0;


      this.bindElements();

      this.resize();

      this.generateStars();


      window.addEventListener(
        'resize',
        () => {

          this.resize();
          this.generateStars();
        }
      );


      console.log(
        'NEON SIEGE: game engine loaded'
      );
    }


    /* =====================================================
       DOM
    ===================================================== */

    bindElements() {

      this.healthFill =
        document.getElementById(
          'healthFill'
        );

      this.shieldFill =
        document.getElementById(
          'shieldFill'
        );

      this.hpText =
        document.getElementById(
          'hpText'
        );

      this.shieldText =
        document.getElementById(
          'shieldText'
        );

      this.levelText =
        document.getElementById(
          'levelText'
        );

      this.waveText =
        document.getElementById(
          'waveText'
        );

      this.enemyCount =
        document.getElementById(
          'enemyCount'
        );

      this.scoreText =
        document.getElementById(
          'scoreText'
        );

      this.weaponName =
        document.getElementById(
          'weaponName'
        );

      this.ammoText =
        document.getElementById(
          'ammoText'
        );

      this.reloadFill =
        document.getElementById(
          'reloadFill'
        );

      this.weaponInfo =
        document.getElementById(
          'weaponInfo'
        );

      this.xpText =
        document.getElementById(
          'xpText'
        );

      this.xpFill =
        document.getElementById(
          'xpFill'
        );

      this.comboBox =
        document.getElementById(
          'comboBox'
        );

      this.comboText =
        document.getElementById(
          'comboText'
        );

      this.comboTimerElement =
        document.getElementById(
          'comboTimer'
        );

      this.bossHud =
        document.getElementById(
          'bossHud'
        );

      this.bossName =
        document.getElementById(
          'bossName'
        );

      this.bossHealthFill =
        document.getElementById(
          'bossHealthFill'
        );

      this.notificationElement =
        document.getElementById(
          'notification'
        );

      this.screenFlash =
        document.getElementById(
          'screenFlash'
        );

      this.gameOverScreen =
        document.getElementById(
          'gameOverScreen'
        );

      this.gameOverTitle =
        document.getElementById(
          'gameOverTitle'
        );

      this.finalStats =
        document.getElementById(
          'finalStats'
        );
    }


    /* =====================================================
       RESIZE
    ===================================================== */

    resize() {

      this.width =
        window.innerWidth;

      this.height =
        window.innerHeight;


      this.dpr =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


      this.canvas.width =
        Math.floor(
          this.width *
          this.dpr
        );

      this.canvas.height =
        Math.floor(
          this.height *
          this.dpr
        );


      this.canvas.style.width =
        `${this.width}px`;

      this.canvas.style.height =
        `${this.height}px`;


      this.ctx.setTransform(
        this.dpr,
        0,
        0,
        this.dpr,
        0,
        0
      );


      if (this.player) {

        this.player.x =
          U.clamp(
            this.player.x,
            50,
            this.width - 50
          );

        this.player.y =
          U.clamp(
            this.player.y,
            50,
            this.height - 50
          );
      }
    }


    /* =====================================================
       RESET / START
    ===================================================== */

    reset() {

      this.enemies.length = 0;

      this.projectiles.length = 0;

      this.enemyProjectiles.length = 0;

      this.pickups.length = 0;


      NS.Effects.clear();

      NS.Upgrades.reset();


      this.player =
        new NS.Player(
          this
        );


      this.wave = 0;

      this.waveTarget = 0;

      this.waveSpawned = 0;

      this.waveActive = false;

      this.waveCompleteTimer = 0;

      this.spawnTimer = 0;

      this.bossWave = false;


      this.score = 0;

      this.combo = 0;

      this.comboTimer = 0;


      this.elapsed = 0;

      this.cameraShake = 0;

      this.pendingUpgrades = 0;


      this.gameOver = false;

      this.paused = false;

      this.upgradePaused = false;


      if (
        this.gameOverScreen
      ) {

        this.gameOverScreen
          .classList
          .add(
            'hidden'
          );
      }


      this.hideBossHud();

      this.updateHUD();


      this.startNextWave();
    }


    start() {

      this.reset();

      this.running = true;

      this.lastTimestamp =
        performance.now();


      if (NS.Audio) {

        NS.Audio.init();

        NS.Audio.stopAmbience();

        NS.Audio.ambience();
      }
    }


    /* =====================================================
       WAVE SYSTEM
    ===================================================== */

    startNextWave() {

      if (
        this.gameOver
      ) {
        return;
      }


      this.wave++;

      this.waveSpawned = 0;

      this.waveActive = true;

      this.waveCompleteTimer = 0;


      this.bossWave =
        (
          this.wave %
          C.game.bossEvery
        ) === 0;


      if (
        this.bossWave
      ) {

        this.waveTarget = 1;

        this.spawnTimer = 1.5;


        this.notify(
          `⚠ BOSS WAVE ${this.wave}`
        );


        if (NS.Audio) {

          NS.Audio.bossWarning();
        }

      } else {

        this.waveTarget =
          Math.min(
            C.game.maxEnemies,
            Math.ceil(
              C.waves.baseEnemies +
              (
                this.wave - 1
              ) *
              C.waves.enemyGrowth
            )
          );


        this.spawnTimer =
          0.65;


        this.notify(
          `WAVE ${this.wave}`
        );


        if (NS.Audio) {

          NS.Audio.waveStart();
        }
      }


      const unlocked =
        NS.Weapons.unlockForWave(
          this.player,
          this.wave
        );


      if (
        unlocked.length > 0
      ) {

        const last =
          unlocked[
            unlocked.length - 1
          ];


        const weapon =
          C.weapons[last];


        this.notify(
          `سلاح جدید: ${weapon.name}`
        );
      }


      this.updateHUD();
    }


    updateWave(dt) {

      if (
        !this.waveActive ||
        this.gameOver
      ) {
        return;
      }


      /*
        Spawn enemies.
      */

      if (
        this.waveSpawned <
        this.waveTarget
      ) {

        this.spawnTimer -= dt;


        if (
          this.spawnTimer <= 0
        ) {

          if (
            this.bossWave
          ) {

            this.spawnBoss();

          } else {

            this.spawnEnemy();
          }


          this.waveSpawned++;


          const delay =
            Math.max(
              C.waves.spawnDelayMin,

              C.waves
                .spawnDelayStart -

              (
                this.wave - 1
              ) *
              C.waves
                .spawnDelayReduction
            );


          this.spawnTimer =
            delay;
        }


        return;
      }


      /*
        Wave is complete only after
        every enemy is dead.
      */

      const alive =
        this.enemies.some(
          enemy =>
            enemy &&
            !enemy.dead
        );


      if (alive) {

        this.waveCompleteTimer =
          0;

        return;
      }


      if (
        this.waveCompleteTimer <= 0
      ) {

        this.waveCompleteTimer =
          C.game.baseWaveDelay;


        if (
          this.bossWave
        ) {

          this.enemyProjectiles
            .length = 0;


          this.player.heal(
            30
          );


          this.player.addShield(
            25
          );
        }

      } else {

        this.waveCompleteTimer -= dt;


        if (
          this.waveCompleteTimer <= 0
        ) {

          this.waveActive =
            false;

          this.startNextWave();
        }
      }
    }


    spawnEnemy() {

      if (
        this.enemies.length >=
        C.game.maxEnemies
      ) {
        return;
      }


      const enemy =
        NS.EnemyFactory
          .createRandom(
            this,
            this.wave
          );


      this.enemies.push(
        enemy
      );
    }


    spawnBoss() {

      const boss =
        NS.EnemyFactory
          .createBoss(
            this,
            this.wave
          );


      this.enemies.push(
        boss
      );


      if (
        this.bossHud
      ) {

        this.bossHud
          .classList
          .remove(
            'hidden'
          );
      }


      if (
        this.bossName
      ) {

        this.bossName
          .textContent =
          boss.data.name;
      }
    }


    /* =====================================================
       FRAME UPDATE
    ===================================================== */

    update(dt) {

      if (
        !this.running ||
        this.paused ||
        this.gameOver
      ) {
        return;
      }


      if (
        this.upgradePaused
      ) {

        NS.Effects.update(
          dt * 0.22
        );

        this.updateCamera(
          dt
        );

        this.updateHUD();

        return;
      }


      this.elapsed += dt;

      this.gridOffset +=
        dt * 11;


      this.player.update(
        dt
      );


      this.updateEnemies(
        dt
      );

      this.updateProjectiles(
        dt
      );

      this.updateEnemyProjectiles(
        dt
      );

      this.updatePickups(
        dt
      );


      NS.Effects.update(
        dt
      );


      this.updateWave(
        dt
      );

      this.updateCombo(
        dt
      );

      this.updateCamera(
        dt
      );

      this.updateNotification(
        dt
      );

      this.processPendingUpgrade();


      this.cleanup();

      this.updateHUD();
    }


    /* =====================================================
       ENEMIES
    ===================================================== */

    updateEnemies(dt) {

      for (
        const enemy of
        this.enemies
      ) {

        if (
          !enemy ||
          enemy.dead
        ) {
          continue;
        }


        enemy.update(
          this,
          dt
        );
      }
    }


    /* =====================================================
       PROJECTILES
    ===================================================== */

    updateProjectiles(dt) {

      for (
        const projectile of
        this.projectiles
      ) {

        if (
          projectile.dead
        ) {
          continue;
        }


        projectile.update(
          this,
          dt
        );
      }
    }


    updateEnemyProjectiles(dt) {

      for (
        const projectile of
        this.enemyProjectiles
      ) {

        if (
          projectile.dead
        ) {
          continue;
        }


        projectile.update(
          this,
          dt
        );
      }
    }


    /* =====================================================
       PICKUPS
    ===================================================== */

    updatePickups(dt) {

      for (
        const pickup of
        this.pickups
      ) {

        if (
          pickup.dead
        ) {
          continue;
        }


        pickup.update(
          this,
          dt
        );
      }
    }


    spawnPickup(
      x,
      y,
      forcedType = null
    ) {

      let type =
        forcedType;


      if (!type) {

        const D =
          C.drops;


        type =
          U.weightedChoice([
            {
              value: 'health',
              weight:
                D.healthWeight
            },

            {
              value: 'shield',
              weight:
                D.shieldWeight
            },

            {
              value: 'ammo',
              weight:
                D.ammoWeight
            },

            {
              value: 'overdrive',
              weight:
                D.overdriveWeight
            }
          ]);
      }


      this.pickups.push(
        new NS.Pickup(
          x,
          y,
          type
        )
      );
    }


    /* =====================================================
       ENEMY KILLED
    ===================================================== */

    enemyKilled(
      enemy,
      info = {}
    ) {

      if (!enemy) {
        return;
      }


      this.player.kills++;


      this.player.addXP(
        enemy.xp || 0
      );


      let score =
        enemy.score || 0;


      this.combo++;

      this.comboTimer =
        C.game.comboDuration;


      const comboMultiplier =
        1 +
        Math.min(
          2.5,
          Math.max(
            0,
            this.combo - 1
          ) *
          0.08
        );


      score *=
        comboMultiplier;


      this.score +=
        Math.round(
          score
        );


      if (
        enemy.isBoss
      ) {

        this.score +=
          1500 *
          this.wave;


        this.hideBossHud();


        if (NS.Audio) {

          setTimeout(
            () => {

              if (
                this.running &&
                !this.gameOver
              ) {

                NS.Audio.victory();
              }

            },
            250
          );
        }


        this.flashDamage(
          '#ffffff',
          0.32
        );

      } else {

        if (
          U.chance(
            C.drops.baseChance
          )
        ) {

          this.spawnPickup(
            enemy.x,
            enemy.y
          );
        }
      }


      if (
        this.score >
        this.highScore
      ) {

        this.highScore =
          this.score;


        localStorage.setItem(
          'neonSiegeHighScore',
          String(
            Math.floor(
              this.highScore
            )
          )
        );
      }


      this.updateHUD();
    }


    /* =====================================================
       COMBO
    ===================================================== */

    updateCombo(dt) {

      if (
        this.combo <= 0
      ) {
        return;
      }


      this.comboTimer -= dt;


      if (
        this.comboTimer <= 0
      ) {

        this.combo = 0;
        this.comboTimer = 0;
      }
    }


    /* =====================================================
       LEVEL UP
    ===================================================== */

    requestUpgrade() {

      this.pendingUpgrades++;
    }


    processPendingUpgrade() {

      if (
        this.pendingUpgrades <= 0 ||
        this.gameOver ||
        NS.Upgrades.active
      ) {
        return;
      }


      this.pendingUpgrades--;


      NS.Upgrades.open(
        this
      );
    }


    /* =====================================================
       PLAYER DEATH
    ===================================================== */

    playerDied() {

      if (
        this.gameOver
      ) {
        return;
      }


      this.gameOver = true;


      this.enemyProjectiles
        .length = 0;


      this.addShake(
        18
      );


      this.flashDamage(
        '#ff3e67',
        0.34
      );


      if (NS.Audio) {

        NS.Audio.gameOver();

        NS.Audio.stopAmbience();
      }


      setTimeout(
        () => {

          this.showGameOver();

        },
        650
      );
    }


    showGameOver() {

      if (
        !this.gameOverScreen
      ) {
        return;
      }


      if (
        this.gameOverTitle
      ) {

        this.gameOverTitle
          .textContent =
          'MISSION FAILED';
      }


      if (
        this.finalStats
      ) {

        const accuracy =
          this.player &&
          this.player.weaponState
            .shotsFired > 0

            ? Math.round(
                (
                  this.player
                    .weaponState
                    .shotsHit /

                  this.player
                    .weaponState
                    .shotsFired
                ) *
                100
              )

            : 0;


        this.finalStats.innerHTML =
          `
          WAVE
          <b>${this.wave}</b>
          <br>

          SCORE
          <b>${U.formatScore(this.score)}</b>
          <br>

          KILLS
          <b>${this.player.kills}</b>
          <br>

          LEVEL
          <b>${this.player.level}</b>
          <br>

          DAMAGE
          <b>${Math.round(this.player.damageDone)}</b>
          <br>

          HIGH SCORE
          <b>${U.formatScore(this.highScore)}</b>
          `;
      }


      this.gameOverScreen
        .classList
        .remove(
          'hidden'
        );
    }


    /* =====================================================
       PAUSE
    ===================================================== */

    togglePause() {

      if (
        this.gameOver ||
        !this.running ||
        this.upgradePaused
      ) {
        return;
      }


      this.paused =
        !this.paused;


      const screen =
        document.getElementById(
          'pauseScreen'
        );


      if (screen) {

        screen.classList.toggle(
          'hidden',
          !this.paused
        );
      }


      if (
        !this.paused &&
        NS.Audio
      ) {

        NS.Audio.resume();
      }
    }


    /* =====================================================
       CAMERA / SCREEN FX
    ===================================================== */

    addShake(amount) {

      this.cameraShake =
        Math.min(
          C.game.camera.maxShake,
          Math.max(
            this.cameraShake,
            amount
          )
        );
    }


    updateCamera(dt) {

      if (
        this.cameraShake > 0
      ) {

        this.cameraShake =
          Math.max(
            0,
            this.cameraShake -
            C.game.camera
              .shakeDecay *
            dt
          );


        this.cameraShakeX =
          U.rand(
            -this.cameraShake,
            this.cameraShake
          );

        this.cameraShakeY =
          U.rand(
            -this.cameraShake,
            this.cameraShake
          );

      } else {

        this.cameraShakeX = 0;
        this.cameraShakeY = 0;
      }


      if (
        this.flashTimer > 0
      ) {

        this.flashTimer -= dt;


        if (
          this.flashTimer <= 0 &&
          this.screenFlash
        ) {

          this.screenFlash
            .style.opacity =
            '0';
        }
      }
    }


    flashDamage(
      color,
      duration = 0.12
    ) {

      if (
        !this.screenFlash
      ) {
        return;
      }


      this.flashTimer =
        duration;


      this.screenFlash
        .style.background =
        color;


      this.screenFlash
        .style.opacity =
        String(
          Math.min(
            0.28,
            duration
          )
        );


      requestAnimationFrame(
        () => {

          if (
            this.screenFlash
          ) {

            this.screenFlash
              .style.opacity =
              '0';
          }
        }
      );
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    notify(
      text,
      duration = 1.8
    ) {

      if (
        !this.notificationElement
      ) {
        return;
      }


      this.notificationElement
        .textContent =
        text;


      this.notificationElement
        .classList
        .add(
          'show'
        );


      this.notificationTimer =
        duration;
    }


    updateNotification(dt) {

      if (
        this.notificationTimer <= 0
      ) {
        return;
      }


      this.notificationTimer -= dt;


      if (
        this.notificationTimer <= 0 &&
        this.notificationElement
      ) {

        this.notificationElement
          .classList
          .remove(
            'show'
          );
      }
    }


    /* =====================================================
       CLEANUP
    ===================================================== */

    cleanup() {

      this.enemies =
        this.enemies.filter(
          enemy =>
            enemy &&
            !enemy.dead
        );


      this.projectiles =
        this.projectiles.filter(
          projectile =>
            projectile &&
            !projectile.dead
        );


      this.enemyProjectiles =
        this.enemyProjectiles.filter(
          projectile =>
            projectile &&
            !projectile.dead
        );


      this.pickups =
        this.pickups.filter(
          pickup =>
            pickup &&
            !pickup.dead
        );
    }


    /* =====================================================
       HUD
    ===================================================== */

    updateHUD() {

      if (!this.player) {
        return;
      }


      const player =
        this.player;


      const hpRatio =
        U.clamp(
          player.health /
          player.maxHealth,
          0,
          1
        );


      const shieldRatio =
        player.maxShield > 0
          ? U.clamp(
              player.shield /
              player.maxShield,
              0,
              1
            )
          : 0;


      if (
        this.healthFill
      ) {

        this.healthFill
          .style.width =
          `${hpRatio * 100}%`;
      }


      if (
        this.shieldFill
      ) {

        this.shieldFill
          .style.width =
          `${shieldRatio * 100}%`;
      }


      if (
        this.hpText
      ) {

        this.hpText
          .textContent =
          `${Math.ceil(player.health)} / ${Math.ceil(player.maxHealth)}`;
      }


      if (
        this.shieldText
      ) {

        this.shieldText
          .textContent =
          `SHIELD ${Math.ceil(player.shield)}`;
      }


      if (
        this.levelText
      ) {

        this.levelText
          .textContent =
          `LV ${player.level}`;
      }


      if (
        this.waveText
      ) {

        this.waveText
          .textContent =
          `WAVE ${this.wave}`;
      }


      if (
        this.enemyCount
      ) {

        this.enemyCount
          .textContent =
          String(
            this.enemies.filter(
              enemy =>
                enemy &&
                !enemy.dead
            ).length
          );
      }


      if (
        this.scoreText
      ) {

        this.scoreText
          .textContent =
          `SCORE ${U.formatScore(this.score)}`;
      }


      const weapon =
        NS.Weapons.getHudData(
          player
        );


      if (weapon) {

        if (
          this.weaponName
        ) {

          this.weaponName
            .textContent =
            weapon.name;
        }


        if (
          this.ammoText
        ) {

          this.ammoText
            .textContent =
            `${weapon.magazine} / ${weapon.reserve}`;
        }


        if (
          this.reloadFill
        ) {

          this.reloadFill
            .style.width =
            `${weapon.reloadProgress * 100}%`;
        }


        if (
          this.weaponInfo
        ) {

          if (
            weapon.reloading
          ) {

            this.weaponInfo
              .textContent =
              'RELOADING';

          } else if (
            player.overdriveTimer > 0
          ) {

            this.weaponInfo
              .textContent =
              `OVERDRIVE ${player.overdriveTimer.toFixed(1)}s`;

          } else if (
            player.dashCooldown > 0
          ) {

            this.weaponInfo
              .textContent =
              `DASH ${player.dashCooldown.toFixed(1)}s`;

          } else {

            this.weaponInfo
              .textContent =
              'READY';
          }
        }
      }


      const xpRatio =
        player.xpNeeded > 0
          ? U.clamp(
              player.xp /
              player.xpNeeded,
              0,
              1
            )
          : 0;


      if (
        this.xpFill
      ) {

        this.xpFill
          .style.width =
          `${xpRatio * 100}%`;
      }


      if (
        this.xpText
      ) {

        this.xpText
          .textContent =
          `XP ${Math.floor(player.xp)} / ${Math.floor(player.xpNeeded)}`;
      }


      if (
        this.combo > 1
      ) {

        if (
          this.comboBox
        ) {

          this.comboBox
            .classList
            .remove(
              'hidden'
            );
        }


        if (
          this.comboText
        ) {

          this.comboText
            .textContent =
            `COMBO ×${this.combo}`;
        }


        if (
          this.comboTimerElement
        ) {

          const comboRatio =
            U.clamp(
              this.comboTimer /
              C.game.comboDuration,
              0,
              1
            );


          this.comboTimerElement
            .style.width =
            `${100 * comboRatio}px`;
        }

      } else if (
        this.comboBox
      ) {

        this.comboBox
          .classList
          .add(
            'hidden'
          );
      }


      this.updateBossHUD();
    }


    updateBossHUD() {

      const boss =
        this.enemies.find(
          enemy =>
            enemy &&
            !enemy.dead &&
            enemy.isBoss
        );


      if (!boss) {

        this.hideBossHud();

        return;
      }


      if (
        this.bossHud
      ) {

        this.bossHud
          .classList
          .remove(
            'hidden'
          );
      }


      if (
        this.bossHealthFill
      ) {

        const ratio =
          U.clamp(
            boss.health /
            boss.maxHealth,
            0,
            1
          );


        this.bossHealthFill
          .style.width =
          `${ratio * 100}%`;
      }
    }


    hideBossHud() {

      if (
        this.bossHud
      ) {

        this.bossHud
          .classList
          .add(
            'hidden'
          );
      }
    }


    /* =====================================================
       BACKGROUND DATA
    ===================================================== */

    generateStars() {

      this.stars.length = 0;


      const count =
        Math.min(
          150,
          Math.floor(
            (
              this.width *
              this.height
            ) /
            9000
          )
        );


      for (
        let i = 0;
        i < count;
        i++
      ) {

        this.stars.push({

          x:
            Math.random() *
            this.width,

          y:
            Math.random() *
            this.height,

          size:
            U.rand(
              0.5,
              1.7
            ),

          alpha:
            U.rand(
              0.12,
              0.55
            ),

          pulse:
            U.rand(
              0,
              Math.PI * 2
            )
        });
      }
    }


    /* =====================================================
       RENDER
    ===================================================== */

    render() {

      const ctx =
        this.ctx;


      ctx.save();


      ctx.setTransform(
        this.dpr,
        0,
        0,
        this.dpr,
        0,
        0
      );


      this.drawBackground(
        ctx
      );


      ctx.save();


      ctx.translate(
        this.cameraShakeX,
        this.cameraShakeY
      );


      this.drawArena(
        ctx
      );


      for (
        const pickup of
        this.pickups
      ) {

        pickup.draw(
          ctx
        );
      }


      for (
        const enemy of
        this.enemies
      ) {

        enemy.draw(
          ctx
        );
      }


      if (
        this.player
      ) {

        this.player.draw(
          ctx
        );
      }


      for (
        const projectile of
        this.projectiles
      ) {

        projectile.draw(
          ctx
        );
      }


      for (
        const projectile of
        this.enemyProjectiles
      ) {

        projectile.draw(
          ctx
        );
      }


      NS.Effects.draw(
        ctx
      );


      ctx.restore();


      if (
        NS.Debug.enabled &&
        NS.Debug.showFPS
      ) {

        this.drawDebug(
          ctx
        );
      }


      ctx.restore();
    }


    /* =====================================================
       BACKGROUND
    ===================================================== */

    drawBackground(ctx) {

      ctx.fillStyle =
        C.colors.background;

      ctx.fillRect(
        0,
        0,
        this.width,
        this.height
      );


      const gradient =
        ctx.createRadialGradient(
          this.width * 0.5,
          this.height * 0.42,
          0,

          this.width * 0.5,
          this.height * 0.42,

          Math.max(
            this.width,
            this.height
          ) * 0.75
        );


      gradient.addColorStop(
        0,
        '#10203a'
      );

      gradient.addColorStop(
        0.42,
        '#091221'
      );

      gradient.addColorStop(
        1,
        '#03050b'
      );


      ctx.globalAlpha =
        0.78;

      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        0,
        this.width,
        this.height
      );


      ctx.globalAlpha = 1;


      /*
        Stars.
      */

      for (
        const star of
        this.stars
      ) {

        const pulse =
          0.65 +
          Math.sin(
            this.elapsed *
            1.5 +
            star.pulse
          ) *
          0.35;


        ctx.globalAlpha =
          star.alpha *
          pulse;


        ctx.fillStyle =
          '#92bdff';


        ctx.fillRect(
          star.x,
          star.y,
          star.size,
          star.size
        );
      }


      ctx.globalAlpha = 1;


      /*
        Moving grid.
      */

      const spacing = 48;

      const offset =
        this.gridOffset %
        spacing;


      ctx.strokeStyle =
        'rgba(51,92,145,.09)';

      ctx.lineWidth = 1;


      ctx.beginPath();


      for (
        let x =
          -spacing +
          offset;
        x <
        this.width +
        spacing;
        x += spacing
      ) {

        ctx.moveTo(
          x,
          0
        );

        ctx.lineTo(
          x,
          this.height
        );
      }


      for (
        let y =
          -spacing +
          offset * 0.55;
        y <
        this.height +
        spacing;
        y += spacing
      ) {

        ctx.moveTo(
          0,
          y
        );

        ctx.lineTo(
          this.width,
          y
        );
      }


      ctx.stroke();
    }


    drawArena(ctx) {

      const padding =
        C.game.worldPadding;


      ctx.save();


      ctx.strokeStyle =
        'rgba(0,229,255,.12)';

      ctx.lineWidth = 1;


      ctx.shadowColor =
        C.colors.player;

      ctx.shadowBlur = 7;


      ctx.strokeRect(
        padding,
        padding,
        this.width -
        padding * 2,
        this.height -
        padding * 2
      );


      /*
        Corner indicators.
      */

      const size = 22;


      ctx.strokeStyle =
        'rgba(243,201,105,.28)';


      const corners = [

        [
          padding,
          padding,
          1,
          1
        ],

        [
          this.width - padding,
          padding,
          -1,
          1
        ],

        [
          padding,
          this.height - padding,
          1,
          -1
        ],

        [
          this.width - padding,
          this.height - padding,
          -1,
          -1
        ]
      ];


      for (
        const [
          x,
          y,
          sx,
          sy
        ] of corners
      ) {

        ctx.beginPath();

        ctx.moveTo(
          x,
          y +
          sy * size
        );

        ctx.lineTo(
          x,
          y
        );

        ctx.lineTo(
          x +
          sx * size,
          y
        );

        ctx.stroke();
      }


      ctx.restore();
    }


    /* =====================================================
       DEBUG
    ===================================================== */

    drawDebug(ctx) {

      ctx.save();

      ctx.direction = 'ltr';

      ctx.font =
        '12px monospace';

      ctx.fillStyle =
        '#ffffff';

      ctx.fillText(
        `Enemies: ${this.enemies.length}`,
        15,
        this.height - 52
      );

      ctx.fillText(
        `Projectiles: ${
          this.projectiles.length +
          this.enemyProjectiles.length
        }`,
        15,
        this.height - 36
      );

      ctx.fillText(
        `Particles: ${NS.Effects.particles.length}`,
        15,
        this.height - 20
      );

      ctx.restore();
    }


    /* =====================================================
       MAIN RAF
    ===================================================== */

    frame(timestamp) {

      if (
        !this.running
      ) {
        return;
      }


      let dt =
        (
          timestamp -
          this.lastTimestamp
        ) /
        1000;


      this.lastTimestamp =
        timestamp;


      dt =
        Math.min(
          C.game.maxDelta,
          Math.max(
            0,
            dt
          )
        );


      /*
        Pause key must remain responsive
        even while gameplay is paused.
      */

      if (
        NS.Input.consumePause()
      ) {

        this.togglePause();
      }


      this.update(
        dt
      );


      this.render();


      requestAnimationFrame(
        time =>
          this.frame(
            time
          )
      );
    }


    launchLoop() {

      this.lastTimestamp =
        performance.now();


      requestAnimationFrame(
        time =>
          this.frame(
            time
          )
      );
    }

  }


  NS.Game =
    new Game();

})();

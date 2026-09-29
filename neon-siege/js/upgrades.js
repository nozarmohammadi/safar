(() => {
  'use strict';

  const NS = window.NS;
  const U = NS.Util;

  class UpgradeSystem {

    constructor() {

      this.active = false;

      this.game = null;

      this.cardsElement =
        document.getElementById(
          'upgradeCards'
        );

      this.screenElement =
        document.getElementById(
          'upgradeScreen'
        );


      this.definitions = [

        {
          id: 'damage',

          name: 'OVERCLOCKED ROUNDS',

          icon: '💥',

          description:
            'قدرت تمام سلاح‌ها ۱۵٪ افزایش پیدا می‌کند.',

          maxLevel: 8,

          weight: 20,

          apply(player) {

            player.damageMultiplier *=
              1.15;
          }
        },


        {
          id: 'fireRate',

          name: 'TRIGGER CORE',

          icon: '⚡',

          description:
            'سرعت شلیک تمام سلاح‌ها ۱۲٪ بیشتر می‌شود.',

          maxLevel: 8,

          weight: 18,

          apply(player) {

            player.fireRateMultiplier *=
              1.12;
          }
        },


        {
          id: 'speed',

          name: 'KINETIC BOOTS',

          icon: '➤',

          description:
            'سرعت حرکت ۱۰٪ افزایش پیدا می‌کند.',

          maxLevel: 6,

          weight: 14,

          apply(player) {

            player.moveSpeedMultiplier *=
              1.10;
          }
        },


        {
          id: 'health',

          name: 'VITAL CORE',

          icon: '♥',

          description:
            'حداکثر جان +۲۰ و مقداری جان بازیابی می‌شود.',

          maxLevel: 6,

          weight: 15,

          apply(player) {

            player.maxHealth += 20;

            player.health =
              Math.min(
                player.maxHealth,
                player.health + 28
              );
          }
        },


        {
          id: 'shield',

          name: 'AEGIS MODULE',

          icon: '◆',

          description:
            'حداکثر Shield +۲۵ و ۳۵ Shield فوری دریافت می‌کنی.',

          maxLevel: 5,

          weight: 14,

          apply(player) {

            player.maxShield += 25;

            player.shield =
              Math.min(
                player.maxShield,
                player.shield + 35
              );
          }
        },


        {
          id: 'critical',

          name: 'CRITICAL MATRIX',

          icon: '✦',

          description:
            'شانس Critical Hit پنج درصد بیشتر می‌شود.',

          maxLevel: 7,

          weight: 12,

          apply(player) {

            player.criticalChance =
              Math.min(
                0.55,
                player.criticalChance +
                0.05
              );
          }
        },


        {
          id: 'criticalDamage',

          name: 'EXECUTION PROTOCOL',

          icon: '☠',

          description:
            'قدرت Critical Hit بیست درصد افزایش پیدا می‌کند.',

          maxLevel: 6,

          weight: 10,

          apply(player) {

            player.criticalMultiplier +=
              0.20;
          }
        },


        {
          id: 'armor',

          name: 'NANO ARMOR',

          icon: '⬢',

          description:
            'آسیب دریافتی ۵٪ کمتر می‌شود.',

          maxLevel: 7,

          weight: 12,

          apply(player) {

            player.armor =
              Math.min(
                0.45,
                player.armor + 0.05
              );
          }
        },


        {
          id: 'lifesteal',

          name: 'VAMPIRIC CIRCUIT',

          icon: '✚',

          description:
            '۲٪ از Damage واردشده به جان تبدیل می‌شود.',

          maxLevel: 5,

          weight: 8,

          apply(player) {

            player.lifeSteal =
              Math.min(
                0.12,
                player.lifeSteal +
                0.02
              );
          }
        },


        {
          id: 'dash',

          name: 'PHASE DRIVE',

          icon: '⚡',

          description:
            'Cooldown دَش ۱۲٪ کمتر می‌شود.',

          maxLevel: 6,

          weight: 12,

          apply(player) {

            player.dashCooldownMultiplier *=
              0.88;

            player.dashCooldownMultiplier =
              Math.max(
                0.38,
                player.dashCooldownMultiplier
              );
          }
        },


        {
          id: 'dashPower',

          name: 'VECTOR BURST',

          icon: '»',

          description:
            'سرعت دَش ۱۰٪ افزایش پیدا می‌کند.',

          maxLevel: 4,

          weight: 8,

          apply(player) {

            player.dashSpeedMultiplier *=
              1.10;
          }
        },


        {
          id: 'accuracy',

          name: 'TARGETING CHIP',

          icon: '◎',

          description:
            'پراکندگی گلوله‌ها ۱۲٪ کمتر می‌شود.',

          maxLevel: 6,

          weight: 9,

          apply(player) {

            player.spreadMultiplier *=
              0.88;

            player.spreadMultiplier =
              Math.max(
                0.42,
                player.spreadMultiplier
              );
          }
        },


        {
          id: 'pickup',

          name: 'MAGNET FIELD',

          icon: '◉',

          description:
            'برد جذب آیتم‌ها ۲۵ واحد افزایش پیدا می‌کند.',

          maxLevel: 5,

          weight: 8,

          apply(player) {

            player.pickupRadius +=
              25;
          }
        },


        {
          id: 'healthRegen',

          name: 'REPAIR NANITES',

          icon: '♻',

          description:
            'بعد از چند ثانیه، جان به‌آرامی بازیابی می‌شود.',

          maxLevel: 5,

          weight: 8,

          apply(player) {

            player.healthRegen +=
              0.75;
          }
        },


        {
          id: 'shieldRegen',

          name: 'SHIELD REACTOR',

          icon: '◈',

          description:
            'Shield به‌آرامی و خودکار بازیابی می‌شود.',

          maxLevel: 5,

          weight: 8,

          apply(player) {

            player.shieldRegen +=
              1.4;
          }
        },


        {
          id: 'ammo',

          name: 'AMMO SYNTHESIZER',

          icon: '▣',

          description:
            'مهمات تمام سلاح‌های آزادشده افزایش پیدا می‌کند.',

          maxLevel: 5,

          weight: 10,

          apply(player) {

            NS.Weapons.giveAmmo(
              player,
              0.55
            );
          }
        }

      ];


      this.map =
        Object.create(null);


      for (
        const upgrade of
        this.definitions
      ) {

        this.map[
          upgrade.id
        ] = upgrade;
      }
    }


    /* =====================================================
       LEVEL
    ===================================================== */

    getLevel(
      player,
      id
    ) {

      return (
        player.upgradeLevels[id] ||
        0
      );
    }


    isMaxed(
      player,
      upgrade
    ) {

      return (
        this.getLevel(
          player,
          upgrade.id
        ) >=
        upgrade.maxLevel
      );
    }


    /* =====================================================
       CHOICES
    ===================================================== */

    getChoices(
      player,
      count = 3
    ) {

      const available =
        this.definitions.filter(
          upgrade =>
            !this.isMaxed(
              player,
              upgrade
            )
        );


      if (
        available.length === 0
      ) {

        return [];
      }


      const choices = [];

      const pool =
        available.slice();


      while (
        choices.length < count &&
        pool.length > 0
      ) {

        const weighted =
          pool.map(
            upgrade => ({
              value: upgrade,
              weight:
                upgrade.weight ||
                10
            })
          );


        const selected =
          U.weightedChoice(
            weighted
          );


        choices.push(
          selected
        );


        const index =
          pool.indexOf(
            selected
          );


        if (
          index >= 0
        ) {

          pool.splice(
            index,
            1
          );
        }
      }


      return choices;
    }


    /* =====================================================
       OPEN
    ===================================================== */

    open(game) {

      if (
        this.active ||
        !game ||
        !game.player
      ) {

        return;
      }


      this.active = true;

      this.game = game;


      const choices =
        this.getChoices(
          game.player,
          3
        );


      if (
        choices.length === 0
      ) {

        this.active = false;

        return;
      }


      game.upgradePaused = true;


      this.renderCards(
        choices
      );


      if (
        this.screenElement
      ) {

        this.screenElement
          .classList
          .remove(
            'hidden'
          );
      }
    }


    /* =====================================================
       RENDER CARDS
    ===================================================== */

    renderCards(choices) {

      if (
        !this.cardsElement
      ) {
        return;
      }


      this.cardsElement
        .innerHTML = '';


      for (
        const upgrade of
        choices
      ) {

        const player =
          this.game.player;


        const currentLevel =
          this.getLevel(
            player,
            upgrade.id
          );


        const card =
          document.createElement(
            'button'
          );


        card.type =
          'button';


        card.className =
          'upgrade-card';


        const icon =
          document.createElement(
            'div'
          );

        icon.className =
          'upgrade-icon';

        icon.textContent =
          upgrade.icon;


        const name =
          document.createElement(
            'div'
          );

        name.className =
          'upgrade-name';

        name.textContent =
          upgrade.name;


        const description =
          document.createElement(
            'div'
          );

        description.className =
          'upgrade-description';

        description.textContent =
          upgrade.description;


        const level =
          document.createElement(
            'div'
          );

        level.className =
          'upgrade-level';

        level.textContent =
          `LEVEL ${
            currentLevel + 1
          } / ${
            upgrade.maxLevel
          }`;


        card.appendChild(
          icon
        );

        card.appendChild(
          name
        );

        card.appendChild(
          description
        );

        card.appendChild(
          level
        );


        card.addEventListener(
          'click',
          () => {

            this.select(
              upgrade.id
            );
          }
        );


        this.cardsElement
          .appendChild(
            card
          );
      }
    }


    /* =====================================================
       APPLY
    ===================================================== */

    apply(
      player,
      id
    ) {

      const upgrade =
        this.map[id];


      if (
        !upgrade ||
        !player ||
        this.isMaxed(
          player,
          upgrade
        )
      ) {

        return false;
      }


      upgrade.apply(
        player
      );


      player.upgradeLevels[id] =
        this.getLevel(
          player,
          id
        ) + 1;


      return true;
    }


    /* =====================================================
       SELECT
    ===================================================== */

    select(id) {

      if (
        !this.active ||
        !this.game ||
        !this.game.player
      ) {

        return;
      }


      const upgrade =
        this.map[id];


      if (!upgrade) {
        return;
      }


      const applied =
        this.apply(
          this.game.player,
          id
        );


      if (!applied) {
        return;
      }


      if (NS.Audio) {

        NS.Audio.upgradeSelect();
      }


      if (
        NS.Effects
      ) {

        NS.Effects.ring(
          this.game.player.x,
          this.game.player.y,
          NS.Config.colors.gold,
          10,
          95,
          0.5,
          4
        );


        for (
          let i = 0;
          i < 30;
          i++
        ) {

          const angle =
            U.rand(
              0,
              Math.PI * 2
            );


          const speed =
            U.rand(
              40,
              210
            );


          NS.Effects.particle({

            x:
              this.game.player.x,

            y:
              this.game.player.y,

            vx:
              Math.cos(angle) *
              speed,

            vy:
              Math.sin(angle) *
              speed,

            radius:
              U.rand(
                1.5,
                3.8
              ),

            color:
              Math.random() < 0.28
                ? '#ffffff'
                : NS.Config
                    .colors
                    .gold,

            life:
              U.rand(
                0.25,
                0.65
              ),

            drag: 5,

            glow: 12
          });
        }
      }


      if (
        this.game.notify
      ) {

        this.game.notify(
          upgrade.name
        );
      }


      this.close();
    }


    /* =====================================================
       CLOSE
    ===================================================== */

    close() {

      if (
        this.screenElement
      ) {

        this.screenElement
          .classList
          .add(
            'hidden'
          );
      }


      if (
        this.cardsElement
      ) {

        this.cardsElement
          .innerHTML = '';
      }


      if (this.game) {

        this.game.upgradePaused =
          false;
      }


      this.active = false;

      this.game = null;
    }


    /* =====================================================
       RESET
    ===================================================== */

    reset() {

      if (
        this.screenElement
      ) {

        this.screenElement
          .classList
          .add(
            'hidden'
          );
      }


      if (
        this.cardsElement
      ) {

        this.cardsElement
          .innerHTML = '';
      }


      this.active = false;

      this.game = null;
    }

  }


  NS.Upgrades =
    new UpgradeSystem();


  console.log(
    'NEON SIEGE: upgrade system loaded'
  );

})();

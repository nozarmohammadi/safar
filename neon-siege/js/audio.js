(() => {
  'use strict';

  const NS = window.NS;

  class AudioEngine {

    constructor() {

      this.ctx = null;

      this.master = null;

      this.sfxGain = null;

      this.musicGain = null;

      this.initialized = false;

      this.enabled = true;

      this.volume = 0.34;

      this.musicVolume = 0.08;

      this.noiseBuffer = null;
    }


    /* =====================================================
       INIT
    ===================================================== */

    init() {

      if (this.initialized) {
        this.resume();
        return;
      }

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {

        console.warn(
          'Web Audio API unavailable'
        );

        this.enabled = false;

        return;
      }

      this.ctx =
        new AudioContext();

      this.master =
        this.ctx.createGain();

      this.sfxGain =
        this.ctx.createGain();

      this.musicGain =
        this.ctx.createGain();


      this.master.gain.value =
        this.volume;

      this.sfxGain.gain.value =
        1;

      this.musicGain.gain.value =
        this.musicVolume;


      this.sfxGain.connect(
        this.master
      );

      this.musicGain.connect(
        this.master
      );

      this.master.connect(
        this.ctx.destination
      );


      this.createNoiseBuffer();

      this.initialized = true;

      this.resume();
    }


    resume() {

      if (
        this.ctx &&
        this.ctx.state === 'suspended'
      ) {

        this.ctx.resume();
      }
    }


    createNoiseBuffer() {

      const length =
        this.ctx.sampleRate * 2;

      this.noiseBuffer =
        this.ctx.createBuffer(
          1,
          length,
          this.ctx.sampleRate
        );

      const data =
        this.noiseBuffer
          .getChannelData(0);

      for (
        let i = 0;
        i < length;
        i++
      ) {

        data[i] =
          Math.random() * 2 - 1;
      }
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    osc({
      type = 'sine',
      frequency = 440,
      endFrequency = null,
      duration = 0.1,
      volume = 0.1,
      delay = 0,
      attack = 0.002,
      destination = null
    } = {}) {

      if (
        !this.enabled ||
        !this.initialized
      ) {
        return;
      }

      const now =
        this.ctx.currentTime + delay;

      const oscillator =
        this.ctx.createOscillator();

      const gain =
        this.ctx.createGain();


      oscillator.type =
        type;

      oscillator.frequency
        .setValueAtTime(
          Math.max(
            20,
            frequency
          ),
          now
        );


      if (
        endFrequency !== null
      ) {

        oscillator.frequency
          .exponentialRampToValueAtTime(
            Math.max(
              20,
              endFrequency
            ),
            now + duration
          );
      }


      gain.gain
        .setValueAtTime(
          0.0001,
          now
        );

      gain.gain
        .exponentialRampToValueAtTime(
          Math.max(
            0.0001,
            volume
          ),
          now + attack
        );

      gain.gain
        .exponentialRampToValueAtTime(
          0.0001,
          now + duration
        );


      oscillator.connect(
        gain
      );

      gain.connect(
        destination ||
        this.sfxGain
      );


      oscillator.start(
        now
      );

      oscillator.stop(
        now +
        duration +
        0.03
      );
    }


    noise({
      duration = 0.1,
      volume = 0.1,
      delay = 0,
      lowpass = 1200,
      highpass = 0
    } = {}) {

      if (
        !this.enabled ||
        !this.initialized ||
        !this.noiseBuffer
      ) {
        return;
      }

      const now =
        this.ctx.currentTime + delay;

      const source =
        this.ctx.createBufferSource();

      const gain =
        this.ctx.createGain();


      source.buffer =
        this.noiseBuffer;


      let lastNode =
        source;


      if (
        highpass > 0
      ) {

        const filter =
          this.ctx.createBiquadFilter();

        filter.type =
          'highpass';

        filter.frequency.value =
          highpass;

        lastNode.connect(
          filter
        );

        lastNode =
          filter;
      }


      if (
        lowpass > 0
      ) {

        const filter =
          this.ctx.createBiquadFilter();

        filter.type =
          'lowpass';

        filter.frequency.value =
          lowpass;

        lastNode.connect(
          filter
        );

        lastNode =
          filter;
      }


      gain.gain
        .setValueAtTime(
          volume,
          now
        );

      gain.gain
        .exponentialRampToValueAtTime(
          0.0001,
          now + duration
        );


      lastNode.connect(
        gain
      );

      gain.connect(
        this.sfxGain
      );


      source.start(
        now
      );

      source.stop(
        now +
        duration +
        0.03
      );
    }


    click(
      frequency = 900,
      volume = 0.05
    ) {

      this.osc({

        type: 'square',

        frequency,

        endFrequency:
          frequency * 0.72,

        duration: 0.035,

        volume
      });
    }


    /* =====================================================
       WEAPON SOUNDS
    ===================================================== */

    shot(weaponId) {

      if (!this.initialized) {
        return;
      }

      switch (weaponId) {

        case 'pistol':

          this.osc({
            type: 'square',
            frequency: 210,
            endFrequency: 82,
            duration: 0.085,
            volume: 0.22
          });

          this.noise({
            duration: 0.05,
            volume: 0.08,
            lowpass: 1500
          });

          break;


        case 'smg':

          this.osc({
            type: 'square',
            frequency: 245,
            endFrequency: 105,
            duration: 0.045,
            volume: 0.12
          });

          this.noise({
            duration: 0.025,
            volume: 0.045,
            lowpass: 1900
          });

          break;


        case 'shotgun':

          this.noise({
            duration: 0.19,
            volume: 0.30,
            lowpass: 850
          });

          this.osc({
            type: 'sawtooth',
            frequency: 145,
            endFrequency: 42,
            duration: 0.16,
            volume: 0.22
          });

          this.osc({
            type: 'square',
            frequency: 80,
            endFrequency: 38,
            duration: 0.18,
            volume: 0.11
          });

          break;


        case 'plasma':

          this.osc({
            type: 'sawtooth',
            frequency: 490,
            endFrequency: 185,
            duration: 0.09,
            volume: 0.12
          });

          this.osc({
            type: 'sine',
            frequency: 870,
            endFrequency: 420,
            duration: 0.075,
            volume: 0.09
          });

          break;


        case 'railgun':

          this.osc({
            type: 'sawtooth',
            frequency: 1300,
            endFrequency: 110,
            duration: 0.20,
            volume: 0.20
          });

          this.osc({
            type: 'square',
            frequency: 720,
            endFrequency: 75,
            duration: 0.15,
            volume: 0.13
          });

          this.noise({
            duration: 0.12,
            volume: 0.12,
            highpass: 700,
            lowpass: 5000
          });

          break;


        case 'rocket':

          this.noise({
            duration: 0.24,
            volume: 0.23,
            lowpass: 800
          });

          this.osc({
            type: 'sawtooth',
            frequency: 110,
            endFrequency: 42,
            duration: 0.28,
            volume: 0.20
          });

          break;
      }
    }


    /* =====================================================
       IMPACT / DAMAGE
    ===================================================== */

    hit() {

      this.osc({
        type: 'triangle',
        frequency: 145,
        endFrequency: 75,
        duration: 0.05,
        volume: 0.08
      });

      this.noise({
        duration: 0.035,
        volume: 0.035,
        lowpass: 1300
      });
    }


    criticalHit() {

      this.hit();

      this.osc({
        type: 'square',
        frequency: 920,
        endFrequency: 350,
        duration: 0.09,
        volume: 0.10
      });
    }


    playerHit() {

      this.noise({
        duration: 0.12,
        volume: 0.16,
        lowpass: 650
      });

      this.osc({
        type: 'sawtooth',
        frequency: 130,
        endFrequency: 55,
        duration: 0.14,
        volume: 0.13
      });
    }


    shieldHit() {

      this.osc({
        type: 'sine',
        frequency: 850,
        endFrequency: 340,
        duration: 0.10,
        volume: 0.13
      });

      this.osc({
        type: 'triangle',
        frequency: 1200,
        endFrequency: 550,
        duration: 0.07,
        volume: 0.07
      });
    }


    /* =====================================================
       EXPLOSIONS
    ===================================================== */

    explosion(
      power = 1
    ) {

      power =
        Math.min(
          1.8,
          Math.max(
            0.4,
            power
          )
        );

      this.noise({
        duration:
          0.35 * power,

        volume:
          0.28 * power,

        lowpass: 520
      });

      this.osc({
        type: 'sawtooth',

        frequency:
          115 * power,

        endFrequency: 36,

        duration:
          0.30 * power,

        volume:
          0.17 * power
      });
    }


    bossExplosion() {

      this.explosion(
        1.5
      );

      this.noise({
        duration: 0.8,
        volume: 0.35,
        lowpass: 380,
        delay: 0.09
      });

      this.osc({
        type: 'sawtooth',
        frequency: 95,
        endFrequency: 28,
        duration: 0.72,
        volume: 0.25
      });

      this.osc({
        type: 'square',
        frequency: 65,
        endFrequency: 25,
        duration: 0.9,
        volume: 0.13
      });
    }


    /* =====================================================
       UI
    ===================================================== */

    pickup() {

      this.osc({
        type: 'sine',
        frequency: 520,
        endFrequency: 780,
        duration: 0.10,
        volume: 0.10
      });

      this.osc({
        type: 'triangle',
        frequency: 780,
        endFrequency: 1150,
        duration: 0.13,
        volume: 0.08,
        delay: 0.055
      });
    }


    reload() {

      this.click(
        380,
        0.06
      );

      this.click(
        620,
        0.05
      );
    }


    reloadComplete() {

      this.click(
        820,
        0.07
      );

      this.osc({
        type: 'sine',
        frequency: 520,
        endFrequency: 720,
        duration: 0.07,
        volume: 0.06
      });
    }


    weaponSwitch() {

      this.osc({
        type: 'triangle',
        frequency: 260,
        endFrequency: 430,
        duration: 0.07,
        volume: 0.07
      });
    }


    dash() {

      this.noise({
        duration: 0.14,
        volume: 0.10,
        lowpass: 1300,
        highpass: 180
      });

      this.osc({
        type: 'sawtooth',
        frequency: 220,
        endFrequency: 75,
        duration: 0.15,
        volume: 0.10
      });
    }


    levelUp() {

      const notes = [
        523.25,
        659.25,
        783.99,
        1046.5
      ];

      notes.forEach(
        (frequency, i) => {

          this.osc({
            type: 'triangle',
            frequency,
            endFrequency:
              frequency * 1.015,
            duration: 0.22,
            volume: 0.10,
            delay: i * 0.075
          });
        }
      );
    }


    upgradeSelect() {

      this.osc({
        type: 'sine',
        frequency: 480,
        endFrequency: 960,
        duration: 0.17,
        volume: 0.12
      });

      this.osc({
        type: 'triangle',
        frequency: 720,
        endFrequency: 1440,
        duration: 0.14,
        volume: 0.07,
        delay: 0.05
      });
    }


    waveStart() {

      this.osc({
        type: 'triangle',
        frequency: 160,
        endFrequency: 280,
        duration: 0.18,
        volume: 0.09
      });

      this.osc({
        type: 'triangle',
        frequency: 240,
        endFrequency: 420,
        duration: 0.19,
        volume: 0.08,
        delay: 0.09
      });
    }


    bossWarning() {

      for (
        let i = 0;
        i < 3;
        i++
      ) {

        this.osc({
          type: 'sawtooth',
          frequency: 105,
          endFrequency: 70,
          duration: 0.20,
          volume: 0.12,
          delay: i * 0.29
        });
      }
    }


    gameOver() {

      const notes = [
        330,
        270,
        210,
        145
      ];

      notes.forEach(
        (frequency, i) => {

          this.osc({
            type: 'sawtooth',
            frequency,
            endFrequency:
              frequency * 0.68,
            duration: 0.32,
            volume: 0.10,
            delay: i * 0.13
          });
        }
      );
    }


    victory() {

      const notes = [
        523,
        659,
        784,
        1047,
        1318
      ];

      notes.forEach(
        (frequency, i) => {

          this.osc({
            type: 'triangle',
            frequency,
            endFrequency:
              frequency * 1.01,
            duration: 0.30,
            volume: 0.11,
            delay: i * 0.10
          });
        }
      );
    }


    /* =====================================================
       AMBIENT DRONE
    ===================================================== */

    ambience() {

      if (
        !this.initialized ||
        !this.enabled
      ) {
        return;
      }

      const now =
        this.ctx.currentTime;

      const oscillator =
        this.ctx.createOscillator();

      const oscillator2 =
        this.ctx.createOscillator();

      const gain =
        this.ctx.createGain();

      const filter =
        this.ctx.createBiquadFilter();


      oscillator.type =
        'sine';

      oscillator.frequency.value =
        44;


      oscillator2.type =
        'triangle';

      oscillator2.frequency.value =
        66;


      gain.gain.value =
        0.035;


      filter.type =
        'lowpass';

      filter.frequency.value =
        220;


      oscillator.connect(
        filter
      );

      oscillator2.connect(
        filter
      );

      filter.connect(
        gain
      );

      gain.connect(
        this.musicGain
      );


      oscillator.start(
        now
      );

      oscillator2.start(
        now
      );


      this.ambientNodes = [
        oscillator,
        oscillator2,
        gain
      ];
    }


    stopAmbience() {

      if (!this.ambientNodes) {
        return;
      }

      for (
        const node
        of this.ambientNodes
      ) {

        try {

          if (node.stop) {
            node.stop();
          }

        } catch (_) {}
      }

      this.ambientNodes = null;
    }


    /* =====================================================
       VOLUME
    ===================================================== */

    setVolume(
      value
    ) {

      this.volume =
        NS.Util.clamp(
          value,
          0,
          1
        );

      if (this.master) {

        this.master.gain.value =
          this.volume;
      }
    }


    mute() {

      this.enabled = false;

      if (this.master) {

        this.master.gain.value =
          0;
      }
    }


    unmute() {

      this.enabled = true;

      if (this.master) {

        this.master.gain.value =
          this.volume;
      }

      this.resume();
    }

  }


  NS.Audio =
    new AudioEngine();


  console.log(
    'NEON SIEGE: audio engine loaded'
  );

})();

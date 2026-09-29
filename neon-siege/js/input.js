(() => {
  'use strict';

  const NS = window.NS;

  class InputManager {

    constructor() {

      this.initialized = false;

      this.keys = Object.create(null);

      this.moveX = 0;
      this.moveY = 0;

      this.aimX = 1;
      this.aimY = 0;

      this.aimActive = false;

      this.pointerX = 0;
      this.pointerY = 0;

      this.pointerInside = false;

      this.firing = false;

      this.mouseFiring = false;
      this.touchFiring = false;

      this.dashQueued = false;
      this.reloadQueued = false;
      this.weaponQueued = false;
      this.pauseQueued = false;

      this.movePointerId = null;
      this.aimPointerId = null;

      this.moveTouchX = 0;
      this.moveTouchY = 0;

      this.aimTouchX = 0;
      this.aimTouchY = 0;

      this.joystickRadius = 44;

      this.canvas = null;

      this.moveZone = null;
      this.moveStick = null;

      this.aimZone = null;
      this.aimStick = null;

      this.fireButton = null;
      this.dashButton = null;
      this.reloadButton = null;
      this.weaponButton = null;
    }


    /* =====================================================
       INIT
    ===================================================== */

    init() {

      if (this.initialized) {
        return;
      }

      this.canvas =
        document.getElementById('game');

      this.moveZone =
        document.getElementById('moveZone');

      this.moveStick =
        document.getElementById('moveStick');

      this.aimZone =
        document.getElementById('aimZone');

      this.aimStick =
        document.getElementById('aimStick');

      this.fireButton =
        document.getElementById('fireButton');

      this.dashButton =
        document.getElementById('dashButton');

      this.reloadButton =
        document.getElementById('reloadButton');

      this.weaponButton =
        document.getElementById('weaponButton');


      this.bindKeyboard();
      this.bindMouse();
      this.bindMoveJoystick();
      this.bindAimJoystick();
      this.bindButtons();
      this.bindWindowEvents();


      this.initialized = true;

      console.log(
        'NEON SIEGE: input system loaded'
      );
    }


    /* =====================================================
       KEYBOARD
    ===================================================== */

    bindKeyboard() {

      window.addEventListener(
        'keydown',
        event => {

          const code =
            event.code;


          if (
            [
              'ArrowUp',
              'ArrowDown',
              'ArrowLeft',
              'ArrowRight',
              'Space'
            ].includes(code)
          ) {

            event.preventDefault();
          }


          const wasDown =
            !!this.keys[code];

          this.keys[code] = true;


          if (wasDown) {
            return;
          }


          if (
            code === 'ShiftLeft' ||
            code === 'ShiftRight' ||
            code === 'Space'
          ) {

            this.dashQueued = true;
          }


          if (
            code === 'KeyR'
          ) {

            this.reloadQueued = true;
          }


          if (
            code === 'KeyQ' ||
            code === 'KeyE' ||
            code === 'Tab'
          ) {

            if (code === 'Tab') {
              event.preventDefault();
            }

            this.weaponQueued = true;
          }


          if (
            code === 'Escape' ||
            code === 'KeyP'
          ) {

            this.pauseQueued = true;
          }
        },
        {
          passive: false
        }
      );


      window.addEventListener(
        'keyup',
        event => {

          this.keys[
            event.code
          ] = false;
        }
      );
    }


    /* =====================================================
       MOUSE
    ===================================================== */

    bindMouse() {

      if (!this.canvas) {
        return;
      }


      this.canvas.addEventListener(
        'pointermove',
        event => {

          if (
            event.pointerType !== 'mouse' &&
            event.pointerType !== 'pen'
          ) {
            return;
          }

          this.updatePointerPosition(
            event
          );

          this.pointerInside = true;

          this.aimActive = true;
        }
      );


      this.canvas.addEventListener(
        'pointerenter',
        event => {

          if (
            event.pointerType === 'mouse' ||
            event.pointerType === 'pen'
          ) {

            this.pointerInside = true;
          }
        }
      );


      this.canvas.addEventListener(
        'pointerleave',
        event => {

          if (
            event.pointerType === 'mouse' ||
            event.pointerType === 'pen'
          ) {

            this.pointerInside = false;

            this.mouseFiring = false;

            this.refreshFireState();
          }
        }
      );


      this.canvas.addEventListener(
        'pointerdown',
        event => {

          if (
            event.pointerType !== 'mouse' &&
            event.pointerType !== 'pen'
          ) {
            return;
          }

          if (
            event.button !== 0
          ) {
            return;
          }

          this.updatePointerPosition(
            event
          );

          this.mouseFiring = true;

          this.refreshFireState();


          if (
            NS.Audio &&
            NS.Audio.initialized
          ) {

            NS.Audio.resume();
          }
        }
      );


      window.addEventListener(
        'pointerup',
        event => {

          if (
            event.pointerType !== 'mouse' &&
            event.pointerType !== 'pen'
          ) {
            return;
          }

          if (
            event.button === 0
          ) {

            this.mouseFiring = false;

            this.refreshFireState();
          }
        }
      );


      this.canvas.addEventListener(
        'contextmenu',
        event => {

          event.preventDefault();
        }
      );
    }


    updatePointerPosition(
      event
    ) {

      if (!this.canvas) {
        return;
      }

      const rect =
        this.canvas
          .getBoundingClientRect();

      this.pointerX =
        event.clientX -
        rect.left;

      this.pointerY =
        event.clientY -
        rect.top;
    }


    /* =====================================================
       MOVE JOYSTICK
    ===================================================== */

    bindMoveJoystick() {

      if (
        !this.moveZone ||
        !this.moveStick
      ) {
        return;
      }


      this.moveZone.addEventListener(
        'pointerdown',
        event => {

          event.preventDefault();

          if (
            this.movePointerId !== null
          ) {
            return;
          }


          this.movePointerId =
            event.pointerId;


          try {

            this.moveZone
              .setPointerCapture(
                event.pointerId
              );

          } catch (_) {}


          this.updateMoveJoystick(
            event
          );
        },
        {
          passive: false
        }
      );


      this.moveZone.addEventListener(
        'pointermove',
        event => {

          if (
            event.pointerId !==
            this.movePointerId
          ) {
            return;
          }

          event.preventDefault();

          this.updateMoveJoystick(
            event
          );
        },
        {
          passive: false
        }
      );


      const release =
        event => {

          if (
            event.pointerId !==
            this.movePointerId
          ) {
            return;
          }

          this.movePointerId = null;

          this.moveTouchX = 0;
          this.moveTouchY = 0;

          this.centerStick(
            this.moveStick
          );
        };


      this.moveZone.addEventListener(
        'pointerup',
        release
      );

      this.moveZone.addEventListener(
        'pointercancel',
        release
      );

      this.moveZone.addEventListener(
        'lostpointercapture',
        event => {

          if (
            event.pointerId ===
            this.movePointerId
          ) {

            this.movePointerId = null;

            this.moveTouchX = 0;
            this.moveTouchY = 0;

            this.centerStick(
              this.moveStick
            );
          }
        }
      );
    }


    updateMoveJoystick(
      event
    ) {

      const result =
        this.calculateJoystick(
          this.moveZone,
          event
        );


      this.moveTouchX =
        result.x;

      this.moveTouchY =
        result.y;


      this.positionStick(
        this.moveStick,
        result.visualX,
        result.visualY
      );
    }


    /* =====================================================
       AIM JOYSTICK
    ===================================================== */

    bindAimJoystick() {

      if (
        !this.aimZone ||
        !this.aimStick
      ) {
        return;
      }


      this.aimZone.addEventListener(
        'pointerdown',
        event => {

          event.preventDefault();

          if (
            this.aimPointerId !== null
          ) {
            return;
          }


          this.aimPointerId =
            event.pointerId;


          try {

            this.aimZone
              .setPointerCapture(
                event.pointerId
              );

          } catch (_) {}


          this.aimActive = true;

          this.updateAimJoystick(
            event
          );
        },
        {
          passive: false
        }
      );


      this.aimZone.addEventListener(
        'pointermove',
        event => {

          if (
            event.pointerId !==
            this.aimPointerId
          ) {
            return;
          }

          event.preventDefault();

          this.updateAimJoystick(
            event
          );
        },
        {
          passive: false
        }
      );


      const release =
        event => {

          if (
            event.pointerId !==
            this.aimPointerId
          ) {
            return;
          }

          this.aimPointerId = null;

          this.aimTouchX = 0;
          this.aimTouchY = 0;

          this.aimActive = false;

          this.centerStick(
            this.aimStick
          );
        };


      this.aimZone.addEventListener(
        'pointerup',
        release
      );

      this.aimZone.addEventListener(
        'pointercancel',
        release
      );

      this.aimZone.addEventListener(
        'lostpointercapture',
        event => {

          if (
            event.pointerId ===
            this.aimPointerId
          ) {

            this.aimPointerId = null;

            this.aimTouchX = 0;
            this.aimTouchY = 0;

            this.aimActive = false;

            this.centerStick(
              this.aimStick
            );
          }
        }
      );
    }


    updateAimJoystick(
      event
    ) {

      const result =
        this.calculateJoystick(
          this.aimZone,
          event
        );


      this.aimTouchX =
        result.x;

      this.aimTouchY =
        result.y;


      const magnitude =
        Math.hypot(
          result.x,
          result.y
        );


      if (
        magnitude > 0.15
      ) {

        const normal =
          NS.Util.normalize(
            result.x,
            result.y
          );

        this.aimX =
          normal.x;

        this.aimY =
          normal.y;

        this.aimActive = true;
      }


      this.positionStick(
        this.aimStick,
        result.visualX,
        result.visualY
      );
    }


    /* =====================================================
       JOYSTICK HELPERS
    ===================================================== */

    calculateJoystick(
      element,
      event
    ) {

      const rect =
        element
          .getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width * 0.5;

      const centerY =
        rect.top +
        rect.height * 0.5;


      let dx =
        event.clientX -
        centerX;

      let dy =
        event.clientY -
        centerY;


      const distance =
        Math.hypot(
          dx,
          dy
        );


      const radius =
        Math.min(
          this.joystickRadius,
          Math.min(
            rect.width,
            rect.height
          ) * 0.35
        );


      if (
        distance > radius &&
        distance > 0
      ) {

        dx =
          dx /
          distance *
          radius;

        dy =
          dy /
          distance *
          radius;
      }


      let x =
        dx /
        radius;

      let y =
        dy /
        radius;


      const magnitude =
        Math.hypot(
          x,
          y
        );


      /*
        Dead zone prevents drift.
      */

      const deadZone =
        0.10;


      if (
        magnitude <
        deadZone
      ) {

        x = 0;
        y = 0;
      }


      return {

        x,
        y,

        visualX: dx,
        visualY: dy
      };
    }


    positionStick(
      stick,
      x,
      y
    ) {

      if (!stick) {
        return;
      }

      stick.style.transform =
        `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }


    centerStick(
      stick
    ) {

      if (!stick) {
        return;
      }

      stick.style.transform =
        'translate(-50%, -50%)';
    }


    /* =====================================================
       TOUCH BUTTONS
    ===================================================== */

    bindButtons() {

      this.bindHoldButton(
        this.fireButton,

        () => {

          this.touchFiring = true;

          this.refreshFireState();
        },

        () => {

          this.touchFiring = false;

          this.refreshFireState();
        }
      );


      this.bindPressButton(
        this.dashButton,
        () => {

          this.dashQueued = true;
        }
      );


      this.bindPressButton(
        this.reloadButton,
        () => {

          this.reloadQueued = true;
        }
      );


      this.bindPressButton(
        this.weaponButton,
        () => {

          this.weaponQueued = true;
        }
      );
    }


    bindHoldButton(
      button,
      onPress,
      onRelease
    ) {

      if (!button) {
        return;
      }


      button.addEventListener(
        'pointerdown',
        event => {

          event.preventDefault();

          try {

            button.setPointerCapture(
              event.pointerId
            );

          } catch (_) {}


          button.classList.add(
            'active'
          );


          onPress();


          if (
            NS.Audio &&
            NS.Audio.initialized
          ) {

            NS.Audio.resume();
          }
        },
        {
          passive: false
        }
      );


      const release =
        event => {

          event.preventDefault();

          button.classList.remove(
            'active'
          );

          onRelease();
        };


      button.addEventListener(
        'pointerup',
        release,
        {
          passive: false
        }
      );

      button.addEventListener(
        'pointercancel',
        release,
        {
          passive: false
        }
      );

      button.addEventListener(
        'lostpointercapture',
        () => {

          button.classList.remove(
            'active'
          );

          onRelease();
        }
      );
    }


    bindPressButton(
      button,
      callback
    ) {

      if (!button) {
        return;
      }


      button.addEventListener(
        'pointerdown',
        event => {

          event.preventDefault();

          try {

            button.setPointerCapture(
              event.pointerId
            );

          } catch (_) {}


          button.classList.add(
            'active'
          );


          callback();


          if (
            NS.Audio &&
            NS.Audio.initialized
          ) {

            NS.Audio.resume();
          }
        },
        {
          passive: false
        }
      );


      const release =
        () => {

          button.classList.remove(
            'active'
          );
        };


      button.addEventListener(
        'pointerup',
        release
      );

      button.addEventListener(
        'pointercancel',
        release
      );

      button.addEventListener(
        'lostpointercapture',
        release
      );
    }


    refreshFireState() {

      this.firing =
        this.mouseFiring ||
        this.touchFiring;
    }


    /* =====================================================
       WINDOW EVENTS
    ===================================================== */

    bindWindowEvents() {

      window.addEventListener(
        'blur',
        () => {

          this.resetHeldInputs();

          if (
            NS.Game &&
            NS.Game.running &&
            !NS.Game.paused
          ) {

            this.pauseQueued =
              true;
          }
        }
      );


      document.addEventListener(
        'visibilitychange',
        () => {

          if (
            document.hidden
          ) {

            this.resetHeldInputs();

            if (
              NS.Game &&
              NS.Game.running &&
              !NS.Game.paused
            ) {

              this.pauseQueued =
                true;
            }
          }
        }
      );


      document.addEventListener(
        'touchmove',
        event => {

          if (
            event.target.closest &&
            event.target.closest(
              '#mobileControls'
            )
          ) {

            event.preventDefault();
          }
        },
        {
          passive: false
        }
      );
    }


    resetHeldInputs() {

      this.keys =
        Object.create(null);

      this.mouseFiring =
        false;

      this.touchFiring =
        false;

      this.firing =
        false;

      this.moveTouchX = 0;
      this.moveTouchY = 0;

      this.aimTouchX = 0;
      this.aimTouchY = 0;

      this.movePointerId =
        null;

      this.aimPointerId =
        null;


      this.centerStick(
        this.moveStick
      );

      this.centerStick(
        this.aimStick
      );
    }


    /* =====================================================
       FRAME UPDATE
    ===================================================== */

    update(
      player = null
    ) {

      /*
        Keyboard movement
      */

      let keyboardX = 0;
      let keyboardY = 0;


      if (
        this.keys.KeyA ||
        this.keys.ArrowLeft
      ) {

        keyboardX -= 1;
      }


      if (
        this.keys.KeyD ||
        this.keys.ArrowRight
      ) {

        keyboardX += 1;
      }


      if (
        this.keys.KeyW ||
        this.keys.ArrowUp
      ) {

        keyboardY -= 1;
      }


      if (
        this.keys.KeyS ||
        this.keys.ArrowDown
      ) {

        keyboardY += 1;
      }


      /*
        Touch joystick takes priority while
        the player is touching it.
      */

      if (
        this.movePointerId !== null
      ) {

        this.moveX =
          this.moveTouchX;

        this.moveY =
          this.moveTouchY;

      } else {

        const length =
          Math.hypot(
            keyboardX,
            keyboardY
          );


        if (
          length > 1
        ) {

          keyboardX /= length;
          keyboardY /= length;
        }


        this.moveX =
          keyboardX;

        this.moveY =
          keyboardY;
      }


      /*
        Desktop aim direction is computed
        from player position to mouse.
      */

      if (
        player &&
        this.pointerInside &&
        !NS.Device.mobile
      ) {

        const dx =
          this.pointerX -
          player.x;

        const dy =
          this.pointerY -
          player.y;


        const normal =
          NS.Util.normalize(
            dx,
            dy
          );


        if (
          Math.hypot(
            normal.x,
            normal.y
          ) > 0.1
        ) {

          this.aimX =
            normal.x;

          this.aimY =
            normal.y;

          this.aimActive =
            true;
        }
      }


      /*
        Mobile right joystick.
      */

      if (
        this.aimPointerId !== null
      ) {

        const magnitude =
          Math.hypot(
            this.aimTouchX,
            this.aimTouchY
          );


        if (
          magnitude > 0.12
        ) {

          const normal =
            NS.Util.normalize(
              this.aimTouchX,
              this.aimTouchY
            );


          this.aimX =
            normal.x;

          this.aimY =
            normal.y;

          this.aimActive =
            true;
        }
      }
    }


    /* =====================================================
       ONE-SHOT ACTIONS
    ===================================================== */

    consumeDash() {

      if (!this.dashQueued) {
        return false;
      }

      this.dashQueued = false;

      return true;
    }


    consumeReload() {

      if (!this.reloadQueued) {
        return false;
      }

      this.reloadQueued = false;

      return true;
    }


    consumeWeaponSwitch() {

      if (!this.weaponQueued) {
        return false;
      }

      this.weaponQueued = false;

      return true;
    }


    consumePause() {

      if (!this.pauseQueued) {
        return false;
      }

      this.pauseQueued = false;

      return true;
    }


    /* =====================================================
       PUBLIC HELPERS
    ===================================================== */

    getMoveVector() {

      return {
        x: this.moveX,
        y: this.moveY
      };
    }


    getAimVector() {

      return {
        x: this.aimX,
        y: this.aimY
      };
    }


    getAimAngle() {

      return Math.atan2(
        this.aimY,
        this.aimX
      );
    }


    isMoving() {

      return (
        Math.hypot(
          this.moveX,
          this.moveY
        ) > 0.1
      );
    }


    isFiring() {

      return this.firing;
    }

  }


  NS.Input =
    new InputManager();

})();

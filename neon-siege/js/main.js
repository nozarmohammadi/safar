(() => {
  'use strict';

  const NS = window.NS;

  let loopStarted = false;

  const startScreen =
    document.getElementById(
      'startScreen'
    );

  const pauseScreen =
    document.getElementById(
      'pauseScreen'
    );

  const gameOverScreen =
    document.getElementById(
      'gameOverScreen'
    );

  const startButton =
    document.getElementById(
      'startButton'
    );

  const resumeButton =
    document.getElementById(
      'resumeButton'
    );

  const restartButton =
    document.getElementById(
      'restartButton'
    );

  const gameOverRestartButton =
    document.getElementById(
      'gameOverRestartButton'
    );


  /* =====================================================
     START GAME
  ===================================================== */

  function startGame() {

    if (
      NS.Audio
    ) {

      NS.Audio.init();
      NS.Audio.resume();
    }


    if (
      startScreen
    ) {

      startScreen
        .classList
        .add(
          'hidden'
        );
    }


    if (
      pauseScreen
    ) {

      pauseScreen
        .classList
        .add(
          'hidden'
        );
    }


    if (
      gameOverScreen
    ) {

      gameOverScreen
        .classList
        .add(
          'hidden'
        );
    }


    NS.Game.start();


    if (
      !loopStarted
    ) {

      loopStarted = true;

      NS.Game.launchLoop();
    }
  }


  /* =====================================================
     RESTART
  ===================================================== */

  function restartGame() {

    if (
      NS.Audio
    ) {

      NS.Audio.resume();
    }


    if (
      pauseScreen
    ) {

      pauseScreen
        .classList
        .add(
          'hidden'
        );
    }


    if (
      gameOverScreen
    ) {

      gameOverScreen
        .classList
        .add(
          'hidden'
        );
    }


    NS.Game.start();


    if (
      !loopStarted
    ) {

      loopStarted = true;

      NS.Game.launchLoop();
    }
  }


  /* =====================================================
     RESUME
  ===================================================== */

  function resumeGame() {

    if (
      !NS.Game
    ) {
      return;
    }


    if (
      NS.Game.paused
    ) {

      NS.Game.togglePause();
    }


    if (
      pauseScreen
    ) {

      pauseScreen
        .classList
        .add(
          'hidden'
        );
    }


    if (
      NS.Audio
    ) {

      NS.Audio.resume();
    }
  }


  /* =====================================================
     BUTTONS
  ===================================================== */

  if (
    startButton
  ) {

    startButton.addEventListener(
      'click',
      startGame
    );
  }


  if (
    resumeButton
  ) {

    resumeButton.addEventListener(
      'click',
      resumeGame
    );
  }


  if (
    restartButton
  ) {

    restartButton.addEventListener(
      'click',
      restartGame
    );
  }


  if (
    gameOverRestartButton
  ) {

    gameOverRestartButton
      .addEventListener(
        'click',
        restartGame
      );
  }


  /* =====================================================
     INPUT INITIALIZATION
  ===================================================== */

  NS.Input.init();


  /* =====================================================
     MOBILE FULLSCREEN HELPERS
  ===================================================== */

  function requestFullscreen() {

    const root =
      document.documentElement;


    if (
      document.fullscreenElement
    ) {
      return;
    }


    if (
      root.requestFullscreen
    ) {

      root.requestFullscreen()
        .catch(
          () => {}
        );
    }
  }


  /*
    Fullscreen is attempted only after a
    real user interaction.
  */

  if (
    NS.Device.mobile &&
    startButton
  ) {

    startButton.addEventListener(
      'click',
      () => {

        setTimeout(
          requestFullscreen,
          120
        );

      },
      {
        once: true
      }
    );
  }


  /* =====================================================
     PREVENT MOBILE BROWSER GESTURES
  ===================================================== */

  document.addEventListener(
    'contextmenu',
    event => {

      if (
        event.target.closest &&
        (
          event.target.closest(
            '#game'
          ) ||
          event.target.closest(
            '#mobileControls'
          )
        )
      ) {

        event.preventDefault();
      }
    }
  );


  document.addEventListener(
    'gesturestart',
    event => {

      event.preventDefault();

    },
    {
      passive: false
    }
  );


  document.addEventListener(
    'gesturechange',
    event => {

      event.preventDefault();

    },
    {
      passive: false
    }
  );


  document.addEventListener(
    'gestureend',
    event => {

      event.preventDefault();

    },
    {
      passive: false
    }
  );


  /* =====================================================
     VISIBILITY
  ===================================================== */

  document.addEventListener(
    'visibilitychange',
    () => {

      if (
        document.hidden
      ) {

        return;
      }


      if (
        NS.Audio
      ) {

        NS.Audio.resume();
      }
    }
  );


  /* =====================================================
     ORIENTATION
  ===================================================== */

  window.addEventListener(
    'orientationchange',
    () => {

      setTimeout(
        () => {

          if (
            NS.Game
          ) {

            NS.Game.resize();
          }

        },
        180
      );
    }
  );


  /* =====================================================
     INITIAL PREVIEW
  ===================================================== */

  NS.Game.render();


  console.log(
    '%c NEON SIEGE READY ',
    'background:#00e5ff;color:#020711;font-weight:bold;padding:6px 10px;border-radius:5px;'
  );

})();

(function () {
  function setupMusicControls() {
    var audio = document.getElementById("bgmMusic");
    var power = document.querySelector(".mPower");
    var onBtn = document.getElementById("on");
    var offBtn = document.getElementById("off");

    if (!audio || !power || !onBtn || !offBtn) return;

    function sync() {
      var paused = audio.paused;
      onBtn.style.display = paused ? "none" : "inline-block";
      offBtn.style.display = paused ? "inline-block" : "none";
    }

    power.style.display = "block";
    sync();

    onBtn.addEventListener("click", function () {
      audio.pause();
      sync();
    });

    offBtn.addEventListener("click", function () {
      audio.play().catch(function () {});
      sync();
    });

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        audio.pause();
      }
      sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMusicControls);
  } else {
    setupMusicControls();
  }
})();

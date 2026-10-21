(() => {
  const beginButton = document.getElementById("beginButton");
  const pauseButton = document.getElementById("pauseButton");
  const restartButton = document.getElementById("restartButton");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const soundError = document.getElementById("soundError");
  const experience = document.getElementById("experience");
  const history = document.getElementById("history");
  const sceneNumber = document.getElementById("sceneNumber");
  const sceneTitle = document.getElementById("sceneTitle");
  const sceneDescription = document.getElementById("sceneDescription");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");
  const stageCaption = document.getElementById("stageCaption");
  const roomScene = document.getElementById("roomScene");
  const blurHaze = document.getElementById("blurHaze");
  const eyeBlink = document.getElementById("eyeBlink");
  let started = false, lastProgress = -1, ticking = false, lastStage = -1;

  const scenes = [
    { at: 0, number: "EYES OPEN / THE ORDINARY NIGHT", title: "A city is going to sleep.", desc: "A ceiling fan turns above the bed. Yellow streetlight spills through the window; a wedding carries on outside.", label: "EYES OPEN · THE ORDINARY NIGHT" },
    { at: .20, number: "FIRST BLINK / SOMETHING OUTSIDE", title: "The siren comes closer.", desc: "The wedding disappears behind the siren. Dogs begin barking in the lanes below.", label: "FIRST BLINK · THE SIREN APPROACHES" },
    { at: .40, number: "SECOND BLINK / THE FIRST COUGHS", title: "The night no longer sounds normal.", desc: "The siren grows clearer. Dogs bark, and coughing starts from nearby homes. The wind begins to fall away.", label: "SECOND BLINK · COUGHS IN THE LANES" },
    { at: .60, number: "THIRD BLINK / THE NEIGHBOURHOOD", title: "Everyone is coughing.", desc: "The wind is gone. Coughs overlap from different homes; a baby begins to cry. The ceiling and fan start to blur.", label: "THIRD BLINK · THE ROOM BLURS" },
    { at: .80, number: "FOURTH BLINK / LOSING SIGHT", title: "He struggles to keep his eyes open.", desc: "A cough tears through the room. Babies fall silent one by one; neighbours fade into silence as the siren fills everything.", label: "FOURTH BLINK · SIGHT AND SOUND FADE" },
    { at: .985, number: "EYES CLOSED / SILENCE", title: "", desc: "", label: "EYES CLOSED · SILENCE" }
  ];

  function getProgress() {
    const rect = experience.getBoundingClientRect();
    const scrollable = experience.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / scrollable));
  }
  function sceneFor(p) {
    let s = scenes[0];
    for (const item of scenes) if (p >= item.at) s = item;
    return s;
  }
  function render() {
    ticking = false;
    if (!started) return;
    const p = getProgress();
    if (Math.abs(p - lastProgress) < .001) return;
    lastProgress = p;
    const scene = sceneFor(p);
    const stageIndex = scenes.indexOf(scene);
    if (stageIndex !== lastStage && stageIndex > 0 && stageIndex < 5) {
      eyeBlink.classList.remove("blinking");
      void eyeBlink.offsetWidth;
      eyeBlink.classList.add("blinking");
      window.setTimeout(() => eyeBlink.classList.remove("blinking"), 380);
    }
    lastStage = stageIndex;
    sceneNumber.textContent = scene.number;
    sceneTitle.textContent = scene.title;
    sceneDescription.textContent = scene.desc;
    progressFill.style.width = `${p * 100}%`;
    progressLabel.textContent = scene.label;
    const blackout = Math.max(0, Math.min(1, (p - .91) / .085));
    sceneTitle.style.opacity = 1 - blackout;
    sceneDescription.style.opacity = 1 - blackout;
    sceneNumber.style.opacity = 1 - blackout;
    stageCaption.textContent = scene.label;
    const blur = Math.max(0, Math.min(12, (p - .57) * 18 + Math.max(0, p - .78) * 30));
    roomScene.style.filter = `blur(${blur}px)`;
    roomScene.style.transform = `scale(${1.015 + blur * .002})`;
    blurHaze.style.backdropFilter = `blur(${Math.max(0, (p - .58) * 10 + Math.max(0, p - .8) * 16)}px)`;
    blurHaze.style.background = `rgba(184,155,104,${Math.max(0, Math.min(.22, (p - .65) * .35))})`;
    window.BhopalVisuals?.setProgress(p);
    window.BhopalAudio?.update(p);
  }
  function requestRender() {
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }
  async function startExperience() {
    if (started) {
      document.getElementById("experience").scrollIntoView({ behavior: "smooth" });
      window.BhopalAudio?.resume();
      return;
    }
    beginButton.disabled = true;
    beginButton.querySelector("span:nth-child(2)").textContent = "Loading sound…";
    try {
      const result = await window.BhopalAudio.init();
      if (result?.failed?.length) {
        soundError.hidden = false;
        soundError.textContent = "Some files could not be loaded: " + result.failed.join(", ") + ". Check the README and assets/audio folder.";
      }
      window.BhopalAudio.begin();
      started = true;
      pauseButton.disabled = false;
      pauseButton.textContent = "Pause sound";
      loadingOverlay.classList.add("hidden");
      experience.scrollIntoView({ behavior: "smooth" });
      beginButton.querySelector("span:nth-child(2)").textContent = "Listening started";
      requestRender();
    } catch (error) {
      console.error(error);
      beginButton.disabled = false;
      beginButton.querySelector("span:nth-child(2)").textContent = "Try again";
      soundError.hidden = false;
      soundError.textContent = "Audio could not start. Open this project through a local web server (see README), then try again.";
      loadingOverlay.classList.add("hidden");
    }
  }
  beginButton.addEventListener("click", startExperience);
  pauseButton.addEventListener("click", () => {
    if (!started) return;
    const s = window.BhopalAudio.getState();
    if (s.paused) {
      window.BhopalAudio.resume();
      pauseButton.textContent = "Pause sound";
    } else {
      window.BhopalAudio.pause();
      pauseButton.textContent = "Resume sound";
    }
  });
  restartButton.addEventListener("click", () => {
    if (started) window.BhopalAudio.restart();
    started = false;
    lastProgress = -1;
    lastStage = -1;
    roomScene.style.filter = "blur(0px)";
    roomScene.style.transform = "scale(1.015)";
    blurHaze.style.backdropFilter = "blur(0px)";
    blurHaze.style.background = "rgba(184,155,104,0)";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause sound";
    beginButton.disabled = false;
    beginButton.querySelector("span:nth-child(2)").textContent = "Begin listening";
    loadingOverlay.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.BhopalVisuals?.setProgress(0);
  });
  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);
  // If the user reaches the historical section, keep the sound engine quiet.
  const observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting) && started) {
      window.BhopalAudio?.update(1);
    }
  }, { threshold: 0.1 });
  observer.observe(history);
})();
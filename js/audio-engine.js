/* Blink-driven spatial audio timeline for The Night Bhopal Went Silent. */
(() => {
  const CONFIG = {
    fan: { file: "ceiling_fan.mp3", position: [0, 1.2, -0.7], gain: 0.24, loop: true },
    wedding: { file: "wedding.mp3", position: [7, 0, -13], gain: 0.19, loop: true },
    night: { file: "night_ambience.mp3", position: [-7, 0, -9], gain: 0.20, loop: true },
    wind: { file: "wind.mp3", position: [2, 0, -10], gain: 0.035, loop: true },
    trainRunning: { file: "train_running.mp3", position: [-13, 0, -18], gain: 0.11, loop: true },
    trainHorn: { file: "train_horn.mp3", position: [-15, 0, -18], gain: 0.16, loop: false },
    dogBarks: { file: "dog_barks.mp3", position: [11, 0, -7], gain: 0.16, loop: false },
    coughFemale: { file: "cough_female.mp3", position: [-5, 0, -4], gain: 0.34, loop: false },
    coughMale1: { file: "cough_male_1.mp3", position: [5, 0, -6], gain: 0.36, loop: false },
    coughMale2: { file: "cough_male_2.mp3", position: [-2, 0, -8], gain: 0.35, loop: false },
    coughPOV: { file: "cough_male_1.mp3", position: [0, 0, -0.35], gain: 0.72, loop: false },
    siren: { file: "siren.mp3", position: [0, 0, -20], gain: 0.78, loop: true },
    ambulance: { file: "ambulance.mp3", position: [8, 0, -16], gain: 0.23, loop: false },
    dogWhine: { file: "dog_whine.mp3", position: [9, 0, -3], gain: 0.40, loop: false },
    child1: { file: "child_cry_1.mp3", position: [-8, 0, -4], gain: 0.32, loop: false },
    child2: { file: "child_cry_2.mp3", position: [7, 0, -10], gain: 0.30, loop: false }
  };

  const state = { ctx: null, master: null, nodes: {}, buffers: {}, started: false, paused: false, loaded: false, progress: 0, played: new Set(), lastUpdate: 0, coughBeats: new Set(), fadeTargets: {} };
  const root = "assets/audio/";

  function setParam(param, value, duration = 0.5) {
    if (!state.ctx || !param) return;
    const now = state.ctx.currentTime;
    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(Math.max(0, value), now + Math.max(0.01, duration));
    } catch (e) { param.value = Math.max(0, value); }
  }
  async function loadBuffer(file) {
    const response = await fetch(root + file);
    if (!response.ok) throw new Error("Could not load " + file);
    return await state.ctx.decodeAudioData(await response.arrayBuffer());
  }
  async function init() {
    if (state.ctx) return { failed: [] };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("This browser does not support the Web Audio API.");
    state.ctx = new AC();
    state.master = state.ctx.createGain();
    state.master.gain.value = 0.82;
    state.master.connect(state.ctx.destination);
    const entries = Object.entries(CONFIG);
    const results = await Promise.allSettled(entries.map(async ([key, item]) => { state.buffers[key] = await loadBuffer(item.file); }));
    const failed = [];
    results.forEach((r, i) => { if (r.status === "rejected") failed.push(entries[i][1].file); });
    for (const [key, item] of entries) {
      if (!state.buffers[key]) continue;
      const gain = state.ctx.createGain(); gain.gain.value = 0;
      const panner = state.ctx.createPanner();
      panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1; panner.maxDistance = 100; panner.rolloffFactor = 1;
      panner.positionX.value = item.position[0]; panner.positionY.value = item.position[1]; panner.positionZ.value = item.position[2];
      gain.connect(panner); panner.connect(state.master);
      state.nodes[key] = { gain, panner, item, source: null, started: false };
    }
    state.loaded = true;
    return { failed };
  }
  function createSource(key, offset = 0) {
    const node = state.nodes[key], buffer = state.buffers[key];
    if (!node || !buffer || !state.ctx) return false;
    if (node.source) { try { node.source.stop(); } catch (_) {} try { node.source.disconnect(); } catch (_) {} }
    const source = state.ctx.createBufferSource(); source.buffer = buffer; source.loop = !!node.item.loop; source.connect(node.gain);
    node.source = source; node.started = true;
    try { source.start(0, Math.min(offset, Math.max(0, buffer.duration - 0.01))); } catch (_) { try { source.start(); } catch (__) {} }
    return true;
  }
  function startLoop(key, targetGain, fade = 2) {
    const node = state.nodes[key]; if (!node) return;
    if (!node.started) createSource(key);
    setParam(node.gain.gain, targetGain, fade);
  }
  function fire(key, targetGain, options = {}) {
    if (state.played.has(key)) return;
    state.played.add(key); playAgain(key, targetGain, options);
  }
  function playAgain(key, targetGain, options = {}) {
    const node = state.nodes[key]; if (!node) return;
    if (!createSource(key, options.offset || 0)) return;
    setParam(node.gain.gain, targetGain ?? node.item.gain, options.fadeIn ?? 0.12);
    if (!node.item.loop) {
      const buffer = state.buffers[key];
      const duration = Math.max(0.3, (buffer?.duration || 1) - (options.offset || 0));
      window.setTimeout(() => { if (node.gain && node.source) setParam(node.gain.gain, 0, 0.35); }, Math.max(300, duration * 1000));
    }
  }
  function fade(key, target, duration = 1) { const node = state.nodes[key]; if (!node) return; const prior = state.fadeTargets[key]; if (prior !== undefined && Math.abs(prior - target) < 0.025) return; state.fadeTargets[key] = target; setParam(node.gain.gain, target, duration); }
  function playInitial() {
    if (!state.ctx) return;
    state.ctx.resume();
    ["fan", "wedding", "night", "wind", "trainRunning"].forEach(key => startLoop(key, CONFIG[key].gain, 2.4));
    window.setTimeout(() => { if (state.started && state.progress < 0.2) playAgain("dogBarks", 0.095); }, 4200);
    window.setTimeout(() => { if (state.started && state.progress < 0.2) playAgain("trainHorn", 0.12); }, 6500);
  }
  const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  function update(progress) {
    if (!state.ctx || !state.started || state.paused) return;
    const p = Math.max(0, Math.min(1, progress)); state.progress = p;
    // Eyes open: the fan, distant wedding, train and occasional neighbourhood dogs.
    if (p < 0.2) {
      const sirenNode = state.nodes.siren;
      if (p >= 0.13 && sirenNode && !sirenNode.started) { createSource("siren"); setParam(sirenNode.gain.gain, 0.09, 3); }
    }
    // First blink: wedding cuts away; siren steps forward and dogs bark again.
    if (p >= 0.2) {
      fade("wedding", 0, 0.7); fade("siren", 0.39, 1.2); fade("wind", 0.022, 1.2);
      if (!state.played.has("blink1Dogs")) { state.played.add("blink1Dogs"); playAgain("dogBarks", 0.17); }
    }
    // Second blink: coughs emerge from nearby homes; the wind recedes almost completely.
    if (p >= 0.4) {
      fade("siren", 0.55, 1); fade("wind", 0.008, 1.2);
      fire("coughFemale", 0.29); fire("coughMale1", 0.28);
      if (!state.played.has("blink2Dogs")) { state.played.add("blink2Dogs"); playAgain("dogBarks", 0.15); }
    }
    // Third blink: wind disappears; coughs repeat from different positions and one baby cries.
    if (p >= 0.6) {
      fade("wind", 0, 0.8); fade("siren", 0.69, 1);
      fire("child1", 0.29);
      const coughMarks = [[0.635, "coughMale2"], [0.675, "coughFemale"], [0.715, "coughMale1"], [0.755, "coughMale2"]];
      coughMarks.forEach(([mark, key], i) => {
        if (p >= mark && !state.coughBeats.has(i)) { state.coughBeats.add(i); playAgain(key, key === "coughFemale" ? 0.33 : 0.39); }
      });
      fade("fan", CONFIG.fan.gain * (1 - smooth(0.72, 0.94, p)), 1.4);
      fade("night", CONFIG.night.gain * (1 - smooth(0.65, 0.85, p)), 1.4);
      fade("trainRunning", CONFIG.trainRunning.gain * (1 - smooth(0.64, 0.83, p)), 1.4);
    }
    // Fourth blink: intimate POV cough, crying babies and distressed dogs. The siren dominates.
    if (p >= 0.8) {
      fade("siren", 0.86, 0.8); fade("fan", 0, 1.2); fade("night", 0, 1.2); fade("trainRunning", 0, 1.2);
      fire("coughPOV", 0.72); fire("child2", 0.30); fire("dogWhine", 0.38);
      if (!state.played.has("blink4Dogs")) { state.played.add("blink4Dogs"); playAgain("dogBarks", 0.13); }
      // Each crying/coughing voice disappears separately, rather than cutting all distress at once.
      if (p >= 0.865) fade("child1", 0, 1.5);
      if (p >= 0.895) fade("coughFemale", 0, 1.7);
      if (p >= 0.915) fade("child2", 0, 1.3);
      if (p >= 0.93) { fade("coughMale1", 0, 1.2); fade("coughMale2", 0, 1.2); fade("dogBarks", 0, 1.4); }
      if (p >= 0.94 && !state.played.has("ambulanceLate")) { state.played.add("ambulanceLate"); playAgain("ambulance", 0.26); }
      if (p >= 0.955) fade("dogWhine", 0, 1.3);
    }
    // Eyes close: everything falls away into silence.
    if (p >= 0.985) {
      Object.keys(state.nodes).forEach(k => fade(k, 0, 0.35));
      if (!state.played.has("finalSilence")) {
        state.played.add("finalSilence");
        window.setTimeout(() => { if (state.progress >= 0.985) Object.values(state.nodes).forEach(n => { if (n.source) { try { n.source.stop(); } catch (_) {} n.source = null; n.started = false; } }); }, 500);
      }
    }
  }
  function setMaster(value) { if (state.master && state.ctx) setParam(state.master.gain, Math.max(0, Math.min(1, value)), 0.1); }
  function pause() { if (state.ctx && state.ctx.state === "running") { state.ctx.suspend(); state.paused = true; } else if (state.ctx && state.ctx.state === "suspended") { state.ctx.resume(); state.paused = false; } }
  function resume() { if (state.ctx) { state.ctx.resume(); state.paused = false; } }
  function restart() {
    if (!state.ctx) return;
    Object.values(state.nodes).forEach(n => { if (n.source) { try { n.source.stop(); } catch (_) {} } n.source = null; n.started = false; n.gain.gain.cancelScheduledValues(state.ctx.currentTime); n.gain.gain.setValueAtTime(0, state.ctx.currentTime); });
    state.played.clear(); state.coughBeats.clear(); state.fadeTargets = {}; state.progress = 0; state.started = false; state.paused = false; state.ctx.resume();
  }
  function begin() { state.started = true; state.paused = false; playInitial(); }
  window.BhopalAudio = { init, begin, update, pause, resume, restart, setMaster, getState: () => state, config: CONFIG };
})();

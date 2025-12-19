// src/audio/ambient.js
let music = null;
let targetVol = 0;

export function startAmbientMusic(scene) {
  if (music && music.isPlaying) return music;

  music = scene.sound.add("bg_thriller", {
    loop: true,
    volume: 0.18, // start calm
  });

  // In Electron this should autoplay; if it doesn’t, it will start on first click.
  music.play();

  targetVol = music.volume;

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    try { music?.stop(); } catch {}
    music = null;
  });

  return music;
}

/**
 * intensity: 0..1
 * 0 = calm / low tension
 * 1 = high tension / suspense / action
 */
export function setAmbientIntensity(scene, intensity) {
  if (!music) return;

  const i = Phaser.Math.Clamp(intensity, 0, 1);

  const MIN = 0.10; // calm
  const MAX = 0.55; // intense
  const vol = MIN + (MAX - MIN) * i;

  if (Math.abs(vol - targetVol) < 0.01) return;
  targetVol = vol;

  scene.tweens.killTweensOf(music);
  scene.tweens.add({
    targets: music,
    volume: vol,
    duration: 700,
    ease: "Sine.InOut",
  });
}

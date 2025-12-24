// src/fx/death_fx.js
export function playDeathFX(scene, opts = {}) {
  const cam = scene.cameras.main;

  const {
    // camera shake
    shakeDuration = 420,
    shakeIntensity = 0.015,

    // vignette / darkening
    vignetteAlpha = 0.85,

    // blood
    baseAlpha = 0.78,
    fadeInMs = 180,
    dripDelayMs = 450,
    minLayers = 2,
    maxLayers = 3,
    useMultiply = true,

    // cracked screen (NEW)
    crackChance = 0,        // 0..1
    crackAlpha = 0.35,      // final alpha
    crackThickness = 2,     // line thickness
    crackCount = 6,         // number of main crack rays
    impactX = null,         // 0..1 in screen space (optional)
    impactY = null,         // 0..1 in screen space (optional)

    // cleanup
    autoCleanupMs = 0,
  } = opts;

  // --- 1) Camera shake
  scene.cameras.main.shake(shakeDuration, shakeIntensity);

  // --- 2) Vignette (simple full-screen dark overlay)
  const vignette = scene.add
    .rectangle(0, 0, cam.width, cam.height, 0x000000, 1)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(9998)
    .setAlpha(0);

  scene.tweens.add({
    targets: vignette,
    alpha: vignetteAlpha,
    duration: 120,
    ease: "Sine.easeOut",
  });

  // --- 3) Blood overlays (from your pack)
  const pool = [
    "blood_corner_UL",
    "blood_corner_UR",
    "blood_edge_left",
    "blood_edge_right",
    "blood_center_small",
    "blood_droplets_light",
    "blood_smear_glass",
  ].filter((k) => scene.textures.exists(k));

  const chosenCount = Phaser.Math.Clamp(
    Phaser.Math.Between(minLayers, maxLayers),
    1,
    pool.length
  );

  const chosen = Phaser.Utils.Array.Shuffle(pool.slice()).slice(0, chosenCount);

  const bloodSprites = chosen.map((key) => {
    const img = scene.add.image(cam.midPoint.x, cam.midPoint.y, key);
    img.setScrollFactor(0);
    img.setDepth(9999);
    img.setAlpha(0);
    img.setRotation(Phaser.Math.FloatBetween(-0.12, 0.12));
    img.setScale(Phaser.Math.FloatBetween(0.98, 1.03));

    if (useMultiply) img.setBlendMode(Phaser.BlendModes.MULTIPLY);

    scene.tweens.add({
      targets: img,
      alpha: Phaser.Math.FloatBetween(baseAlpha * 0.55, baseAlpha),
      duration: fadeInMs,
      ease: "Sine.easeOut",
    });

    return img;
  });

  // --- 4) Delayed drips
  const dripsKey = "blood_drips_vertical";
  const drips = scene.textures.exists(dripsKey)
    ? scene.add.image(cam.midPoint.x, cam.midPoint.y, dripsKey)
    : null;

  if (drips) {
    drips.setScrollFactor(0);
    drips.setDepth(10000);
    drips.setAlpha(0);
    if (useMultiply) drips.setBlendMode(Phaser.BlendModes.MULTIPLY);

    scene.time.delayedCall(dripDelayMs, () => {
      scene.tweens.add({
        targets: drips,
        alpha: Phaser.Math.FloatBetween(0.55, 0.8),
        duration: 260,
        ease: "Sine.easeOut",
      });
    });
  }

  // --- 5) Cracked screen (image pack)
let cracks = null;

const rollCrack = crackChance > 0 && Math.random() < crackChance;

if (rollCrack) {
  // Pick severity based on your existing opts (crackAlpha/crackCount/etc),
  // or just randomize. Here’s a simple mapping:
  let crackKey = "crack_light";
  if (crackAlpha >= 0.32) crackKey = "crack_extreme";
  else if (crackAlpha >= 0.26) crackKey = "crack_heavy";
  else if (crackAlpha >= 0.18) crackKey = "crack_medium";

  if (scene.textures.exists(crackKey)) {
    cracks = scene.add.image(cam.midPoint.x, cam.midPoint.y, crackKey);
    cracks.setScrollFactor(0);
    cracks.setDepth(10005);
    cracks.setAlpha(0);

    // Make it fill the screen
    cracks.setDisplaySize(cam.width, cam.height);

    // Optional slight rotation / variation
    cracks.setRotation(Phaser.Math.FloatBetween(-0.03, 0.03));

    scene.tweens.add({
      targets: cracks,
      alpha: crackAlpha,
      duration: 120,
      ease: "Sine.easeOut",
    });
  }
}

  // Return handles so you can remove later
  const fx = {
    vignette,
    bloodSprites,
    drips,
    cracks,
    destroy() {
      try { vignette.destroy(); } catch {}
      try { bloodSprites.forEach((s) => s.destroy()); } catch {}
      try { drips?.destroy(); } catch {}
      try { cracks?.destroy(); } catch {}
    },
  };

  if (autoCleanupMs > 0) {
    scene.time.delayedCall(autoCleanupMs, () => fx.destroy());
  }

  return fx;
}
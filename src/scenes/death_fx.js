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

  // --- 5) Cracked screen (procedural) (NEW)
  let cracks = null;

  const rollCrack = crackChance > 0 && Math.random() < crackChance;

  if (rollCrack) {
    cracks = scene.add.graphics();
    cracks.setScrollFactor(0);
    cracks.setDepth(10005);
    cracks.setAlpha(0);

    const w = cam.width;
    const h = cam.height;

    const hitX = impactX != null ? impactX * w : Phaser.Math.Between(w * 0.25, w * 0.75);
    const hitY = impactY != null ? impactY * h : Phaser.Math.Between(h * 0.20, h * 0.60);

    // glass crack lines: pale, slightly blue-ish white
    // (still reads as glass without screaming “white lines”)
    cracks.lineStyle(crackThickness, 0xeaf2ff, 0.55);

    // draw main rays
    for (let i = 0; i < crackCount; i++) {
      const ang = (Math.PI * 2 * i) / crackCount + Phaser.Math.FloatBetween(-0.35, 0.35);
      const len = Phaser.Math.Between(Math.min(w, h) * 0.25, Math.min(w, h) * 0.58);

      let x = hitX;
      let y = hitY;

      cracks.beginPath();
      cracks.moveTo(x, y);

      // jagged segments
      const segs = Phaser.Math.Between(6, 10);
      for (let s = 1; s <= segs; s++) {
        const t = s / segs;
        const jitter = Phaser.Math.FloatBetween(-10, 10) * (1 - t);
        const nx = hitX + Math.cos(ang) * (len * t) + jitter;
        const ny = hitY + Math.sin(ang) * (len * t) + Phaser.Math.FloatBetween(-10, 10) * (1 - t);
        cracks.lineTo(nx, ny);
        x = nx;
        y = ny;

        // occasional branching
        if (Math.random() < 0.18 && s > 2) {
          const bang = ang + Phaser.Math.FloatBetween(-0.7, 0.7);
          const blen = Phaser.Math.Between(40, 120);

          cracks.beginPath();
          cracks.moveTo(x, y);
          cracks.lineTo(
            x + Math.cos(bang) * blen + Phaser.Math.FloatBetween(-8, 8),
            y + Math.sin(bang) * blen + Phaser.Math.FloatBetween(-8, 8)
          );
          cracks.strokePath();
        }
      }

      cracks.strokePath();
    }

    // a faint “impact star” at the hit point
    cracks.lineStyle(crackThickness + 1, 0xf8fbff, 0.45);
    cracks.strokeCircle(hitX, hitY, Phaser.Math.Between(10, 18));

    scene.tweens.add({
      targets: cracks,
      alpha: crackAlpha,
      duration: 90,
      ease: "Sine.easeOut",
    });
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
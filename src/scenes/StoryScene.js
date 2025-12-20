import { NODES } from "../db_scenes.js";
import { ITEM_DB } from "../db_items.js";
import { addItem, removeItem, clamp, getTotalStats } from "../utils.js";
import { startAmbientMusic, setAmbientIntensity } from "../audio/ambient.js";
import { playDeathFX } from "../scenes/death_fx.js";

export default class StoryScene extends Phaser.Scene {
  constructor() {
  super("StoryScene");
  this.thunder = null;
  this.jumpScarePlayed = false; // 👈 add
  this.demonLaughPlayed = false;
  this.ghostActive = false;
  this.lastGhostTime = 0;
  this.deathFx = null;
  this._deathFxNodeId = null;
  this.pcUI = null;
this.pcMode = false;
this.pcTyping = null;
this.pcLines = [];
this.pcIndex = 0;
}

clearBleedSprites() {
  this.bleedSprites = this.bleedSprites || [];
  this.bleedSprites.forEach(s => { try { s.destroy(); } catch {} });
  this.bleedSprites.length = 0;
}


  create() {
    console.log("StoryScene LOADED ✅ (ghost build A)");


    const { width } = this.scale;
    this.ambient = startAmbientMusic(this);

// if autoplay is blocked, start on first pointer
const unlockAudio = () => {
  if (this.ambient && !this.ambient.isPlaying) this.ambient.play();
};

this.input.once("pointerdown", unlockAudio);
this.input.keyboard.once("keydown", unlockAudio);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
  this.stopIntroThunder();

  // ✅ stop bg tweens + kill overlays
  try { this.killBackgroundTweens?.(); } catch {}

  // ✅ cleanup death overlays if the scene is destroyed/restarted
  try { this.deathFx?.destroy?.(); } catch {}
  this.deathFx = null;
  this._deathFxNodeId = null;

  // ✅ cleanup bleed overlays too
  try { this.clearBleedSprites?.(); } catch {}

  // ✅ cleanup mask
  if (this._screenMask) {
    try { this._screenMask.destroy(); } catch {}
    this._screenMask = null;
  }
  if (this._onPcResize) {
  try { this.scale.off("resize", this._onPcResize); } catch {}
  this._onPcResize = null;
  this._pcResizeBound = false;
}
});

    // --- Background layer holders ---
    

    this.bgGroup = this.add.group();
    this.bgSprites = {
  bg: null,
  fg: null,
  light: null,
  glow: null,
  screen: null,
  screenFg: null
};
    this.bleedSprites = []; // track overlay + ghosts
    this.bgTweens = [];          // <-- track tweens so they don’t stack
    this.currentLayers = null;   // <-- remember active layers for resize

    // Text (above panel)
    this.titleText = this.add.text(40, 70, "", {
  fontFamily: "monospace",
  fontSize: "28px",
  color: "#ffffff",
  shadow: {
    offsetX: 2,
    offsetY: 2,
    color: "#000000",
    blur: 2,
    fill: true
  }
}).setDepth(10);

    this.metaText = this.add.text(40, 110, "", {
  fontFamily: "monospace",
  fontSize: "16px",
  color: "#cfcfcf",
  shadow: {
    offsetX: 1,
    offsetY: 1,
    color: "#000000",
    blur: 2,
    fill: true
  }
}).setDepth(10);


    this.bodyText = this.add.text(40, 160, "", {
  fontFamily: "monospace",
  fontSize: "18px",
  color: "#eaeaea",
  wordWrap: { width: width - 80 },
  shadow: {
    offsetX: 2,
    offsetY: 2,
    color: "#000000",
    blur: 3,
    fill: true
  }
}).setDepth(10);

    this.choiceTexts = [];

// Re-scale backgrounds on resize (named handler so it can be removed)
this._onStoryResize = () => {
  const state = this.registry.get("state");
  if (this.currentLayers) {
    this.setBackgroundLayers({ ...this.currentLayers, _resizeRefresh: true }, state);
  }
  this.bodyText.setWordWrapWidth(this.scale.width - 80);
};

this.scale.on("resize", this._onStoryResize);


    this._lastNodeId = null;

    this.renderNode();
  }


  // ---------- UTILS ----------
  makeScreenMask(maskDef, anchorX, anchorY) {
  // destroy previous mask graphics if any
  if (this._screenMaskGfx) {
    try { this._screenMaskGfx.destroy(); } catch {}
    this._screenMaskGfx = null;
  }

  const g = this.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);

  const x = anchorX + (maskDef.x ?? 0);
  const y = anchorY + (maskDef.y ?? 0);
  const w = maskDef.w ?? 200;
  const h = maskDef.h ?? 120;
  const r = maskDef.r ?? 12;

  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);

  // keep reference so we can destroy it later
  this._screenMaskGfx = g;

  return g.createGeometryMask();
}

  scaleToCover(image, cx = this.scale.width / 2, cy = this.scale.height / 2) {
  const { width, height } = this.scale;
  const iw = image.width;
  const ih = image.height;

  const scale = Math.max(width / iw, height / ih);
  image.setScale(scale);
  image.setPosition(cx, cy);
}

bindPcResizeHandler() {
  if (this._pcResizeBound) return;

  this._pcResizeBound = true;
  this._onPcResize = () => {
    if (!this.pcMode) return;
    const lastUi = this._lastPcUi;
    if (!lastUi) return;

    this.exitPcMode(true);
    this.enterPcMode(lastUi);
  };

  this.scale.on("resize", this._onPcResize);
}

  bleedToBg(newKey, cx, cy) {
  const oldBg = this.bgSprites.bg;
  if (!oldBg) return;

  this.clearBleedSprites?.();

  const cx2 = cx ?? this.scale.width / 2;
  const cy2 = cy ?? this.scale.height / 2;

  // ✅ CHANGE THIS (lower = faster)
  const D = 1200; // was 2600 (try 900–1400)

  const overlay = this.add.image(cx2, cy2, newKey)
    .setOrigin(0.5)
    .setDepth(oldBg.depth + 1)
    .setAlpha(0);

  const g1 = this.add.image(cx2 + 10, cy2 + 4, newKey)
    .setOrigin(0.5)
    .setDepth(oldBg.depth + 1)
    .setAlpha(0);

  const g2 = this.add.image(cx2 - 10, cy2 - 4, newKey)
    .setOrigin(0.5)
    .setDepth(oldBg.depth + 1)
    .setAlpha(0);

  this.scaleToCover(overlay, cx2, cy2);
  this.scaleToCover(g1, cx2, cy2);
  this.scaleToCover(g2, cx2, cy2);

  this.bleedSprites.push(overlay, g1, g2);

  overlay.x += 6; overlay.y += 2;
  g1.x += 6; g1.y += 2;
  g2.x += 6; g2.y += 2;

  // Fade old out while new bleeds in (FASTER)
  const t1 = this.tweens.add({
    targets: oldBg,
    alpha: { from: 1, to: 0 },
    duration: D,
    ease: "Sine.inOut",
  });

  const t2 = this.tweens.add({
    targets: overlay,
    alpha: { from: 0, to: 1 },
    x: cx2,
    y: cy2,
    duration: D,
    ease: "Sine.inOut",
  });

  // Ghost flicker (also faster)
  const tg1 = this.tweens.add({
    targets: g1,
    alpha: { from: 0, to: 0.22 },
    x: cx2 + 4,
    y: cy2 + 2,
    duration: Math.floor(D * 0.35), // was 900
    yoyo: true,
    repeat: 1,
    ease: "Sine.inOut",
  });

  const tg2 = this.tweens.add({
    targets: g2,
    alpha: { from: 0, to: 0.18 },
    x: cx2 - 4,
    y: cy2 - 2,
    duration: Math.floor(D * 0.42), // was 1100
    yoyo: true,
    repeat: 1,
    ease: "Sine.inOut",
  });

  this.bgTweens.push(t1, t2, tg1, tg2);

  t2.on("complete", () => {
    oldBg.setTexture(newKey);
    this.scaleToCover(oldBg);
    oldBg.setAlpha(1);
    this.clearBleedSprites();
  });
}

  killBackgroundTweens() {
  this.bgTweens.forEach(t => t?.stop?.());
  this.bgTweens = [];

  // ✅ NEW: remove any bleed overlays/ghosts
  this.clearBleedSprites();

  if (this.bgSprites.bg) this.tweens.killTweensOf(this.bgSprites.bg);
  if (this.bgSprites.fg) this.tweens.killTweensOf(this.bgSprites.fg);
  if (this.bgSprites.light) this.tweens.killTweensOf(this.bgSprites.light);
  if (this.bgSprites.glow) this.tweens.killTweensOf(this.bgSprites.glow);
  if (this.bgSprites.screen) this.tweens.killTweensOf(this.bgSprites.screen);
  if (this.bgSprites.screenFg) this.tweens.killTweensOf(this.bgSprites.screenFg);
  if (this._screenMask) {
  try { this._screenMask.destroy(); } catch {}
  this._screenMask = null;
}
if (this._screenMaskGfx) {
  try { this._screenMaskGfx.destroy(); } catch {}
  this._screenMaskGfx = null;
}
}

  // ---------- BACKGROUND RENDERING ----------
  setBackgroundLayers(layerKeys, state = null) {
    // HARD GUARD: never allow drift stacking
if (!this.bgTweens) this.bgTweens = [];
this.tweens.killTweensOf([
  this.bgSprites?.bg,
  this.bgSprites?.fg,
  this.bgSprites?.light,
  this.bgSprites?.glow,
]);
  if (!layerKeys) return;

  const isResizeRefresh = !!layerKeys._resizeRefresh;

  // ✅ store a clean copy (no resize flag)
  const { _resizeRefresh, ...clean } = layerKeys;
  this.currentLayers = clean;

    const cx = this.scale.width / 2;
const cy = this.scale.height / 2;



        // --- MIRROR VARIANT: slow bleed + motion-blur ghosts ---
    const enteringMirror =
      state?.nodeId === "apartment_mirror" &&
      layerKeys?.bg &&
      this.bgSprites.bg &&
      this.bgSprites.bg.texture?.key &&
      this.bgSprites.bg.texture.key !== layerKeys.bg;

    const isVariantSwap =
  enteringMirror &&
  (
    layerKeys.bg.includes("mirror_wrong") ||
    layerKeys.bg.includes("mirror_demon")
  );

    if (isVariantSwap) {
      // Kill tweens + destroy everything EXCEPT the current bg so we can transition
      this.killBackgroundTweens();

      // destroy old non-bg layers if they exist
      ["fg", "light", "glow", "screen", "screenFg"].forEach((k) => {
        if (this.bgSprites[k]) {
          this.bgSprites[k].destroy();
          this.bgSprites[k] = null;
        }
      });

      this.tryGhostAppearance(state);

      // Do the special transition on bg, then continue to build other layers
      this.bleedToBg(layerKeys.bg, cx, cy);

      // IMPORTANT: do NOT clear/destroy the bgGroup here (we kept bg alive)
      // Continue below to (re)build other layers (light/glow/fg/etc).
    } else {
  this.killBackgroundTweens();

  // ✅ If this is just a resize refresh, keep sprites and just rescale/reposition.
  if (isResizeRefresh) {
    // just re-apply positions/scales below, no destruction
  } else {
    this.destroyBgSprites();
    this.bgSprites = { bg: null, fg: null, light: null, glow: null, screen: null, screenFg: null };
  }
}

    // ---- BASE BACKGROUND ----
if (layerKeys.bg && this.textures.exists(layerKeys.bg)) {

  // ✅ During mirror variant swap, DO NOT spawn a new bg.
  // bleedToBg will swap the texture on the existing bg when finished.
  const shouldCreateBg = !(isVariantSwap && this.bgSprites.bg);

  if (shouldCreateBg) {
    const bg = this.add.image(cx, cy, layerKeys.bg)
      .setDepth(-30)
      .setOrigin(0.5);

    this.scaleToCover(bg);

    this.bgGroup.add(bg);
    this.bgSprites.bg = bg;
  }
}

    
// ---- TV / SCREEN CONTENT (news) ----
if (layerKeys.screen && this.textures.exists(layerKeys.screen)) {
  const screen = this.add.image(0, 0, layerKeys.screen)
    .setDepth(-18)
    .setOrigin(0.5)
    .setAlpha(layerKeys.screenAlpha ?? 0.95);

  const sx = (layerKeys.screenX ?? 0.23) * this.scale.width;
  const sy = (layerKeys.screenY ?? 0.62) * this.scale.height;

  screen.setPosition(sx, sy);
  screen.setScale(layerKeys.screenScale ?? 0.34);
  screen.setRotation(layerKeys.screenRot ?? -0.035);

  // Blend mode
  const blendName = (layerKeys.screenBlend || "SCREEN").toUpperCase();
  const BLENDS = Phaser.BlendModes;
  const blend =
    blendName === "ADD" ? BLENDS.ADD :
    blendName === "MULTIPLY" ? BLENDS.MULTIPLY :
    blendName === "NORMAL" ? BLENDS.NORMAL :
    BLENDS.SCREEN;

  screen.setBlendMode(blend);

  // Optional cover-fit inside mask rect
  if (layerKeys.screenFit === "cover" && layerKeys.screenMask) {
    const mw = layerKeys.screenMask.w ?? 300;
    const mh = layerKeys.screenMask.h ?? 200;
    const iw = screen.width;
    const ih = screen.height;
    const cover = Math.max(mw / iw, mh / ih);
    screen.setScale((layerKeys.screenScale ?? 1) * cover);
  }

  // Clip to TV glass rectangle
if (layerKeys.screenMask) {
  // ✅ destroy old mask first (prevents mask buildup)
  if (this._screenMask) {
    try { this._screenMask.destroy(); } catch {}
    this._screenMask = null;
  }

  const mask = this.makeScreenMask(layerKeys.screenMask, sx, sy);
  screen.setMask(mask);
  this._screenMask = mask;
}

this.bgGroup.add(screen);
this.bgSprites.screen = screen;

// ✅ Flicker/Wobble ONLY on real scene entry, not resize refresh
if (!isResizeRefresh) {
  // CRT flicker
  const tvFlicker = this.tweens.add({
    targets: screen,
    alpha: {
      from: (layerKeys.screenAlpha ?? 0.95) - 0.05,
      to:   (layerKeys.screenAlpha ?? 0.95) + 0.05
    },
    duration: Phaser.Math.Between(80, 140),
    yoyo: true,
    repeat: -1,
  });
  this.bgTweens.push(tvFlicker);

  // Gentle wobble
  const tvWobble = this.tweens.add({
    targets: screen,
    angle: screen.angle + 0.3,
    duration: 6000,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut",
  });
  this.bgTweens.push(tvWobble);
}
}

// ---- TV GLASS / BEZEL FOREGROUND (anchored) ----
if (layerKeys.screenFg && this.textures.exists(layerKeys.screenFg)) {
  const screenFg = this.add.image(0, 0, layerKeys.screenFg)
    .setDepth(-17) // ABOVE screen (-18) but below normal fg (5)
    .setOrigin(0.5)
    .setAlpha(layerKeys.screenFgAlpha ?? 1);

  const sx = (layerKeys.screenFgX ?? layerKeys.screenX ?? 0.23) * this.scale.width;
  const sy = (layerKeys.screenFgY ?? layerKeys.screenY ?? 0.62) * this.scale.height;

  screenFg.setPosition(sx, sy);
  screenFg.setScale(layerKeys.screenFgScale ?? layerKeys.screenScale ?? 0.34);
  screenFg.setRotation(layerKeys.screenFgRot ?? layerKeys.screenRot ?? -0.035);

  this.bgGroup.add(screenFg);
  this.bgSprites.screenFg = screenFg;
}

// ---- FOREGROUND (full-screen OR anchored like TV bezel) ----
if (layerKeys.fg && this.textures.exists(layerKeys.fg)) {
  const fg = this.add.image(0, 0, layerKeys.fg)
    .setDepth(5)
    .setOrigin(0.5);

  const anchored = (layerKeys.fgX != null && layerKeys.fgY != null);

  if (anchored) {
    const fx = layerKeys.fgX * this.scale.width;
    const fy = layerKeys.fgY * this.scale.height;

    fg.setPosition(fx, fy);
    fg.setScale(layerKeys.fgScale ?? 0.34);
    fg.setRotation(layerKeys.fgRot ?? -0.035);

    layerKeys.lockFg = true; // prevent drift
  } else {
    fg.setPosition(cx, cy);
    this.scaleToCover(fg);
  }

  this.bgGroup.add(fg);
  this.bgSprites.fg = fg;
}

// ---- LIGHT / DARKNESS ----
if (layerKeys.light && this.textures.exists(layerKeys.light)) {
  // ✅ reuse on resize if it already exists with same texture
  let light = this.bgSprites.light;

  const needsNew =
    !light ||
    !light.texture ||
    light.texture.key !== layerKeys.light;

  if (!needsNew) {
    // just rescale/reposition on resize
    light.setPosition(cx, cy);
    this.scaleToCover(light);
  } else {
    if (light) { try { light.destroy(); } catch {} }

    light = this.add.image(cx, cy, layerKeys.light)
      .setDepth(-20)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(1);

    this.scaleToCover(light);
    this.bgGroup.add(light);
    this.bgSprites.light = light;

    // ✅ only create infinite tweens when NOT resizing
    if (!isResizeRefresh) {
      const flicker = this.tweens.add({
        targets: light,
        alpha: { from: 1, to: 0.94 },
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      this.bgTweens.push(flicker);
    }
  }
}

// ---- GLOW ----
if (layerKeys.glow && this.textures.exists(layerKeys.glow)) {
  // ✅ reuse on resize if it already exists with same texture
  let glow = this.bgSprites.glow;

  const needsNew =
    !glow ||
    !glow.texture ||
    glow.texture.key !== layerKeys.glow;

  if (!needsNew) {
    glow.setPosition(cx, cy);
    this.scaleToCover(glow);
  } else {
    if (glow) { try { glow.destroy(); } catch {} }

    glow = this.add.image(cx, cy, layerKeys.glow)
      .setDepth(-15)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.9);

    this.scaleToCover(glow);
    this.bgGroup.add(glow);
    this.bgSprites.glow = glow;

    // ✅ only create infinite tweens when NOT resizing
    if (!isResizeRefresh) {
      const breathe = this.tweens.add({
        targets: glow,
        alpha: { from: 0.85, to: 1.0 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      this.bgTweens.push(breathe);
    }
  }
}

// ---- CAMERA DRIFT ----
if (!isResizeRefresh) {
  if (this.bgSprites.bg) {
    const driftBg = this.tweens.add({
      targets: this.bgSprites.bg,
      x: cx + 12,
      y: cy + 6,
      duration: 9000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.bgTweens.push(driftBg);
  }

  if (this.bgSprites.fg && !layerKeys.lockFg) {
    const driftFg = this.tweens.add({
      targets: this.bgSprites.fg,
      x: cx + 6,
      y: cy + 3,
      duration: 9000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.bgTweens.push(driftFg);
  }
}
}

enterPcMode(ui) {
  this.pcMode = true;
  this.pcTyping = null;
  this.pcLines = [];
  this.pcIndex = 0;

  // build UI if needed
  if (!this.pcUI) this.buildPcUI();

  // decide how to render
  if (ui?.type === "desktop") {
    this.renderPcDesktop(ui);
  } else {
    // default = terminal
    this.pcLines = ui?.lines ?? ["(no data)"];
    this.typePcLines(this.pcLines, 28);
  }
}

buildPcUI() {
  const { width, height } = this.scale;

  // Invisible click-catcher (prevents underlying clicks)
  const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.001)
    .setDepth(9998)
    .setInteractive();

  const root = this.add.container(0, 0).setDepth(9999);

  const dim = this.add.image(0, 0, "pc_dim").setOrigin(0).setDisplaySize(width, height);
  const wallpaper = this.add.image(width / 2, height / 2, "pc_wallpaper").setDisplaySize(width, height);

  const desktopLayer = this.add.container(80, 120);

  const terminalText = this.add.text(120, 160, "", {
    fontFamily: "monospace",
    fontSize: "18px",
    color: "#e6f0ff",
    lineSpacing: 6,
    wordWrap: { width: width - 240 }
  }).setVisible(false);

  const taskbar = this.add.image(0, 0, "pc_taskbar").setOrigin(0).setDisplaySize(width, height);
  const windowFrame = this.add.image(0, 0, "pc_window").setOrigin(0).setDisplaySize(width, height);

  const modal = this.add.image(width / 2, height / 2, "pc_modal")
    .setVisible(false)
    .setDepth(10000);

  root.add([dim, wallpaper, desktopLayer, terminalText, taskbar, windowFrame, modal]);

  // ✅ NOW assign pcUI (after variables exist)
  this.pcUI = {
    blocker,
    root,
    desktopLayer,
    terminalText,
    modal,
    icons: [],
    frameBounds: { x: 0, y: 0, w: width, h: height } // ✅ here
  };

  // keep it correct on resize
  this.bindPcResizeHandler();
}

exitPcMode(skipRender = false) {
  this.pcMode = false;
  this._lastPcUi = null;

  if (this.pcUI) {
    try { this.pcUI.blocker.destroy(); } catch {}
    try { this.pcUI.root.destroy(); } catch {}
    this.pcUI = null;
  }

  this.stopPcTyping();

  if (!skipRender) {
    this.showStoryUI();
    this.renderNode();
  }
}

renderPcDesktop(ui) {
  this._lastPcUi = ui;
  const state = this.registry.get("state");

  const layer = this.pcUI.desktopLayer;
  layer.removeAll(true);
  this.pcUI.icons.length = 0;

  this.pcUI.terminalText.setText("").setVisible(false);
  layer.setVisible(true);

  const icons = ui.icons ?? [];
  const colW = 140;
  const rowH = 120;
  const cols = 5;

  icons.forEach((ic, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = col * colW;
    const y = row * rowH;

    const key =
      ic.icon === "folder" ? "pc_icon_folder" :
      ic.icon === "terminal" ? "pc_icon_terminal" :
      ic.icon === "warning" ? "pc_icon_warning" :
      "pc_icon_file";

    const sprite = this.add.image(x, y, key)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const label = this.add.text(x - 55, y + 52, ic.label ?? "FILE", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      wordWrap: { width: 110 },
      align: "center"
    });

    sprite.on("pointerdown", () => {
      if (!ic.go) return;
      state.nodeId = ic.go;
      this.exitPcMode(true);
      this.renderNode();
    });

    layer.add([sprite, label]);
    this.pcUI.icons.push(sprite);
  });

  // show desktop
  this.pcUI.desktopLayer.setVisible(true);
}

  playIntroThunderOnce() {
  if (!this.thunder) {
    this.thunder = this.sound.add("thunderstorm", { loop: false, volume: 0.9 });
  }

  // only start if not already playing
  if (!this.thunder.isPlaying) {
    this.thunder.play();
  }
}

stopIntroThunder() {
  if (this.thunder && this.thunder.isPlaying) {
    this.thunder.stop();
  }
}

  // ---------- STORY ----------
  clearChoices() {
  this.choiceTexts.forEach(t => { try { t.destroy(); } catch {} });
  this.choiceTexts = [];

  // ✅ also clear 1–9 hotkeys
  if (this._choiceKeys) {
    this._choiceKeys.forEach(k => { try { k.destroy(); } catch {} });
    this._choiceKeys = [];
  }
}

  bindChoiceHotkeys() {
  // remove any previous hotkeys
  if (this._choiceKeys) {
    this._choiceKeys.forEach(k => { try { k.destroy(); } catch {} });
  }
  this._choiceKeys = [];

  // bind 1–9 to current choices
  this.choiceTexts.forEach((txt, i) => {
    if (i > 8) return; // 9 max
    const keyCode = Phaser.Input.Keyboard.KeyCodes.ONE + i;
    const key = this.input.keyboard.addKey(keyCode);
    key.once("down", () => {
      // simulate clicking that choice
      txt.emit("pointerdown");
    });
    this._choiceKeys.push(key);
  });
}

  tryGhostAppearance(state) {
    if (this.pcMode) return;
  // Ensure sanity exists
  state.maxSanity = state.maxSanity ?? 10;
  state.sanity = state.sanity ?? state.maxSanity;

  // 🔒 HARD GATE — ghost ONLY when sanity is low
  if (state.sanity > 3) return;

  const id = (state.nodeId || "").toLowerCase();

  // Only in apartment-related nodes
  const isApartment =
    id.startsWith("apartment_") ||
    id === "intro_morning" ||
    id === "apartment";

  if (!isApartment) return;

  // Cooldown (prevents spam)
  const now = this.time.now;
  if (now - this.lastGhostTime < 2500) return;

  // Chance scales with sanity
  // sanity 3 → 12%
  // sanity 2 → 24%
  // sanity 1 → 36%
  // sanity 0 → 48%
  const chance = (4 - state.sanity) * 0.12;
  if (Math.random() > chance) return;

  // ✅ THIS WAS MISSING
  this.lastGhostTime = now;
  this.spawnGhost();
}

spawnGhost() {
  console.log("GHOST SPAWNED");

  if (!this.textures.exists("ghost_fg")) {
    console.warn("ghost_fg texture missing — preload it in BootScene");
    return;
  }

  if (this.ghostActive) return;
  this.ghostActive = true;

  const state = this.registry.get("state");
const { x: gx, y: gy } = this.getGhostAnchor(state);

let SCALE = 0.48;
let BASE_A = 0.22;
let ECHO_A = 0.08;

const id = (state?.nodeId || "").toLowerCase();

// hallway/bathroom = further away + dimmer
if (id === "apartment_mirror" || id === "apartment_door") {
  SCALE = 0.44;
  BASE_A = 0.18;
  ECHO_A = 0.06;
}


  const cx = this.scale.width / 2;
  const cy = this.scale.height / 2 + 20;


  // If you want it to feel inside the room, don't put it above UI
  // Put it below fg (fg is depth 5 in your background code)
  const DEPTH = 4;

  const ghost = this.add.image(gx, gy, "ghost_fg")
    .setDepth(DEPTH)
    .setScrollFactor(0)
    .setAlpha(0)
    .setBlendMode(Phaser.BlendModes.NORMAL)
    .setTint(0xdfe7ff)
    .setScale(SCALE);

  const g1 = this.add.image(gx + 10, gy + 6, "ghost_fg")
    .setDepth(DEPTH)
    .setScrollFactor(0)
    .setAlpha(0)
    .setBlendMode(Phaser.BlendModes.NORMAL)
    .setTint(0xdfe7ff)
    .setScale(SCALE);

  const g2 = this.add.image(gx - 10, gy - 6, "ghost_fg")
    .setDepth(DEPTH)
    .setScrollFactor(0)
    .setAlpha(0)
    .setBlendMode(Phaser.BlendModes.NORMAL)
    .setTint(0xdfe7ff)
    .setScale(SCALE);

  this.tweens.killTweensOf([ghost, g1, g2]);
  ghost.setTint(0xe8f0ff);


  // subtle camera shake (less “jump scare”, more “presence”)
  this.cameras.main.shake(60, 0.0018);

  // fade in quickly
  this.tweens.add({
    targets: ghost,
    alpha: { from: 0, to: BASE_A },
    duration: 120,
    ease: "Sine.out",
  });

  // echoes pop in softly
  this.tweens.add({
    targets: [g1, g2],
    alpha: { from: 0, to: ECHO_A },
    duration: 140,
    ease: "Sine.out",
  });

  // small “breath” flicker (never hits alpha 1)
  this.tweens.add({
    targets: ghost,
    alpha: { from: BASE_A, to: 0.10 },
    duration: 220,
    yoyo: true,
    repeat: 1,
    ease: "Linear",
  });

  // slight drift so it feels spatial
  this.tweens.add({
    targets: ghost,
    x: gx + 6,
    duration: 900,
    yoyo: true,
    ease: "Sine.inOut",
  });

  // echo sweep
  this.time.delayedCall(60, () => {
    this.tweens.add({
      targets: g1,
      x: gx + 22,
      y: gy + 12,
      alpha: 0,
      duration: 260,
      ease: "Sine.out",
    });

    this.tweens.add({
      targets: g2,
      x: gx - 22,
      y: gy - 12,
      alpha: 0,
      duration: 280,
      ease: "Sine.out",
    });
  });

  // vanish + cleanup
  this.time.delayedCall(650, () => {
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 240,
      onComplete: () => {
        ghost.destroy();
        g1.destroy();
        g2.destroy();
        this.ghostActive = false;
      },
    });
  });

}

getGhostAnchor(state) {
  const w = this.scale.width;
  const h = this.scale.height;
  const id = (state?.nodeId || "").toLowerCase();

  // Default: deeper in the room, slightly right
  let x = w * 0.56;
  let y = h * 0.70;

  // ---- Anchors by node ----
  if (id === "intro_morning" || id === "apartment" || id.startsWith("apartment_")) {
    // Main apartment "window / living area" vibe
    x = w * 0.62;
    y = h * 0.68;
  }

  if (id === "apartment_door") {
    // Doorway area (left-ish)
    x = w * 0.24;
    y = h * 0.70;
  }

  if (id === "apartment_coffee") {
    // Near coffee table / lower center
    x = w * 0.52;
    y = h * 0.76;
  }

  if (id === "apartment_tv") {
    // Near TV / right-mid
    x = w * 0.72;
    y = h * 0.66;
  }

  if (id === "apartment_mirror") {
    // Hallway/bathroom feel: mid-left, deeper
    x = w * 0.38;
    y = h * 0.72;
  }

  return { x, y };
}

  oneFrameFlicker() {
  const w = this.scale.width;
  const h = this.scale.height;

  const r = this.add.rectangle(0, 0, w, h, 0x000000, 1)
    .setOrigin(0, 0)
    .setDepth(4)
    .setScrollFactor(0);

  // one frame (roughly)
  this.time.delayedCall(16, () => r.destroy());
}

isDeathNode(nodeId) {
  const id = (nodeId || "").toLowerCase();
  return (
    id.startsWith("death_") ||
    id === "final_death" ||
    id === "death_end_of_day" ||
    id === "apartment_demon_death"
  );
}

destroyBgSprites() {
  const keys = ["bg", "screen", "screenFg", "light", "glow", "fg"];
  keys.forEach((k) => {
    if (this.bgSprites?.[k]) {
      try { this.bgSprites[k].destroy(); } catch {}
      this.bgSprites[k] = null;
    }
  });

  // group cleanup too (safe)
  try { this.bgGroup?.clear?.(true, true); } catch {}
}

showPcError(message) {
  if (!this.pcUI) return;
  // simple: write to terminalText as an "error"
  this.pcUI.desktopLayer.setVisible(false);
  this.pcUI.terminalText.setVisible(true);
  this.pcUI.terminalText.setText(String(message));
}

hidePcError() {
  if (!this.pcUI) return;
  // no-op unless you build a real modal
}

stopPcTyping() {
  if (this.pcTyping) {
    this.pcTyping.remove(false);
    this.pcTyping = null;
  }
}

typePcLines(lines, speedMs = 28) {
  if (!this.pcUI) return;

  this.pcUI.desktopLayer.setVisible(false);
  this.pcUI.terminalText.setVisible(true);

  this.stopPcTyping();

  const full = (Array.isArray(lines) ? lines : [String(lines)]).join("\n");
  this.pcUI.terminalText.setText("");

  this.pcTyping = this.time.addEvent({
    delay: speedMs,
    loop: true,
    callback: () => {
      const shown = this.pcUI.terminalText.text;
      const nextChar = full[shown.length];
      if (!nextChar) {
        this.stopPcTyping();
        return;
      }
      this.pcUI.terminalText.setText(shown + nextChar);
    }
  });
}

hideStoryUI() {
  this.titleText?.setVisible(false);
  this.metaText?.setVisible(false);
  this.bodyText?.setVisible(false);
  this.choiceTexts?.forEach(t => t.setVisible(false));
}

showStoryUI() {
  this.titleText?.setVisible(true);
  this.metaText?.setVisible(true);
  this.bodyText?.setVisible(true);
  this.choiceTexts?.forEach(t => t.setVisible(true));
}

renderPcButtons(ui) {
  if (!this.pcUI) return;

  // destroy old
  this.pcUI.btns = this.pcUI.btns || [];
  this.pcUI.btns.forEach(b => { try { b.destroy(); } catch {} });
  this.pcUI.btns.length = 0;

  const buttons = ui?.buttons || [];
  if (!buttons.length) return;

  const { x, y, w, h } = this.pcUI.frameBounds;

  let startY = y + h - 90;     // bottom area
  let startX = x + 24;

  buttons.forEach((b, i) => {
    const t = this.add.text(startX + i * 140, startY, `[ ${b.label} ]`, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#dfe7ff",
      backgroundColor: "#121a24",
      padding: { x: 10, y: 6 }
    })
    .setDepth(10000)
    .setInteractive({ useHandCursor: true });

    t.on("pointerdown", () => {
      const state = this.registry.get("state");
      if (b.go) {
        state.nodeId = b.go;
        this.renderNode();
      }
    });

    this.pcUI.btns.push(t);
  });
}

  renderNode() {

    // HARD RESET visual layers between nodes
this.clearBleedSprites?.();

// HARD RESET visual layers between nodes
this.killBackgroundTweens?.();
this.destroyBgSprites?.();

  const state = this.registry.get("state");

  state.flags = state.flags || {};
state.maxSanity = state.maxSanity ?? 10;
state.sanity = state.sanity ?? state.maxSanity; // ensure sanity exists

  const prevNodeId = this._lastNodeId;
const nextNodeId = state.nodeId;

const prevNode = prevNodeId ? NODES[prevNodeId] : null;
const node = NODES[nextNodeId];

const entering = prevNodeId !== nextNodeId;

// ✅ mark first-death (loop awareness hook)
if (entering && nextNodeId === "death_first_time") {
  state.flags.first_death_seen = true;
}

// ----------------------------
// END-OF-DAY INEVITABILITY
// No real clock. Counts steps.
// ----------------------------
const DAY_STEP_LIMIT = 18; // forced death at this step
const WARNING_STEP = 16;   // warning hits at this step

state.flags = state.flags || {};

// reset the "day" counter when the loop resets
if (entering && nextNodeId === "intro_game") {
  state.flags.day_steps = 0;
  state.flags.day_forced_death = false;
  state.flags.day_warned = false;
}

// only count steps when entering a new node
if (entering) {
  const id = (nextNodeId || "").toLowerCase();

  const exempt =
    id === "intro_game" ||
    id === "final_death" ||
    id === "death_end_of_day" ||
    id === "day_warning" ||
    id.startsWith("death_") ||
    id.startsWith("part1_") ||
    id.includes("demon_realm");

  if (!exempt) {
    state.flags.day_steps = (state.flags.day_steps ?? 0) + 1;
  }

  // 🔔 WARNING — one-time
  if (!state.flags.day_warned && (state.flags.day_steps ?? 0) >= WARNING_STEP) {
    state.flags.day_warned = true;
    state.nodeId = "day_warning";
    this._lastNodeId = null;
    this.renderNode();
    return;
  }

  // ☠️ Forced end-of-day death
  if (!state.flags.day_forced_death && (state.flags.day_steps ?? 0) >= DAY_STEP_LIMIT) {
    state.flags.day_forced_death = true;
    state.nodeId = "death_end_of_day";
    this._lastNodeId = null;
    this.renderNode();
    return;
  }
}



  if (entering && prevNodeId === "apartment_mirror") {
  this.jumpScarePlayed = false;
  this.demonLaughPlayed = false; // 👈 add
}

  // If we’re entering the very first intro node, play thunder once
if (entering && nextNodeId === "intro_game") {
  this.playIntroThunderOnce();
}

// If we are leaving intro_game to any other node, stop thunder if it’s still playing
if (entering && prevNodeId === "intro_game" && nextNodeId !== "intro_game") {
  this.stopIntroThunder();
}

  // Run exit/enter hooks exactly once on transition
  if (entering) {
    if (prevNode?.onExit) prevNode.onExit(state);
    if (node?.onEnter) node.onEnter(state);
  }

  // update last node AFTER hooks
  this._lastNodeId = nextNodeId;

  // ----------------------------
// DEATH FX (blood + cracks)
// ----------------------------
const nowNodeId = state.nodeId;

// entering a new node?
const enteringNode = prevNodeId !== nowNodeId;

// if we left a death node, clean up overlays
if (enteringNode && this._deathFxNodeId && this._deathFxNodeId !== nowNodeId) {
  try { this.deathFx?.destroy?.(); } catch {}
  this.deathFx = null;
  this._deathFxNodeId = null;
}

// if we entered a death node, trigger once
if (enteringNode && this.isDeathNode(nowNodeId)) {
  // Don’t double-stack FX on quick rerenders
  if (this._deathFxNodeId !== nowNodeId) {
    this._deathFxNodeId = nowNodeId;

    const isCleanFailsafe =
      !!state.flags?.failsafe_seen || nowNodeId === "final_death";

    const isBigImpact =
      nowNodeId === "apartment_demon_death" || nowNodeId === "death_end_of_day";

    const crackChance = isCleanFailsafe ? 0.15 : (isBigImpact ? 0.9 : 0.6);

    // ✅ Play death scream on non-clean deaths (only if loaded)
if (!isCleanFailsafe) {
  if (this.cache?.audio?.exists("death_scream")) {
    try {
      this.sound.play("death_scream", { volume: 0.85 });
    } catch (e) {
      console.warn("death_scream failed to play:", e);
    }
  } else {
    console.warn("death_scream not loaded (check BootScene preload path)");
  }
}

    // ✅ Heavy old-school death look: blood + cracked glass
    this.deathFx = playDeathFX(this, {
  // camera punch
  shakeDuration: 420,
  shakeIntensity: isBigImpact ? 0.018 : 0.010,

  // ✅ less dark vignette
  vignetteAlpha: isCleanFailsafe ? 0.28 : 0.45,

  // ✅ less blood darkness
  baseAlpha: isCleanFailsafe ? 0.28 : 0.55,
  fadeInMs: 160,
  dripDelayMs: isCleanFailsafe ? 750 : 520,
  minLayers: isCleanFailsafe ? 1 : 2,
  maxLayers: isCleanFailsafe ? 2 : 4,

  // ✅ IMPORTANT: Multiply is what “crushes” the scene darker
  useMultiply: false,

  // cracks still visible
  crackChance,
  crackAlpha: isCleanFailsafe ? 0.10 : (isBigImpact ? 0.35 : 0.22),
  crackThickness: isBigImpact ? 3 : 2,
  crackCount: isBigImpact ? 7 : 5,

  autoCleanupMs: 0,
});
  }
}

  if (!node) {
    this.bodyText.setText(`Missing node: ${state.nodeId}`);
    return;
  }
  
// PC MODE HANDLING
const isComputer = node.uiMode === "computer";

if (isComputer) {
  const ui = typeof node.computerUI === "function"
    ? node.computerUI(state)
    : node.computerUI;

  this.hideStoryUI();        // ✅ IMPORTANT
  this.enterPcMode(ui);

  if (!ui) {
  this.typePcLines(["(NO UI DATA)"], 20);
  this.renderPcButtons(null);              // ✅ clear buttons
} else if (ui.type === "dos") {
  this.typePcLines([...(ui.lines || []), "", ui.prompt || ""], 12);
  this.renderPcButtons(ui);                // ✅ show DOS buttons if provided
} else if (ui.type === "error") {
  this.typePcLines([ui.title || "", "", ...(ui.message || [])], 18);
  this.showPcError((ui.message || []).join("\n"));
  this.renderPcButtons(ui);                // ✅ show OK / Back / Try anyway
} else if (ui.type === "desktop") {
  this.renderPcDesktop(ui);
  this.renderPcButtons(null);              // ✅ desktop uses icons, not buttons
} else {
  this.typePcLines(ui.lines || ["(unknown ui.type)"], 18);
  this.renderPcButtons(ui);                // ✅ in case you add buttons later
} 

  return; // ✅ stop renderNode here so story UI doesn’t re-render
} else {
  if (this.pcMode) this.exitPcMode(true);
  this.showStoryUI();
}

  // --- Music tension control ---
const t = typeof node.tension === "number" ? node.tension : null;

// If you don’t set node.tension yet, this fallback keeps things sensible:
let intensity = 0.15; // calm default
if (t != null) {
  intensity = Phaser.Math.Clamp(t, 0, 1);
} else {
  // heuristic fallback: you can refine later
  const id = (state.nodeId || "").toLowerCase();
  if (id.includes("echo") || id.includes("bites") || id.includes("escape")) intensity = 0.85;
  if (id.includes("boss") || id.includes("office")) intensity = 0.55;
  if (id.includes("mirror")) intensity = 0.65;
}
// Avoid piling up volume tweens if you click quickly
this.tweens.killTweensOf(this.ambient);

setAmbientIntensity(this, intensity);

  // Background hook (support object OR function)
  if (node.backgroundLayers) {
    const layers =
      typeof node.backgroundLayers === "function"
        ? node.backgroundLayers(state)
        : node.backgroundLayers;

    this.setBackgroundLayers(layers, state);
    this.tryGhostAppearance(state);

  }

  // one-frame flicker ONLY when entering mirror
  if (entering && state.nodeId === "apartment_mirror") {
    this.oneFrameFlicker();
  }

  // 👁️ Jump scare when mirror variant appears
if (
  state.nodeId === "apartment_mirror" &&
  state.flags.mirrorVariant === "wrong" &&
  !this.jumpScarePlayed
) {
  if (this.cache.audio.exists("jump_scare")) {
    this.sound.play("jump_scare", { volume: 0.9 });
  }
  this.jumpScarePlayed = true;
}

// 😈 Demon laugh — play ONCE when demon mirror appears
if (
  state.nodeId === "apartment_mirror" &&
  state.flags.mirrorVariant === "demon" &&
  !this.demonLaughPlayed
) {
  if (this.cache.audio.exists("demon_laugh")) {
    this.sound.play("demon_laugh", { volume: 0.75 });
  }
  this.demonLaughPlayed = true;
}

    // Text content
    this.titleText.setText(node.title || "");
    const meta = typeof node.meta === "function" ? node.meta(state) : node.meta;
    this.metaText.setText(meta || "");

    const lines = typeof node.text === "function" ? node.text(state) : node.text;
    this.bodyText.setText(Array.isArray(lines) ? lines.join("\n") : (lines || ""));

        this.clearChoices();

    // loot roll (optional)
    if (node.loot && Math.random() < node.loot.chance) {
      const drop = node.loot.table[Math.floor(Math.random() * node.loot.table.length)];
      addItem(state, drop, 1);
    }

    // Responsive choice placement
    let startY = Math.min(this.scale.height - 220, 520);

    // intro-only: push "Begin" down away from the dialog
    if (state.nodeId === "intro_game") {
      startY += 60; // try 40–90
    }

    const choices = typeof node.choices === "function" ? node.choices(state) : node.choices;

    choices?.forEach((c, i) => {
      const txt = this.add.text(60, startY + i * 34, `> ${c.label}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000000",
          blur: 2,
          fill: true
        }
      })
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

      txt.on("pointerdown", () => this.choose(c));
      this.choiceTexts.push(txt);
    });

    // ✅ AFTER choices exist, bind 1–9 keys once
    this.bindChoiceHotkeys();
  }

  choose(choice) {
  const state = this.registry.get("state");

  // If player clicks forward during intro, cut thunder immediately
  if (this._lastNodeId === "intro_game") {
    this.stopIntroThunder();
  }

  // stat check
  if (choice.check) {
    const totals = getTotalStats(state);
    const statVal = totals[choice.check.stat] || 0;
    const roll = Phaser.Math.Between(1, 6);
    const total = roll + statVal;

    const pass = total >= choice.check.dc;
    state.flags.lastCheck = { ...choice.check, roll, total, pass };

    state.nodeId = pass ? choice.onPass : choice.onFail;
    this.renderNode();
    return;
  }

  if (choice.action) this.applyAction(choice);

  // ✅ If no navigation was specified, rerender once to reflect state changes
  if (!choice.go && !choice.goScene) {
    this.renderNode();
    return;
  }

  if (choice.goScene) {
    this.scene.launch(choice.goScene, choice.data || {});
    return;
  }

  if (choice.go) {
    state.nodeId = choice.go;
    this.renderNode();
  }
}

  applyAction(choice) {
  const state = this.registry.get("state");
  const data = choice.data || {};

  switch (choice.action) {
    case "travelDowntown":
  state.locationId = "downtown";

  state.beat = Math.max(state.beat ?? 0, 2);
  state.newsBeat = Math.max(state.newsBeat ?? 0, 2);

  state.nodeId = "downtown_arrival";
  break;

  case "applyTVStory": {
  const { storyId, unlocks = [], evidence = 0 } = data;
  if (!storyId) break;

  state.flags = state.flags || {};
  state.flags.tv_seen = state.flags.tv_seen || {};
  state.flags.tv_story_index = state.flags.tv_story_index ?? 0;
  state.flags.evidence_count = state.flags.evidence_count ?? 0;

  const alreadySeen = !!state.flags.tv_seen[storyId];

  state.flags.tv_seen[storyId] = true;
  state.flags.tv_current_story_id = storyId;

  if (!alreadySeen) {
    state.newsBeat = Math.min(3, (state.newsBeat ?? 0) + 1);
    state.flags.tv_story_index += 1;

    unlocks.forEach((locId) => {
      if (locId) state.flags[`unlock_${locId}`] = true;
    });
    if (unlocks.length) state.flags.unlocked_map = true;

    const ev = Number(evidence ?? 0);
    if (Number.isFinite(ev) && ev > 0) state.flags.evidence_count += ev;
  }

  state.flags.tv_last_story_id = storyId;
  state.flags.tv_last_seen_at = Date.now();
  break;
}
  
      case "collectEvidence": {
        // Collect an evidence flag and apply optional unlocks / counters in a single action.
        // data: { flag: "ev_police_tape", evidence: 1, unlocks: ["riverfront"], once: true }
        state.flags = state.flags || {};
        const flag = data.flag;
        const once = data.once !== false; // default true
        const already = flag ? !!state.flags[flag] : false;

        if (flag) state.flags[flag] = data.value ?? true;

        // Evidence counter (separate from specific ev_* flags)
        state.flags.evidence_count = state.flags.evidence_count ?? 0;
        const ev = Number(data.evidence ?? 0);

        if (!once || !already) {
          if (ev > 0) state.flags.evidence_count += ev;

          // Unlock locations
          const unlocks = Array.isArray(data.unlocks) ? data.unlocks : [];
          unlocks.forEach((locId) => {
            if (locId) state.flags[`unlock_${locId}`] = true;
          });

          // Ensure map appears once you start getting leads
          if (unlocks.length) state.flags.unlocked_map = true;
        }
        break;
      }

case "setFlag":
  if (data.flag) state.flags[data.flag] = (data.value ?? true);
  break;

  case "incFlag": {
  const key = data.flag;
  const by = data.by ?? 1;
  if (!key) break;
  state.flags[key] = (state.flags[key] ?? 0) + by;
  break;
}

case "stareMirror": {
  state.flags = state.flags || {};

    // --- sanity hit guards (per visit) ---
  state.flags.mirror_sanity_hit_wrong =
    state.flags.mirror_sanity_hit_wrong ?? false;

  state.flags.mirror_sanity_hit_demon =
    state.flags.mirror_sanity_hit_demon ?? false;

  const prevVariant = state.flags.mirrorVariant ?? "normal";

  // increment stares
  const amt = Number(data?.amount ?? 1);
  state.flags.mirror_stare_count = (state.flags.mirror_stare_count ?? 0) + amt;

  // persistent wrong total across run
  state.flags.mirror_wrong_total = state.flags.mirror_wrong_total ?? 0;

  // current variant
  const current = state.flags.mirrorVariant ?? "normal";

  // If demon is active, do nothing else
  if (current === "demon") break;

  // --- WRONG MIRROR: 1 in 15 ON EACH STARE ---
  // (but don’t spam-trigger if it’s already wrong)
  const WRONG_CHANCE = 1 / 15;
  const canRollWrong = current !== "wrong";

  if (canRollWrong && Math.random() < WRONG_CHANCE) {
  state.flags.mirrorVariant = "wrong";
  state.flags.mirror_was_wrong = true;
  state.flags.mirror_wrong_total += 1;
  state.flags.mirror_demon_started = false;

  // ✅ sanity drop ONCE when it flips to wrong
  state.maxSanity = state.maxSanity ?? 10;
  state.sanity = state.sanity ?? state.maxSanity;

  if (prevVariant !== "wrong") {
    state.sanity = clamp(state.sanity - 1, 0, state.maxSanity);
  }

  break;
}

  // --- DEMON: only after wrong total >= 3 AND deep stares ---
  const DEMON_STARE_THRESHOLD = 10;
  const DEMON_CHANCE = 1 / 20;

  const eligibleForDemon =
    state.flags.mirror_wrong_total >= 3 &&
    state.flags.mirror_stare_count >= DEMON_STARE_THRESHOLD &&
    state.flags.mirrorVariant !== "demon" &&
    !state.flags.mirror_demon_started;

  if (eligibleForDemon && Math.random() < DEMON_CHANCE) {
  state.flags.mirrorVariant = "demon";
  state.flags.mirror_demon_started = true;

  // ✅ sanity drop ONCE when it flips to demon
  state.maxSanity = state.maxSanity ?? 10;
  state.sanity = state.sanity ?? state.maxSanity;

  if (prevVariant !== "demon") {
    state.sanity = clamp(state.sanity - 2, 0, state.maxSanity);
  }

  break;
}

  // Otherwise: stay normal (or stay wrong if already wrong)
  if (state.flags.mirrorVariant == null) state.flags.mirrorVariant = "normal";

  console.log("[MIRROR] no trigger", {
    stares: state.flags.mirror_stare_count,
    wrongTotal: state.flags.mirror_wrong_total,
    variant: state.flags.mirrorVariant,
  });

  break;
}

case "resetMirrorVisit":
  delete state.flags.mirrorVariant;
  delete state.flags.mirror_wrong_counted_this_visit;
  delete state.flags.mirror_demon_started;

  // ✅ reset sanity guards for next visit
  delete state.flags.mirror_sanity_hit_wrong;
  delete state.flags.mirror_sanity_hit_demon;
  break;

      case "advance":
  state.beat = Math.max(state.beat ?? 0, data.beat ?? (state.beat ?? 0) + 1);
  if (data.newsBeat != null) state.newsBeat = data.newsBeat;
  break;

    case "takeDamage":
      state.hp = clamp(state.hp - (data.amount || 0), 0, state.maxHp);
      break;

    case "gainXp":
      this.gainXp(state, data.amount || 0);
      break;

    // ✅ NEW: sanity loss / gain
    case "loseSanity":
      state.sanity = clamp(
        (state.sanity ?? state.maxSanity ?? 10) - (data.amount ?? 1),
        0,
        state.maxSanity ?? 10
      );
      break;

    case "gainSanity":
      state.sanity = clamp(
        (state.sanity ?? 0) + (data.amount ?? 1),
        0,
        state.maxSanity ?? 10
      );
      break;

    case "buyItem":
      if (state.cash >= data.price) {
        state.cash -= data.price;
        addItem(state, data.id, 1);
      }
      break;

    case "useItem": {
      const id = data.id;
      const def = ITEM_DB[id];
      if (!def) break;
      const ok = removeItem(state, id, 1);
      if (!ok) break;
      const res = def.use?.(state);
      if (res && res.consumed === false) addItem(state, id, 1);
      break;
    }
  }
}

  gainXp(state, amount) {
    state.xp += amount;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level += 1;
      state.xpToNext = Math.floor(state.xpToNext * 1.35);

      state.maxHp += 5;
      state.hp = state.maxHp;

      if (state.level % 2 === 0) {
        state.stats.wits += 1;
      }
    }
  }
}

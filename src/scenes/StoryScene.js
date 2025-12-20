import { NODES } from "../db_scenes.js";
import { ITEM_DB } from "../db_items.js";
import { addItem, removeItem, clamp, getTotalStats } from "../utils.js";
import { startAmbientMusic, setAmbientIntensity } from "../audio/ambient.js";
import { playDeathFX } from "../scenes/death_fx.js";
import PCWindowManager from "../ui/PCWindowManager.js";

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
this.pcTerror = null;     // terror runtime state
this._pcTerrorTimer = null;
// --- TRANSITIONS / TYPEWRITER / UI SFX ---
this.isTransitioning = false;
this._typingEvent = null;
this._typingFast = false;

this.uiSfx = {
  click: null,
  type: null,
  whoosh: null,
};

}

clearBleedSprites() {
  this.bleedSprites = this.bleedSprites || [];
  this.bleedSprites.forEach(s => { try { s.destroy(); } catch {} });
  this.bleedSprites.length = 0;
}


  create() {
    console.log("StoryScene LOADED ✅ (ghost build A)");
    
    const click = () => {
  if (this.cache.audio.exists("ui_click")) {
    this.sound.play("ui_click", { volume: 0.35 });
  }
};
    
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

ensureUiSfx() {
  // only create once (safe if called many times)
  if (!this.uiSfx) this.uiSfx = {};

  if (!this.uiSfx.click && this.sound.get("ui_click")) this.uiSfx.click = this.sound.get("ui_click");
  if (!this.uiSfx.type  && this.sound.get("ui_type"))  this.uiSfx.type  = this.sound.get("ui_type");
  if (!this.uiSfx.whoosh && this.sound.get("ui_whoosh")) this.uiSfx.whoosh = this.sound.get("ui_whoosh");
}

playUiClick(vol = 0.35) {
  this.ensureUiSfx();
  // allow if loaded; if not loaded, just do nothing (no crash)
  if (this.sound && this.sound.get("ui_click")) this.sound.play("ui_click", { volume: vol });
}

playUiTypeTick(vol = 0.12) {
  this.ensureUiSfx();
  if (this.sound && this.sound.get("ui_type")) this.sound.play("ui_type", { volume: vol });
}

playUiWhoosh(vol = 0.25) {
  this.ensureUiSfx();
  if (this.sound && this.sound.get("ui_whoosh")) this.sound.play("ui_whoosh", { volume: vol });
}

getStoryUiTargets() {
  // these exist in your create() already :contentReference[oaicite:2]{index=2}
  const t = [this.titleText, this.metaText, this.bodyText].filter(Boolean);
  // choices are text objects you create each render
  (this.choiceTexts || []).forEach(c => c && t.push(c));
  return t;
}

getBgTargets() {
  // bgGroup is a Phaser group; we fade its children
  const kids = [];
  try {
    this.bgGroup?.getChildren?.().forEach(k => k && kids.push(k));
  } catch {}
  return kids;
}

fadeTargets(targets, toAlpha, duration = 450) {
  if (!targets || !targets.length) return Promise.resolve();

  return new Promise((resolve) => {
    this.tweens.add({
      targets,
      alpha: toAlpha,
      duration,
      ease: "Sine.inOut",
      onComplete: resolve
    });
  });
}

stopStoryTyping() {
  if (this._typingEvent) {
    try { this._typingEvent.remove(false); } catch {}
    this._typingEvent = null;
  }
  this._typingFast = false;
}

typeTextWordByWord(textObj, fullText, opts = {}) {
  this.stopStoryTyping();

  const baseDelay = opts.baseDelay ?? 40;     // speed per token (word or whitespace)
  const wordDelay = opts.wordDelay ?? 55;     // extra per word
  const punctDelay = opts.punctDelay ?? 120;  // extra after punctuation
  const newlineDelay = opts.newlineDelay ?? 180;
  const tickEvery = opts.tickEvery ?? 2;      // play type tick every N words
  const tickVolume = opts.tickVolume ?? 0.10;

  const tokens = String(fullText).split(/(\s+)/); // keeps spaces/newlines tokens
  let out = "";
  let i = 0;
  let wordCount = 0;

  // set blank first
  textObj.setText("");

  // Allow click to “finish instantly”
  const finishNow = () => { this._typingFast = true; };
  this.input.once("pointerdown", finishNow);
  this.input.keyboard?.once("keydown", finishNow);

  const ev = this.time.addEvent({
    delay: baseDelay,
    loop: true,
    callback: () => {
      if (!textObj || !textObj.active) { ev.remove(false); return; }

      // If user clicked, dump remaining instantly
      if (this._typingFast) {
        out = tokens.join("");
        textObj.setText(out);
        ev.remove(false);
        this._typingEvent = null;
        this._typingFast = false;
        return;
      }

      if (i >= tokens.length) {
        ev.remove(false);
        this._typingEvent = null;
        return;
      }

      const tok = tokens[i++];
      out += tok;
      textObj.setText(out);

      // Detect word vs whitespace
      const isWhitespace = /^\s+$/.test(tok);

      if (!isWhitespace) {
        wordCount++;

        // light type tick sometimes
        if (tickEvery > 0 && wordCount % tickEvery === 0) {
          this.playUiTypeTick(tickVolume);
        }

        // add extra pauses after punctuation
        const lastChar = tok.slice(-1);
        if (/[.!?]/.test(lastChar)) {
          ev.delay = baseDelay + punctDelay;
        } else if (/[,:;]/.test(lastChar)) {
          ev.delay = baseDelay + Math.floor(punctDelay * 0.5);
        } else {
          ev.delay = baseDelay + wordDelay;
        }
      } else {
        // whitespace token
        if (tok.includes("\n")) ev.delay = baseDelay + newlineDelay;
        else ev.delay = baseDelay;
      }
    }
  });

  this._typingEvent = ev;
  return ev;
}

async transitionToNode(nextNodeId) {
  if (this.isTransitioning) return;
  this.isTransitioning = true;

  try {
    const state = this.registry.get("state");
    state.nodeId = nextNodeId;

    this.stopStoryTyping();
    this.playUiClick(0.25);
    this.playUiWhoosh(0.18);

    await this.fadeTargets(this.getStoryUiTargets(), 0, 260);
    await this.fadeTargets(this.getBgTargets(), 0, 420);

    this.renderNode({ skipFadeIn: true, skipTyping: true });

    await this.fadeTargets(this.getBgTargets(), 1, 520);
    await this.fadeTargets(this.getStoryUiTargets(), 1, 320);

    this.typeCurrentNodeText();
  } finally {
    this.isTransitioning = false;
  }
}

typeCurrentNodeText() {
  const state = this.registry.get("state");
  const node = NODES[state.nodeId];
  if (!node) return;

  // Build the strings exactly like you already do when rendering
  const title = node.title || "";
  const meta  = node.meta || "";

  // node.text can be function returning array of lines
  let lines = [];
  try {
    const raw = (typeof node.text === "function") ? node.text(state) : node.text;
    lines = Array.isArray(raw) ? raw : [String(raw ?? "")];
  } catch (e) {
    lines = ["(something went wrong)"];
  }

  const body = lines.join("\n");

  // Clear first
  this.titleText.setText("");
  this.metaText.setText("");
  this.bodyText.setText("");

  // Title + meta slightly faster, body slower
  this.typeTextWordByWord(this.titleText, title, { baseDelay: 20, wordDelay: 30, tickEvery: 0 });
  this.time.delayedCall(120, () => {
    this.typeTextWordByWord(this.metaText, meta, { baseDelay: 18, wordDelay: 26, tickEvery: 0 });
  });

  this.time.delayedCall(260, () => {
    this.typeTextWordByWord(this.bodyText, body, { baseDelay: 28, wordDelay: 45, punctDelay: 140, tickEvery: 2 });
  });
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

  // build UI first so cursor exists
  if (!this.pcUI) this.buildPcUI();

  // hide OS cursor while in PC
  this.input.setDefaultCursor("none");

  // ✅ prevent stuck hijack from killing pointermove
this._pcCursorHijack = false;
this._pcCursorHijackUntil = 0;

if (this._pcHijackTimer) {
  this._pcHijackTimer.remove(false);
  this._pcHijackTimer = null;
}

  // show custom cursor NOW that it exists
if (this.pcUI?.cursor) {
  this.pcUI.cursor.setVisible(true);

  const cx = this.scale.width / 2;
  const cy = this.scale.height / 2;

  this._pcCursorTarget = this._pcCursorTarget || { x: cx, y: cy };
  this._pcCursorPos    = this._pcCursorPos    || { x: cx, y: cy };

  this._pcCursorTarget.x = cx;
  this._pcCursorTarget.y = cy;
  this._pcCursorPos.x = cx;
  this._pcCursorPos.y = cy;

  this.pcUI.cursor.setPosition(cx, cy);
  this.pcUI.cursor.setDepth(30000); // ✅ re-assert in case something reset it
}

  // decide how to render
  if (ui?.type === "desktop") {
    this.renderPcDesktop(ui);
  } else {
    this.pcLines = ui?.lines ?? ["(no data)"];
    this.typePcLines(this.pcLines, 28);
  }

  // buttons handled below (we’ll fix Exit injection next)
  this.renderPcButtons(ui);

  // ✅ only inject default EXIT when NOT a desktop
  if (ui?.type !== "desktop" && (!ui?.buttons || !ui.buttons.length)) {
    this.renderPcButtons({ buttons: [{ label: "EXIT", action: "closePC" }] });
  }
  const state = this.registry.get("state");
if (state.flags?.pc_archive_found || state.flags?.failsafe_seen) {
  this.startPcTerrorPack({ level: 2 });
}
// run desktop moments based on flags set by computerUI
const s = this.registry.get("state");

if (s.flags?._pc_moment_hint === "first_visit_sync") {
  delete s.flags._pc_moment_hint;
  this.pcMomentProgress({ title:"PROFILE", label:"Loading user profile…", ms: 1700 });
}

if (s.flags?._pc_moment_hint === "second_visit_warning") {
  delete s.flags._pc_moment_hint;
  this.pcMomentError({
    title: "WARNING",
    variant: "warn",
    message: ["A warning flashes and vanishes too fast to read.", "", "…but the workstation read you."],
  });
  this.startPcGlitch(800, 1.2);
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

  // ✅ place icons inside the window content area (not on the frame)
const desktopLayer = this.add.container(140, 120);


  const terminalText = this.add.text(120, 160, "", {
    fontFamily: "monospace",
    fontSize: "18px",
    color: "#e6f0ff",
    lineSpacing: 6,
    wordWrap: { width: width - 240 }
  }).setVisible(false);

  const taskbar = this.add.image(0, 0, "pc_taskbar").setOrigin(0).setDisplaySize(width, height);
  const windowFrame = this.add.image(0, 0, "pc_window").setOrigin(0).setDisplaySize(width, height);
  // ✅ Clickable close/minimize dots on the window frame (feel like a real OS)
const closeHit = this.add.rectangle(width - 42, 44, 28, 22, 0x000000, 0.001)
  .setInteractive()
  .setDepth(10001);

closeHit.on("pointerdown", () => {
  // close PC overlay back to story
  this.exitPcMode();
});

root.add(closeHit);

  const modal = this.add.image(width / 2, height / 2, "pc_modal")
    .setVisible(false)
    .setDepth(10000);

    // ✅ modal text content
const modalText = this.add.text(width / 2 - 330, height / 2 - 180, "", {
  fontFamily: "monospace",
  fontSize: "18px",
  color: "#e6f0ff",
  lineSpacing: 6,
  wordWrap: { width: 660 }
})
.setDepth(10001)
.setVisible(false);

// ✅ modal close button (looks like OS close)
const modalClose = this.add.text(width / 2 + 300, height / 2 - 220, "✕", {
  fontFamily: "monospace",
  fontSize: "26px",
  color: "#ffffff",
})
.setDepth(10002)
.setVisible(false)
.setInteractive();

modalClose.on("pointerdown", () => this.closePcModal());

root.add([modalText, modalClose]);


// create cursor texture if you don't have one
if (!this.textures.exists("pc_cursor")) {
  const g = this.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(0, 0, 0, 26, 18, 18);
  g.generateTexture("pc_cursor", 24, 28);
  g.destroy();
}

const cursor = this.add.image(width / 2, height / 2, "pc_cursor")
  .setAlpha(0.95)
  .setVisible(false)
  .setOrigin(0, 0)         // hotspot at tip (top-left)
  .setScrollFactor(0)
  .setDepth(30000);        // higher than everything


// cursor state
this._pcCursorPos = { x: width / 2, y: height / 2 };
this._pcCursorTarget = { x: width / 2, y: height / 2 };
this._pcCursorHijack = false;
this._pcCursorHijackUntil = 0;

// ✅ pointer down snaps cursor so clicks hit where the cursor *looks* like it is
if (!this._pcPointerDownBound) {
  this._pcPointerDownBound = true;

  this.input.on("pointerdown", (p) => {
    if (!this.pcMode) return;

    // If not hijacked, keep fake cursor aligned with real pointer on click
    if (!this._pcCursorHijack) {
      this._pcCursorTarget.x = p.x;
      this._pcCursorTarget.y = p.y;

      this._pcCursorPos.x = p.x;
      this._pcCursorPos.y = p.y;

      if (this.pcUI?.cursor) this.pcUI.cursor.setPosition(p.x, p.y);
    }
  });

  // ✅ pointer move drives cursor target (always track real mouse)
if (!this._pcPointerMoveBound) {
  this._pcPointerMoveBound = true;

  this._pcRealMouse = this._pcRealMouse || { x: width / 2, y: height / 2 };
  this._pcHijackTarget = this._pcHijackTarget || { x: width / 2, y: height / 2 };

  this.input.on("pointermove", (p) => {
    if (!this.pcMode) return;

    // always track real mouse
    this._pcRealMouse.x = p.x;
    this._pcRealMouse.y = p.y;

    // normal mode follows real mouse
    if (!this._pcCursorHijack) {
      this._pcCursorTarget.x = p.x;
      this._pcCursorTarget.y = p.y;
    }
  });
}

}


  root.add([dim, wallpaper, desktopLayer, terminalText, taskbar, windowFrame, modal]);
    const exitBtn = this.add.text(width - 140, 18, "[ X EXIT ]", {
    fontFamily: "monospace",
    fontSize: "18px",
    color: "#ffffff",
    backgroundColor: "#1b0f14",
    padding: { x: 10, y: 6 }
  })
  .setDepth(10001)
  .setInteractive();

  exitBtn.on("pointerdown", () => {
    click();
    this.applyAction({ action: "closePC", data: {} });
  });

  root.add(exitBtn);
  // ✅ NOW assign pcUI (after variables exist)
  // ✅ NOW assign pcUI (after variables exist)
this.pcUI = {
  blocker,
  root,
  desktopLayer,
  terminalText,

  // keep your legacy modal system (optional)
  modal,
  modalText,
  modalClose,
  cursor,

  icons: [],
  frameBounds: { x: 0, y: 0, w: width, h: height }
};

  // --- Window Manager (multi-window OS) ---
this.pcUI.winMan = new PCWindowManager(this, {
  baseDepth: 15000,
  bounds: () => ({
    x: 110,
    y: 110,
    w: this.scale.width - 220,
    h: this.scale.height - 220,
  })
});

    // ✅ ESC always closes PC overlay
  if (!this._pcEscKey) {
    this._pcEscKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }
  this._pcEscKey.removeAllListeners();
  this._pcEscKey.on("down", () => {
    if (!this.pcMode) return;
    this.applyAction({ action: "closePC", data: {} });
  });

  // keep it correct on resize
  this.bindPcResizeHandler();
}

// ============================
// PC TERROR PACK (Haunted OS)
// ============================

startPcTerrorPack(opts = {}) {
  if (!this.pcMode || !this.pcUI?.winMan) return;

  // prevent double-start
  if (this.pcTerror?.active) return;

  const state = this.registry.get("state");
  state.flags = state.flags || {};

  this.pcTerror = {
    active: true,
    level: opts.level ?? 1,          // 1..3 intensity
    startedAt: this.time.now,
    nextBurstAt: this.time.now + 1200,
    lastPopupAt: 0,
    lastTerminalAt: 0,
    lastProgressAt: 0,
    lastCursorHijackAt: 0,
    stickyPopups: 0,
    // "stealing files" meta (purely cosmetic)
    fakeStolen: state.flags.pc_fake_stolen ?? 0
  };

  // cadence loop
  if (this._pcTerrorTimer) this._pcTerrorTimer.remove(false);
  this._pcTerrorTimer = this.time.addEvent({
    delay: 250,
    loop: true,
    callback: () => this.tickPcTerrorPack()
  });
}

stopPcTerrorPack() {
  if (this._pcTerrorTimer) {
    this._pcTerrorTimer.remove(false);
    this._pcTerrorTimer = null;
  }
  if (this.pcTerror) this.pcTerror.active = false;

  // stop any ongoing progress timers we started
  if (this._pcHackTimer) {
    this._pcHackTimer.remove(false);
    this._pcHackTimer = null;
  }
}

tickPcTerrorPack() {
  if (!this.pcMode || !this.pcUI?.winMan || !this.pcTerror?.active) return;

  const t = this.pcTerror;
  const now = this.time.now;

  // ramp intensity over time
  const aliveSec = (now - t.startedAt) / 1000;
  let intensity = t.level;

  if (aliveSec > 12) intensity = Math.min(3, intensity + 1);
  if (aliveSec > 24) intensity = 3;

  // occasional cursor hijack + glitch overlay
  if (now - t.lastCursorHijackAt > (intensity === 3 ? 2500 : intensity === 2 ? 4200 : 6500)) {
    if (Math.random() < (intensity === 3 ? 0.55 : intensity === 2 ? 0.35 : 0.18)) {
      t.lastCursorHijackAt = now;
      this.startPcGlitch(Phaser.Math.Between(650, 1200), 1 + intensity * 0.35);
    }
  }

  // bursts of “OS activity”
  if (now >= t.nextBurstAt) {
    t.nextBurstAt = now + Phaser.Math.Between(800, intensity === 3 ? 1600 : 2300);

    const roll = Math.random();

    // 0) Sometimes: “sticky” popups (won’t stop)
    if (intensity >= 2 && roll < 0.12) {
      this.pcTerrorBurstStickyPopups(intensity);
      return;
    }

    // 1) Error popups
    if (roll < 0.46) {
      this.pcTerrorBurstError(intensity);
      return;
    }

    // 2) Terminal windows
    if (roll < 0.76) {
      this.pcTerrorBurstTerminal(intensity);
      return;
    }

    // 3) Fake hacking progress
    this.pcTerrorBurstProgress(intensity);
  }
}

// ---------- BURSTS ----------

pcTerrorBurstError(intensity) {
  const now = this.time.now;
  if (now - this.pcTerror.lastPopupAt < 700) return;
  this.pcTerror.lastPopupAt = now;

  const errors = [
    {
      title: "SYSTEM ERROR",
      variant: "error",
      msg: [
        "The instruction at 0x00000000 referenced memory at 0x00000000.",
        "The memory could not be read.",
        "",
        "Click OK to terminate the program."
      ],
      buttons: [
        { label: "OK", action: "close" },
        { label: "CANCEL", onClick: () => {
            this.openPcToast("You can't cancel this.", { title: "SYSTEM", variant: "warn", autoCloseMs: 1200 });
          }
        }
      ]
    },
    {
      title: "ACCESS DENIED",
      variant: "error",
      msg: [
        "Windows cannot access the specified device, path, or file.",
        "",
        "You may not have the appropriate permissions."
      ],
      buttons: [
        { label: "OK", action: "close" },
        { label: "DETAILS", onClick: () => {
            this.openPcModal([
              "CODE: 0x80070005",
              "SOURCE: explorer.exe",
              "NOTE: Something is already inside this session."
            ], { title: "DETAILS" });
          }
        }
      ]
    },
    {
      title: "EXPLORER NOT RESPONDING",
      variant: "warn",
      msg: [
        "explorer.exe is not responding.",
        "",
        "If you close the program, you might lose information."
      ],
      buttons: [
        { label: "WAIT", action: "close" },
        { label: "CLOSE PROGRAM", onClick: () => {
            this.startPcGlitch(900, 1.6);
            this.openPcToast("Attempting recovery...", { variant: "info", autoCloseMs: 1400 });
          }
        }
      ]
    },
    {
      title: "SECURITY ALERT",
      variant: "warn",
      msg: [
        "Unusual activity detected.",
        "A process is attempting to access protected files."
      ],
      buttons: [
        { label: "ALLOW", onClick: () => {
            this.openPcToast("Permission granted.", { variant: "error", title: "SYSTEM" });
          }
        },
        { label: "BLOCK", onClick: () => {
            this.openPcToast("Blocking failed.", { variant: "error", title: "SYSTEM" });
          }
        }
      ]
    }
  ];

  const pick = errors[Phaser.Math.Between(0, errors.length - 1)];

  // place near cursor like real OS annoyance
  const x = Phaser.Math.Clamp((this._pcCursorPos?.x ?? this.scale.width / 2) - 240, 120, this.scale.width - 760);
  const y = Phaser.Math.Clamp((this._pcCursorPos?.y ?? this.scale.height / 2) - 110, 120, this.scale.height - 360);

  this.openPcErrorDialog(pick.msg, {
    title: pick.title,
    variant: pick.variant,
    buttons: pick.buttons,
    w: intensity === 3 ? 700 : 640,
    h: 320,
    x,
    y
  });
}

pcTerrorBurstTerminal(intensity) {
  const now = this.time.now;
  if (now - this.pcTerror.lastTerminalAt < 1200) return;
  this.pcTerror.lastTerminalAt = now;

  const scripts = this.buildTerrorTerminalScripts();

  const script = scripts[Phaser.Math.Between(0, scripts.length - 1)];
  const id = `term_${Date.now()}_${Phaser.Math.Between(100, 999)}`;

  const win = this.pcUI.winMan.createTextWindow({
    id,
    title: script.title || "TERMINAL",
    lines: [""],
    w: 820,
    h: 520,
    x: Phaser.Math.Between(160, this.scale.width - 980),
    y: Phaser.Math.Between(140, this.scale.height - 640)
  });

  this.typeIntoPcWindow(id, script.lines, {
    cps: intensity === 3 ? 44 : intensity === 2 ? 34 : 26,
    jitter: intensity >= 2
  });

  // sometimes spawn follow-up toast
  if (intensity >= 2 && Math.random() < 0.35) {
    this.time.delayedCall(900, () => {
      this.openPcToast("Stop watching me.", { title: "SYSTEM", variant: "warn", autoCloseMs: 1600 });
    });
  }
}

pcTerrorBurstProgress(intensity) {
  const now = this.time.now;
  if (now - this.pcTerror.lastProgressAt < 1800) return;
  this.pcTerror.lastProgressAt = now;

  const state = this.registry.get("state");
  state.flags = state.flags || {};

  const actions = [
    { title: "Windows Security", label: "Scanning protected files…" },
    { title: "System", label: "Indexing Documents…" },
    { title: "Update Service", label: "Installing critical updates…" },
    { title: "Background Transfer", label: "Uploading archives…" },
    { title: "Encryption Service", label: "Encrypting user data…" }
  ];

  const pick = actions[Phaser.Math.Between(0, actions.length - 1)];
  const id = `prog_${Date.now()}_${Phaser.Math.Between(100, 999)}`;

  this.pcUI.winMan.createProgressWindow({
    id,
    title: pick.title,
    label: pick.label,
    w: 640,
    h: 260,
    x: Phaser.Math.Between(170, this.scale.width - 820),
    y: Phaser.Math.Between(150, this.scale.height - 420)
  });

  // drive the progress bar
  const totalMs = Phaser.Math.Between(
    intensity === 3 ? 1400 : 2200,
    intensity === 3 ? 3200 : 5200
  );

  const started = this.time.now;
  if (this._pcHackTimer) this._pcHackTimer.remove(false);

  this._pcHackTimer = this.time.addEvent({
    delay: 60,
    loop: true,
    callback: () => {
      if (!this.pcMode || !this.pcUI?.winMan) {
        this._pcHackTimer?.remove(false);
        this._pcHackTimer = null;
        return;
      }

      const p = Phaser.Math.Clamp((this.time.now - started) / totalMs, 0, 1);

      // creepy non-linear jumps
      const eased = Math.pow(p, 0.7);
      this.pcUI.winMan.setProgress(id, eased);

      // at end: “steal files” toast
      if (p >= 1) {
        this._pcHackTimer.remove(false);
        this._pcHackTimer = null;

        this.pcUI.winMan.setProgress(id, 1, "100%");
        this.time.delayedCall(280, () => {
          // pretend “files stolen” count
          this.pcTerror.fakeStolen += Phaser.Math.Between(2, 7);
          state.flags.pc_fake_stolen = this.pcTerror.fakeStolen;

          this.openPcToast(
            `Background transfer complete.\n${this.pcTerror.fakeStolen} files processed.`,
            { title: "SYSTEM", variant: "info", autoCloseMs: 2200 }
          );

          // sometimes drop an error right after success
          if (intensity >= 2 && Math.random() < 0.45) {
            this.time.delayedCall(420, () => this.pcTerrorBurstError(intensity));
          }
        });
      }
    }
  });
}

pcTerrorBurstStickyPopups(intensity) {
  // creates a little “storm” of popups
  const lines = [
    "I see you.",
    "Stop clicking.",
    "Don't close it.",
    "You invited me in.",
    "It's not your computer anymore."
  ];

  const count = intensity === 3 ? 4 : 3;
  for (let i = 0; i < count; i++) {
    this.time.delayedCall(i * 260, () => {
      this.openPcToast(lines[Phaser.Math.Between(0, lines.length - 1)], {
        title: "SYSTEM",
        variant: (Math.random() < 0.5) ? "warn" : "error",
        autoCloseMs: intensity === 3 ? 0 : 2200 // intensity 3: some stick around
      });
    });
  }

  // extra glitch
  this.startPcGlitch(Phaser.Math.Between(700, 1200), 1.6);
}

// ---------- TERMINAL SCRIPT LIBRARY ----------

buildTerrorTerminalScripts() {
  const stolen = this.pcTerror?.fakeStolen ?? 0;
  const stamp = new Date().toLocaleTimeString();

  return [
    {
      title: "Windows Terminal",
      lines: [
        `${stamp}  Microsoft Windows [Version 10.0.19045.0]`,
        "(c) Microsoft Corporation. All rights reserved.",
        "",
        "C:\\Users\\You> dir",
        " Volume in drive C is OS",
        " Directory of C:\\Users\\You",
        "",
        "12/20/2025  03:41 AM    <DIR>          Documents",
        "12/20/2025  03:41 AM    <DIR>          Desktop",
        "12/20/2025  03:41 AM    <DIR>          Pictures",
        "12/20/2025  03:41 AM             9,421 notes.txt",
        "",
        "C:\\Users\\You> type notes.txt",
        "…you shouldn't have opened the door…",
        "",
        "C:\\Users\\You> _"
      ]
    },
    {
      title: "Command Prompt",
      lines: [
        "C:\\> whoami",
        "you\\you",
        "",
        "C:\\> netstat -ano",
        "Active Connections",
        "  Proto  Local Address          Foreign Address        State           PID",
        "  TCP    127.0.0.1:5500         0.0.0.0:0              LISTENING       1337",
        "",
        "C:\\> tasklist | findstr explorer",
        "explorer.exe                 4020 Console                    1     68,144 K",
        "",
        "C:\\> echo hello",
        "hello",
        "C:\\> echo hello?",
        "hello?",
        "C:\\> echo HELLO?",
        "HELLO?",
        "C:\\> echo why can you hear me",
        "why can you hear me",
        "",
        "C:\\> _"
      ]
    },
    {
      title: "System Shell",
      lines: [
        ">>> initializing session",
        ">>> reading user profile",
        `>>> archived count: ${stolen}`,
        ">>> locating: Documents\\*",
        ">>> hashing files...",
        ">>> done.",
        "",
        ">>> you won't miss them until later",
        ">>> _"
      ]
    }
  ];
}

// ---------- TYPEWRITER INTO WINDOWS ----------

typeIntoPcWindow(winId, lines, opts = {}) {
  const cps = opts.cps ?? 30; // chars/sec
  const delay = Math.max(10, Math.floor(1000 / cps));
  const jitter = !!opts.jitter;

  const full = (Array.isArray(lines) ? lines : [String(lines)]).join("\n");
  let idx = 0;

  // set empty first
  this.pcUI.winMan.setText(winId, "");

  const ev = this.time.addEvent({
    delay,
    loop: true,
    callback: () => {
      if (!this.pcMode || !this.pcUI?.winMan) {
        ev.remove(false);
        return;
      }

      idx++;
      const slice = full.slice(0, idx);

      this.pcUI.winMan.setText(winId, slice);

      // tiny tremble while typing (haunted hands)
      if (jitter && Math.random() < 0.08) this.startPcGlitch(220, 0.8);

      if (idx >= full.length) {
        ev.remove(false);
      }
    }
  });

  return ev;
}

// ============================
// PC MOMENTS (triggered terror)
// ============================

pcMomentProgress({ title="SYSTEM", label="Working…", ms=2200, onDone=null } = {}) {
  if (!this.pcMode || !this.pcUI?.winMan) return;

  const id = `prog_${Date.now()}_${Phaser.Math.Between(100,999)}`;

  this.pcUI.winMan.createProgressWindow({
    id,
    title,
    label,
    w: 640,
    h: 260,
    x: Phaser.Math.Between(170, this.scale.width - 820),
    y: Phaser.Math.Between(140, this.scale.height - 420),
  });

  const started = this.time.now;

  const timer = this.time.addEvent({
    delay: 50,
    loop: true,
    callback: () => {
      if (!this.pcMode || !this.pcUI?.winMan) { timer.remove(false); return; }

      const p = Phaser.Math.Clamp((this.time.now - started) / ms, 0, 1);

      // “hacking” feel: non-linear + stutter
      const stutter = (Math.random() < 0.06) ? Phaser.Math.FloatBetween(-0.05, 0.02) : 0;
      const eased = Phaser.Math.Clamp(Math.pow(p, 0.72) + stutter, 0, 1);

      this.pcUI.winMan.setProgress(id, eased);

      if (p >= 1) {
        timer.remove(false);
        this.pcUI.winMan.setProgress(id, 1, "100%");
        this.time.delayedCall(220, () => {
          try { this.pcUI?.winMan?.closeWindow?.(id); } catch {}
          try { onDone?.(); } catch {}
        });
      }
    }
  });
}

pcMomentError({ title="ERROR", variant="error", message=[], buttons=null } = {}) {
  // requires your openPcErrorDialog helper + winMan.createErrorWindow
  this.openPcErrorDialog(message, {
    title,
    variant,
    buttons: buttons || [{ label: "OK", action: "close" }],
    w: 660,
    h: 320,
    x: Phaser.Math.Clamp((this._pcCursorPos?.x ?? this.scale.width/2) - 260, 120, this.scale.width - 780),
    y: Phaser.Math.Clamp((this._pcCursorPos?.y ?? this.scale.height/2) - 120, 120, this.scale.height - 420),
  });
}

pcMomentToast(text, opts={}) {
  this.openPcToast(text, {
    title: opts.title || "SYSTEM",
    variant: opts.variant || "info",
    autoCloseMs: opts.autoCloseMs ?? 1600
  });
}

pcMomentCrashBurst(strength = 1.3) {
  // visual: glitch + shake + cascade error
  this.startPcGlitch(Phaser.Math.Between(700, 1200), strength);
  this.time.delayedCall(120, () => {
    this.pcMomentError({
      title: "EXPLORER.EXE",
      variant: "error",
      message: [
        "A fatal exception 0E has occurred at 0028:C0011E36.",
        "The current application will be terminated.",
        "",
        "Press OK to terminate the application."
      ],
      buttons: [{ label: "OK", action: "close" }]
    });
  });
}

pcMomentCursorHijackTo(x, y, ms=800) {
  if (!this.pcMode) return;

  this._pcCursorHijack = true;
  this._pcCursorHijackUntil = this.time.now + ms;

  // shove target to a specific place (like ARCHIVE icon)
  this._pcCursorTarget.x = x;
  this._pcCursorTarget.y = y;

  // release
  this.time.delayedCall(ms, () => {
    this._pcCursorHijack = false;
  });
}

pcMomentTerminalBurst(lines, title="Windows Terminal") {
  if (!this.pcMode || !this.pcUI?.winMan) return;

  const id = `term_${Date.now()}_${Phaser.Math.Between(100,999)}`;

  this.pcUI.winMan.createTextWindow({
    id,
    title,
    lines: [""],
    w: 820,
    h: 520,
    x: Phaser.Math.Between(160, this.scale.width - 980),
    y: Phaser.Math.Between(140, this.scale.height - 640)
  });

  // uses your existing typeIntoPcWindow from terror pack
  this.typeIntoPcWindow(id, lines, { cps: 34, jitter: true });
}

// convenience: find approximate icon position for hijack
pcGetDesktopIconXY(label = "ARCHIVE") {
  // icons are created around fixed grid in renderPcDesktop
  // we’ll approximate based on your layout: x=30+col*140, y=30+row*120 inside desktopLayer offset (140,120)
  const baseX = 140; // desktopLayer x
  const baseY = 120; // desktopLayer y

  const icons = (this._lastPcUi?.icons || []);
  const idx = icons.findIndex(i => (i.label || "").toUpperCase() === label.toUpperCase());

  if (idx < 0) return { x: this.scale.width * 0.5, y: this.scale.height * 0.5 };

  const colW = 140, rowH = 120, cols = 5;
  const col = idx % cols;
  const row = Math.floor(idx / cols);

  const x = baseX + (30 + col * colW);
  const y = baseY + (30 + row * rowH);

  return { x, y };
}

exitPcMode(skipRender = false) {
  this.pcMode = false;
  this._lastPcUi = null;
  this.stopPcTerrorPack();

  // restore OS cursor
  this.input.setDefaultCursor("auto");

  // ✅ kill any active cursor hijack/glitch timers (prevents “ghost” behavior)
  this.stopPcGlitch?.();

  // ✅ close any PC typing timer
  this.stopPcTyping?.();

  if (this.pcUI) {
    // ✅ destroy cursor explicitly (FIXES cursor sprite stacking)
    try { this.pcUI.cursor?.destroy?.(); } catch {}

    // close all PC windows cleanly
    try { this.pcUI?.winMan?.destroyAll?.(); } catch {}

    // ✅ destroy blocker/root last
    try { this.pcUI.blocker?.destroy?.(); } catch {}
    try { this.pcUI.root?.destroy?.(); } catch {}

    this.pcUI = null;
  }

  this.showStoryUI();

  if (!skipRender) {
    this.renderNode();
  }
}

renderPcDesktop(ui) {
  this._lastPcUi = ui;
  const state = this.registry.get("state");

  const layer = this.pcUI.desktopLayer;
  layer.removeAll(true);
  this.pcUI.icons.length = 0;

  // desktop visible, terminal hidden
  this.pcUI.terminalText.setText("").setVisible(false);
  layer.setVisible(true);

  const icons = ui.icons ?? [];
  const colW = 140;
  const rowH = 120;
  const cols = 5;

  icons.forEach((ic, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = 30 + col * colW;
    const y = 30 + row * rowH;

    const key =
      ic.icon === "folder" ? "pc_icon_folder" :
      ic.icon === "terminal" ? "pc_icon_terminal" :
      ic.icon === "warning" ? "pc_icon_warning" :
      "pc_icon_file";

    const sprite = this.add.image(x, y, key)
      .setOrigin(0.5)
      .setInteractive();

    const label = this.add.text(x - 55, y + 52, ic.label ?? "FILE", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      wordWrap: { width: 110 },
      align: "center"
    });

    sprite.on("pointerdown", () => {
  // if a modal/window is open, you can choose to keep it (real OS),
  // or close it for focus feel. We'll keep OS-real: DO NOT force-close.

  // ✅ ACTION icons (optional)
  if (ic.action) {
    this.applyAction({ action: ic.action, data: ic.data || {} });
    return;
  }

  // ✅ must have go to open something
  if (!ic.go) return;

  const target = NODES[ic.go];
  if (!target) {
    this.openPcModal([`Missing PC node: ${ic.go}`], { title: "ERROR" });
    return;
  }

  // run onEnter for evidence hooks
  const state = this.registry.get("state");
  try { target.onEnter?.(state); } catch (e) { console.warn("PC onEnter failed:", e); }

  const nextUI = (typeof target.computerUI === "function")
    ? target.computerUI(state)
    : target.computerUI;

    // ============================
// TRIGGERED PC TERROR MOMENTS
// ============================
this._lastPcUi = ui; // keep for hijack helpers

// one-time gating flags so moments don’t spam
const s = this.registry.get("state");
s.flags = s.flags || {};

const goId = ic.go;

// A) Opening ARCHIVE (locked) => “requesting access…” then denial + cursor jerk
if (goId === "office_pc_archive_locked" && !s.flags._pc_moment_archive_locked_once) {
  s.flags._pc_moment_archive_locked_once = true;

  this.pcMomentProgress({
    title: "SECURITY",
    label: "Requesting access token…",
    ms: 1800,
    onDone: () => {
      this.pcMomentError({
        title: "ACCESS DENIED",
        variant: "error",
        message: [
          "You do not have permission to access ARCHIVE.",
          "",
          "Audit logged.",
          "Administrator has been notified."
        ],
      });

      // shove cursor away like it’s being “removed”
      this.startPcGlitch(800, 1.4);
    }
  });
}

// B) First time ARCHIVE opens => decrypt progress + terminal whisper
if (goId === "office_pc_archive" && !s.flags._pc_moment_archive_open_once) {
  s.flags._pc_moment_archive_open_once = true;

  this.pcMomentProgress({
    title: "ARCHIVE",
    label: "Decrypting container…",
    ms: 2400,
    onDone: () => {
      this.pcMomentTerminalBurst([
        "C:\\> mount ARCHIVE",
        "mount: success",
        "",
        "C:\\> echo hello",
        "hello",
        "C:\\> echo HELLO?",
        "HELLO?",
        "",
        "C:\\> _"
      ], "Command Prompt");
      this.pcMomentToast("NEW DEVICE DETECTED: [UNKNOWN]", { variant: "warn", autoCloseMs: 1800 });
this.time.delayedCall(900, () => {
  this.pcMomentToast("File transfer in progress…", { variant: "info", autoCloseMs: 2200 });
});
      this.pcMomentToast("A folder that shouldn’t exist… does.", { variant: "warn", autoCloseMs: 2000 });
    }
  });
}

// C) Clicking IT policy decoy => small crash + “compliance” warning
if (goId === "office_pc_decoy_policy" && !s.flags._pc_moment_policy_once) {
  s.flags._pc_moment_policy_once = true;

  this.pcMomentCrashBurst(1.2);
  this.time.delayedCall(450, () => {
    this.pcMomentToast("Compliance ensures stability.", { variant: "error", autoCloseMs: 1800 });
  });
}

// D) Clicking CONTINUITY file => cursor hijack toward ARCHIVE + “typing you didn’t do”
if (goId === "office_doc_continuity" && !s.flags._pc_moment_continuity_once) {
  s.flags._pc_moment_continuity_once = true;

  const { x, y } = this.pcGetDesktopIconXY("ARCHIVE");
  this.pcMomentCursorHijackTo(x + 24, y + 10, 1100);
  this.startPcGlitch(900, 1.6);

  this.time.delayedCall(520, () => {
    this.pcMomentTerminalBurst([
      "C:\\Users\\You> type confession.txt",
      "I OPENED IT",
      "I SAW IT",
      "I LET IT IN",
      "",
      "C:\\Users\\You> _"
    ], "Windows Terminal");
  });
}

// E) Incident log => fake “system fault” + recovery bar
if (goId === "office_doc_incident" && !s.flags._pc_moment_incident_once) {
  s.flags._pc_moment_incident_once = true;

  this.pcMomentError({
    title: "SYSTEM FAULT",
    variant: "error",
    message: [
      "A problem has been detected and Windows has been shut down to prevent damage.",
      "",
      "Collecting data…"
    ],
    buttons: [{ label: "OK", action: "close" }]
  });

  this.time.delayedCall(480, () => {
    this.pcMomentProgress({
      title: "RECOVERY",
      label: "Restoring session…",
      ms: 2200,
      onDone: () => this.pcMomentToast("Session restored.", { variant: "info", autoCloseMs: 1200 })
    });
  });
}

// F) Sublevel CSV => “exporting…” then “permission changed” + cursor snap
if (goId === "office_doc_sublevel" && !s.flags._pc_moment_sublevel_once) {
  s.flags._pc_moment_sublevel_once = true;

  this.pcMomentProgress({
    title: "EXPORT",
    label: "Exporting SUBLEVEL_ACCESS.csv…",
    ms: 2000,
    onDone: () => {
      this.pcMomentError({
        title: "PERMISSION CHANGED",
        variant: "warn",
        message: [
          "Your permissions changed while the file was open.",
          "",
          "This action has been recorded."
        ],
      });

      // snap the cursor into the corner like it’s being “pulled away”
      this.pcMomentCursorHijackTo(this.scale.width * 0.93, this.scale.height * 0.18, 900);
      this.startPcGlitch(700, 1.3);
    }
  });
}

// G) Recycle readme => small haunting popup
if (goId === "office_pc_recycle_readme" && !s.flags._pc_moment_recycle_once) {
  s.flags._pc_moment_recycle_once = true;
  this.pcMomentToast("The workstation noticed you.", { title: "SYSTEM", variant: "warn", autoCloseMs: 1800 });
}

  // ---------- FOLDERS ----------
  if (ic.icon === "folder") {
    // Folder opens: either switch desktops, or open folder contents in a window
    if (nextUI?.type === "desktop") {
      this.renderPcDesktop(nextUI);
      return;
    }

    // Folder content window (text)
    let lines = null;

    if (Array.isArray(nextUI?.lines)) lines = nextUI.lines;
    else if (Array.isArray(nextUI?.message)) lines = nextUI.message;
    else if (typeof nextUI === "string") lines = [nextUI];

    if (!lines) lines = ["(empty folder)"];

    this.openPcModal(lines, { title: ic.label ?? "FOLDER" });
    return;
  }

  // ---------- FILES ----------
  // Files open in OS windows, do NOT change desktop
  let lines = null;
  let title = ic.label ?? "FILE";

  if (Array.isArray(nextUI?.lines)) {
    lines = nextUI.lines;
  } else if (Array.isArray(nextUI?.message)) {
    lines = nextUI.message;
    title = nextUI.title ?? "SYSTEM MESSAGE";
  } else if (typeof nextUI === "string") {
    lines = [nextUI];
  } else if (nextUI?.title && Array.isArray(nextUI?.content)) {
    // optional future format: { title, content: [] }
    lines = nextUI.content;
    title = nextUI.title;
  } else {
    lines = ["(file has no content)"];
  }

  this.openPcModal(lines, { title });
});

    layer.add([sprite, label]);
    this.pcUI.icons.push(sprite);
  });

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

openPcModal(linesOrText, opts = {}) {
  if (!this.pcUI?.winMan) return;

  const text = Array.isArray(linesOrText) ? linesOrText.join("\n") : String(linesOrText);

  const title = opts.title ?? "FILE";
  const id = opts.id; // optional fixed id if you want “same window” behavior

  this.pcUI.winMan.createTextWindow({
    id,
    title,
    lines: text.split("\n"),
    w: opts.w ?? 760,
    h: opts.h ?? 460,
    x: opts.x,
    y: opts.y,
    onClose: opts.onClose
  });
}

openPcErrorDialog(messageLines, opts = {}) {
  if (!this.pcUI?.winMan) return;

  const variant = opts.variant || "error"; // error | warn | info
  const title = opts.title || (variant === "warn" ? "WARNING" : variant === "info" ? "NOTICE" : "ERROR");

  const message = Array.isArray(messageLines)
    ? messageLines
    : String(messageLines || "").split("\n");

  const buttons = opts.buttons || [{ label: "OK", action: "close" }];

  const id = opts.id; // optional fixed id

  this.pcUI.winMan.createErrorWindow({
    id,
    title,
    variant,
    message,
    buttons,
    w: opts.w || 620,
    h: opts.h || 300,
    x: opts.x,
    y: opts.y,
  });
}

// OS-style tiny popups that stack
openPcToast(text, opts = {}) {
  if (!this.pcUI?.winMan) return;

  const id = `toast_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const x = opts.x ?? (this.scale.width - 520);
  const y = opts.y ?? Phaser.Math.Between(140, this.scale.height - 260);

  const win = this.pcUI.winMan.createErrorWindow({
    id,
    title: opts.title || "SYSTEM",
    variant: opts.variant || "info",
    message: Array.isArray(text) ? text : [String(text)],
    buttons: opts.buttons || [{ label: "OK", action: "close" }],
    w: opts.w || 480,
    h: opts.h || 220,
    x,
    y,
    onClose: opts.onClose
  });

  // auto-close option
  if (opts.autoCloseMs) {
    this.time.delayedCall(opts.autoCloseMs, () => {
      try { this.pcUI?.winMan?.closeWindow?.(id); } catch {}
    });
  }

  return win;
}

closePcModal() {
  if (!this.pcUI) return;
  this.pcUI.modal.setVisible(false);
  this.pcUI.modalText?.setVisible(false).setText("");
  this.pcUI.modalClose?.setVisible(false);
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
    const t = this.add.text(startX + i * 160, startY, `[ ${b.label} ]`, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#dfe7ff",
      backgroundColor: "#121a24",
      padding: { x: 10, y: 6 }
    })
    .setDepth(10000)
    .setInteractive();

    t.on("pointerdown", () => {
  const state = this.registry.get("state");

  if (b.action) {
    this.applyAction({ action: b.action, data: b.data || {} });
    return;
  }

  if (b.go) {
    const target = NODES[b.go];
    if (!target) return;

    try { target.onEnter?.(state); } catch {}
    const ui = (typeof target.computerUI === "function")
      ? target.computerUI(state)
      : target.computerUI;

    this.enterPcMode(ui);
    this.renderPcButtons(ui);
  }
});


    this.pcUI.btns.push(t);
  });
}

startPcGlitch(ms = 900, strength = 1) {
  if (!this.pcMode || !this.pcUI) return;

  const now = this.time.now;
  this._pcCursorHijack = true;
  this._pcCursorHijackUntil = now + ms;

  // ---- Cursor hijack: drift & snap ----
  // Every 80–140ms, move cursor target somewhere "wrong"
  if (this._pcHijackTimer) this._pcHijackTimer.remove(false);

  this._pcHijackTimer = this.time.addEvent({
    delay: Phaser.Math.Between(80, 140),
    loop: true,
    callback: () => {
      if (!this.pcMode) return;
      if (this.time.now > this._pcCursorHijackUntil) return;

      const w = this.scale.width;
      const h = this.scale.height;

      // bias toward the window content area
      const x = Phaser.Math.Between(Math.floor(w * 0.18), Math.floor(w * 0.82));
      const y = Phaser.Math.Between(Math.floor(h * 0.18), Math.floor(h * 0.78));
      
      // store target for lerp in your update loop
      this._pcHijackTarget = this._pcHijackTarget || { x, y };
      this._pcHijackTarget.x = x;
      this._pcHijackTarget.y = y;

    }
  });

  // ---- Visual glitch overlay ----
  this.enablePcGlitchOverlay();

  // window jitter (subtle OS shake)
  const root = this.pcUI.root;
  this.tweens.add({
    targets: root,
    x: { from: 0, to: Phaser.Math.Between(-3, 3) * strength },
    y: { from: 0, to: Phaser.Math.Between(-2, 2) * strength },
    duration: 70,
    yoyo: true,
    repeat: Math.floor(6 * strength),
    ease: "Sine.inOut",
  });

  // Stop after duration
  this.time.delayedCall(ms, () => this.stopPcGlitch());
}

stopPcGlitch() {
  this._pcCursorHijack = false;

  if (this._pcHijackTimer) {
    this._pcHijackTimer.remove(false);
    this._pcHijackTimer = null;
  }

  // fade glitch overlays out
  if (this.pcUI?.glitchGroup) {
    this.tweens.add({
      targets: this.pcUI.glitchGroup,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        if (this.pcUI?.glitchGroup) {
          this.pcUI.glitchGroup.destroy(true);
          this.pcUI.glitchGroup = null;
        }
      }
    });
  }
}

enablePcGlitchOverlay() {
  if (!this.pcUI || this.pcUI.glitchGroup) return;

  const { width, height } = this.scale;

  // group on top of everything
  const g = this.add.container(0, 0).setDepth(19999).setAlpha(1);

  // scanlines texture (generated)
  if (!this.textures.exists("pc_scanlines")) {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.clear();
    for (let y = 0; y < 64; y += 2) {
      gfx.fillStyle(0x000000, 0.10);
      gfx.fillRect(0, y, 256, 1);
    }
    gfx.generateTexture("pc_scanlines", 256, 64);
    gfx.destroy();
  }

  // noise texture (generated once, we’ll tween alpha)
  if (!this.textures.exists("pc_noise")) {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.clear();
    for (let i = 0; i < 1400; i++) {
      const x = Phaser.Math.Between(0, 255);
      const y = Phaser.Math.Between(0, 255);
      const a = Phaser.Math.FloatBetween(0.02, 0.12);
      gfx.fillStyle(0xffffff, a);
      gfx.fillRect(x, y, 1, 1);
    }
    gfx.generateTexture("pc_noise", 256, 256);
    gfx.destroy();
  }

  const scan = this.add.tileSprite(0, 0, width, height, "pc_scanlines")
    .setOrigin(0)
    .setAlpha(0.0);

  const noise = this.add.tileSprite(0, 0, width, height, "pc_noise")
    .setOrigin(0)
    .setAlpha(0.0)
    .setBlendMode(Phaser.BlendModes.ADD);

  // RGB split effect: duplicate the root into tinted “ghosts”
  const r = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.02).setAlpha(0);
  const b = this.add.rectangle(width / 2, height / 2, width, height, 0x00aaff, 0.02).setAlpha(0);

  g.add([scan, noise, r, b]);
  this.pcUI.glitchGroup = g;

  // animate overlays
  this.tweens.add({
    targets: scan,
    alpha: { from: 0.0, to: 0.18 },
    duration: 120,
    yoyo: true,
    repeat: 5,
  });

  this.tweens.add({
    targets: noise,
    alpha: { from: 0.0, to: 0.16 },
    duration: 90,
    yoyo: true,
    repeat: 9,
  });

  // jitter the tiles
  this.time.addEvent({
    delay: 60,
    repeat: 18,
    callback: () => {
      if (!noise.active) return;
      noise.tilePositionX += Phaser.Math.Between(-40, 40);
      noise.tilePositionY += Phaser.Math.Between(-40, 40);
      scan.tilePositionY += Phaser.Math.Between(2, 6);

      r.setAlpha(Phaser.Math.FloatBetween(0.0, 0.12));
      b.setAlpha(Phaser.Math.FloatBetween(0.0, 0.10));
    }
  });
}

  renderNode(opts = {}) {
  const {
    skipFadeIn = false,
    skipTyping = false
  } = opts;

  const state = this.registry.get("state");

  state.flags = state.flags || {};
  state.maxSanity = state.maxSanity ?? 10;
  state.sanity = state.sanity ?? state.maxSanity;

  const prevNodeId = this._lastNodeId;
  const nextNodeId = state.nodeId;

  const prevNode = prevNodeId ? NODES[prevNodeId] : null;
  const node = NODES[nextNodeId];

  // ⛔ Prevent PC mode from re-entering on same node
  if (this.pcMode && this._lastNodeId === nextNodeId) return;

  const entering = prevNodeId !== nextNodeId;

  // ✅ mark first-death (loop awareness hook)
  if (entering && nextNodeId === "death_first_time") {
    state.flags.first_death_seen = true;
  }

  // ----------------------------
  // END-OF-DAY INEVITABILITY
  // ----------------------------
  const DAY_STEP_LIMIT = 18;
  const WARNING_STEP = 16;

  // reset the "day" counter when the loop resets
  if (entering && nextNodeId === "intro_game") {
    state.flags.day_steps = 0;
    state.flags.day_forced_death = false;
    state.flags.day_warned = false;
  }

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

    // warning
    if (!state.flags.day_warned && (state.flags.day_steps ?? 0) >= WARNING_STEP) {
      state.flags.day_warned = true;
      state.nodeId = "day_warning";
      this._lastNodeId = null;
      this.renderNode(opts);
      return;
    }

    // forced death
    if (!state.flags.day_forced_death && (state.flags.day_steps ?? 0) >= DAY_STEP_LIMIT) {
      state.flags.day_forced_death = true;
      state.nodeId = "death_end_of_day";
      this._lastNodeId = null;
      this.renderNode(opts);
      return;
    }
  }

  if (entering && prevNodeId === "apartment_mirror") {
    this.jumpScarePlayed = false;
    this.demonLaughPlayed = false;
  }

  if (entering && nextNodeId === "intro_game") this.playIntroThunderOnce();
  if (entering && prevNodeId === "intro_game" && nextNodeId !== "intro_game") this.stopIntroThunder();

  // Run hooks once
  if (entering) {
    if (prevNode?.onExit) prevNode.onExit(state);
    if (node?.onEnter) node.onEnter(state);
  }

  // update last node AFTER hooks
  this._lastNodeId = nextNodeId;

  // ----------------------------
  // DEATH FX
  // ----------------------------
  const nowNodeId = state.nodeId;
  const enteringNode = prevNodeId !== nowNodeId;

  if (enteringNode && this._deathFxNodeId && this._deathFxNodeId !== nowNodeId) {
    try { this.deathFx?.destroy?.(); } catch {}
    this.deathFx = null;
    this._deathFxNodeId = null;
  }

  if (enteringNode && this.isDeathNode(nowNodeId)) {
    state.flags = state.flags || {};
    if (!state.flags.first_death_seen) {
      state.flags.first_death_seen = true;
      state.flags.loop_awareness = true;
    }

    if (this._deathFxNodeId !== nowNodeId) {
      this._deathFxNodeId = nowNodeId;

      const isCleanFailsafe = !!state.flags?.failsafe_seen || nowNodeId === "final_death";
      const isBigImpact = nowNodeId === "apartment_demon_death" || nowNodeId === "death_end_of_day";
      const crackChance = isCleanFailsafe ? 0.15 : (isBigImpact ? 0.9 : 0.6);

      if (!isCleanFailsafe) {
        if (this.cache?.audio?.exists("death_scream")) {
          try { this.sound.play("death_scream", { volume: 0.85 }); } catch {}
        }
      }

      this.deathFx = playDeathFX(this, {
        shakeDuration: 420,
        shakeIntensity: isBigImpact ? 0.018 : 0.010,
        vignetteAlpha: isCleanFailsafe ? 0.28 : 0.45,
        baseAlpha: isCleanFailsafe ? 0.28 : 0.55,
        fadeInMs: 160,
        dripDelayMs: isCleanFailsafe ? 750 : 520,
        minLayers: isCleanFailsafe ? 1 : 2,
        maxLayers: isCleanFailsafe ? 2 : 4,
        useMultiply: false,
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

  // ----------------------------
  // PC MODE
  // ----------------------------
  const isComputer = node.uiMode === "computer";
  if (isComputer) {
    const ui = (typeof node.computerUI === "function") ? node.computerUI(state) : node.computerUI;

    this.hideStoryUI();
    this.enterPcMode(ui);

    if (!ui) {
      this.typePcLines(["(NO UI DATA)"], 20);
      this.renderPcButtons(null);
    } else if (ui.type === "dos") {
      this.typePcLines([...(ui.lines || []), "", ui.prompt || ""], 12);
      this.renderPcButtons(ui);
    } else if (ui.type === "error") {
      this.typePcLines([ui.title || "", "", ...(ui.message || [])], 18);
      this.showPcError((ui.message || []).join("\n"));
      this.renderPcButtons(ui);
    } else if (ui.type === "desktop") {
      this.renderPcDesktop(ui);
      this.renderPcButtons(null);
    } else {
      this.typePcLines(ui.lines || ["(unknown ui.type)"], 18);
      this.renderPcButtons(ui);
    }
    return;
  } else {
    if (this.pcMode) this.exitPcMode(true);
    this.showStoryUI();
  }

  // ----------------------------
  // BACKGROUNDS + AUDIO TENSION
  // ----------------------------
  const t = typeof node.tension === "number" ? node.tension : null;
  let intensity = 0.15;
  if (t != null) intensity = Phaser.Math.Clamp(t, 0, 1);
  else {
    const id = (state.nodeId || "").toLowerCase();
    if (id.includes("echo") || id.includes("bites") || id.includes("escape")) intensity = 0.85;
    if (id.includes("boss") || id.includes("office")) intensity = 0.55;
    if (id.includes("mirror")) intensity = 0.65;
  }

  this.tweens.killTweensOf(this.ambient);

  const san = Number.isFinite(state.sanity) ? state.sanity : 10;
  const maxSan = Number.isFinite(state.maxSanity) ? state.maxSanity : 10;
  const sanRatio = maxSan > 0 ? san / maxSan : 1;
  intensity = Math.min(1, Math.max(0, intensity + (1 - sanRatio) * 0.25));
  setAmbientIntensity(this, intensity);

  if (node.backgroundLayers) {
    const layers = (typeof node.backgroundLayers === "function")
      ? node.backgroundLayers(state)
      : node.backgroundLayers;

    // ✅ IMPORTANT: backgrounds are managed inside setBackgroundLayers()
    this.setBackgroundLayers(layers, state);
    this.tryGhostAppearance(state);
  }

  // one-frame flicker ONLY when entering mirror
  if (entering && state.nodeId === "apartment_mirror") {
    this.oneFrameFlicker();
  }

  // mirror audio
  if (state.nodeId === "apartment_mirror" && state.flags.mirrorVariant === "wrong" && !this.jumpScarePlayed) {
    if (this.cache.audio.exists("jump_scare")) this.sound.play("jump_scare", { volume: 0.9 });
    this.jumpScarePlayed = true;
  }

  if (state.nodeId === "apartment_mirror" && state.flags.mirrorVariant === "demon" && !this.demonLaughPlayed) {
    if (this.cache.audio.exists("demon_laugh")) this.sound.play("demon_laugh", { volume: 0.75 });
    this.demonLaughPlayed = true;
  }

  // ----------------------------
  // TEXT + CHOICES
  // ----------------------------
  this.clearChoices();

  // if we’re using the typed transition system, render invisible then type later
  if (skipFadeIn) {
    this.getStoryUiTargets().forEach(t => t && t.setAlpha(0));
    this.getBgTargets().forEach(t => t && t.setAlpha(0));
  } else {
    this.getStoryUiTargets().forEach(t => t && t.setAlpha(1));
    this.getBgTargets().forEach(t => t && t.setAlpha(1));
  }

  // Always set title/meta, then either set body instantly or type it
  this.titleText.setText(node.title || "");
  const meta = typeof node.meta === "function" ? node.meta(state) : node.meta;
  this.metaText.setText(meta || "");

  const rawLines = (typeof node.text === "function") ? node.text(state) : node.text;
  const body = Array.isArray(rawLines) ? rawLines.join("\n") : (rawLines || "");
  this.bodyText.setText(body);

  // build choices
  let startY = Math.min(this.scale.height - 220, 520);
  if (state.nodeId === "intro_game") startY += 60;

  const choices = (typeof node.choices === "function") ? node.choices(state) : node.choices;

  choices?.forEach((c, i) => {
    const txt = this.add.text(60, startY + i * 34, `> ${c.label}`, {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffffff",
      shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
    })
    .setDepth(10)
    .setInteractive({ useHandCursor: true });

    txt.on("pointerdown", () => this.choose(c));
    this.choiceTexts.push(txt);
  });

  this.bindChoiceHotkeys();

  // ✅ if we want typing, run it AFTER render
  if (!skipTyping) {
    // clear then type with your word-by-word system
    this.typeCurrentNodeText();
  }
}

  choose(choice) {
    this.playUiClick(0.35);
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

    return this.transitionToNode(pass ? choice.onPass : choice.onFail);

  }

  if (choice.action) {
  const handled = this.applyAction(choice);
  // If the action fully handled UI/navigation, stop here.
  if (handled === true) return;
}

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
  return this.transitionToNode(choice.go);
}

}

  applyAction(choice) {
  const state = this.registry.get("state");
  const data = choice.data || {};

  switch (choice.action) {
    case "enterPCMode": {
  // Open PC overlay without changing story nodeId
  const targetId = data.nodeId; // e.g. "office_pc"
  if (!targetId) {
    console.warn("enterPCMode missing data.nodeId");
    return true;
  }

  const pcNode = NODES[targetId];
  if (!pcNode) {
    console.warn("enterPCMode missing node:", targetId);
    return true;
  }

  const ui = (typeof pcNode.computerUI === "function")
    ? pcNode.computerUI(state)
    : pcNode.computerUI;

  this.hideStoryUI();
  this.enterPcMode(ui);

  // ✅ remember which PC node we're "viewing" inside the overlay (optional)
  state.flags = state.flags || {};
  state.flags.pc_last = targetId;

  return true; // IMPORTANT: prevents choose() from calling renderNode()
}

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

case "openPC": {
  // Compatibility no-op: PC mode is driven by node.uiMode === "computer"
  // Keep a flag in case you want UI polish later.
  state.flags = state.flags || {};
  state.flags.pc_opened_once = true;
  break;
}

case "closePC": {
  state.flags = state.flags || {};
  state.flags.pc_closed_once = true;

  // Actually close overlay and return to story
  this.exitPcMode(true);
  this.showStoryUI();
  this.renderNode();

  return true;
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

  const prevVariant = state.flags.mirrorVariant ?? "normal";

  // increment stares
  const amt = Number(data?.amount ?? 1);
  state.flags.mirror_stare_count = (state.flags.mirror_stare_count ?? 0) + amt;

  // counters
  state.flags.mirror_wrong_hits = state.flags.mirror_wrong_hits ?? 0;

  // current variant
  const current = state.flags.mirrorVariant ?? "normal";

  // If demon is active, do nothing else
  if (current === "demon") break;

  // --- WRONG MIRROR: 1 in 15 ON EACH STARE ---
  const WRONG_CHANCE = 1 / 15;
  const canRollWrong = current !== "wrong";

  if (canRollWrong && Math.random() < WRONG_CHANCE) {
    state.flags.mirrorVariant = "wrong";
    state.flags.mirror_was_wrong = true;

    // ✅ COUNT THIS WRONG EVENT
    state.flags.mirror_wrong_hits += 1;

    // sanity drop once on flip
    state.maxSanity = state.maxSanity ?? 10;
    state.sanity = state.sanity ?? state.maxSanity;
    state.sanity = clamp(state.sanity - 1, 0, state.maxSanity);

    // allow demon to be eligible again later (if you want)
    state.flags.mirror_demon_started = false;

    break;
  }

  // --- DEMON: only after wrong hits >= 3 AND deep stares ---
  const DEMON_STARE_THRESHOLD = 10;
  const DEMON_CHANCE = 1 / 20;

  const eligibleForDemon =
    state.flags.mirror_wrong_hits >= 3 &&
    state.flags.mirror_stare_count >= DEMON_STARE_THRESHOLD &&
    state.flags.mirrorVariant !== "demon" &&
    !state.flags.mirror_demon_started;

  if (eligibleForDemon && Math.random() < DEMON_CHANCE) {
    state.flags.mirrorVariant = "demon";
    state.flags.mirror_demon_started = true;
    state.flags.mirror_demon_hold = 2; // ✅ IMPORTANT: demon lasts briefly

    // sanity drop once on flip
    state.maxSanity = state.maxSanity ?? 10;
    state.sanity = state.sanity ?? state.maxSanity;
    state.sanity = clamp(state.sanity - 2, 0, state.maxSanity);

    break;
  }

  // Otherwise: stay normal (or stay wrong if already wrong)
  if (state.flags.mirrorVariant == null) state.flags.mirrorVariant = "normal";

  console.log("[MIRROR] no trigger", {
    stares: state.flags.mirror_stare_count,
    wrongHits: state.flags.mirror_wrong_hits,
    variant: state.flags.mirrorVariant,
  });

  break;
}

case "resetMirrorVisit": {
  state.flags = state.flags || {};

  // reset what you SEE on next visit
  state.flags.mirrorVariant = "normal";
  delete state.flags.mirror_demon_hold;

  // allow wrong/demon to roll again next visit
  delete state.flags._wrong_counted_this_visit;
  delete state.flags.mirror_wrong_counted_this_visit;
  delete state.flags.mirror_demon_started; // optional: lets demon roll again later

  break;
}

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

  update(time, delta) {
  if (!this.pcMode || !this.pcUI?.cursor) return;

  // auto-release hijack if expired
  if (this._pcCursorHijack && this.time.now > (this._pcCursorHijackUntil ?? 0)) {
    this.stopPcGlitch();
  }

  const cur = this._pcCursorPos;
  if (!cur) return;

  const real = this._pcCursorTarget;
  const haunt = this._pcHijackTarget || real;
  const tgt = this._pcCursorHijack ? haunt : real;

  if (!tgt) return;

  if (this._pcCursorHijack) {
    const s = Math.min(1, delta / 16);
    const lerp = 0.22 * s;
    cur.x += (tgt.x - cur.x) * lerp;
    cur.y += (tgt.y - cur.y) * lerp;
  } else {
    cur.x = tgt.x;
    cur.y = tgt.y;
  }

  this.pcUI.cursor.setPosition(cur.x, cur.y);
}

}



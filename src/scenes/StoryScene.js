import { NODES } from "../db_scenes.js";
import { ITEM_DB } from "../db_items.js";
import { addItem, removeItem, clamp, getTotalStats } from "../utils.js";
import { startAmbientMusic, setAmbientIntensity } from "../audio/ambient.js";
import { playDeathFX } from "../scenes/death_fx.js";

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super("StoryScene");
    this.thunder = null;
    this.jumpScarePlayed = false;
    this.demonLaughPlayed = false;

    this.ghostActive = false;
    this.lastGhostTime = 0;

    this.deathFx = null;
  }

  clearDeathFx() {
    if (!this.deathFx) return;
    try {
      this.deathFx.destroy?.();
    } catch {}
    this.deathFx = null;
  }

  clearBleedSprites() {
    this.bleedSprites = this.bleedSprites || [];
    this.bleedSprites.forEach((s) => {
      try {
        s.destroy();
      } catch {}
    });
    this.bleedSprites.length = 0;
  }

  create() {
    console.log("StoryScene LOADED ✅ (ghost build A)");

    const { width } = this.scale;
    this.ambient = startAmbientMusic(this);

    // if autoplay is blocked, start on first pointer
    this.input.once("pointerdown", () => {
      if (this.ambient && !this.ambient.isPlaying) this.ambient.play();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopIntroThunder();
      this.clearDeathFx();
    });

    // --- Background layer holders ---
    this.bgGroup = this.add.group();
    this.bgSprites = { bg: null, fg: null, light: null, glow: null, screen: null };
    this.bleedSprites = [];
    this.bgTweens = [];
    this.currentLayers = null;

    // Text (above panel)
    this.titleText = this.add
      .text(40, 70, "", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ffffff",
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true },
      })
      .setDepth(10);

    this.metaText = this.add
      .text(40, 110, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cfcfcf",
        shadow: { offsetX: 1, offsetY: 1, color: "#000000", blur: 2, fill: true },
      })
      .setDepth(10);

    this.bodyText = this.add
      .text(40, 160, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#eaeaea",
        wordWrap: { width: width - 80 },
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 3, fill: true },
      })
      .setDepth(10);

    this.choiceTexts = [];

    // Re-scale backgrounds on resize
    this.scale.on("resize", () => {
      if (this.currentLayers) this.setBackgroundLayers(this.currentLayers, this.registry.get("state"));
      this.bodyText.setWordWrapWidth(this.scale.width - 80);
    });

    this._lastNodeId = null;
    this.renderNode();
  }

  // ---------- UTILS ----------
  scaleToCover(image, cx = this.scale.width / 2, cy = this.scale.height / 2) {
    const { width, height } = this.scale;
    const iw = image.width;
    const ih = image.height;

    const scale = Math.max(width / iw, height / ih);
    image.setScale(scale);
    image.setPosition(cx, cy);
  }

  bleedToBg(newKey, cx, cy) {
    const oldBg = this.bgSprites.bg;
    if (!oldBg) return;

    this.clearBleedSprites?.();

    const cx2 = cx ?? this.scale.width / 2;
    const cy2 = cy ?? this.scale.height / 2;

    const D = 1200;

    const overlay = this.add
      .image(cx2, cy2, newKey)
      .setOrigin(0.5)
      .setDepth(oldBg.depth + 1)
      .setAlpha(0);

    const g1 = this.add
      .image(cx2 + 10, cy2 + 4, newKey)
      .setOrigin(0.5)
      .setDepth(oldBg.depth + 1)
      .setAlpha(0);

    const g2 = this.add
      .image(cx2 - 10, cy2 - 4, newKey)
      .setOrigin(0.5)
      .setDepth(oldBg.depth + 1)
      .setAlpha(0);

    this.scaleToCover(overlay, cx2, cy2);
    this.scaleToCover(g1, cx2, cy2);
    this.scaleToCover(g2, cx2, cy2);

    this.bleedSprites.push(overlay, g1, g2);

    overlay.x += 6;
    overlay.y += 2;
    g1.x += 6;
    g1.y += 2;
    g2.x += 6;
    g2.y += 2;

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

    const tg1 = this.tweens.add({
      targets: g1,
      alpha: { from: 0, to: 0.22 },
      x: cx2 + 4,
      y: cy2 + 2,
      duration: Math.floor(D * 0.35),
      yoyo: true,
      repeat: 1,
      ease: "Sine.inOut",
    });

    const tg2 = this.tweens.add({
      targets: g2,
      alpha: { from: 0, to: 0.18 },
      x: cx2 - 4,
      y: cy2 - 2,
      duration: Math.floor(D * 0.42),
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
    this.bgTweens.forEach((t) => t?.stop?.());
    this.bgTweens = [];

    this.clearBleedSprites();

    if (this.bgSprites.bg) this.tweens.killTweensOf(this.bgSprites.bg);
    if (this.bgSprites.fg) this.tweens.killTweensOf(this.bgSprites.fg);
    if (this.bgSprites.light) this.tweens.killTweensOf(this.bgSprites.light);
    if (this.bgSprites.glow) this.tweens.killTweensOf(this.bgSprites.glow);
    if (this.bgSprites.screen) this.tweens.killTweensOf(this.bgSprites.screen);
  }

  // ---------- BACKGROUND RENDERING ----------
  setBackgroundLayers(layerKeys, state = null) {
    this.currentLayers = layerKeys;
    if (!layerKeys) return;

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const enteringMirror =
      state?.nodeId === "apartment_mirror" &&
      layerKeys?.bg &&
      this.bgSprites.bg &&
      this.bgSprites.bg.texture?.key &&
      this.bgSprites.bg.texture.key !== layerKeys.bg;

    const isVariantSwap =
      enteringMirror &&
      (layerKeys.bg.includes("mirror_wrong") || layerKeys.bg.includes("mirror_demon"));

    if (isVariantSwap) {
      this.killBackgroundTweens();

      ["fg", "light", "glow", "screen"].forEach((k) => {
        if (this.bgSprites[k]) {
          this.bgSprites[k].destroy();
          this.bgSprites[k] = null;
        }
      });

      this.tryGhostAppearance(state);
      this.bleedToBg(layerKeys.bg, cx, cy);
    } else {
      this.killBackgroundTweens();
      this.bgGroup.clear(true, true);
      this.bgSprites = { bg: null, fg: null, light: null, glow: null, screen: null };
    }

    // ---- BASE BACKGROUND ----
    if (layerKeys.bg && this.textures.exists(layerKeys.bg)) {
      const shouldCreateBg = !(isVariantSwap && this.bgSprites.bg);
      if (shouldCreateBg) {
        const bg = this.add.image(cx, cy, layerKeys.bg).setDepth(-30).setOrigin(0.5);
        this.scaleToCover(bg);
        this.bgGroup.add(bg);
        this.bgSprites.bg = bg;
      }
    }

    // ---- TV / SCREEN ----
    if (layerKeys.screen && this.textures.exists(layerKeys.screen)) {
      const screen = this.add
        .image(0, 0, layerKeys.screen)
        .setDepth(-18)
        .setOrigin(0.5)
        .setAlpha(layerKeys.screenAlpha ?? 0.95);

        

      if (layerKeys.lockScreenToBg && this.bgSprites.bg) {
  const bg = this.bgSprites.bg;

  // interpret screenX/screenY as normalized coordinates on the bg image (0..1)
  const nx = layerKeys.screenX ?? 0.23;
  const ny = layerKeys.screenY ?? 0.62;

  screen.x = bg.x + (nx - 0.5) * bg.displayWidth;
  screen.y = bg.y + (ny - 0.5) * bg.displayHeight;
} else {
  const sx = (layerKeys.screenX ?? 0.23) * this.scale.width;
  const sy = (layerKeys.screenY ?? 0.62) * this.scale.height;
  screen.setPosition(sx, sy);
}


      screen.setScale(layerKeys.screenScale ?? 0.34);
      screen.setRotation(layerKeys.screenRot ?? -0.035);

      const blendName = (layerKeys.screenBlend || "SCREEN").toUpperCase();
      const BLENDS = Phaser.BlendModes;
      const blend =
        blendName === "ADD"
          ? BLENDS.ADD
          : blendName === "MULTIPLY"
            ? BLENDS.MULTIPLY
            : blendName === "NORMAL"
              ? BLENDS.NORMAL
              : BLENDS.SCREEN;

      screen.setBlendMode(blend);

      this.bgGroup.add(screen);
      this.bgSprites.screen = screen;

      const tvFlicker = this.tweens.add({
        targets: screen,
        alpha: {
          from: (layerKeys.screenAlpha ?? 0.95) - 0.05,
          to: (layerKeys.screenAlpha ?? 0.95) + 0.05,
        },
        duration: Phaser.Math.Between(80, 140),
        yoyo: true,
        repeat: -1,
      });
      this.bgTweens.push(tvFlicker);
    }

    // ---- LIGHT ----
    if (layerKeys.light && this.textures.exists(layerKeys.light)) {
      const light = this.add
        .image(cx, cy, layerKeys.light)
        .setDepth(-20)
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setAlpha(1);

      this.scaleToCover(light);

      this.bgGroup.add(light);
      this.bgSprites.light = light;

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

    // ---- GLOW ----
    if (layerKeys.glow && this.textures.exists(layerKeys.glow)) {
      const glow = this.add
        .image(cx, cy, layerKeys.glow)
        .setDepth(-15)
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.9);

      this.scaleToCover(glow);

      this.bgGroup.add(glow);
      this.bgSprites.glow = glow;

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

    // ---- FOREGROUND ----
if (layerKeys.fg && this.textures.exists(layerKeys.fg)) {
  const fg = this.add.image(0, 0, layerKeys.fg)
    .setDepth(5)
    .setOrigin(0.5);

  // ✅ If fgX/fgY provided, treat FG as an "anchored overlay" (like TV frame)
  if (layerKeys.fgX != null && layerKeys.fgY != null) {
    const fx = (layerKeys.fgX) * this.scale.width;
    const fy = (layerKeys.fgY) * this.scale.height;

    fg.setPosition(fx, fy);
    fg.setScale(layerKeys.fgScale ?? 0.34);
    fg.setRotation(layerKeys.fgRot ?? -0.035);
  } else {
    // otherwise it's a normal full-screen overlay
    fg.setPosition(cx, cy);
    this.scaleToCover(fg);
  }

  this.bgGroup.add(fg);
  this.bgSprites.fg = fg;
}

    // ---- CAMERA DRIFT ----
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

  playIntroThunderOnce() {
    if (!this.thunder) {
      this.thunder = this.sound.add("thunderstorm", { loop: false, volume: 0.9 });
    }
    if (!this.thunder.isPlaying) this.thunder.play();
  }

  stopIntroThunder() {
    if (this.thunder && this.thunder.isPlaying) this.thunder.stop();
  }

  // ---------- STORY ----------
  clearChoices() {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
  }

  tryGhostAppearance(state) {
    state.maxSanity = state.maxSanity ?? 10;
    state.sanity = state.sanity ?? state.maxSanity;

    if (state.sanity > 3) return;

    const id = (state.nodeId || "").toLowerCase();
    const isApartment = id.startsWith("apartment_") || id === "intro_morning" || id === "apartment";
    if (!isApartment) return;

    const now = this.time.now;
    if (now - this.lastGhostTime < 2500) return;

    const chance = (4 - state.sanity) * 0.12;
    if (Math.random() > chance) return;

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
    if (id === "apartment_mirror" || id === "apartment_door") {
      SCALE = 0.44;
      BASE_A = 0.18;
      ECHO_A = 0.06;
    }

    const DEPTH = 4;

    const ghost = this.add
      .image(gx, gy, "ghost_fg")
      .setDepth(DEPTH)
      .setScrollFactor(0)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setTint(0xdfe7ff)
      .setScale(SCALE);

    const g1 = this.add
      .image(gx + 10, gy + 6, "ghost_fg")
      .setDepth(DEPTH)
      .setScrollFactor(0)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setTint(0xdfe7ff)
      .setScale(SCALE);

    const g2 = this.add
      .image(gx - 10, gy - 6, "ghost_fg")
      .setDepth(DEPTH)
      .setScrollFactor(0)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setTint(0xdfe7ff)
      .setScale(SCALE);

    this.tweens.killTweensOf([ghost, g1, g2]);
    ghost.setTint(0xe8f0ff);

    this.cameras.main.shake(60, 0.0018);

    this.tweens.add({
      targets: ghost,
      alpha: { from: 0, to: BASE_A },
      duration: 120,
      ease: "Sine.out",
    });

    this.tweens.add({
      targets: [g1, g2],
      alpha: { from: 0, to: ECHO_A },
      duration: 140,
      ease: "Sine.out",
    });

    this.tweens.add({
      targets: ghost,
      alpha: { from: BASE_A, to: 0.1 },
      duration: 220,
      yoyo: true,
      repeat: 1,
      ease: "Linear",
    });

    this.tweens.add({
      targets: ghost,
      x: gx + 6,
      duration: 900,
      yoyo: true,
      ease: "Sine.inOut",
    });

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

    let x = w * 0.56;
    let y = h * 0.7;

    if (id === "intro_morning" || id === "apartment" || id.startsWith("apartment_")) {
      x = w * 0.62;
      y = h * 0.68;
    }
    if (id === "apartment_door") {
      x = w * 0.24;
      y = h * 0.7;
    }
    if (id === "apartment_coffee") {
      x = w * 0.52;
      y = h * 0.76;
    }
    if (id === "apartment_tv") {
      x = w * 0.72;
      y = h * 0.66;
    }
    if (id === "apartment_mirror") {
      x = w * 0.38;
      y = h * 0.72;
    }

    return { x, y };
  }

  oneFrameFlicker() {
    const w = this.scale.width;
    const h = this.scale.height;

    const r = this.add.rectangle(0, 0, w, h, 0x000000, 1).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
    this.time.delayedCall(16, () => r.destroy());
  }

  renderNode() {
    const state = this.registry.get("state");

    state.flags = state.flags || {};
    state.maxSanity = state.maxSanity ?? 10;
    state.sanity = state.sanity ?? state.maxSanity;

    const prevNodeId = this._lastNodeId;
    const nextNodeId = state.nodeId;

    const prevNode = prevNodeId ? NODES[prevNodeId] : null;
    const node = NODES[nextNodeId];

    const entering = prevNodeId !== nextNodeId;

    if (entering && nextNodeId === "death_first_time") {
      state.flags.first_death_seen = true;
    }

    const DAY_STEP_LIMIT = 18;
    const WARNING_STEP = 16;

    if (entering && nextNodeId === "intro_game") {
      state.flags.day_steps = 0;
      state.flags.day_forced_death = false;
      state.flags.day_warned = false;
    }

    const isDeathNode =
      typeof nextNodeId === "string" &&
      (nextNodeId === "final_death" || nextNodeId === "death_end_of_day" || nextNodeId.startsWith("death_"));

    const isIntroOrMenu = nextNodeId === "intro_game" || nextNodeId === "intro_morning" || nextNodeId === "menu";

    if (isIntroOrMenu) this.clearDeathFx();

    state.flags._deathFxNode = state.flags._deathFxNode ?? null;

    if (entering) {
      const wasDeathNode =
        prevNodeId === "final_death" ||
        prevNodeId === "death_end_of_day" ||
        (typeof prevNodeId === "string" && prevNodeId.startsWith("death_"));

      if (wasDeathNode && !isDeathNode) {
        this.clearDeathFx();
        state.flags._deathFxNode = null;
        state.flags._deathScreamNode = null;
      }

      if (isDeathNode && !isIntroOrMenu && state.flags._deathFxNode !== nextNodeId) {
        this.clearDeathFx();

        state.flags._deathScreamNode = state.flags._deathScreamNode ?? null;
        if (state.flags._deathScreamNode !== nextNodeId) {
          if (this.sound && this.cache.audio.exists("death_scream")) {
            this.sound.play("death_scream", { volume: 0.9, loop: false });
          }
          state.flags._deathScreamNode = nextNodeId;
        }

        const BIG_IMPACT = new Set(["death_car", "death_muggers", "death_supernatural_corner", "death_end_of_day", "death_mirror_demon"]);
        const isBigImpact = BIG_IMPACT.has(nextNodeId);

        const ev = Number(state.flags?.evidence_count ?? 0);
        const isCleanFailsafe = nextNodeId === "final_death" && ev >= 3;

        const crackChance = isCleanFailsafe ? 0 : isBigImpact ? 0.85 : 0.25;

        this.deathFx = playDeathFX(this, {
  shakeDuration: 420,
  shakeIntensity: isBigImpact ? 0.02 : 0.012,

  // ✅ LIGHTER SETTINGS
  vignetteAlpha: 0.45,
  baseAlpha:    0.35,

  dripDelayMs: isCleanFailsafe ? 700 : 450,
  minLayers: isCleanFailsafe ? 1 : 2,
  maxLayers: isCleanFailsafe ? 2 : 3,

  // ✅ keep multiply, but lighter alphas make it not “black out”
  useMultiply: false,

  autoCleanupMs: 0,

  crackChance,
  crackAlpha: isBigImpact ? 0.25 : 0.18,
});

        state.flags._deathFxNode = nextNodeId;
      }

      const id = (nextNodeId || "").toLowerCase();
      const exempt =
        id === "intro_game" ||
        id === "final_death" ||
        id === "death_end_of_day" ||
        id === "day_warning" ||
        id.startsWith("death_") ||
        id.startsWith("part1_") ||
        id.includes("demon_realm");

      if (!exempt) state.flags.day_steps = (state.flags.day_steps ?? 0) + 1;

      if (!state.flags.day_warned && (state.flags.day_steps ?? 0) >= WARNING_STEP) {
        state.flags.day_warned = true;
        state.nodeId = "day_warning";
        this._lastNodeId = null;
        this.renderNode();
        return;
      }

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
      this.demonLaughPlayed = false;
    }

    if (entering && nextNodeId === "intro_game") this.playIntroThunderOnce();
    if (entering && prevNodeId === "intro_game" && nextNodeId !== "intro_game") this.stopIntroThunder();

    if (entering) {
      if (prevNode?.onExit) prevNode.onExit(state);
      if (node?.onEnter) node.onEnter(state);
    }

    this._lastNodeId = nextNodeId;

    if (!node) {
      this.bodyText.setText(`Missing node: ${state.nodeId}`);
      return;
    }

    const t = typeof node.tension === "number" ? node.tension : null;
    let intensity = 0.15;

    if (t != null) {
      intensity = Phaser.Math.Clamp(t, 0, 1);
    } else {
      const id = (state.nodeId || "").toLowerCase();
      if (id.includes("echo") || id.includes("bites") || id.includes("escape")) intensity = 0.85;
      if (id.includes("boss") || id.includes("office")) intensity = 0.55;
      if (id.includes("mirror")) intensity = 0.65;
    }

    this.tweens.killTweensOf(this.ambient);
    setAmbientIntensity(this, intensity);

    if (node.backgroundLayers) {
      const layers = typeof node.backgroundLayers === "function" ? node.backgroundLayers(state) : node.backgroundLayers;
      this.setBackgroundLayers(layers, state);
      this.tryGhostAppearance(state);
    }

    if (entering && state.nodeId === "apartment_mirror") this.oneFrameFlicker();

    if (state.nodeId === "apartment_mirror" && state.flags.mirrorVariant === "wrong" && !this.jumpScarePlayed) {
      const sfx = this.sound.add("jump_scare", { volume: 0.9 });
      sfx.play();
      this.jumpScarePlayed = true;
    }

    if (state.nodeId === "apartment_mirror" && state.flags.mirrorVariant === "demon" && !this.demonLaughPlayed) {
      const laugh = this.sound.add("demon_laugh", { volume: 0.75 });
      laugh.play();
      this.demonLaughPlayed = true;
    }

    // Text content
this.titleText.setText(node.title || "");

let meta = "";
try {
  meta = typeof node.meta === "function" ? node.meta(state) : node.meta;
} catch (e) {
  console.error("NODE meta() crashed:", state.nodeId, e);
  meta = "";
}
this.metaText.setText(meta || "");

let lines = "";
try {
  lines = typeof node.text === "function" ? node.text(state) : node.text;
} catch (e) {
  console.error("NODE text() crashed:", state.nodeId, e);
  lines = "…";
}
this.bodyText.setText(Array.isArray(lines) ? lines.join("\n") : (lines || ""));

    this.clearChoices();

    if (node.loot && Math.random() < node.loot.chance) {
      const drop = node.loot.table[Math.floor(Math.random() * node.loot.table.length)];
      addItem(state, drop, 1);
    }

    let startY = Math.min(this.scale.height - 220, 520);
    if (state.nodeId === "intro_game") startY += 60;

    const choices = typeof node.choices === "function" ? node.choices(state) : node.choices;
    choices?.forEach((c, i) => {
      const txt = this.add
        .text(60, startY + i * 34, `> ${c.label}`, {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#ffffff",
          shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true },
        })
        .setDepth(10)
        .setInteractive({ useHandCursor: true });

      txt.on("pointerdown", () => this.choose(c));
      this.choiceTexts.push(txt);
    });
  }

  choose(choice) {
    const state = this.registry.get("state");

    if (this._lastNodeId === "intro_game") this.stopIntroThunder();

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

    const beforeNode = state.nodeId;

    if (choice.action) this.applyAction(choice);

    // ✅ FIX: actions like "stareMirror" change flags only — force a rerender so backgrounds update
    if (!choice.go && !choice.goScene && state.nodeId === beforeNode && choice.action) {
      this.renderNode();
      return;
    }

    if (!choice.go && !choice.goScene && state.nodeId !== beforeNode) {
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
        state.flags.unlocked_map = true;
        state.flags.unlock_downtown = true;
        state.beat = Math.max(state.beat ?? 0, 2);
        state.newsBeat = Math.max(state.newsBeat ?? 0, 2);
        state.nodeId = "downtown_arrival";
        break;

        case "applyTVStory": {
  state.flags = state.flags || {};
  state.flags.tv_seen = state.flags.tv_seen || {};
  state.flags.tv_story_index = state.flags.tv_story_index ?? 0;
  state.flags.evidence_count = state.flags.evidence_count ?? 0;

  const storyId = data.storyId;
  if (!storyId) break;

  // show this story’s text on the TV node
  state.flags.tv_current_story_id = storyId;

  // only grant rewards once per unique story
  if (!state.flags.tv_seen[storyId]) {
    state.flags.tv_seen[storyId] = true;
    state.flags.tv_story_index += 1;

    // unlock map markers
    const unlocks = Array.isArray(data.unlocks) ? data.unlocks : [];
    unlocks.forEach((locId) => {
      state.flags[`unlock_${locId}`] = true;
    });

    // make sure the map is available once TV starts giving leads
    state.flags.unlocked_map = true;

    // evidence progression
    const ev = Number(data.evidence ?? 0);
    if (ev > 0) state.flags.evidence_count += ev;

    // optionally advance the TV “screen” visuals (tv_news_0..3)
    state.newsBeat = Math.min((state.newsBeat ?? 0) + 1, 3);
  }

  break;
}

      case "setFlag":
        if (data.flag) state.flags[data.flag] = data.value ?? true;
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

        const amt = Number(data?.amount ?? 1);
        state.flags.mirror_stare_count = (state.flags.mirror_stare_count ?? 0) + amt;

        state.flags.mirror_wrong_total = state.flags.mirror_wrong_total ?? 0;

        const current = state.flags.mirrorVariant ?? "normal";
        if (current === "demon") break;

        const WRONG_CHANCE = 1 / 15;
        const canRollWrong = current !== "wrong";

        if (canRollWrong && Math.random() < WRONG_CHANCE) {
          state.flags.mirrorVariant = "wrong";
          state.flags.mirror_was_wrong = true;
          state.flags.mirror_wrong_total += 1;
          state.flags.mirror_demon_started = false;

          state.maxSanity = state.maxSanity ?? 10;
          state.sanity = state.sanity ?? state.maxSanity;

          if (prevVariant !== "wrong") {
            state.sanity = clamp(state.sanity - 1, 0, state.maxSanity);
          }
          break;
        }

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

          state.maxSanity = state.maxSanity ?? 10;
          state.sanity = state.sanity ?? state.maxSanity;

          if (prevVariant !== "demon") {
            state.sanity = clamp(state.sanity - 2, 0, state.maxSanity);
          }
          break;
        }

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

      case "loseSanity":
        state.sanity = clamp((state.sanity ?? state.maxSanity ?? 10) - (data.amount ?? 1), 0, state.maxSanity ?? 10);
        break;

      case "gainSanity":
        state.sanity = clamp((state.sanity ?? 0) + (data.amount ?? 1), 0, state.maxSanity ?? 10);
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

      default:
        console.warn("Unknown action:", choice.action, choice);
        break;
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

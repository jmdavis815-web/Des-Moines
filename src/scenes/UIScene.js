export default class UIScene extends Phaser.Scene {
  constructor() {
  super("UIScene");

  this.timer = null;
  this.keys = null;

  this.txtHP = null;
  this.txtSan = null;
  this.txtCash = null;
  this.txtXP = null;
  this.txtTime = null; // ✅ FIXED

  this.btnInv = null;
  this.btnMap = null;
  this.btnPause = null;

  this._onResize = null;

  // cached state helpers for quick save/load
  this._stateApi = null;
  this._stateApiLoading = false;
}

  async _getStateApi() {
    if (this._stateApi) return this._stateApi;
    if (this._stateApiLoading) return null;

    this._stateApiLoading = true;
    try {
      // IMPORTANT: path must match where UIScene.js lives relative to state.js
      const mod = await import("./state.js");
      this._stateApi = { saveToSlot: mod.saveToSlot, loadFromSlot: mod.loadFromSlot };
      return this._stateApi;
    } catch (e) {
      console.warn("UIScene: could not import state.js for quick save/load:", e);
      return null;
    } finally {
      this._stateApiLoading = false;
    }
  }

  create() {
    // --- heartbeat loop (created once) ---
this.heartbeat = this.sound.add("heartbeat", { loop: true, volume: 0 });
this._hbOn = false;


    const w = this.scale.width;

    // HUD bar
    this.hudBg = this.add
      .rectangle(w / 2, 26, w, 52, 0x000000, 0.35)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1);

    const baseStyle = {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
    };

    this.txtHP = this.add.text(16, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtSan = this.add.text(150, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtCash = this.add.text(300, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtXP = this.add.text(450, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtTime = this.add.text(w - 520, 10, "", baseStyle).setScrollFactor(0).setDepth(2);

    // ---- BUTTON FACTORY ----
    const makeBtn = (x, label, onClick) => {
      const t = this.add
        .text(x, 10, label, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
        })
        .setScrollFactor(0)
        .setDepth(3)
        .setInteractive({ useHandCursor: true });

      t.on("pointerdown", onClick);
      return t;
    };

    this.btnInv   = makeBtn(w - 300, "[I] Inventory", () => this.toggleModal("InventoryScene"));
    this.btnMap   = makeBtn(w - 170, "[M] Map", () => this.toggleModal("MapScene"));
    this.btnPause = makeBtn(w - 60,  "[P]", () => this.toggleModal("PauseMenuScene"));

    // ---- HOTKEYS ----
    this.keys = this.input.keyboard.addKeys({
      I: Phaser.Input.Keyboard.KeyCodes.I,
      M: Phaser.Input.Keyboard.KeyCodes.M,
      P: Phaser.Input.Keyboard.KeyCodes.P,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      C: Phaser.Input.Keyboard.KeyCodes.C,
      ESC: Phaser.Input.Keyboard.KeyCodes.ESC,

      // PC extras
      F11: Phaser.Input.Keyboard.KeyCodes.F11,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
      TAB: Phaser.Input.Keyboard.KeyCodes.TAB,
    });

    // ✅ stop the browser from using TAB to change focus
this.input.keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.TAB);

    // Core modal hotkeys
    this.keys.I.on("down", () => this.toggleModal("InventoryScene"));
    this.keys.M.on("down", () => this.toggleModal("MapScene"));
    this.keys.P.on("down", () => this.toggleModal("PauseMenuScene"));
    this.keys.E.on("down", () => this.toggleModal("EquipmentScene"));
    this.keys.C.on("down", () => this.toggleModal("CharacterScene"));

    // ---- FULLSCREEN (PC) ----
    this.keys.F11.on("down", () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // ---- QUICK SAVE / LOAD (PC) ----
    // Ctrl+S = quicksave Slot 1
    this.input.keyboard.on("keydown-S", async (ev) => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();

      const state = this.registry.get("state");
      if (!state) return;

      const api = await this._getStateApi();
      if (!api?.saveToSlot) return;

      try {
        api.saveToSlot(0, state);
        // Optional tiny feedback: flash cash text
        this.txtCash.setAlpha(0.4);
        this.time.delayedCall(120, () => this.txtCash.setAlpha(1));
      } catch (e) {
        console.warn("Quicksave failed:", e);
      }
    });

    const quickLoad = async (slotIndex) => {
      const api = await this._getStateApi();
      if (!api?.loadFromSlot) return;

      try {
        const loaded = api.loadFromSlot(slotIndex);
        if (!loaded) return;

        this.registry.set("state", loaded);

        const story = this.scene.get("StoryScene");
        story?.renderNode?.();

        this.refresh();
      } catch (e) {
        console.warn("Quickload failed:", e);
      }
    };

    this.keys.ONE.on("down", () => quickLoad(0));
    this.keys.TWO.on("down", () => quickLoad(1));
    this.keys.THREE.on("down", () => quickLoad(2));

    // ---- HUD TOGGLE (cinematic) ----
    this.keys.TAB.on("down", () => {
    const visible = this.hudBg.visible;
    const next = !visible;

    this.hudBg.setVisible(next);
    this.txtHP.setVisible(next);
    this.txtSan.setVisible(next);
    this.txtCash.setVisible(next);
    this.txtXP.setVisible(next);
    this.txtTime.setVisible(next); // ✅ added

    this.btnInv.setVisible(next);
    this.btnMap.setVisible(next);
    this.btnPause.setVisible(next);
  });


    // ---- ESC PRIORITY CLOSE ----
    // IMPORTANT: Only resume StoryScene when *no* modals remain open.
    this.keys.ESC.on("down", () => {
      const order = [
        "InventoryScene",
        "ShopScene",        // PC-friendly (optional)
        "MapScene",
        "EquipmentScene",
        "CharacterScene",
        "PauseMenuScene",
      ];

      for (const key of order) {
  if (this.scene.isActive(key)) {
    if (key === "MapScene") {
      const map = this.scene.get("MapScene");
      if (map?.closeMap) { map.closeMap(); return; }
    }

    this.scene.stop(key);
    this._resumeStoryIfNoModals();
    return;
  }
}

      // nothing open → open pause menu
      this.toggleModal("PauseMenuScene");
    });

    // ---- RESIZE ----
    this._onResize = (gameSize) => {
    const ww = gameSize.width;

    this.hudBg.width = ww;
    this.hudBg.x = ww / 2;

    this.txtTime.x = ww - 520; // ✅ TIME RESIZE

    this.btnInv.x = ww - 300;
    this.btnMap.x = ww - 170;
    this.btnPause.x = ww - 60;
  };

    this.scale.on("resize", this._onResize);

    // ---- HUD REFRESH ----
    this.timer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.refresh(),
    });

    // CLEANUP
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.timer?.remove?.(); } catch {}

      try {
        if (this._onResize) this.scale.off("resize", this._onResize);
      } catch {}

      try {
        this.input.keyboard.removeAllListeners();
      } catch {}

      Object.values(this.keys || {}).forEach(k => {
        try { k.removeAllListeners(); } catch {}
      });
    });

    // ✅ ALWAYS keep HUD on top at start
this.scene.bringToTop("UIScene");

    this.refresh();
  }

  _resumeStoryIfNoModals() {
    const MODALS = [
      "InventoryScene",
      "ShopScene",
      "MapScene",
      "PauseMenuScene",
      "EquipmentScene",
      "CharacterScene",
    ];

    const anyOpen = MODALS.some(k => this.scene.isActive(k));
    if (!anyOpen) {
      if (this.scene.isPaused("StoryScene")) this.scene.resume("StoryScene");
      this.scene.bringToTop("UIScene");
    }
  }

  // ---- MODAL TOGGLING ----
  toggleModal(key) {
    const MODALS = new Set([
      "InventoryScene",
      "ShopScene",
      "MapScene",
      "PauseMenuScene",
      "EquipmentScene",
      "CharacterScene",
    ]);

    // close if already open
// close if already open
if (this.scene.isActive(key)) {
  const modal = this.scene.get(key);

  // ✅ Prefer scene-owned close routine if it exists
  if (modal?.closeModal) {
    modal.closeModal();
    return;
  }

  // ✅ Back-compat for MapScene
  if (key === "MapScene") {
    if (modal?.closeMap) {
      modal.closeMap();
      return;
    }
  }

  this.scene.stop(key);
  this._resumeStoryIfNoModals();
  return;
}

    // close all other modals first
    MODALS.forEach(k => {
      if (k !== key && this.scene.isActive(k)) {
        this.scene.stop(k);
      }
    });

    // pause story + launch
if (!this.scene.isPaused("StoryScene")) this.scene.pause("StoryScene");

if (key === "MapScene") {
  this.scene.launch("MapScene", { view: "city" });
} else {
  this.scene.launch(key);
}

// ✅ Put the modal above everything so it receives clicks
this.scene.bringToTop(key);

// (optional) keep HUD visible but NOT on top while modals are open
// this.scene.bringToTop("UIScene");

  }

  refresh() {
    const state = this.registry.get("state");
    if (!state) return;

    const mins = Number(state.time?.minutes ?? 0);
    const h = Math.floor(mins / 60) % 24;
    const m = String(mins % 60).padStart(2, "0");
    this.txtTime.setText(`TIME: ${h}:${m}`);

    this.txtHP.setText(`HP: ${state.hp ?? 0}/${state.maxHp ?? 0}`);
    this.txtSan.setText(`SAN: ${state.sanity ?? 0}/${state.maxSanity ?? 0}`);
    this.txtCash.setText(`$${state.cash ?? 0}`);
    this.txtXP.setText(`XP: ${state.xp ?? 0}/${state.xpToNext ?? 0}`);

    // --- heartbeat intensity based on low HP ---
const s = this.registry.get("state") || {};
const hp = Number.isFinite(s.hp) ? s.hp : 0;
const maxHp = Number.isFinite(s.maxHp) && s.maxHp > 0 ? s.maxHp : 1;

const ratio = hp / maxHp;

// start heartbeat when <= 30% hp (tweak this)
const low = ratio <= 0.30;

if (low) {
  // intensity goes 0..1 as ratio goes 0.30 -> 0.00
  const intensity = Phaser.Math.Clamp((0.30 - ratio) / 0.30, 0, 1);

  // louder + faster as it gets worse
  const vol = Phaser.Math.Linear(0.15, 0.85, intensity);
  const rate = Phaser.Math.Linear(1.0, 1.8, intensity);

  if (!this.heartbeat.isPlaying) this.heartbeat.play();

  this.heartbeat.setVolume(vol);
  this.heartbeat.setRate(rate);
} else {
  if (this.heartbeat.isPlaying) this.heartbeat.stop();
  this.heartbeat.setVolume(0);
  this.heartbeat.setRate(1);
}


  }
}

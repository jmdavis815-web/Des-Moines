export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
    this.timer = null;
    this.keys = null;

    this.txtHP = null;
    this.txtSan = null;
    this.txtCash = null;
    this.txtXP = null;

    this.btnInv = null;
    this.btnMap = null;
    this.btnPause = null;
  }

  create() {
    const w = this.scale.width;

    // HUD bar
    this.hudBg = this.add
      .rectangle(w / 2, 26, w, 52, 0x000000, 0.35)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1);

    const baseStyle = { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" };
    this.txtHP = this.add.text(16, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtSan = this.add.text(150, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtCash = this.add.text(300, 10, "", baseStyle).setScrollFactor(0).setDepth(2);
    this.txtXP = this.add.text(450, 10, "", baseStyle).setScrollFactor(0).setDepth(2);

    // Buttons (CREATE ONCE)
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

    this.btnInv = makeBtn(w - 260, "[I] Inventory", () => this.toggleModal("InventoryScene"));
    this.btnMap = makeBtn(w - 140, "[M] Map", () => this.toggleModal("MapScene"));
    this.btnPause = makeBtn(w - 52, "[P]", () => this.toggleModal("PauseMenuScene"));

    // Hotkeys
    this.keys = this.input.keyboard.addKeys({
  I: Phaser.Input.Keyboard.KeyCodes.I,
  E: Phaser.Input.Keyboard.KeyCodes.E,
  C: Phaser.Input.Keyboard.KeyCodes.C,
  M: Phaser.Input.Keyboard.KeyCodes.M,
  P: Phaser.Input.Keyboard.KeyCodes.P,
  ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
});

    this.keys.I.on("down", () => this.toggleModal("InventoryScene"));
    this.keys.M.on("down", () => this.toggleModal("MapScene"));
    this.keys.P.on("down", () => this.toggleModal("PauseMenuScene"));
    this.keys.E.on("down", () => this.toggleModal("EquipmentScene"));
    this.keys.C.on("down", () => this.toggleModal("CharacterScene"));

    // ESC closes top modal first
    this.keys.ESC.on("down", () => {
      if (this.scene.isActive("InventoryScene")) {
        this.scene.stop("InventoryScene");
        this.scene.resume("StoryScene");
        return;
      }
      if (this.scene.isActive("MapScene")) {
        this.scene.stop("MapScene");
        this.scene.resume("StoryScene");
        return;
      }
      if (this.scene.isActive("PauseMenuScene")) {
        this.scene.stop("PauseMenuScene");
        this.scene.resume("StoryScene");
        return;
      }
      this.toggleModal("PauseMenuScene");
    });

    // Resize: reposition, don’t recreate
    this.scale.on("resize", (gameSize) => {
      const ww = gameSize.width;
      this.hudBg.width = ww;
      this.hudBg.x = ww / 2;

      this.btnInv.x = ww - 260;
      this.btnMap.x = ww - 140;
      this.btnPause.x = ww - 52;
    });

    // HUD refresh (lightweight)
    this.timer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.refresh(),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.timer?.remove?.(); } catch {}
      try { this.keys?.I?.removeAllListeners?.(); } catch {}
      try { this.keys?.M?.removeAllListeners?.(); } catch {}
      try { this.keys?.P?.removeAllListeners?.(); } catch {}
      try { this.keys?.ESC?.removeAllListeners?.(); } catch {}
    });

    this.refresh();
  }

  toggleModal(key) {
    const isModal = (k) => k === "InventoryScene" || k === "MapScene" || k === "PauseMenuScene";

    if (this.scene.isActive(key)) {
      this.scene.stop(key);
      if (isModal(key)) this.scene.resume("StoryScene");
      return;
    }

    if (isModal(key)) this.scene.pause("StoryScene");
    this.scene.launch(key);
    this.scene.bringToTop("UIScene");
  }

  refresh() {
    const state = this.registry.get("state");
    if (!state) return;

    this.txtHP.setText(`HP: ${state.hp ?? 0}/${state.maxHp ?? 0}`);
    this.txtSan.setText(`SAN: ${state.sanity ?? 0}/${state.maxSanity ?? 0}`);
    this.txtCash.setText(`$${state.cash ?? 0}`);
    this.txtXP.setText(`XP: ${state.xp ?? 0}/${state.xpToNext ?? 0}`);
  }
}
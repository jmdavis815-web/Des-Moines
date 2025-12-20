import { saveToSlot, loadFromSlot } from "../state.js";

export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super("PauseMenuScene");
  }

  create() {
    const { width, height } = this.scale;

    // Dim backdrop (click to close)
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.stop());

    // Panel
    const panel = this.add
      .rectangle(width / 2, height / 2, 560, 480, 0x121218, 0.97)
      .setStrokeStyle(2, 0x444455, 1)
      .setDepth(1);

    // Prevent backdrop clicks from closing when clicking the panel
    panel.setInteractive();

    this.add
      .text(width / 2 - 230, height / 2 - 210, "Menu", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setDepth(2);

    const makeBtn = (y, label, onClick) => {
      const t = this.add
        .text(width / 2 - 230, y, `> ${label}`, {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#ffffff",
        })
        .setDepth(2)
        .setInteractive({ useHandCursor: true });

      t.on("pointerdown", onClick);
      t.on("pointerover", () => t.setColor("#ffd7a8"));
      t.on("pointerout", () => t.setColor("#ffffff"));
      return t;
    };

    let y = height / 2 - 150;

    makeBtn(y, "Resume", () => this.scene.stop()); y += 40;

    makeBtn(y, "Save (Slot 1)", () => this.doSave(0)); y += 34;
    makeBtn(y, "Save (Slot 2)", () => this.doSave(1)); y += 34;
    makeBtn(y, "Save (Slot 3)", () => this.doSave(2)); y += 46;

    makeBtn(y, "Load (Slot 1)", () => this.doLoad(0)); y += 34;
    makeBtn(y, "Load (Slot 2)", () => this.doLoad(1)); y += 34;
    makeBtn(y, "Load (Slot 3)", () => this.doLoad(2)); y += 46;

    makeBtn(y, "Quit to Main Menu", () => this.quitToMenu()); y += 40;

    this.msg = this.add
      .text(width / 2 - 230, height / 2 + 205, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cfcfcf",
        wordWrap: { width: 460 },
      })
      .setDepth(2);
  }

  doSave(slotIndex) {
    const state = this.registry.get("state");
    if (!state) return;

    saveToSlot(slotIndex, state);
    this.msg.setText(`Saved to Slot ${slotIndex + 1}.`);
  }

  doLoad(slotIndex) {
    const loaded = loadFromSlot(slotIndex);
    if (!loaded) {
      this.msg.setText(`Slot ${slotIndex + 1} is empty.`);
      return;
    }

    this.registry.set("state", loaded);

    // Re-render story + HUD
    const story = this.scene.get("StoryScene");
    story?.renderNode?.();

    const ui = this.scene.get("UIScene");
    ui?.refresh?.();

    this.msg.setText(`Loaded Slot ${slotIndex + 1}.`);
  }

  quitToMenu() {
    this.scene.stop("PauseMenuScene");
    this.scene.stop("CharacterScene");
    this.scene.stop("InventoryScene");
    this.scene.stop("MapScene");
    this.scene.stop("ShopScene");
    this.scene.stop("StoryScene");
    this.scene.stop("UIScene");

    this.scene.start("MenuScene");
  }
}

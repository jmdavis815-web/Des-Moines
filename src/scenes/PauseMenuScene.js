import { saveToSlot, loadFromSlot, getSlotInfo } from "../state.js";

export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super("PauseMenuScene");
    this.msg = null;
  }

  closeModal() {
    // Resume StoryScene FIRST
    const story = this.scene.get("StoryScene");
    if (story) {
      try { this.scene.wake("StoryScene"); } catch {}
      try { this.scene.resume("StoryScene"); } catch {}
      if (story.input) story.input.enabled = true;
      this.scene.bringToTop("StoryScene");
      story.renderNode?.();
    }

    // HUD on top
    if (this.scene.isActive("UIScene")) {
      this.scene.bringToTop("UIScene");
      const ui = this.scene.get("UIScene");
      ui?._resumeStoryIfNoModals?.();
    }

    // Stop pause menu next tick to avoid race conditions
    this.time.delayedCall(0, () => {
      this.scene.stop("PauseMenuScene");
    });
  }

  confirmAction({ title, body, onYes }) {
    const { width, height } = this.scale;

    // Prevent stacking confirm modals
    if (this._confirmOpen) return;
    this._confirmOpen = true;

    const shade = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setDepth(10)
      .setInteractive(); // blocks clicks behind

    const panel = this.add
      .rectangle(width / 2, height / 2, 420, 220, 0x1a1a22, 1)
      .setStrokeStyle(2, 0x666677)
      .setDepth(11)
      .setInteractive();

    const txtTitle = this.add
      .text(width / 2, height / 2 - 80, title, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(12);

    const txtBody = this.add
      .text(width / 2, height / 2 - 30, body, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cfcfcf",
        align: "center",
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5)
      .setDepth(12);

    const makeConfirmBtn = (x, y, label, cb) => {
      const t = this.add
        .text(x, y, `[ ${label} ]`, {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });

      t.on("pointerover", () => t.setColor("#ffd7a8"));
      t.on("pointerout", () => t.setColor("#ffffff"));
      t.on("pointerdown", cb);
      return t;
    };

    const cleanup = () => {
      this._confirmOpen = false;
      try { shade.destroy(); } catch {}
      try { panel.destroy(); } catch {}
      try { txtTitle.destroy(); } catch {}
      try { txtBody.destroy(); } catch {}
      // destroy any depth-12 confirm buttons
      this.children
        .getAll()
        .filter((o) => o && o.depth === 12)
        .forEach((o) => {
          try { o.destroy(); } catch {}
        });
    };

    makeConfirmBtn(width / 2 - 80, height / 2 + 60, "YES", () => {
      cleanup();
      onYes?.();
    });

    makeConfirmBtn(width / 2 + 80, height / 2 + 60, "NO", () => cleanup());
  }

  create() {
    const { width, height } = this.scale;

    // Dim backdrop (click to close)
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.closeModal());

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

    const slotLabel = (i) => {
      const info = getSlotInfo(i);
      if (!info) return "(empty)";
      const s = info.summary;
      return `Day ${s.day} • ${s.time} • ${s.locationTitle}`;
    };

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

    makeBtn(y, "Resume", () => this.closeModal());
    y += 40;

    // SAVE (confirm)
    makeBtn(y, `Save — ${slotLabel(0)}`, () => {
      this.confirmAction({
        title: "Overwrite Save?",
        body: "This will replace Slot 1.",
        onYes: () => this.doSave(0),
      });
    });
    y += 34;

    makeBtn(y, `Save — ${slotLabel(1)}`, () => {
      this.confirmAction({
        title: "Overwrite Save?",
        body: "This will replace Slot 2.",
        onYes: () => this.doSave(1),
      });
    });
    y += 34;

    makeBtn(y, `Save — ${slotLabel(2)}`, () => {
      this.confirmAction({
        title: "Overwrite Save?",
        body: "This will replace Slot 3.",
        onYes: () => this.doSave(2),
      });
    });
    y += 46;

    // LOAD (confirm)
    makeBtn(y, `Load — ${slotLabel(0)}`, () => {
      this.confirmAction({
        title: "Load Save?",
        body: "Unsaved progress will be lost.",
        onYes: () => this.doLoad(0),
      });
    });
    y += 34;

    makeBtn(y, `Load — ${slotLabel(1)}`, () => {
      this.confirmAction({
        title: "Load Save?",
        body: "Unsaved progress will be lost.",
        onYes: () => this.doLoad(1),
      });
    });
    y += 34;

    makeBtn(y, `Load — ${slotLabel(2)}`, () => {
      this.confirmAction({
        title: "Load Save?",
        body: "Unsaved progress will be lost.",
        onYes: () => this.doLoad(2),
      });
    });
    y += 46;

    makeBtn(y, "Quit to Main Menu", () => this.quitToMenu());
    y += 40;

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
    this.msg?.setText?.(`Saved to Slot ${slotIndex + 1}.`);

    // refresh menu so slot labels update
    this.time.delayedCall(150, () => {
      this.scene.restart();
    });
  }

  doLoad(slotIndex) {
    const loaded = loadFromSlot(slotIndex);
    if (!loaded) {
      this.msg?.setText?.(`Slot ${slotIndex + 1} is empty.`);
      return;
    }

    this.registry.set("state", loaded);

    // Re-render story + HUD
    const story = this.scene.get("StoryScene");
    story?.renderNode?.();

    const ui = this.scene.get("UIScene");
    ui?.refresh?.();

    this.msg?.setText?.(`Loaded Slot ${slotIndex + 1}.`);
  }

  quitToMenu() {
    this.scene.stop("PauseMenuScene");
    this.scene.stop("CharacterScene");
    this.scene.stop("InventoryScene");
    this.scene.stop("MapScene");
    this.scene.stop("ShopScene");
    this.scene.stop("EquipmentScene");
    this.scene.stop("StoryScene");
    this.scene.stop("UIScene");

    this.scene.start("MenuScene");
  }
}

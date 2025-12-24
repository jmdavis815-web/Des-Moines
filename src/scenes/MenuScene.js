import { makeNewState, loadFromSlot, getSlotInfo } from "/src/state.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    const bgKey = this.textures.exists("menu_bg") ? "menu_bg" : "apartment_bg"; // fallback
      this.add.image(0, 0, bgKey)
        .setOrigin(0, 0)
        .setDisplaySize(width, height)
        .setDepth(0);

    this.add
      .text(width / 2, 140, "DES MOINES AFTER DARK", {
        fontFamily: "monospace",
        fontSize: "42px",
        color: "#eaeaea",
      })
      .setOrigin(0.5);

    const makeBtn = (y, label, onClick, enabled = true) => {
      const t = this.add
        .text(width / 2, y, `[ ${label} ]`, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: enabled ? "#ffffff" : "#666666",
        })
        .setOrigin(0.5);

      if (enabled) {
        t.setInteractive({ useHandCursor: true });
        t.on("pointerdown", onClick);
        t.on("pointerover", () => t.setColor("#ffd7a8"));
        t.on("pointerout", () => t.setColor("#ffffff"));
      }
      return t;
    };

    const slot1 = loadFromSlot(0);
    const canContinue = !!slot1;

    let y = 300;

    makeBtn(y, "NEW GAME", () => {
      this.registry.set("state", makeNewState());
      this.scene.start("StoryScene");
      this.scene.launch("UIScene");
    });
    y += 56;

    makeBtn(
      y,
      "CONTINUE",
      () => {
        const loaded = loadFromSlot(0);
        if (!loaded) return;
        this.registry.set("state", loaded);
        this.scene.start("StoryScene");
        this.scene.launch("UIScene");
      },
      canContinue
    );
    y += 56;

    const slotLine = (i) => {
  const info = getSlotInfo(i);
  if (!info) return `Slot ${i + 1}: (empty)`;

  const s = info.summary;
  return `Day ${s.day} • ${s.time} • ${s.locationTitle} / ${s.areaTitle}`;
};

makeBtn(y, "LOAD", () => this.loadSlot(0));
this.add.text(width / 2, y + 26, slotLine(0), {
  fontFamily: "monospace",
  fontSize: "14px",
  color: "#cfcfcf",
}).setOrigin(0.5);
y += 58;

makeBtn(y, "LOAD", () => this.loadSlot(1));
this.add.text(width / 2, y + 26, slotLine(1), {
  fontFamily: "monospace",
  fontSize: "14px",
  color: "#cfcfcf",
}).setOrigin(0.5);
y += 58;

makeBtn(y, "LOAD", () => this.loadSlot(2));
this.add.text(width / 2, y + 26, slotLine(2), {
  fontFamily: "monospace",
  fontSize: "14px",
  color: "#cfcfcf",
}).setOrigin(0.5);
y += 64;

    makeBtn(y, "QUIT", () => {
      this.add
        .text(width / 2, y + 60, "Close the tab/window to quit.", {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#cfcfcf",
        })
        .setOrigin(0.5);
    });
  }

  loadSlot(i) {
    const loaded = loadFromSlot(i);
    if (!loaded) {
      const { width } = this.scale;
      this.add
        .text(width / 2, 660, `Slot ${i + 1} is empty.`, {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#cfcfcf",
        })
        .setOrigin(0.5);
      return;
    }

    this.registry.set("state", loaded);
    this.scene.start("StoryScene");
    this.scene.launch("UIScene");
  }
}

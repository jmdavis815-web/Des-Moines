import { ITEM_DB } from "../db_items.js";

export default class EquipmentScene extends Phaser.Scene {
  constructor() {
    super("EquipmentScene");
    this.backdrop = null;
  }

  closeModal() {
    this.scene.stop("EquipmentScene");

    const story = this.scene.get("StoryScene");
    if (story) {
      try { this.scene.resume("StoryScene"); } catch {}
      try { this.scene.wake("StoryScene"); } catch {}
      if (story.input) story.input.enabled = true;
      this.scene.bringToTop("StoryScene");
      story.renderNode?.();
    }

    if (this.scene.isActive("UIScene")) {
      this.scene.bringToTop("UIScene");
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const state = this.registry.get("state");

    try { this.scene.pause("StoryScene"); } catch {}

    this.backdrop = this.add
      .rectangle(0, 0, w, h, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setDepth(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.closeModal());

    this.add
      .text(w / 2, 40, "Equipment", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#ffffff",
      })
      .setDepth(1)
      .setOrigin(0.5);

    const slots = [
      ["Weapon", "weapon"],
      ["Armor", "armor"],
      ["Trinket", "trinket"],
    ];

    slots.forEach(([label, key], i) => {
      const y = 120 + i * 60;

      const id = state.equipped?.[key] || null;
      const itemName = id ? (ITEM_DB[id]?.name ?? id) : "(empty)";

      this.add.text(100, y, `${label}: ${itemName}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#dddddd",
      }).setDepth(1);
    });

    const close = this.add
      .text(w - 120, h - 50, "[Close]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => this.closeModal());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.backdrop?.removeInteractive?.(); } catch {}
      try { this.backdrop?.destroy?.(); } catch {}
      this.backdrop = null;
      try { this.input?.removeAllListeners?.(); } catch {}
    });
  }
}

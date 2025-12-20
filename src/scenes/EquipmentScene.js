import { ITEM_DB } from "../db_items.js";

export default class EquipmentScene extends Phaser.Scene {
  constructor() {
    super("EquipmentScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const state = this.registry.get("state");

    // Dark backdrop (click to close)
    this.add
      .rectangle(0, 0, w, h, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.stop());

    this.add
      .text(w / 2, 40, "Equipment", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#ffffff",
      })
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
      });
    });

    const close = this.add
      .text(w - 120, h - 50, "[Close]", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => this.scene.stop());
  }
}

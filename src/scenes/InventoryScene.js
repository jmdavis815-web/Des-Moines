import { ITEM_DB } from "../db_items.js";
import { addItem, removeItem } from "../utils.js";

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super("InventoryScene");
  }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    // Dark backdrop (click to close)
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.stop());

    this.add.text(40, 30, "INVENTORY", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#fff",
    });

    const close = this.add
      .text(width - 40, 30, "[X]", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff",
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => this.scene.stop());

    const eq = state.equipped;
    this.add.text(
      40,
      80,
      `Equipped:\n weapon: ${eq.weapon || "-"}\n armor: ${eq.armor || "-"}\n trinket: ${eq.trinket || "-"}`,
      {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cfcfcf",
      }
    );

    let y = 200;

    state.inventory.forEach((stack) => {
      const def = ITEM_DB[stack.id];
      if (!def) return;

      this.add.text(60, y, `${def.name} x${stack.qty}  (${def.type})`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff",
      });

      const btnUse = this.add
        .text(width - 360, y, "[USE]", {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#fff",
        })
        .setInteractive({ useHandCursor: true });

      const btnEquip = this.add.text(
        width - 260,
        y,
        def.type === "gear" ? "[EQUIP]" : "",
        {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#fff",
        }
      );

      btnUse.on("pointerdown", () => {
        if (def.type !== "consumable") return;

        const ok = removeItem(state, def.id, 1);
        if (!ok) return;

        def.use?.(state);
        this.scene.restart();
      });

      if (def.type === "gear") {
        btnEquip.setInteractive({ useHandCursor: true });
        btnEquip.on("pointerdown", () => {
          const slot = def.slot;

          // swap gear cleanly
          const prev = state.equipped[slot];
          state.equipped[slot] = def.id;

          if (prev && prev !== def.id) {
            addItem(state, prev, 1);
            removeItem(state, def.id, 1);
          }

          this.scene.restart();
        });
      }

      y += 34;
    });
  }
}

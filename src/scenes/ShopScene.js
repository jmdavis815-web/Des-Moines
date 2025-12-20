import { ITEM_DB } from "../db_items.js";
import { addItem } from "../utils.js";

const SHOP_STOCK = ["coffee", "bandage", "hoodie", "pocketknife"];

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    // Backdrop (click to close)
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.80)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.stop());

    this.add.text(40, 30, "SHOP", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#fff",
    });

    this.add.text(40, 70, `Cash: $${state.cash}`, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#cfcfcf",
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

    let y = 130;

    SHOP_STOCK.forEach((id) => {
      const def = ITEM_DB[id];
      if (!def) return;

      this.add.text(60, y, `${def.name} — $${def.price}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff",
      });

      this.add.text(60, y + 20, def.desc, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9aa",
        wordWrap: { width: width - 340 },
      });

      const btn = this.add
        .text(width - 220, y, "[BUY]", {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#fff",
        })
        .setInteractive({ useHandCursor: true });

      btn.on("pointerdown", () => {
        if (state.cash < def.price) return;

        state.cash -= def.price;
        addItem(state, def.id, 1);
        this.scene.restart();
      });

      y += 60;
    });
  }
}

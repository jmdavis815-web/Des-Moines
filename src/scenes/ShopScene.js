import { ITEM_DB } from "../db_items.js";
import {
  addItem,
  getInvQty,
  isSellable,
  getSellPrice,
  sellItem,
} from "../utils.js";

const SHOP_STOCK = ["coffee", "bandage", "hoodie", "pocketknife"];
const SELL_MULTIPLIER = 0.6; // shop buys at 60%

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
    this.backdrop = null;
    this.mode = "buy"; // "buy" | "sell"
  }

  closeModal() {
    this.scene.stop("ShopScene");

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
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    try { this.scene.pause("StoryScene"); } catch {}

    this.backdrop = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0, 0)
      .setDepth(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.closeModal());

    // Header
    this.add.text(40, 30, "SHOP", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#fff",
    }).setDepth(1);

    this.add.text(40, 70, `Cash: $${state.cash ?? 0}`, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#cfcfcf",
    }).setDepth(1);

    const close = this.add
      .text(width - 40, 30, "[X]", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff",
      })
      .setDepth(1)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => this.closeModal());

    // Mode toggles
    const buyTab = this.add
      .text(40, 100, this.mode === "buy" ? "[BUY]" : " BUY ", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff",
      })
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    const sellTab = this.add
      .text(140, 100, this.mode === "sell" ? "[SELL]" : " SELL ", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff",
      })
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    buyTab.on("pointerdown", () => {
      this.mode = "buy";
      this.scene.restart();
    });

    sellTab.on("pointerdown", () => {
      this.mode = "sell";
      this.scene.restart();
    });

    this.add.text(
      40,
      120,
      this.mode === "buy" ? "Pick something up." : "Sell valuables and junk.",
      {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9aa",
      }
    ).setDepth(1);

    let y = 150;

    if (this.mode === "buy") {
      SHOP_STOCK.forEach((id) => {
        const def = ITEM_DB[id];
        if (!def) return;

        // keep sell-only/junk out of buy stock
        if (isSellable(def)) return;

        this.add.text(60, y, `${def.name} — $${def.price}`, {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#fff",
        }).setDepth(1);

        this.add.text(60, y + 20, def.desc, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#9aa",
          wordWrap: { width: width - 340 },
        }).setDepth(1);

        const owned = getInvQty(state, def.id);
        this.add.text(width - 220, y + 20, `Owned: ${owned}`, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#9aa",
        }).setDepth(1);

        const btn = this.add
          .text(width - 220, y, "[BUY]", {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#fff",
          })
          .setDepth(1)
          .setInteractive({ useHandCursor: true });

        btn.on("pointerdown", () => {
          const cash = Number.isFinite(state.cash) ? state.cash : 0;
          if (cash < (def.price ?? 0)) return;

          state.cash = cash - (def.price ?? 0);
          addItem(state, def.id, 1);
          this.scene.restart();
        });

        y += 70;
      });
    } else {
      // SELL MODE (inventory is already {id, qty})
      const inv = Array.isArray(state.inventory) ? state.inventory : [];

      const sellables = inv
        .map((entry) => ({
          id: entry?.id,
          qty: entry?.qty ?? 0,
          def: entry?.id ? ITEM_DB[entry.id] : null,
        }))
        .filter((x) => x.id && x.qty > 0 && isSellable(x.def))
        .sort((a, b) => (b.def?.price ?? 0) - (a.def?.price ?? 0));

      if (!sellables.length) {
        this.add.text(60, y, "You have nothing worth selling.", {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#fff",
        }).setDepth(1);

        this.add.text(60, y + 25, "Find junk/valuables as loot and come back.", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#9aa",
        }).setDepth(1);
      } else {
        sellables.forEach(({ def, id, qty }) => {
          const p = getSellPrice(def, SELL_MULTIPLIER);

          this.add.text(60, y, `${def.name} x${qty} — Sell: $${p}`, {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#fff",
          }).setDepth(1);

          this.add.text(60, y + 20, def.desc, {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#9aa",
            wordWrap: { width: width - 340 },
          }).setDepth(1);

          const btn1 = this.add
            .text(width - 280, y, "[SELL 1]", {
              fontFamily: "monospace",
              fontSize: "18px",
              color: "#fff",
            })
            .setDepth(1)
            .setInteractive({ useHandCursor: true });

          btn1.on("pointerdown", () => {
            const result = sellItem(state, id, 1, SELL_MULTIPLIER);
            if (!result.ok) return;
            this.scene.restart();
          });

          const btnAll = this.add
            .text(width - 160, y, "[SELL ALL]", {
              fontFamily: "monospace",
              fontSize: "18px",
              color: "#fff",
            })
            .setDepth(1)
            .setInteractive({ useHandCursor: true });

          btnAll.on("pointerdown", () => {
            const have = getInvQty(state, id);
            if (have <= 0) return;
            const result = sellItem(state, id, have, SELL_MULTIPLIER);
            if (!result.ok) return;
            this.scene.restart();
          });

          y += 70;
        });
      }
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.backdrop?.removeInteractive?.(); } catch {}
      try { this.backdrop?.destroy?.(); } catch {}
      this.backdrop = null;
      try { this.input?.removeAllListeners?.(); } catch {}
    });
  }
}

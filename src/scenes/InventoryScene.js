import { ITEM_DB } from "../db_items.js";
import { addItem, removeItem } from "../utils.js";

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super("InventoryScene");
    this.backdrop = null;
  }

  closeModal() {
    // 1) Stop THIS scene
    this.scene.stop("InventoryScene");

    // 2) Resume + wake StoryScene
    const story = this.scene.get("StoryScene");
    if (story) {
      try { this.scene.resume("StoryScene"); } catch {}
      try { this.scene.wake("StoryScene"); } catch {}

      // Make sure StoryScene can receive clicks again
      if (story.input) story.input.enabled = true;

      // Ensure StoryScene is top for input
      this.scene.bringToTop("StoryScene");

      // Rebuild node interactives safely
      story.renderNode?.();
    }

    // 3) Keep HUD on top (if active)
    if (this.scene.isActive("UIScene")) {
      this.scene.bringToTop("UIScene");
    }
  }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    // Ensure StoryScene is paused while this modal is open (safe even if already paused)
    try { this.scene.pause("StoryScene"); } catch {}

    // Dark backdrop (click to close)
    this.backdrop = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setDepth(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.closeModal());

    this.add.text(40, 30, "INVENTORY", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#fff",
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
    ).setDepth(1);

    let y = 200;

    state.inventory.forEach((stack) => {
      const def = ITEM_DB[stack.id];
      if (!def) return;

      this.add.text(60, y, `${def.name} x${stack.qty}  (${def.type})`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff",
      }).setDepth(1);

      const btnUse = this.add
        .text(width - 360, y, "[USE]", {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#fff",
        })
        .setDepth(1)
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
      ).setDepth(1);

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

    // CLEANUP: make sure backdrop can’t keep eating clicks after stop/restart
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.backdrop?.removeInteractive?.(); } catch {}
      try { this.backdrop?.destroy?.(); } catch {}
      this.backdrop = null;
      try { this.input?.removeAllListeners?.(); } catch {}
    });
  }
}

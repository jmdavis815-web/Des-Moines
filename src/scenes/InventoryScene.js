import { ITEM_DB } from "../db_items.js";
import { addItem, removeItem } from "../utils.js";

export default class InventoryScene extends Phaser.Scene {
  constructor() { super("InventoryScene"); }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.75);
    this.add.text(40, 30, "INVENTORY", { fontFamily:"monospace", fontSize:"28px", color:"#fff" });

    const close = this.add.text(width-40, 30, "[X]", { fontFamily:"monospace", fontSize:"22px", color:"#fff" })
      .setOrigin(1,0).setInteractive({ useHandCursor:true });
    close.on("pointerdown", () => this.scene.stop());

    // ESC closes inventory
this.input.keyboard.once("keydown-ESC", () => this.scene.stop());

// When inventory closes, resume StoryScene and put UI back on top
this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
  if (this.scene.isPaused("StoryScene")) this.scene.resume("StoryScene");
  if (this.scene.isActive("UIScene")) this.scene.bringToTop("UIScene");
});

    const eq = state.equipped;
    this.add.text(40, 80,
      `Equipped:\n weapon: ${eq.weapon || "-"}\n armor: ${eq.armor || "-"}\n trinket: ${eq.trinket || "-"}`,
      { fontFamily:"monospace", fontSize:"16px", color:"#cfcfcf" }
    );

    let y = 200;
    state.inventory.forEach((stack) => {
      const def = ITEM_DB[stack.id];
      if (!def) return;

      const line = this.add.text(60, y, `${def.name} x${stack.qty}  (${def.type})`, {
        fontFamily:"monospace", fontSize:"18px", color:"#fff"
      });

      const btnUse = this.add.text(width-360, y, "[USE]", { fontFamily:"monospace", fontSize:"18px", color:"#fff" })
        .setInteractive({ useHandCursor:true });

      const btnEquip = this.add.text(width-260, y, def.type === "gear" ? "[EQUIP]" : "      ", {
        fontFamily:"monospace", fontSize:"18px", color:"#fff"
      });

      btnUse.setInteractive({ useHandCursor:true });
      btnUse.on("pointerdown", () => {
        if (def.type !== "consumable") return;
        const ok = removeItem(state, def.id, 1);
        if (!ok) return;
        def.use?.(state);
        this.scene.restart();
      });

      if (def.type === "gear") {
        btnEquip.setInteractive({ useHandCursor:true });
        btnEquip.on("pointerdown", () => {
          const slot = def.slot;
          state.equipped[slot] = def.id;
          this.scene.restart();
        });
      }

      y += 34;
    });
  }
}

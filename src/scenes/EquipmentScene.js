export default class EquipmentScene extends Phaser.Scene {
  constructor() {
    super("EquipmentScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const state = this.registry.get("state");

    // Dim background
    this.add.rectangle(0, 0, w, h, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive();

    this.add.text(w / 2, 40, "Equipment", {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const slots = [
      ["Weapon", "weapon"],
      ["Armor", "armor"],
      ["Trinket", "trinket"],
    ];

    slots.forEach(([label, key], i) => {
      const y = 120 + i * 60;
      const item = state.equipment?.[key]?.name ?? "(empty)";

      this.add.text(100, y, `${label}: ${item}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#dddddd",
      });
    });

    const close = this.add.text(w - 100, h - 50, "[ESC] Close", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
    }).setInteractive();

    close.on("pointerdown", () => this.scene.stop());

    this.input.keyboard.once("keydown-ESC", () => this.scene.stop());

    this.events.once("shutdown", () => {
      this.scene.resume("StoryScene");
      this.scene.bringToTop("UIScene");
    });
  }
}

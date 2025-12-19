export default class CharacterScene extends Phaser.Scene {
  constructor() {
    super("CharacterScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const s = this.registry.get("state");

    this.add.rectangle(0, 0, w, h, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setInteractive();

    this.add.text(w / 2, 40, "Character", {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const lines = [
      `Level: ${s.level}`,
      `XP: ${s.xp} / ${s.xpToNext}`,
      `HP: ${s.hp} / ${s.maxHp}`,
      `Sanity: ${s.sanity} / ${s.maxSanity}`,
      "",
      `Wits: ${s.stats.wits}`,
      `Charm: ${s.stats.charm}`,
      `Agility: ${s.stats.agility}`,
    ];

    this.add.text(100, 120, lines.join("\n"), {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#dddddd",
      lineSpacing: 6,
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

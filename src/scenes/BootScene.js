export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
  this.load.audio("heartbeat", "assets/audio/heartbeat.mp3");
}

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#000");

    const txt = this.add.text(
      width / 2,
      height / 2,
      "Created by PhoebusCode\n© 2025",
      {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ffffff",
        align: "center",
      }
    ).setOrigin(0.5);

    // subtle flicker
    this.tweens.add({
      targets: txt,
      alpha: { from: 0.85, to: 1 },
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    this.input.once("pointerdown", () => doFade(200));

    let fading = false;
const doFade = (ms) => {
  if (fading) return;
  fading = true;
  this.cameras.main.fadeOut(ms, 0, 0, 0);
};

    // wait then fade out
    this.time.delayedCall(2200, () => doFade(600));

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("PreloadScene");
    });
  }
}

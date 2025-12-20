import { LOCATIONS } from "../db_locations.js";

const MAP_BASE_W = 800;
const MAP_BASE_H = 600;

// Build marker lists from LOCATIONS
const CITY_MARKERS = Object.values(LOCATIONS)
  .filter((l) => l && l.tier === "city")
  .map((l) => ({ id: l.id, x: l.x / MAP_BASE_W, y: l.y / MAP_BASE_H }));

// (Optional) if you later add local markers, build them here.
// const LOCAL_MARKERS = ...

export default class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
    this._tweens = [];
    this.backdrop = null;
  }

  init(data) {
    this.view = data?.view || "city";
  }

  closeMap() {
    // 1) Stop THIS scene (removes it + its input)
    this.scene.stop("MapScene");

    // 2) Resume + wake StoryScene (covers pause + sleep)
    const story = this.scene.get("StoryScene");
    if (story) {
      try { this.scene.resume("StoryScene"); } catch {}
      try { this.scene.wake("StoryScene"); } catch {}

      // ✅ make sure StoryScene can receive clicks again
      if (story.input) story.input.enabled = true;

      // ✅ ensure StoryScene is on top for input
      this.scene.bringToTop("StoryScene");

      // ✅ safest: rebuild choices + their interactives
      story.renderNode?.();
    }

    // 3) If you have a HUD scene, keep it on top
    if (this.scene.isActive("UIScene")) {
      this.scene.bringToTop("UIScene");
    }
  }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    // If you pause StoryScene when opening map, this guarantees it’s paused here too.
    // (Safe even if it wasn't paused.)
    try { this.scene.pause("StoryScene"); } catch {}

    // Backdrop (click to close)
    this.backdrop = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setDepth(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.closeMap());

    // --- PHONE MAP ---
    const cx = width / 2;
    const cy = height / 2;
    const phone = this.add.container(cx, cy).setDepth(10);

    const mapBg = this.add.image(0, 0, "map_bg");
    const mapOverlay = this.add.image(0, 0, "map_overlay").setDepth(5);

    const fog = this.add.image(0, 0, "map_fog")
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.85);

    const markers = this.add.container(0, 0).setDepth(15);

    const glass = this.add.image(0, 0, "map_glass").setDepth(20).setAlpha(0.35);
    const frame = this.add.image(0, 0, "phone_frame").setDepth(25);

    phone.add([mapBg, mapOverlay, fog, markers, glass, frame]);

    // Scale phone UI to screen
    this.scaleToFit(phone, width * 0.92, height * 0.92);

    // Fog breathing
    this._tweens.push(this.tweens.add({
      targets: fog,
      alpha: { from: 0.78, to: 0.92 },
      duration: 5500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    }));

    // Screen rect inside the phone art (tuned for your asset)
    const SCREEN = { x: 210, y: 210, w: 1500, h: 660 };
    const toPhoneXY = (nx, ny) => ({
      x: (SCREEN.x + nx * SCREEN.w) - 960,
      y: (SCREEN.y + ny * SCREEN.h) - 540,
    });

    // Title + instructions
    this.add.text(40, 34,
      this.view === "city" ? "CITY MAP" : "LOCAL MAP",
      { fontFamily: "monospace", fontSize: "28px", color: "#fff" }
    ).setDepth(20);

    this.add.text(40, 70,
      this.view === "city"
        ? "Click a district marker. Locked ones won’t respond (yet)."
        : "Click a nearby location to continue.",
      { fontFamily: "monospace", fontSize: "16px", color: "#cfcfcf" }
    ).setDepth(20);

    // Close button
    const close = this.add.text(width - 40, 34, "[X]", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#fff",
    })
    .setDepth(20)
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => this.closeMap());

    // --- CITY MARKERS ---
    if (this.view === "city") {
      CITY_MARKERS.forEach((m) => {
        const loc = LOCATIONS[m.id];
        if (!loc) return;

        const locked = !!loc.locked && !state.flags?.[`unlock_${m.id}`];
        const pos = toPhoneXY(m.x, m.y);

        const marker = this.add.image(
          pos.x,
          pos.y,
          "map_markers",
          locked ? 1 : 2
        )
          .setScale(0.72)
          .setAlpha(locked ? 0.75 : 1);

        markers.add(marker);

        const label = this.add.text(pos.x + 48, pos.y - 18, loc.title, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: locked ? "#777" : "#fff",
        });

        markers.add(label);

        if (!locked) {
          this._tweens.push(this.tweens.add({
            targets: marker,
            scale: { from: 0.70, to: 0.82 },
            alpha: { from: 1.0, to: 0.82 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
          }));

          marker.setInteractive({ useHandCursor: true });
          marker.on("pointerdown", () => {
            state.locationId = loc.id;
            state.localId = loc.locals?.[0] || null;

            // ✅ stay in MapScene, switch view cleanly
            this.scene.restart({ view: "local" });
          });
        }
      });
    }

    // --- LOCAL MARKERS (placeholder) ---
    // If you want local view to actually select a node, do it here.
    // if (this.view === "local") { ... }

    // CLEANUP
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // kill tweens
      this._tweens?.forEach(t => { try { t.remove(); } catch {} });
      this._tweens = [];

      // destroy backdrop so it can't keep eating clicks
      try { this.backdrop?.removeInteractive?.(); } catch {}
      try { this.backdrop?.destroy?.(); } catch {}
      this.backdrop = null;

      // nuke any scene-level input listeners
      try { this.input?.removeAllListeners?.(); } catch {}
    });
  }

  scaleToFit(container, maxW, maxH) {
    const baseW = 1920;
    const baseH = 1080;
    const s = Math.min(maxW / baseW, maxH / baseH);
    container.setScale(s);
  }
}

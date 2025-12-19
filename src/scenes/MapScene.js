import { LOCATIONS, CITY_MARKERS } from "../db_locations.js";

export default class MapScene extends Phaser.Scene {
  constructor() { super("MapScene"); }

  init(data) { this.view = data?.view || "city"; }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    // Dim backdrop
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);

    // --- PHONE MAP LAYERS ---
    const cx = width / 2;
    const cy = height / 2;

    // Container so everything stays together
    const phone = this.add.container(cx, cy);

    // Base map
    const mapBg = this.add.image(0, 0, "map_bg").setDepth(0);
    const mapOverlay = this.add.image(0, 0, "map_overlay").setDepth(5);

    // Fog hides locked areas (we’ll fade it later by district if you want)
    const fog = this.add.image(0, 0, "map_fog")
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.85);

    // Markers container
    const markers = this.add.container(0, 0);
    markers.setDepth(15);

    // Glass overlay
    const glass = this.add.image(0, 0, "map_glass")
      .setDepth(20)
      .setAlpha(0.35);

    // Phone frame on top
    const frame = this.add.image(0, 0, "phone_frame").setDepth(25);

    // Add to phone container in the right order
    phone.add([mapBg, mapOverlay, fog, markers, glass, frame]);

    // Scale phone to fit screen nicely
    this.scaleToFit(phone, width * 0.92, height * 0.92);

    // Subtle fog breathing
    this.tweens.add({
      targets: fog,
      alpha: { from: 0.78, to: 0.92 },
      duration: 5500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // --- MAP SCREEN RECT (where markers go) ---
    // IMPORTANT: This matches how the phone frame was built:
    // outer margin 120, screen margin 210 on a 1920x1080 image
    const SCREEN = {
      x: 210,
      y: 210,
      w: 1500,
      h: 660,
    };

    // Convert 0..1 marker coords into phone-local coords
    // (phone container is centered at 0,0)
    const toPhoneXY = (nx, ny) => {
      const px = (SCREEN.x + nx * SCREEN.w) - 960;  // 960 = half of 1920
      const py = (SCREEN.y + ny * SCREEN.h) - 540;  // 540 = half of 1080
      return { x: px, y: py };
    };

    // Title + hint
    const title = this.view === "city" ? "CITY MAP" : "LOCAL MAP";
    const hint = this.view === "city"
      ? "Tap a district marker. Locked ones won’t respond (yet)."
      : "Tap a nearby spot to continue.";

    this.add.text(40, 34, title, { fontFamily: "monospace", fontSize: "28px", color: "#fff" });
    this.add.text(40, 70, hint, { fontFamily: "monospace", fontSize: "16px", color: "#cfcfcf" });

    // Close button
    const close = this.add.text(width - 40, 34, "[X]", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#fff",
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => this.scene.stop());

    // --- BUILD MARKERS ---
    if (this.view === "city") {
      CITY_MARKERS.forEach((m) => {
        const loc = LOCATIONS[m.id];
        if (!loc) return;

        const locked = !!loc.locked && !state.flags[`unlock_${m.id}`];
        const pos = toPhoneXY(m.x, m.y);

        // frame index: 0=you, 1=locked, 2=story, 3=shop
        const frameIndex = locked ? 1 : 2;

        const marker = this.add.image(pos.x, pos.y, "map_markers", frameIndex)
          .setScale(0.72)
          .setAlpha(locked ? 0.75 : 1);

        markers.add(marker);

        // Label (inside the phone)
        const label = this.add.text(pos.x + 48, pos.y - 18, loc.name, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: locked ? "#777" : "#fff",
        });
        markers.add(label);

        // Soft pulse on unlocked markers
        if (!locked) {
          this.tweens.add({
            targets: marker,
            scale: { from: 0.70, to: 0.82 },
            alpha: { from: 1.0, to: 0.82 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
          });

          marker.setInteractive({ useHandCursor: true });
          marker.on("pointerdown", () => {
            state.locationId = loc.id;
            state.localId = loc.locals?.[0] || null;

            // hop to local view
            this.scene.stop();
            this.scene.launch("MapScene", { view: "local" });
          });
        }
      });

      // Optional: show “you are here” marker if state.locationId matches something
      if (state.locationId && LOCATIONS[state.locationId]) {
        const hereMarker = CITY_MARKERS.find(mm => mm.id === state.locationId);
        if (hereMarker) {
          const p = toPhoneXY(hereMarker.x, hereMarker.y);
          const you = this.add.image(p.x, p.y, "map_markers", 0).setScale(0.78);
          markers.add(you);

          this.tweens.add({
            targets: you,
            scale: { from: 0.76, to: 0.90 },
            alpha: { from: 1.0, to: 0.75 },
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
          });
        }
      }

    } else {
      // LOCAL VIEW markers
      const list = LOCAL_MARKERS[state.locationId] || [];
      list.forEach((m) => {
        const pos = toPhoneXY(m.x, m.y);

        const marker = this.add.image(pos.x, pos.y, "map_markers", 2)
          .setScale(0.70);

        markers.add(marker);

        const label = this.add.text(pos.x + 48, pos.y - 18, m.id, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#fff",
        });
        markers.add(label);

        this.tweens.add({
          targets: marker,
          scale: { from: 0.68, to: 0.80 },
          alpha: { from: 1.0, to: 0.82 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });

        marker.setInteractive({ useHandCursor: true });
        marker.on("pointerdown", () => {
          state.localId = m.id;
          if (m.node) state.nodeId = m.node;

          this.scene.stop();
          this.scene.start("StoryScene");
        });
      });
    }
  }

  // Scale a container to fit within maxW/maxH while preserving aspect
  scaleToFit(container, maxW, maxH) {
    // Our phone art is 1920x1080
    const baseW = 1920;
    const baseH = 1080;
    const s = Math.min(maxW / baseW, maxH / baseH);
    container.setScale(s);
  }
}

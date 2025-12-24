import { LOCATIONS, CITY_MARKERS } from "/src/db_locations.js";

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
    this.scene.stop("MapScene");

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

  playUiClick(vol = 0.28) {
    if (this.sound && this.cache?.audio?.exists("ui_click")) {
      try { this.sound.play("ui_click", { volume: vol }); } catch {}
    }
  }

  playUiWhoosh(vol = 0.18) {
    if (this.sound && this.cache?.audio?.exists("ui_whoosh")) {
      try { this.sound.play("ui_whoosh", { volume: vol }); } catch {}
    }
  }

  playUiType(vol = 0.08) {
    if (this.sound && this.cache?.audio?.exists("ui_type")) {
      try { this.sound.play("ui_type", { volume: vol }); } catch {}
    }
  }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get("state");

    try { this.scene.pause("StoryScene"); } catch {}

    const unlockAudio = () => {
      try { this.sound?.context?.resume?.(); } catch {}
    };
    this.input.once("pointerdown", unlockAudio);
    this.input.keyboard?.once("keydown", unlockAudio);

    // Backdrop (click to close)
    this.backdrop = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setDepth(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.playUiClick(0.22);
        this.playUiWhoosh(0.14);
        this.closeMap();
      });

    this.time.delayedCall(120, () => this.playUiType(0.06));
    this.time.delayedCall(240, () => this.playUiType(0.06));
    this.time.delayedCall(360, () => this.playUiType(0.06));

    // --- PHONE MAP ---
    const cx = width / 2;
    const cy = height / 2;
    const phone = this.add.container(cx, cy).setDepth(10);

    // Your phone art is authored in 1920x1080 design space centered at (0,0)
    // So top-left of that design space is (-960, -540)
    const DESIGN_TOP_LEFT = { x: -960, y: -540 };

    // Screen cutout rect (in design-space pixels)
    const SCREEN = { x: 210, y: 210, w: 1500, h: 660, r: 28 };

    // Create a container that represents JUST the screen area.
    // Position it at the screen's top-left in phone-local coords.
    const screenContent = this.add.container(
      DESIGN_TOP_LEFT.x + SCREEN.x,
      DESIGN_TOP_LEFT.y + SCREEN.y
    );
    phone.add(screenContent);

    // Map layers (top-left anchored inside screenContent)
    const mapBg = this.add.image(0, 0, "map_bg").setOrigin(0, 0);
    const mapOverlay = this.add.image(0, 0, "map_overlay").setOrigin(0, 0);

    const fog = this.add
      .image(0, 0, "map_fog")
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.85);

    const markers = this.add.container(0, 0);

    screenContent.add([mapBg, mapOverlay, fog, markers]);

    // Glass + frame are full-phone overlays (NOT inside screenContent)
    const glass = this.add.image(0, 0, "map_glass").setDepth(20).setAlpha(0.35);
    const frame = this.add.image(0, 0, "phone_frame").setDepth(25);
    phone.add([glass, frame]);

    // -------------------------------------------------
    // ✅ FIT MAP TO SCREEN (COVER, not contain)
    // -------------------------------------------------
    const fitCover = (img) => {
      const iw = img.width;
      const ih = img.height;

      const scaleX = SCREEN.w / iw;
      const scaleY = SCREEN.h / ih;

      // ✅ your tuned value
      const s = Math.max(scaleX, scaleY) * 0.83;

      img.setScale(s);

      // Center it inside screen rect (still top-left origin)
      const displayW = iw * s;
      const displayH = ih * s;

      img.setPosition(
        (SCREEN.w - displayW) * 0.5,
        (SCREEN.h - displayH) * 0.5
      );

      return { s, displayW, displayH };
    };

    // Fit each layer and keep bg's numbers for marker math
    const bgFit = fitCover(mapBg);
    fitCover(mapOverlay);
    fitCover(fog);

    // -------------------------------------------------
    // ✅ MASK THE SCREEN CONTENT (local 0,0 coords)
    // -------------------------------------------------
    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRoundedRect(0, 0, SCREEN.w, SCREEN.h, SCREEN.r);
    maskGfx.setVisible(false);

    // maskGfx must be added to screenContent so it shares local coords
    screenContent.add(maskGfx);

    const screenMask = maskGfx.createGeometryMask();
    screenContent.setMask(screenMask);

    // -------------------------------------------------
    // ✅ MARKERS: normalized 0–1 mapped onto the *VISIBLE MAP*
    // (not the whole screen)
    // -------------------------------------------------
    const mapOffsetX = mapBg.x;           // where the map starts inside screenContent
    const mapOffsetY = mapBg.y;
    const mapDrawW = mapBg.displayWidth;  // visible map size after scaling
    const mapDrawH = mapBg.displayHeight;

    const toMapXY = (nx, ny) => ({
      x: mapOffsetX + nx * mapDrawW,
      y: mapOffsetY + ny * mapDrawH,
    });

    CITY_MARKERS.forEach((m) => {
      const loc = LOCATIONS[m.id];
      if (!loc) return;

      const unlocked =
        state.unlockedLocations
        ? !!state.unlockedLocations[loc.id]
        : !loc.locked;

      const pos = toMapXY(m.x, m.y);

      const marker = this.add
        .image(pos.x, pos.y, "map_markers", unlocked ? 2 : 1)
        .setScale(0.72)
        .setAlpha(unlocked ? 1 : 0.75);

      markers.add(marker);

      const label = this.add.text(pos.x + 48, pos.y - 18, loc.title, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: unlocked ? "#fff" : "#777",
      });
      markers.add(label);

      if (!unlocked) return;

      marker.setInteractive({ useHandCursor: true });
      marker.on("pointerdown", () => {
        this.playUiClick(0.32);
        this.playUiWhoosh(0.18);

        state.locationId = loc.id;
        state.flags = state.flags || {};
        state.flags.map_selected_location = loc.id;
        state.flags.map_selected_once = true;

        this.closeMap();
      });
    });

    // ------------------------------------
// CURRENT LOCATION ("YOU ARE HERE") MARKER
// ------------------------------------
const currentLocId =
  state?.flags?.map_selected_location || state?.locationId;

const current = CITY_MARKERS.find((m) => m.id === currentLocId);

if (current) {
  const pos = toMapXY(current.x, current.y);

  const Y_OFFSET = 25; // tweak this number

const you = this.add
  .image(pos.x, pos.y + Y_OFFSET, "map_markers", 0)
  .setScale(0.78)
  .setAlpha(0.95);

  // put it behind pins (looks better)
  markers.addAt(you, 0);

  // pulse animation
  this._tweens.push(
    this.tweens.add({
      targets: you,
      scale: { from: 0.72, to: 0.9 },
      alpha: { from: 0.6, to: 1.0 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    })
  );
}

    // -------------------------------------------------
    // OPTIONAL: Click-to-get normalized coords for CITY_MARKERS
    // (Turn off when done)
    // -------------------------------------------------
    const DEBUG_PICK = false;
    if (DEBUG_PICK) {
      this.input.on("pointerdown", (p) => {
        // screen -> phone-local
        const localX = (p.x - phone.x) / phone.scaleX;
        const localY = (p.y - phone.y) / phone.scaleY;

        // phone-local -> screenContent-local
        const scLocalX = localX - screenContent.x;
        const scLocalY = localY - screenContent.y;

        // inside the map image bounds?
        const nx = (scLocalX - mapOffsetX) / mapDrawW;
        const ny = (scLocalY - mapOffsetY) / mapDrawH;

        if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
          console.log("CITY_MARKER:", { x: +nx.toFixed(4), y: +ny.toFixed(4) });
        }
      });
    }

    // Fog breathing
    this._tweens.push(
      this.tweens.add({
        targets: fog,
        alpha: { from: 0.78, to: 0.92 },
        duration: 5500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      })
    );

    // UI text
    this.add
      .text(40, 34, "CITY MAP", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#fff",
      })
      .setDepth(20);

    this.add
      .text(40, 70, "Click an unlocked marker to select it. Locked ones won’t respond (yet).", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cfcfcf",
      })
      .setDepth(20);

    const close = this.add
      .text(width - 40, 34, "[X]", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff",
      })
      .setDepth(20)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    close.on("pointerdown", () => {
      this.playUiClick(0.28);
      this.playUiWhoosh(0.16);
      this.closeMap();
    });

    // Scale phone UI to screen (do this LAST)
    this.scaleToFit(phone, width * 0.92, height * 0.92);

    // CLEANUP
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._tweens?.forEach((t) => { try { t.remove(); } catch {} });
      this._tweens = [];

      try { this.backdrop?.removeInteractive?.(); } catch {}
      try { this.backdrop?.destroy?.(); } catch {}
      this.backdrop = null;

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

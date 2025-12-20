export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    this.load.on("loaderror", (file) => {
  console.error("❌ LOAD ERROR:", file.key, file.url);
});

this.load.on("filecomplete", (key, type, data) => {
  // Uncomment if you want noisy logs:
  // console.log("✅ LOADED:", key);
});

    // UI
    this.load.image("ui_panel", "assets/ui/panel.png");

    // Apartment background layers
    this.load.image("apartment_bg", "assets/backgrounds/apartment/bg.png");
    this.load.image("apartment_fg", "assets/backgrounds/apartment/fg.png");
    this.load.image("apartment_light", "assets/backgrounds/apartment/light.png");
    this.load.image("apartment_glow", "assets/backgrounds/apartment/glow.png");
    this.load.image(
  "apartment_mirror",
  "assets/backgrounds/apartment/apartment_mirror.png"
);
this.load.image(
  "apartment_mirror_wrong",
  "assets/backgrounds/apartment/apartment_mirror_variant.png"
);
this.load.image(
  "apartment_coffee_bg",
  "assets/backgrounds/apartment/coffee_table_bg.png"
);
this.load.image(
  "apartment_door_bg",
  "assets/backgrounds/apartment/door.png"
);
this.load.image(
  "apartment_mirror_demon",
  "assets/backgrounds/apartment/apartment_mirror_demon.png"
);
this.load.image(
  "demon_fg",
  "assets/backgrounds/apartment/demon_fg.png"
);
this.load.image(
  "ghost_fg",
  "assets/overlays/ghost_fg.png" // your transparent ghost
);
this.load.image(
  "apartment_demon_death",
  "assets/backgrounds/apartment/demon_death.png"
);

//Blood FX
// in preload()
this.load.image("blood_corner_UL", "assets/fx/blood/blood_corner_UL.png");
this.load.image("blood_corner_UR", "assets/fx/blood/blood_corner_UR.png");
this.load.image("blood_edge_left", "assets/fx/blood/blood_edge_left.png");
this.load.image("blood_edge_right", "assets/fx/blood/blood_edge_right.png");
this.load.image("blood_center_small", "assets/fx/blood/blood_center_small.png");
this.load.image("blood_droplets_light", "assets/fx/blood/blood_droplets_light.png");
this.load.image("blood_drips_vertical", "assets/fx/blood/blood_drips_vertical.png");
this.load.image("blood_smear_glass", "assets/fx/blood/blood_smear_glass.png");


    // PHONE MAP (layers)
    this.load.image("phone_frame", "assets/map/phone/frame.png");
    this.load.image("map_bg", "assets/map/phone/map_bg.png");
    this.load.image("map_overlay", "assets/map/phone/map_overlay.png");
    this.load.image("map_fog", "assets/map/phone/fog.png");
    this.load.image("map_glass", "assets/map/phone/glass.png");

    // TV background layers
    this.load.image("tv_bg", "assets/backgrounds/tv/bg.png");
    this.load.image("tv_news", "assets/backgrounds/tv/news.png");
    this.load.image("tv_light", "assets/backgrounds/tv/light.png");
    this.load.image("tv_glow", "assets/backgrounds/tv/glow.png");
    this.load.image("tv_fg", "assets/backgrounds/tv/fg.png");
    this.load.image("tv_news_0", "assets/backgrounds/tv/tv_news_0.png");
    this.load.image("tv_news_1", "assets/backgrounds/tv/tv_news_1.png");
    this.load.image("tv_news_2", "assets/backgrounds/tv/tv_news_2.png");
    this.load.image("tv_news_3", "assets/backgrounds/tv/tv_news_3.png");

    // INTRO background layers
this.load.image("intro_bg", "assets/backgrounds/intro/bg.png");
this.load.image("intro_fg", "assets/backgrounds/intro/fg.png");
this.load.image("intro_light", "assets/backgrounds/intro/light.png");
this.load.image("intro_glow", "assets/backgrounds/intro/glow.png");

// Office background layers
this.load.image("office_bg", "assets/backgrounds/office/bg.png");
this.load.image("office_fg", "assets/backgrounds/office/fg.png");
this.load.image("office_light", "assets/backgrounds/office/light.png");
this.load.image("office_glow", "assets/backgrounds/office/glow.png");

// === PC / WORKSTATION UI ===
this.load.image("pc_wallpaper", "assets/pc/pc_wallpaper.png");
this.load.image("pc_dim", "assets/pc/pc_dim_overlay.png");
this.load.image("pc_window", "assets/pc/pc_window_frame.png");
this.load.image("pc_taskbar", "assets/pc/pc_taskbar.png");

this.load.image("pc_icon_file", "assets/pc/pc_icon_file.png");
this.load.image("pc_icon_folder", "assets/pc/pc_icon_folder.png");
this.load.image("pc_icon_terminal", "assets/pc/pc_icon_terminal.png");
this.load.image("pc_icon_warning", "assets/pc/pc_icon_warning.png");

this.load.image("pc_modal", "assets/pc/pc_modal.png");
this.load.image("pc_cursor", "assets/pc/pc_cursor.png");

    // Audio
this.load.audio("thunderstorm", "assets/thunderstorm.mp3");
this.load.audio("heartbeat", "assets/audio/heartbeat.mp3");
this.load.audio("bg_thriller", "assets/slow-cinematic-thriller.mp3");
this.load.audio("jump_scare", "assets/audio/jump-scare.mp3");
this.load.audio(
  "demon_laugh",
  "assets/audio/demon-laugh.mp3"
);
  this.load.audio("death_scream", "assets/audio/death_scream.mp3");




    // MARKERS (spritesheet: 4 frames, 128x128 each)
    this.load.spritesheet("map_markers", "assets/map/phone/markers_sheet.png", {
      frameWidth: 128,
      frameHeight: 128,
    });

    // (Optional) music preload if you added it
    // this.load.audio("bg_ambient", "assets/audio/ambient_loop.wav");
  }

  create() {
    // UI panel filtering (prevents smear when scaled)
    if (this.textures.exists("ui_panel")) {
      this.textures.get("ui_panel").setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    this.scene.start("MenuScene");

  }
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.on("loaderror", (file) => {
  console.error("❌ LOAD ERROR:", file.key, file.url);
});

this.load.on("filecomplete", (key, type, data) => {
  // Uncomment if you want noisy logs:
  // console.log("✅ LOADED:", key);
});

const { width, height } = this.scale;
  this.cameras.main.setBackgroundColor("#000");

  // -------------------------
  // POWERED BY + LOADING UI
  // -------------------------
  const powered = this.add.text(width / 2, height / 2 - 110, "Powered by Phaser", {
    fontFamily: "monospace",
    fontSize: "20px",
    color: "#aaaaaa",
  }).setOrigin(0.5);

  const loadingTxt = this.add.text(width / 2, height / 2 - 70, "LOADING", {
    fontFamily: "monospace",
    fontSize: "28px",
    color: "#ffffff",
    letterSpacing: "6px",
  }).setOrigin(0.5);

  // bar frame + fill
  const barW = Math.min(520, width * 0.75);
  const barH = 18;

  const frame = this.add.rectangle(width / 2, height / 2, barW + 6, barH + 6)
    .setStrokeStyle(2, 0xffffff, 0.25);

  const fill = this.add.rectangle(width / 2 - barW / 2, height / 2, 0, barH, 0xffffff)
    .setOrigin(0, 0.5)
    .setAlpha(0.85);

  const whisper = this.add.text(width / 2, height / 2 + 42, "don’t blink", {
    fontFamily: "monospace",
    fontSize: "14px",
    color: "#777777",
  }).setOrigin(0.5).setAlpha(0.35);

  // 👇 ADD THIS LINE HERE
let canGlitch = true;

  let beat;

this.load.once("start", () => {
  beat = this.sound.add("heartbeat", { loop: true, volume: 0.1 });
  beat.play();
});

this.load.on("progress", (p) => {
  if (beat) beat.setVolume(0.1 + p * 0.6);
});

this.load.once("complete", () => {
  beat?.stop();
});

  // subtle glitch jitter
  this.time.addEvent({
    delay: 90,
    loop: true,
    callback: () => {
      loadingTxt.x = width / 2 + Phaser.Math.Between(-1, 1);
      loadingTxt.y = height / 2 - 70 + Phaser.Math.Between(-1, 1);
      loadingTxt.setAlpha(Phaser.Math.FloatBetween(0.85, 1));
      powered.setAlpha(Phaser.Math.FloatBetween(0.55, 0.9));
    },
  });

  // progress updates
  this.load.on("progress", (p) => {
  fill.width = barW * p;

  // creepy “crawl”
  fill.y = height / 2 + Phaser.Math.Between(-1, 1);
  whisper.setAlpha(0.2 + p * 0.8);

  // one-frame wrong text glitch
  if (canGlitch && Math.random() < 0.015) {
  canGlitch = false;
  loadingTxt.setText("LOADING YOU");
  this.time.delayedCall(60, () => {
    loadingTxt.setText("LOADING");
    canGlitch = true;
  });
}
});

  this.load.on("complete", () => {
    // (optional) quick fade before menu
    this.cameras.main.fadeOut(450, 0, 0, 0);
  });

  // -------------------------
  // THEN KEEP YOUR ASSET LOAD LIST BELOW
  // -------------------------

  // ... your this.load.image / audio / spritesheet stuff ...

    // UI
    this.load.image("ui_panel", "assets/ui/panel.png");
    this.load.image("menu_bg", "assets/backgrounds/menu/menu_bg.png");

    // Apartment background layers
    this.load.image("apartment_bg_demon", "assets/backgrounds/apartment/apartment_bg_demon.png");
    this.load.image("apartment_bg_night", "assets/backgrounds/apartment/apartment_bg_night.png");
    this.load.image("couch_bg_night", "assets/backgrounds/apartment/couch_bg_night.png");
    this.load.image("apartment_hub_demon", "assets/backgrounds/apartment/apartment_hub_demon.png");
    this.load.image("apartment_hub_night", "assets/backgrounds/apartment/apartment_hub_night.png");
    this.load.image("apartment_hub", "assets/backgrounds/apartment/apartment_hub.png");
    this.load.image("apartment_bg", "assets/backgrounds/apartment/bg.png");
    this.load.image("apartment_fg", "assets/backgrounds/apartment/fg.png");
    this.load.image("apartment_light", "assets/backgrounds/apartment/light.png");
    this.load.image("apartment_glow", "assets/backgrounds/apartment/glow.png");
    this.load.image("couch_bg", "assets/backgrounds/apartment/couch_bg.png");
    this.load.image("couch_bg_night", "assets/backgrounds/apartment/couch_bg_night.png");
    this.load.image("couch_bg_demon", "assets/backgrounds/apartment/couch_bg_demon.png");
    this.load.image("kitchen_bg", "assets/backgrounds/apartment/kitchen_bg.png");
    this.load.image("apartment_kitchen_demon", "assets/backgrounds/apartment/apartment_kitchen_demon.png");
    this.load.image( "apartment_mirror", "assets/backgrounds/apartment/apartment_mirror.png");
this.load.image(
  "apartment_mirror_wrong",
  "assets/backgrounds/apartment/apartment_mirror_variant.png"
);
this.load.image(
  "apartment_mirror_demon_world",
  "assets/backgrounds/apartment/apartment_mirror_demon_world.png"
);
this.load.image(
  "apartment_coffee_bg",
  "assets/backgrounds/apartment/coffee_table_bg.png"
);
this.load.image(
  "apartment_coffee_night",
  "assets/backgrounds/apartment/coffee_night.png"
);
this.load.image(
  "apartment_coffee_table_demon",
  "assets/backgrounds/apartment/apartment_coffee_table_demon.png"
);
this.load.image(
  "apartment_door_bg",
  "assets/backgrounds/apartment/door.png"
);
this.load.image(
  "apartment_door_demon",
  "assets/backgrounds/apartment/apartment_door_demon.png"
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

// Cracks FX (new pack)
this.load.image("crack_light",   "assets/fx/cracks/crack_light.png");
this.load.image("crack_medium",  "assets/fx/cracks/crack_medium.png");
this.load.image("crack_heavy",   "assets/fx/cracks/crack_heavy.png");
this.load.image("crack_extreme", "assets/fx/cracks/crack_extreme.png");


    // PHONE MAP (layers)
    this.load.image("phone_frame", "assets/map/phone/frame.png");
    this.load.image("map_bg", "assets/map/phone/map_bg.png");
    this.load.image("map_overlay", "assets/map/phone/map_overlay.png");
    this.load.image("map_fog", "assets/map/phone/fog.png");
    this.load.image("map_glass", "assets/map/phone/glass.png");

    // TV background layers
    this.load.image("tv_bg_demon", "assets/backgrounds/tv/tv_bg_demon.png");
    this.load.image("tv_bg_night", "assets/backgrounds/tv/tv_bg_night.png");
    this.load.image("tv_bg", "assets/backgrounds/tv/bg.png");
    this.load.image("tv_news", "assets/backgrounds/tv/news.png");
    this.load.image("tv_light", "assets/backgrounds/tv/light.png");
    this.load.image("tv_glow", "assets/backgrounds/tv/glow.png");
    this.load.image("tv_bezel", "assets/backgrounds/tv/tv_bezel.png");
    this.load.image("tv_news_0", "assets/backgrounds/tv/tv_news_0.png");
    this.load.image("tv_news_1", "assets/backgrounds/tv/tv_news_1.png");
    this.load.image("tv_news_2", "assets/backgrounds/tv/tv_news_2.png");
    this.load.image("tv_news_3", "assets/backgrounds/tv/tv_news_3.png");

    // INTRO background layers
    this.load.image("apartment_bedroom_demon", "assets/backgrounds/intro/bedroom_bg_demon.png");
    this.load.image("apartment_bedroom_night", "assets/backgrounds/intro/bedroom_bg_night.png");
    this.load.image("apartment_bedroom", "assets/backgrounds/intro/bg.png");
    this.load.image("intro_fg", "assets/backgrounds/intro/fg.png");
    this.load.image("intro_light", "assets/backgrounds/intro/light.png");
    this.load.image("intro_glow", "assets/backgrounds/intro/glow.png");
    this.load.image("ghost_dream", "assets/backgrounds/intro/ghost_dream.png");
    this.load.image("ghost_dream_jump", "assets/backgrounds/intro/ghost_dream_jump.png");

// Office background layers
this.load.image("office_hub", "assets/backgrounds/office/office_hub.png");
this.load.image("office_hub_night", "assets/backgrounds/office/office_hub_night.png");
this.load.image("office_hub_demon", "assets/backgrounds/office/office_hub_demon.png");
this.load.image("office_fg", "assets/backgrounds/office/fg.png");
this.load.image("office_light", "assets/backgrounds/office/light.png");
this.load.image("office_glow", "assets/backgrounds/office/glow.png");
this.load.image("office_lobby", "assets/backgrounds/office/office_lobby.png");
this.load.image("office_lobby_night", "assets/backgrounds/office/office_lobby_night.png");
this.load.image("office_lobby_demon", "assets/backgrounds/office/office_lobby_demon.png");
this.load.image("office_breakroom", "assets/backgrounds/office/office_breakroom.png");
this.load.image("office_breakroom_night", "assets/backgrounds/office/office_breakroom_night.png");
this.load.image("office_breakroom_demon", "assets/backgrounds/office/office_breakroom_demon.png");
this.load.image("office_floor", "assets/backgrounds/office/office_floor.png");
this.load.image("office_floor_night", "assets/backgrounds/office/office_floor_night.png");
this.load.image("office_floor_demon", "assets/backgrounds/office/office_floor_demon.png");
this.load.image("office_hr", "assets/backgrounds/office/office_hr.png");
this.load.image("office_hr_night", "assets/backgrounds/office/office_hr_night.png");
this.load.image("office_hr_demon", "assets/backgrounds/office/office_hr_demon.png");

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
this.load.audio("bg_thriller", "assets/bg_music.mp3");
this.load.audio("jump_scare", "assets/audio/jump-scare.mp3");
this.load.audio(
  "demon_laugh",
  "assets/audio/demon-laugh.mp3"
);
this.load.audio("death_scream", "assets/audio/death_scream.mp3");
this.load.audio("ui_click",  "assets/audio/ui/click.mp3");
this.load.audio("ui_type",   "assets/audio/ui/tick.mp3");
this.load.audio("ui_whoosh", "assets/audio/ui/whoosh.mp3");
this.load.audio("grunt", "assets/audio/grunt.mp3");
this.load.audio("ghost_moan", "assets/audio/ghost_moan.mp3");
this.load.audio("alarm_clock", "assets/audio/alarm_clock.mp3");
this.load.audio("intro_horror", "assets/audio/intro_horror.mp3");


// PC sounds
this.load.audio("pc_click",    "assets/audio/pc/pc_click.mp3");
this.load.audio("pc_error",    "assets/audio/pc/pc_error.mp3");
this.load.audio("pc_confirm",  "assets/audio/pc/pc_success.mp3");
this.load.audio("pc_tick",  "assets/audio/pc/pc_tick.mp3");
this.load.audio("pc_glitch",  "assets/audio/pc/pc_glitch.mp3");




    // MARKERS (spritesheet: 4 frames, 128x128 each)
    this.load.spritesheet("map_markers", "assets/map/phone/markers_sheet.png", {
      frameWidth: 128,
      frameHeight: 128,
    });

    // (Optional) music preload if you added it
    // this.load.audio("bg_ambient", "assets/audio/ambient_loop.wav");
  }

  create() {
  if (this.textures.exists("ui_panel")) {
    this.textures.get("ui_panel").setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  // if you used fadeOut in "complete"
  this.cameras.main.once("camerafadeoutcomplete", () => {
    this.scene.start("MenuScene");
  });

  // if you decide NOT to fadeOut, just do:
  // this.scene.start("MenuScene");
}
}

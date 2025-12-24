// NOTE: This project serves files directly from the same folder as index.html.
// So scenes live alongside main.js (not in a /scenes subfolder).
import BootScene from "../src/scenes/BootScene.js";
import MenuScene from "../src/scenes/MenuScene.js";
import UIScene from "../src/scenes/UIScene.js";
import StoryScene from "../src/scenes/StoryScene.js";
import MapScene from "../src/scenes/MapScene.js";
import InventoryScene from "../src/scenes/InventoryScene.js";
import ShopScene from "../src/scenes/ShopScene.js";
import PauseMenuScene from "../src/scenes/PauseMenuScene.js";
import CharacterScene from "../src/scenes/CharacterScene.js";
import EquipmentScene from "../src/scenes/EquipmentScene.js";
import PreloadScene from "../src/scenes/PreloadScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#0b0b0f",

  scale: {
  // PC-first: always show the whole 16:9 game without cropping
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,

  // For Electron / desktop fullscreen toggles
  fullscreenTarget: "game",
},

  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    UIScene,
    StoryScene,
    MapScene,
    InventoryScene,
    ShopScene,
    PauseMenuScene,
    CharacterScene,
    EquipmentScene,
  ],
};

new Phaser.Game(config);

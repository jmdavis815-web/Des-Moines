import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import UIScene from "./scenes/UIScene.js";
import StoryScene from "./scenes/StoryScene.js";
import MapScene from "./scenes/MapScene.js";
import InventoryScene from "./scenes/InventoryScene.js";
import ShopScene from "./scenes/ShopScene.js";
import PauseMenuScene from "./scenes/PauseMenuScene.js";
import CharacterScene from "./scenes/CharacterScene.js";
import EquipmentScene from "./scenes/EquipmentScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#0b0b0f",

  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: "game",
  },

  scene: [
    BootScene,
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

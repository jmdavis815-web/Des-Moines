// db_locations.js

export const LOCATIONS = {
//--- location: apartment ---===
  apartment: {
  id: "apartment",
  title: "Your Apartment",
  tier: "city",
  x: 1040,
  y: 340,
  locked: false,
  hours: { open: 0, close: 24 }, // always open

  summary: "TODO",

  entryArea: "apartment_hub",
  entryNode: "loc_apartment_hub",

  // default interior look
  bg: {
    bg: "apartment_bg",
    light: null,
    glow: null,
    fg: null,
  },

  areas: {
    apartment_hub: {
      id: "apartment_hub",
      title: "Apartment Building",
      summary: "Outside your building.",
      bg: {
        bg: "apartment_hub",
        light: "apartment_exterior_light",
        glow: "apartment_exterior_glow",
        fg: null,
      },
      variants: {
        night: { bg: "apartment_hub_night", light: null, glow: null },
        demon: { bg: "apartment_hub_demon", light: null, glow: null },
    },
    },

    apartment_living_room: {
      id: "apartment_living_room",
      title: "Living Room",
      bg: {
        bg: "apartment_bg",
        light: "apartment_light",
        glow: "apartment_glow",
        fg: null,
      },
      variants: {
        night: { bg: "apartment_bg_night", light: null, glow: null },
        demon: { bg: "apartment_bg_demon", light: null, glow: null },
    },
    },

    apartment_bathroom: {
      id: "apartment_bathroom",
      title: "Bathroom",
      bg: {
        bg: "apartment_mirror",
        light: "bathroom_light",
        glow: null,
        fg: null,
      },
      variants: {
        demon: { bg: "apartment_mirror_demon_world", light: null, glow: null },
    },
    },

    apartment_kitchen: {
      id: "apartment_kitchen",
      title: "Kitchen",
      bg: {
        bg: "kitchen_bg",
        light: "apartment_light",
        glow: "apartment_glow",
        fg: null,
      },
      items: [
    { itemId: "mints", once: true },
    { itemId: "kitchen_key", once: true, requiresFlag: "kitchen_intro_seen" },
    ],
      variants: {
        demon: { bg: "apartment_kitchen_demon", light: null, glow: null },
    },
    },

    apartment_front_door: {
      id: "apartment_front_door",
      title: "Front Door",
      bg: {
        bg: "apartment_door_bg",
        light: "intro_light",
        glow: "front_door_glow",
        fg: null,
      },
      variants: {
        demon: { bg: "apartment_door_demon", light: null, glow: null, intensity: .75},
    },
    },

    apartment_tv: {
  id: "apartment_tv",
  title: "Television",
  bg: {
    bg: "tv_bg",
    light: "intro_light",
    fg: null,
    glow: "tv_glow",
  },

  variants: {
    night: { bg: "tv_bg_night", light: null, glow: null },
    demon: { bg: "tv_bg_demon", light: null, glow: null },
  },
},

    apartment_couch: {
      id: "apartment_couch",
      title: "Couch",
      bg: {
        bg: "couch_bg",
        light: "apartment_light",
        glow: "apartment_glow",
        fg: null,
      },
      variants: {
        night: { bg: "couch_bg_night", light: null, glow: null },
        demon: { bg: "couch_bg_demon", light: null, glow: null },
    },
    },

    apartment_coffee_table: {
      id: "apartment_coffee_table",
      title: "Coffee Table",
      bg: {
        bg: "coffee_table_bg",
        light: "apartment_light",
        glow: "apartment_glow",
        fg: null,
      },
      variants: {
        night: { bg: "coffee_table_bg_night", light: null, glow: null },
        demon: { bg: "coffee_table_bg_demon", light: null, glow: null },
    },
    },

    apartment_bedroom: {
  id: "apartment_bedroom",
  title: "Bedroom",

  bg: { 
    bg: "apartment_bedroom", 
    light: "intro_light", 
    glow: "intro_glow", 
    fg: "intro_fg" },

  variants: {
    night: { bg: "apartment_bedroom_night", light: "intro_light", glow: "intro_glow" },
    demon: { bg: "apartment_bedroom_demon", light: "demon_light", glow: "demon_glow" },
  },
},

  },
},

//--- location: office ---===
  office: {
    id: "office",
    title: "Your Office",
    tier: "city",
    x: 710,
    y: 425,
    locked: true,

    summary: "TODO",
    entryArea: "office_hub",
    entryNode: "loc_office_hub",

    bg: {
      light: null,
      glow: null,
      fg: null,
      bg: "office_hub",
    },

    areas: {

      office_hub: {
        id: "office_hub",
        title: "Office Building",
        summary: "TODO",
        bg: { bg: "office_hub", light: null, glow: null, fg: null },
        variants: {
        night: { bg: "office_hub_night", light: null, glow: null },
        demon: { bg: "office_hub_demon", light: null, glow: null },
        },
      },

      office_breakroom: { 
        id: "office_breakroom", 
        title: "Breakroom", 
        summary: "TODO", 
        bg: {
          bg: "office_breakroom",
      },
      variants: {
        night: { bg: "office_breakroom_night", light: null, glow: null },
        demon: { bg: "office_breakroom_demon", light: null, glow: null },
        },
    },

      office_lobby: { 
        id: "office_lobby", 
        title: "Lobby", 
        summary: "TODO", 
        bg: {
          bg: "office_lobby", 
      },
      variants: {
        night: { bg: "office_lobby_night", light: null, glow: null },
        demon: { bg: "office_lobby_demon", light: null, glow: null },
        },
    },

      office_floor: { 
        id: "office_floor", 
        title: "Office Floor", 
        summary: "TODO", 
        bg: { 
          bg: "office_floor",
          light: null,
          glow: null,
          fg: null,
        },
        variants: {
        night: { bg: "office_floor_night", light: null, glow: null },
        demon: { bg: "office_floor_demon", light: null, glow: null },
        },
      },

      office_workstation: { 
        id: "office_workstation", 
        title: "Your Computer", 
        summary: "TODO",
        bg: {
          bg: "office_workstation",  
        },
        variants: {
        night: { bg: "office_workstation_night", light: null, glow: null },
        demon: { bg: "office_workstation_demon", light: null, glow: null },
        },
      },
      office_hr: { 
        id: "office_hr", 
        title: "Human Resources",
        hours: { open: 9, close: 17 }, // 9 AM - 5 PM 
        summary: "TODO",  
        bg:{ bg: "office_hr" },
        locked: true,
        variants: {
        night: { bg: "office_hr_night", light: null, glow: null },
        demon: { bg: "office_hr_demon", light: null, glow: null },
        },
      },
    },
  },

//--- location: downtown ---===
  downtown: {
    id: "downtown",
    title: "Downtown",
    tier: "city",
    x: 920,
    y: 475,
    locked: true,

    summary: "TODO",
    entryArea: "downtown_hub",
    entryNode: "loc_downtown_hub",

    bg: {
      light: "skywalk_light",
      glow: "skywalk_glow",
      fg: "skywalk_fg",
    },

    areas: {
      downtown_hub: { 
        id: "downtown_hub", 
        title: "Downtown", 
        summary: "TODO", 
        bg: "skywalk_hub" 
      },
      downtown_coffee_shop: { 
        id: "downtown_coffee_shop", 
        title: "Coffee Shop", 
        summary: "TODO", 
        bg: "skywalk_bg" 
      },
      downtown_corner_store: { 
        id: "downtown_corner_store", 
        title: "Corner Store",
        summary: "TODO",
        bg: "skywalk_bg" 
      },
      downtown_bar: { 
        id: "downtown_bar", 
        title: "Bar", 
        summary: "TODO", 
        bg: "skywalk_bg"
      },
      downtown_overpass: { 
        id: "downtown_overpass", 
        title: "Overpass", 
        summary: "TODO", 
        bg: "skywalk_bg"
      },
    },
  },

//--- location: police_station ---===
  police_station: {
    id: "police_station",
    title: "Police Station",
    tier: "city",
    x: 620,
    y: 570,
    locked: true,

    summary: "TODO",
    entryArea: "police_station_hub",
    entryNode: "loc_police_station_hub",

    bg: {
      light: "skywalk_light",
      glow: "skywalk_glow",
      fg: "skywalk_fg",
    },

    areas: {
      police_station_hub: { 
        id: "police_station_hub", 
        title: "Police Station", 
        summary: "TODO", 
        bg: "skywalk_hub" 
      },
      police_station_lobby: { 
        id: "police_station_lobby", 
        title: "Lobby", 
        summary: "TODO", 
        bg: "skywalk_bg",
      },
      police_station_holding: { 
        id: "police_station_holding", 
        title: "Holding",
        summary: "TODO",
        bg: "skywalk_bg",
        locked: true,
      },
    },
  },

  //--- location: Governor's House ---===
  governors_house: {
    id: "governors_house",
    title: "Governor's House",
    tier: "city",
    x: 1020,
    y: 870,
    locked: true,

    summary: "TODO",
    entryArea: "governors_house_hub",
    entryNode: "loc_governors_house_hub",

    bg: {
      light: "skywalk_light",
      glow: "skywalk_glow",
      fg: "skywalk_fg",
    },

    areas: {
      governors_house_hub: { 
        id: "governors_house_hub", 
        title: "Governor's House", 
        summary: "TODO", 
        bg: "skywalk_hub" 
      },
      governors_house_backyard: { 
        id: "governors_house_backyard", 
        title: "Backyard", 
        summary: "TODO", 
        bg: "skywalk_bg" 
      },
      governors_house_side_entrance: { 
        id: "governors_house_side_entrance", 
        title: "Side Entrance",
        summary: "TODO",
        bg: "skywalk_bg" 
      },
      governors_house_basement: { 
        id: "governors_house_basement", 
        title: "Basement",
        summary: "TODO",
        bg: "skywalk_bg" 
      },
      governors_house_hidden_room: { 
        id: "governors_house_hidden_room", 
        title: "Hidden Room",
        summary: "TODO",
        bg: "skywalk_bg" 
      },
      governors_house_basement_tunnel: { 
        id: "governors_house_basement_tunnel", 
        title: "Basement Tunnel",
        summary: "TODO",
        bg: "skywalk_bg" 
      },
    },
  },

  // add the rest the same way...
};

// Keep this for MapScene compatibility
export const CITY_MARKERS = Object.values(LOCATIONS)
  .filter((loc) => loc.tier === "city")
  .map((loc) => ({ id: loc.id, x: loc.x / 1920, y: loc.y / 1080 }));

// db_scenes.js
import { LOCATIONS } from "./db_locations.js";
import { ROOM_NODES } from "./db_rooms.js";

function getTimeVariant(state) {
  const h = Math.floor((state.time?.minutes ?? 0) / 60) % 24;
  // tweak thresholds however you want:
  return (h >= 19 || h < 6) ? "night" : "day";
}

function getWorldVariant(state) {
  return state.world?.mode === "demon" ? "demon" : null;
}

// priority: demon > night/day
function pickVariant(state) {
  return getWorldVariant(state) || getTimeVariant(state);
}

function isWithinHours(hour, hours) {
  if (!hours) return true;

  const open = hours.open ?? 0;
  const close = hours.close ?? 24;

  // Normal same-day window (e.g. 9 -> 17)
  if (open < close) return hour >= open && hour < close;

  // Overnight window (e.g. 17 -> 2)
  return hour >= open || hour < close;
}

function getHour(state) {
  return Math.floor((state.time?.minutes ?? 0) / 60) % 24;
}

function isLocationAvailableNow(state, locId) {
  const loc = LOCATIONS[locId];
  return isWithinHours(getHour(state), loc?.hours);
}

function isAreaAvailableNow(state, locId, areaKey) {
  const area = LOCATIONS[locId]?.areas?.[areaKey];
  // area hours override location hours; if area has none, fallback to loc hours
  return isWithinHours(getHour(state), area?.hours ?? LOCATIONS[locId]?.hours);
}

function normalizeBg(bg) {
  if (!bg) return {};
  if (typeof bg === "string") return { bg };
  return bg;
}

function bgFromLoc(locId, areaKey) {
  return (state) => {
    const loc = LOCATIONS[locId];
    if (!loc) return {};

    const area = loc.areas?.[areaKey];
    const variant = pickVariant(state); // "day" | "night" | "demon"

    const locBase  = normalizeBg(loc.bg);
    const areaBase = normalizeBg(area?.bg);

    const locVar  = normalizeBg(loc.variants?.[variant]);
    const areaVar = normalizeBg(area?.variants?.[variant]);

    // merge: base -> loc variant -> area variant
    const merged = { ...locBase, ...areaBase, ...locVar, ...areaVar };

    // ✅ IMPORTANT: return ALL merged keys (screen, masks, offsets, etc)
    return {
      ...merged,
      bg:   merged.bg   ?? "BG_PLACEHOLDER",
      light:merged.light?? null,
      glow: merged.glow ?? null,
      fg:   merged.fg   ?? null,
    };
  };
}

function onEnterLoc(locId, areaId) {
  return (state) => {
    state.flags = state.flags || {};
    state.locationId = locId;
    state.areaId = areaId;
    state.localId = null;
  };
}

function isLocationUnlocked(state, locId) {
  if (!state.unlockedLocations) return !LOCATIONS[locId]?.locked;
  return !!state.unlockedLocations[locId];
}

function isAreaUnlocked(state, locId, areaId) {
  if (!state.unlockedAreas) return !LOCATIONS[locId]?.areas?.[areaId]?.locked;
  return !!state.unlockedAreas[`${locId}.${areaId}`];
}

function areaNodeId(locId, areaId) {
  return `area_${locId}_${areaId}`;
}

function hubNodeId(locId) {
  const loc = LOCATIONS[locId];
  return areaNodeId(locId, loc.entryArea);
}

function bgFromState() {
  return (state) => bgFromLoc(state.locationId, state.areaId)(state);
}

function buildWorldNodes() {
  const nodes = {};

  for (const loc of Object.values(LOCATIONS)) {
    for (const [areaKey, area] of Object.entries(loc.areas || {})) {
      const id = areaNodeId(loc.id, areaKey);

      nodes[id] = {
        loc: loc.id,
        area: areaKey,
        onEnter: onEnterLoc(loc.id, areaKey),
        title: area.title,
        meta: "TODO: area",
        tension: 0.25,
        backgroundLayers: bgFromLoc(loc.id, areaKey),

        text: () => [
  `${loc.title} — ${area.title}`,
],

choices: () => {
  const roomId = `room_${loc.id}_${areaKey}`;

  // If you authored a room menu, go there.
  if (ROOM_NODES[roomId]) {
    return [{ label: "Enter", go: roomId }];
  }

  // Otherwise fallback navigation only
  return [
    { label: "Back to hub", go: hubNodeId(loc.id) },
    { label: "Back to world menu", go: "world_start" },
  ];
},

      };
    }
  }

  return nodes;
}

export const NODES = {
  world_start: {
    title: "World",
    meta: "Scaffold",
    tension: 0.0,
    backgroundLayers: () => ({ bg: "intro_bg", light: "intro_light", glow: "intro_glow", fg: "intro_fg" }),
    text: () => ["World scaffold loaded.", "", "Pick a starting location."],
    choices: (state) => {
      const locals = Object.values(LOCATIONS).filter((l) => l.tier !== "city");
      const cities = Object.values(LOCATIONS).filter((l) => l.tier === "city");

      const mk = (loc) => {
        const unlocked = isLocationUnlocked(state, loc.id);
        return {
          label: loc.title + (unlocked ? "" : " (locked)"),
          go: unlocked ? hubNodeId(loc.id) : "locked_location",
        };
      };

      return [
        ...locals.map(mk),
        { label: "---", go: "world_start" },
        ...cities.map(mk),
      ];
    },
  },

  locked_area: {
    title: "Locked",
    meta: "",
    tension: 0.2,
    backgroundLayers: (state) => bgFromLoc(state.locationId, state.areaId)(state),
    text: () => ["It doesn’t open.", "", "Not yet."],
    choices: (state) => [{ label: "Back", go: areaNodeId(state.locationId, state.areaId) }],
  },

  locked_location: {
    title: "Locked",
    meta: "",
    tension: 0.2,
    backgroundLayers: () => ({ bg: "intro_bg", light: "intro_light", glow: "intro_glow", fg: "intro_fg" }),
    text: () => ["You can’t go there yet.", "", "The city pretends it isn’t listening."],
    choices: () => [{ label: "Back", go: "world_start" }],
  },

  closed_area: {
  title: "Closed",
  meta: "",
  tension: 0.1,
  backgroundLayers: (state) => bgFromLoc(state.locationId, state.areaId)(state),
  text: () => ["It’s closed.", "", "Not right now."],
  choices: (state) => [{ label: "Back", go: areaNodeId(state.locationId, state.areaId) }],
},

closed_location: {
  title: "Closed",
  meta: "",
  tension: 0.1,
  backgroundLayers: () => ({ bg: "intro_bg", light: "intro_light", glow: "intro_glow", fg: "intro_fg" }),
  text: () => ["The city isn’t open to you right now.", "", "Try later."],
  choices: () => [{ label: "Back", go: "world_start" }],
},

  ...buildWorldNodes(),

  ...ROOM_NODES, 
};

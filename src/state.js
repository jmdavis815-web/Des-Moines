// state.js
import { LOCATIONS } from "./db_locations.js";

export function setTime(state, hour, minute = 0) {
  state.time = state.time || { day: 1, minutes: 0 };
  state.time.minutes = hour * 60 + minute;
}

export function advanceMinutes(state, mins) {
  state.time = state.time || { day: 1, minutes: 0 };
  state.time.minutes += mins;
  while (state.time.minutes >= 24 * 60) {
    state.time.minutes -= 24 * 60;
    state.time.day += 1;
  }
}

function buildUnlockedLocationsFromDb() {
  return Object.fromEntries(
    Object.values(LOCATIONS).map((loc) => [loc.id, !loc.locked])
  );
}

function buildUnlockedAreasFromDb() {
  const entries = [];
  for (const loc of Object.values(LOCATIONS)) {
    for (const areaKey of Object.keys(loc.areas || {})) {
      const area = loc.areas[areaKey];
      entries.push([`${loc.id}.${areaKey}`, !area.locked]);
    }
  }
  return Object.fromEntries(entries);
}

export function getHour(state) {
  return Math.floor((state.time?.minutes ?? 0) / 60) % 24;
}

export function makeNewState() {
  return {
    meta: { version: 2, startedAt: Date.now() },

    level: 1,
    xp: 0,
    xpToNext: 50,

    hp: 30,
    maxHp: 30,

    sanity: 10,
    maxSanity: 10,

    cash: 25,

    beat: 0,
    newsBeat: 0,
    taken: {},

    revealed: {},   // ✅ per-item visibility markers (for hidden items)
    ui: {},         // optional if you want “toast” messages

    time: {
      day: 1,
      minutes: 5 * 60 + 12, // 5:12 AM start
    },
    world: { mode: "normal" }, // "normal" | "night" | "demon"

    stats: { might: 1, wits: 1, nerve: 1, charm: 1, agility: 1 },

    equipped: { weapon: null, armor: null, trinket: null },

    inventory: [
      { id: "coffee", qty: 1 },
      { id: "bandage", qty: 1 },
    ],

    // ✅ AUTO: derived from db_locations.js
    unlockedLocations: buildUnlockedLocationsFromDb(),
    unlockedAreas: buildUnlockedAreasFromDb(),

    flags: {
      saw_tv_intro: false,
      searched_coffee: false,
      mirror_unease: false,
      noticed_lock: false,
      apartment_safe: true,
      news_looping: false,

      first_death_seen: false,
      loop_awareness: false,

      mirror_stare_count: 0,
      mirror_wrong_hits: 0,
      mirrorVariant: "normal",
      mirror_demon_started: false,

      pc_visits: 0,
      pc_archive_found: false,

      evidence_count: 0,
      ev_work_pc_archive: false,

      unlocked_map: false,
      unlock_downtown: false,
      unlock_east_village: false,
      unlock_governors_house: false,
    },

    locationId: "apartment",
    areaId: LOCATIONS["apartment"]?.entryArea || "apartment_bedroom",
    localId: null,

    nodeId: "intro_dream",
  };
}

const SAVE_KEY = "dmad_save_slots_v1";
const MAX_SLOTS = 3;

export function serializeState(state) {
  return JSON.stringify(state);
}

export function deserializeState(json) {
  const state = JSON.parse(json);

  state.meta = state.meta || {};
  state.meta.version = state.meta.version ?? 1;

  if (!Number.isFinite(state.maxSanity)) state.maxSanity = 10;
  if (!Number.isFinite(state.sanity)) state.sanity = state.maxSanity;

  if (!Number.isFinite(state.cash)) state.cash = 0;

  if (!Number.isFinite(state.maxHp)) state.maxHp = 30;
  if (!Number.isFinite(state.hp)) state.hp = state.maxHp;

  state.stats = state.stats || {};
  const baseStats = { might: 1, wits: 1, nerve: 1, charm: 1, agility: 1 };
  for (const k of Object.keys(baseStats)) {
    if (!Number.isFinite(state.stats[k])) state.stats[k] = baseStats[k];
  }

  state.equipped = state.equipped || { weapon: null, armor: null, trinket: null };
  state.equipped.weapon = state.equipped.weapon ?? null;
  state.equipped.armor = state.equipped.armor ?? null;
  state.equipped.trinket = state.equipped.trinket ?? null;

  state.inventory = Array.isArray(state.inventory) ? state.inventory : [];
  if (state.inventory.length && typeof state.inventory[0] !== "object") {
    const counts = new Map();
    for (const id of state.inventory) counts.set(id, (counts.get(id) ?? 0) + 1);
    state.inventory = Array.from(counts.entries()).map(([id, qty]) => ({ id, qty }));
  } else {
    state.inventory = state.inventory
      .filter((x) => x && x.id)
      .map((x) => ({ id: x.id, qty: Number.isFinite(x.qty) ? x.qty : 1 }))
      .filter((x) => x.qty > 0);
  }

  state.flags = state.flags || {};
  state.flags.evidence_count = state.flags.evidence_count ?? 0;
  state.flags.pc_visits = state.flags.pc_visits ?? 0;

  state.locationId = state.locationId || "apartment";
  state.nodeId = state.nodeId || "world_start";
  state.areaId = state.areaId || LOCATIONS[state.locationId]?.entryArea || "apartment_hub";

  // ✅ MIGRATION/REPAIR:
  // If these maps are missing or empty, rebuild from db.
  if (!state.unlockedLocations || Object.keys(state.unlockedLocations).length === 0) {
    state.unlockedLocations = buildUnlockedLocationsFromDb();
  } else {
    // Fill any newly-added locations
    for (const [k, v] of Object.entries(buildUnlockedLocationsFromDb())) {
      if (state.unlockedLocations[k] === undefined) state.unlockedLocations[k] = v;
    }
  }

  if (!state.unlockedAreas || Object.keys(state.unlockedAreas).length === 0) {
    state.unlockedAreas = buildUnlockedAreasFromDb();
  } else {
    // Fill any newly-added areas
    for (const [k, v] of Object.entries(buildUnlockedAreasFromDb())) {
      if (state.unlockedAreas[k] === undefined) state.unlockedAreas[k] = v;
    }
  }

  return state;
}

function fmtClock(mins = 0) {
  const h = Math.floor(mins / 60) % 24;
  const m = String(mins % 60).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hr12 = ((h + 11) % 12) + 1;
  return `${hr12}:${m} ${ampm}`;
}

function buildSaveSummary(state) {
  const loc = LOCATIONS[state.locationId];
  const area = loc?.areas?.[state.areaId];

  return {
    version: state?.meta?.version ?? 1,
    day: state?.time?.day ?? 1,
    time: fmtClock(state?.time?.minutes ?? 0),

    locationTitle: loc?.title ?? state.locationId ?? "Unknown",
    areaTitle: area?.title ?? state.areaId ?? "Unknown",

    hp: state?.hp ?? 0,
    maxHp: state?.maxHp ?? 0,
    sanity: state?.sanity ?? 0,
    maxSanity: state?.maxSanity ?? 0,
    cash: state?.cash ?? 0,
    nodeId: state?.nodeId ?? "",
  };
}

export function saveToSlot(slotIndex, state) {
  const slots = loadAllSlots();
  slots[slotIndex] = {
    savedAt: Date.now(),
    summary: buildSaveSummary(state),
    data: serializeState(state),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
}

export function getSlotInfo(slotIndex) {
  const slots = loadAllSlots();
  const slot = slots[slotIndex];
  if (!slot?.data) return null;

  // if older saves don’t have summary, derive it
  const summary =
    slot.summary || buildSaveSummary(deserializeState(slot.data));

  return { savedAt: slot.savedAt ?? 0, summary };
}

export function loadFromSlot(slotIndex) {
  const slots = loadAllSlots();
  const slot = slots[slotIndex];
  if (!slot?.data) return null;
  return deserializeState(slot.data);
}

export function loadAllSlots() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.from({ length: MAX_SLOTS }, (_, i) => parsed[i] ?? null);
  } catch {
    return Array.from({ length: MAX_SLOTS }, () => null);
  }
}

export function hasAnySave() {
  return loadAllSlots().some((s) => s?.data);
}

export function clearAllSaves() {
  localStorage.removeItem(SAVE_KEY);
}

// ---- world access helpers ----
export function unlockArea(state, locId, areaKey) {
  state.unlockedAreas[`${locId}.${areaKey}`] = true;
}

export function unlockLocation(state, locId) {
  state.unlockedLocations[locId] = true;
}


export function makeNewState() {
  return {
    meta: { version: 1, startedAt: Date.now() },

    // progression
    level: 1,
    xp: 0,
    xpToNext: 50,

    // survival
    hp: 30,
    maxHp: 30,

    sanity: 10,     // max 10
    maxSanity: 10,


    // resources
    cash: 25,

    beat: 0,         // story progress 0..n
    newsBeat: 0,     // TV/news progress 0..n (can mirror beat or diverge)

    // stats (affect outcomes)
    stats: {
      might: 1,
      wits: 1,
      nerve: 1,
      charm: 1,
      agility: 1,
    },

    // gear & inventory
      equipped: {
      weapon: null,
      armor: null,
      trinket: null,
    },
    inventory: [
      { id: "coffee", qty: 1 },
      { id: "bandage", qty: 1 },
    ],

    // world flags (START CLEAN)
    flags: {
      saw_tv_intro: false,
      searched_coffee: false,
      mirror_unease: false,
      noticed_lock: false,
      apartment_safe: true,
      news_looping: false,

      // optional progression gates
      unlocked_map: false,
      unlock_downtown: true,       // downtown available by default
      unlock_east_village: false,  // stays locked until you set it later
    },

    // location / world (START IN APARTMENT)
    locationId: "apartment",
    localId: null,

    // current narrative node (START AT YOUR NEW INTRO)
    nodeId: "intro_game",
  };
}

const SAVE_KEY = "dmad_save_slots_v1";
const MAX_SLOTS = 3;

export function serializeState(state) {
  // strip Phaser stuff; keep plain data only
  return JSON.stringify(state);
}

export function deserializeState(json) {
  return JSON.parse(json);
}

export function saveToSlot(slotIndex, state) {
  const slots = loadAllSlots();
  slots[slotIndex] = {
    savedAt: Date.now(),
    data: serializeState(state),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
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
    // normalize to MAX_SLOTS length
    const slots = Array.from({ length: MAX_SLOTS }, (_, i) => parsed[i] ?? null);
    return slots;
  } catch {
    return Array.from({ length: MAX_SLOTS }, () => null);
  }
}

export function hasAnySave() {
  return loadAllSlots().some(s => s?.data);
}

export function clearAllSaves() {
  localStorage.removeItem(SAVE_KEY);
}

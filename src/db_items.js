export const ITEM_DB = {
  coffee: {
    id: "coffee",
    name: "Gas Station Coffee",
    type: "consumable",
    price: 4,
    desc: "Tastes like burnt optimism.",
    use: (state) => {
      // sanity restore (safe if sanity isn't wired yet)
      const maxSanity = Number.isFinite(state.maxSanity) ? state.maxSanity : 10;
      const curSanity = Number.isFinite(state.sanity) ? state.sanity : maxSanity;

      state.maxSanity = maxSanity;
      state.sanity = Math.min(maxSanity, curSanity + 3);

      return {
        log: "You drink it anyway. The caffeine drags your mind back into place… barely.",
        consumed: true,
      };
    },
  },

  // -----------------------------
  // KEYS / QUEST
  // -----------------------------
  city_keycard: {
    id: "city_keycard",
    name: "City Keycard",
    type: "key",
    price: 0,
    desc: "Stamped with a city seal. Not your company’s.",
  },

  usb_loop: {
    id: "usb_loop",
    name: "USB Drive (Loop/Protocol)",
    type: "quest",
    price: 0,
    desc: "Handwritten label: “LOOP / MAYOR / PROTOCOL.”",
  },

  // New quest-style items (no use; just flags / story hooks)
  work_order_slip: {
    id: "work_order_slip",
    name: "Facilities Work Order Slip",
    type: "quest",
    price: 0,
    desc: "“Containment Retrofit — Sublevel Infrastructure.” A stamped spiral made of linked circles.",
  },

  ripped_flyer: {
    id: "ripped_flyer",
    name: "Ripped Civic Flyer",
    type: "quest",
    price: 0,
    desc: "“Civic Preparedness Is Everyone’s Responsibility.” No date. No phone. Just an unfamiliar seal.",
  },

  // -----------------------------
  // CONSUMABLES
  // -----------------------------
  bandage: {
    id: "bandage",
    name: "Sterile Bandage",
    type: "consumable",
    price: 12,
    desc: "Clean gauze and tape. Smells like the inside of an old clinic.",
    use: (state) => {
      state.hp = Math.min(state.maxHp, state.hp + 10);
      return { log: "You patch yourself up. The sting fades… for now.", consumed: true };
    },
  },

  // optional: small sanity item (nice to have later)
  mints: {
    id: "mints",
    name: "Peppermint Mints",
    type: "consumable",
    price: 6,
    desc: "Sharp enough to cut through a bad thought.",
    use: (state) => {
      const maxSanity = Number.isFinite(state.maxSanity) ? state.maxSanity : 10;
      const curSanity = Number.isFinite(state.sanity) ? state.sanity : maxSanity;

      state.maxSanity = maxSanity;
      state.sanity = Math.min(maxSanity, curSanity + 1);

      return { log: "The mint burns clean. Your head clears a notch.", consumed: true };
    },
  },

  // -----------------------------
  // GEAR
  // -----------------------------
  pocketknife: {
    id: "pocketknife",
    name: "Pocketknife",
    type: "gear",
    slot: "weapon",
    price: 30,
    desc: "Not a sword. But it’s honest.",
    modifiers: { might: +1 },
  },

  hoodie: {
    id: "hoodie",
    name: "Work Hoodie",
    type: "gear",
    slot: "armor",
    price: 20,
    desc: "Soft armor. Emotional, mostly.",
    modifiers: { nerve: +1 },
  },

  lucky_coin: {
    id: "lucky_coin",
    name: "Lucky Coin",
    type: "gear",
    slot: "trinket",
    price: 0,
    desc: "It feels warm in your pocket… like it remembers you.",
    modifiers: { wits: +1 },
  },

  // Another trinket option (loot variety)
  cracked_lens: {
    id: "cracked_lens",
    name: "Cracked Glass Lens",
    type: "gear",
    slot: "trinket",
    price: 0,
    desc: "A broken lens that still makes things feel… focused.",
    modifiers: { wits: +1 },
  },

  // -----------------------------
  // SELL-ONLY ITEMS (JUNK / VALUABLES)
  // These are meant to be found as loot and sold.
  // No 'use' function on purpose.
  // -----------------------------
  tarnished_ring: {
    id: "tarnished_ring",
    name: "Tarnished Ring",
    type: "junk",
    price: 18,
    desc: "Cheap metal. The inside is engraved with initials you don’t recognize.",
    sellOnly: true,
  },

  lost_watch: {
  id: "lost_watch",
  name: "Lost Watch",
  desc: "Still ticking. Cold as if worn recently.",
  type: "junk",   // or whatever your isSellable() checks for
  price: 45,      // shop sell value uses price * multiplier
},

  old_watch: {
    id: "old_watch",
    name: "Old Wristwatch",
    type: "junk",
    price: 35,
    desc: "Stopped at 3:12. The glass is scratched like someone tried to erase the time.",
    sellOnly: true,
  },

  subway_token: {
    id: "subway_token",
    name: "Out-of-Date Transit Token",
    type: "junk",
    price: 12,
    desc: "A coin from a system that doesn’t exist anymore. It’s still warm.",
    sellOnly: true,
  },

  brass_seal_fob: {
    id: "brass_seal_fob",
    name: "Brass Seal Fob",
    type: "junk",
    price: 60,
    desc: "A heavy fob stamped with a city seal. Feels official enough to be dangerous.",
    sellOnly: true,
  },

  silver_locket: {
    id: "silver_locket",
    name: "Silver Locket",
    type: "junk",
    price: 80,
    desc: "Empty. The hinge squeaks like it’s trying to whisper.",
    sellOnly: true,
  },

  stamped_scrap: {
    id: "stamped_scrap",
    name: "Stamped Metal Scrap",
    type: "junk",
    price: 22,
    desc: "A cut-off tag of steel with a spiral of linked circles pressed into it.",
    sellOnly: true,
  },
};

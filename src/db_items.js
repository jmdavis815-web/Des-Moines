export const ITEM_DB = {
  coffee: {
    id: "coffee",
    name: "Gas Station Coffee",
    type: "consumable",
    price: 4,
    desc: "Tastes like burnt optimism.",
    use: (state) => {
      // tiny heal + nerve buff vibe (we’ll formalize buffs later)
      state.hp = Math.min(state.maxHp, state.hp + 3);
      return { log: "You drink it anyway. The world steadies… barely.", consumed: true };
    },
  },

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
};

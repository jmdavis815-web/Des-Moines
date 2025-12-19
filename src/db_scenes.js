// db_scenes.js

function tvNewsKey(state) {
  const n = state.newsBeat ?? 0;
  if (n >= 3) return "tv_news_3";
  if (n >= 2) return "tv_news_2";
  if (n >= 1) return "tv_news_1";
  return "tv_news_0";
}

function wakeNode(state) {
  return state?.flags?.first_death_seen ? "intro_morning" : "intro_game";
}

const LOCATION_BACKGROUNDS = {
  intro: {
    bg: "intro_bg",
    light: "intro_light",
    glow: "intro_glow",
    fg: "intro_fg",
  },

  apartment: {
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  },

  apartment_door: {
    bg: "apartment_door_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  },

  bathroom: {
    bg: "apartment_mirror",
    light: "apartment_light",
    glow: "apartment_glow",
  },

  office: {
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  },

  coffee: {
    bg: "coffee_bg",
    light: "coffee_light",
    glow: "coffee_glow",
    fg: "coffee_fg",
  },

  skywalk: {
    bg: "skywalk_bg",
    light: "skywalk_light",
    glow: "skywalk_glow",
    fg: "skywalk_fg",
  },
};

function withBackground(locationKey, override = {}) {
  return (state) => ({
    ...(LOCATION_BACKGROUNDS[locationKey] || {}),
    ...override,
  });
}

function evidenceCount(state) {
  const f = state.flags || {};
  return [
    f.ev_police_tape,
    f.ev_budget_doc,
    f.ev_keycard,
    f.ev_staffer_audio,
    f.ev_capitol_sigils,
  ].filter(Boolean).length;
}

function requireEvidence(min, passNode, failNode) {
  return (state) => (evidenceCount(state) >= min ? passNode : failNode);
}

// --- TV NEWS SYSTEM ---
export const TV_STORIES = [
  {
    id: "tv_01_lab_budget",
    headline: "State Budget Audit 'Misfiled' — New Line Item: Behavioral Research",
    body: [
      "A local anchor smiles too long.",
      "",
      "\"A state budget audit reveals a new line item labeled 'Behavioral Resilience Trials.'\"",
      "\"Officials say it's 'routine public health research'—but the funding moved through three shell departments.\"",
      "",
      "A ticker flashes: 'Governor denies wrongdoing.'",
      "",
      "You feel a cold certainty: this is not routine.",
    ],
    unlocks: ["statehouse", "university_lab"],
    evidence: 1,
  },
  {
    id: "tv_02_missing_persons",
    headline: "Missing Persons Spike Near Downtown Riverwalk",
    body: [
      "\"Police confirm a pattern: late-night disappearances near the Riverwalk.\"",
      "\"Officials suggest coincidence. Residents disagree.\"",
      "",
      "The camera lingers on a sewer grate a moment too long.",
      "A worker in a hazmat vest blocks the shot, then waves it off.",
      "",
      "You catch the address in the lower third.",
    ],
    unlocks: ["riverwalk"],
    evidence: 1,
  },
  {
    id: "tv_03_private_clinic",
    headline: "Private Clinic Wins 'Emergency Contract' Without Bid",
    body: [
      "\"A private clinic has been granted an emergency contract—no bidding process required.\"",
      "\"The clinic specializes in 'sleep studies' and 'stress adaptation therapies.'\"",
      "",
      "They show the clinic sign.",
      "For half a second you see a symbol scratched into the metal—",
      "almost like a trident made of circles.",
    ],
    unlocks: ["private_clinic"],
    evidence: 1,
  },
  {
    id: "tv_04_researcher_whistle",
    headline: "Whistleblower: 'It's Not Science. It's Control.'",
    body: [
      "A silhouette interview. The voice is filtered.",
      "",
      "\"They're calling it research. It's not. It's conditioning.\"",
      "\"They said it was 'pseudo-science' to keep journalists bored.\"",
      "",
      "The anchor cuts in fast:",
      "\"We can't verify these claims.\"",
      "",
      "But the station logo glitches—just once—like something pressed from behind the screen.",
    ],
    unlocks: ["news_station", "storage_unit"],
    evidence: 2,
  },
];

export function tvInit(state) {
  state.flags = state.flags || {};
  state.flags.tv_seen = state.flags.tv_seen || {};
  state.flags.tv_story_index = state.flags.tv_story_index ?? 0;
  state.flags.tv_current_story_id = state.flags.tv_current_story_id ?? null;
  state.flags.evidence_count = state.flags.evidence_count ?? 0;
}

export function tvNextStory(state) {
  tvInit(state);
  const idx = state.flags.tv_story_index % TV_STORIES.length;
  return TV_STORIES[idx];
}

export function tvGetStoryById(id) {
  return TV_STORIES.find(s => s.id === id) || null;
}

export const NODES = {
  // -------------------------
  // INTRO
  // -------------------------
  intro_game: {
  title: "Des Moines",
  meta: "A normal day.",
  tension: 0.1,
  backgroundLayers: (state) => ({
    ...LOCATION_BACKGROUNDS.intro,
  }),
  text: () => [
    "Your alarm goes off at the wrong time.",
    "",
    "You shut it off anyway.",
    "",
    "It’s a weekday.",
    "You know the routine well enough to do it half-asleep.",
    "",
    "Shower.",
    "Coffee.",
    "Keys.",
    "",
    "Nothing feels wrong.",
    "",
    "That almost makes you late.",
  ],
  choices: [{ label: "Get on with it", go: "morning_commute" }],
},

morning_commute: {
  title: "Commute",
  meta: "Same route. Same faces.",
  tension: 0.15,
  backgroundLayers: () => ({
    bg: "BG_COMMUTE_PLACEHOLDER",
  }),
  text: () => [
    "Traffic crawls.",
    "",
    "You sit through three lights that never quite sync.",
    "",
    "Someone in the car next to you keeps glancing over.",
    "",
    "Probably nothing.",
  ],
  choices: [{ label: "Go to work", go: "office_arrival" }],
},

first_death_after_work: {
  title: "After Work",
  meta: "You made it through the day.",
  tension: 0.4,
  backgroundLayers: () => ({
    bg: "BG_CITY_EVENING_PLACEHOLDER",
  }),
  onEnter: (state) => {
    state.flags.first_death_seen = true;
  },
  text: () => [
    "You step outside into evening traffic.",
    "",
    "The sky is the color it’s supposed to be.",
    "",
    "You think about dinner.",
    "",
    "You never hear the car.",
  ],
  choices: [{ label: "—", go: "death_car" }],
},

  // -------------------------
  // APARTMENT HUB
  // -------------------------
  intro_morning: {
  title: "Your Apartment",
  meta: "Morning. Too quiet.",
  tension: 0.15,
  backgroundLayers: (state) => ({
    ...LOCATION_BACKGROUNDS.apartment,
  }),

  text: (state) => {
    state.flags = state.flags || {};

    // ✅ FIRST "REALIZATION" MOMENT (only once)
    if (state.flags.first_death_seen && !state.flags.loop_awareness) {
      state.flags.loop_awareness = true;
      return [
        "You wake up gasping.",
        "",
        "Your heart is racing.",
        "",
        "You remember headlights.",
        "The sound of impact.",
        "",
        "You are very sure you died.",
        "",
        "The apartment looks exactly the same.",
      ];
    }

    // existing logic continues
    const b = state.beat ?? 0;

    if (state.flags.mirror_was_wrong) {
      return [
        "The apartment smells like old coffee and dust warmed by electronics.",
        "",
        "Outside, traffic moves like it always does — distant, indifferent.",
        "Inside, everything feels paused.",
        "",
        "Your TV hums softly.",
      ];
    }

    if (b === 0) {
      return [
        "Traffic crawls in your head. Coffee tastes burned.",
        "",
        "The room looks normal — which almost makes it worse.",
      ];
    }

    if (b === 1) {
      return [
        "You keep checking reflective surfaces without meaning to.",
        "",
        "The window glass gives you a delayed version of you.",
      ];
    }

    if (b >= 2) {
      return [
        "You start packing without fully deciding to leave.",
        "",
        "Every sound in the apartment feels rehearsed.",
      ];
    }

    return ["The apartment waits."];
  },

  choices: (state) => [
  {
    label: state?.flags?.loop_awareness ? "Figure out why you woke up" : "Go about your morning",
    go: "connect_the_dots",
  },
  { label: "Check the TV", action: "advance", data: { beat: 1, newsBeat: 1 }, go: "apartment_tv" },
  { label: "Search the coffee table", go: "apartment_coffee" },
  { label: "Look in the bathroom mirror", action: "advance", data: { beat: 1, newsBeat: 1 }, go: "apartment_mirror" },
  { label: "Check the front door", go: "apartment_door" },
  { label: "Head downtown", action: "travelDowntown" },
],

},

  apartment_tv: {
  title: "Television",
  meta: (state) => {
    tvInit(state);

    const seenCount = Object.keys(state.flags.tv_seen || {}).length;
    const ev = state.flags.evidence_count ?? 0;

    return `Local news.  Stories watched: ${seenCount}/${TV_STORIES.length}  |  Evidence: ${ev}`;
  },

  tension: 0.55,

  backgroundLayers: (state) => ({
  bg: "tv_bg",
  light: "tv_light",
  glow: "tv_glow",

  // ✅ draw your “slanted TV screen overlay” as SCREEN layer, not FG
  screen: tvNewsKey(state),
  screenX: 0.23,
  screenY: 0.62,
  screenScale: 0.34,
  screenRot: -0.035,
  screenBlend: "SCREEN",
  screenAlpha: 0.95,

  // ✅ this should be the full-scene foreground (room edges etc)
  fg: "tv_fg",

  // ✅ IMPORTANT: don’t drift the TV scene background
  disableDrift: true,
}),

  text: (state) => {
    tvInit(state);

    // Show the current story if one was selected
    const currentId = state.flags.tv_current_story_id;
    const current = currentId ? tvGetStoryById(currentId) : null;

    if (current) {
      return [
        current.headline,
        "",
        ...current.body,
      ];
    }

    // Otherwise show a “preview” of the next available story
    const next = tvNextStory(state);

    return [
      "The screen hums with static under the broadcast.",
      "",
      "Tonight's headline:",
      "",
      next.headline,
      "",
      "You could watch the full segment.",
    ];
  },

  choices: (state) => {
    tvInit(state);

    const next = tvNextStory(state);

    return [
      {
        label: `Watch: ${next.headline}`,
        action: "applyTVStory",
        data: {
          storyId: next.id,
          unlocks: next.unlocks,
          evidence: next.evidence,
        },
      },

      // Optional: re-watch current story
      ...(state.flags.tv_current_story_id ? [{
        label: "Rewatch current segment",
        action: "setFlag",
        data: { flag: "tv_current_story_id", value: state.flags.tv_current_story_id },
      }] : []),

      { label: "Turn it off", go: "intro_morning" },
    ];
  },
},

  apartment_coffee: {
  title: "Coffee Table",
  meta: "Cluttered.",
  backgroundLayers: (state) => ({
    bg: "apartment_coffee_bg",

    // reuse apartment mood layers
    light: "apartment_light",
    glow: "apartment_glow",

    // no foreground — this is a close-up POV
  }),
  text: (state) => {
    if (state.flags.searched_coffee) {
      return [
        "Receipts. Old mail. Nothing new.",
        "",
        "You already checked here.",
      ];
    }

    state.flags.searched_coffee = true;
    return [
      "An unpaid bill.",
      "A folded bus schedule.",
      "A coin you don’t remember picking up.",
      "",
      "It’s warm.",
    ];
  },
  loot: { chance: 1, table: ["lucky_coin"] },
  choices: [{ label: "Back", go: "intro_morning" }],
},

  apartment_mirror: {
  title: "The Bathroom",
  meta: "The light hums softly.",
  tension: 0.65,

 backgroundLayers: (state) => {
  const v = state.flags.mirrorVariant ?? "normal";

  return {
    bg:
      v === "demon"
        ? "apartment_mirror_demon"
        : v === "wrong"
        ? "apartment_mirror_wrong"
        : "apartment_mirror",
  };
},

  text: (state) => {
    const count = state.flags.mirror_stare_count ?? 0;

    if (state.flags.mirrorVariant === "demon") {
  return [
    "You stare.",
    "",
    "The glass darkens like something poured itself behind it.",
    "",
    "Your reflection does not move with you anymore.",
    "",
    "It leans closer.",
  ];
}

    if (state.flags.mirrorVariant === "wrong") {
      if (count < 4) {
        return [
          "You stare at your reflection.",
          "",
          "It smiles.",
          "",
          "You do not.",
        ];
      }

      return [
        "You stare at your reflection.",
        "",
        "Its smile widens in slow increments.",
        "",
        "Like it's learning how to wear your face.",
      ];
    }

    if (count === 0) {
      return [
        "You stare at your reflection.",
        "",
        "For half a second, it doesn’t move when you do.",
        "",
        "Then it’s normal again.",
      ];
    }

    if (count === 1) {
      return [
        "You stare again.",
        "",
        "Your reflection keeps pace this time.",
        "",
        "But the timing feels… corrected.",
      ];
    }

    return [
      "You keep staring.",
      "",
      "The longer you hold still, the more the mirror feels like a door.",
    ];
  },

  choices: (state) => {
  // If the demon is already showing, staring again kills you.
  if ((state.flags?.mirrorVariant ?? "normal") === "demon") {
    return [
      { label: "Keep staring", go: "death_mirror_demon" },
      { label: "Run", action: "resetMirrorVisit", go: "intro_morning" },
    ];
  }

  return [
    { label: "Keep staring", action: "stareMirror", data: { amount: 1 }, go: "apartment_mirror" },
    { label: "Turn away", action: "resetMirrorVisit", go: "intro_morning" },
  ];
},

  onExit: (state) => {
  delete state.flags.mirrorVariant;
  delete state.flags.mirror_demon_started;
  delete state.flags.mirror_wrong_counted_this_visit;
  // KEEP mirror_stare_count
}


},

  apartment_door: {
  title: "Front Door",
  meta: "Locked.",
  backgroundLayers: (state) => ({
    ...LOCATION_BACKGROUNDS.apartment_door,
  }),
  text: (state) => {
    if (!state.flags.noticed_lock) {
      state.flags.noticed_lock = true;
      return [
        "You check the lock.",
        "",
        "It’s secure.",
        "You check it again anyway.",
      ];
    }
    return [
      "Still locked.",
      "Still solid.",
    ];
  },
  choices: [
    { label: "Back", go: "intro_morning" },
  ],
},

  // -------------------------
  // OFFICE / DOWNTOWN
  // -------------------------
  office_arrival: {
  title: "Office Block",
  meta: "Fluorescent lights. Keyboard clacks. Everyone pretending they’re fine.",
  tension: 0.55,
  backgroundLayers: withBackground("office"),
  text: () => [
    "The lights hum overhead, a constant tone like a dentist drill.",
    "Everyone looks busy in that careful way people look busy when they don’t want to be noticed.",
    "",
    "Your boss steps out with that practiced irritation that doesn’t need a reason.",
    "\"You're late,\" they snap— even if you aren’t.",
  ],
  choices: [
    { label: "Apologize with charm", check: { stat: "charm", dc: 3 }, onPass: "boss_laugh", onFail: "boss_marks_you" },
    { label: "Bite your tongue", go: "boss_marks_you" },
    { label: "Go grab coffee", go: "coffee_stop" },
  ],
  loot: { chance: 0.2, table: ["lucky_coin"] },
},

  coffee_stop: {
  title: "Coffee Shop",
  meta: "The barista smiles like they’ve practiced it in a mirror.",
  tension: 0.25,
  backgroundLayers: withBackground("coffee"),
  text: () => [
    "A chalkboard menu lists drinks you’re pretty sure aren’t legal.",
    "A tip jar rattles when nobody touches it.",
    "",
    "Still… coffee is coffee.",
  ],
  choices: [
    { label: "Buy coffee ($4)", action: "buyItem", data: { id: "coffee", price: 4 } },
    { label: "Return to office", go: "office_arrival" },
  ],
},

  boss_laugh: {
  title: "HR-Approved Humor",
  meta: "You land a joke. The room exhales.",
  tension: 0.45,
  backgroundLayers: withBackground("office"),
  text: () => [
    "Your boss blinks, then laughs—once.",
    "\"Fine. Just… don’t make it a thing.\"",
    "",
    "For a moment, everything feels normal.",
    "That moment does not last.",
  ],
  choices: [{ label: "Continue the day", action: "gainXp", data: { amount: 15 }, go: "skywalk_echo" }],
},

  boss_marks_you: {
  title: "Marked",
  meta: "They write your name down like it’s a spell.",
  tension: 0.60,
  backgroundLayers: withBackground("office"),
  text: () => [
    "They list your supposed mistakes like they’re reading from a script.",
    "Halfway through, you realize:",
    "",
    "the script includes details you never told anyone.",
  ],
  choices: [
    { label: "Shake it off", action: "gainXp", data: { amount: 10 }, go: "first_death_after_work" },
    { label: "Check the city map", goScene: "MapScene", data: { view: "city" } },
  ],
},

  // -------------------------
  // SKYWALK
  // -------------------------
  skywalk_echo: {
  title: "Skywalk",
  meta: "Your footsteps echo too cleanly.",
  tension: 0.80,
  backgroundLayers: withBackground("skywalk"),
  text: () => [
    "Halfway across, you realize the echo behind you isn’t yours.",
    "A second set of footsteps matches you perfectly…",
    "until it doesn’t.",
  ],
  choices: [
    { label: "Investigate (wits)", check: { stat: "wits", dc: 4 }, onPass: "echo_reveals", onFail: "echo_bites" },
    { label: "Walk faster", action: "takeDamage", data: { amount: 2, reason: "You twist your ankle rushing." }, go: "office_arrival" },
  ],
  loot: { chance: 0.35, table: ["bandage"] },
},

  echo_reveals: {
  title: "A Second Shadow",
  meta: "You look back. Something looks back.",
  tension: 0.90,
  backgroundLayers: withBackground("skywalk"),
  text: () => [
    "For a split second, you see your reflection in the glass.",
    "It blinks a half-beat late.",
    "",
    "Then it smiles when you don’t.",
  ],
  choices: [{ label: "Run (agility)", check: { stat: "agility", dc: 4 }, onPass: "escape_echo", onFail: "echo_bites" }],
},

  escape_echo: {
  title: "Escape",
  meta: "You make it out… but not away.",
  tension: 0.70,
  backgroundLayers: withBackground("skywalk"),
  text: () => [
    "You reach the end of the skywalk and the sound stops instantly.",
    "Like someone hit mute on reality.",
    "",
    "Your phone tries to open maps, fails,",
    "then shows a loading spinner shaped like a spiral.",
  ],
  choices: [{ label: "Open map", goScene: "MapScene", data: { view: "city" } }],
  loot: { chance: 0.4, table: ["pocketknife"] },
},

  echo_bites: {
  title: "Wrong Footsteps",
  meta: "Something touches you from behind.",
  tension: 1.00,
  backgroundLayers: withBackground("skywalk"),
  text: () => [
    "A cold pressure clamps your shoulder.",
    "Not a hand. Not exactly.",
    "",
    "You stumble forward and the contact breaks.",
    "Your skin burns where it touched.",
  ],
  choices: [
    { label: "Keep moving", action: "takeDamage", data: { amount: 6, reason: "Cold burn." }, go: "office_arrival" },
    { label: "Use a bandage", action: "useItem", data: { id: "bandage" }, go: "office_arrival" },
  ],
},


death_mirror_demon: {
  title: "You Should Have Looked Away",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "apartment_demon_death",
    fg: "intro_fg",
  }),
  text: () => [
    "The glass bows outward.",
    "",
    "Not breaking.",
    "Not cracking.",
    "",
    "Something presses from the other side —",
    "as if it has been waiting for permission.",
    "",
    "Hands push through the surface like it’s water.",
    "",
    "You realize too late:",
    "the mirror was never a reflection.",
    "",
    "It was a door.",
  ],
  choices: [
    { label: "END", go: "intro_game" } // or replace with a proper Game Over later
  ],
},

// ---------------------------------
// CITY EXPLORATION HUB (MAP / DOWNTOWN)
// ---------------------------------

downtown_arrival: {
  title: "Downtown",
  meta: "The city looks normal from a distance.",
  tension: 0.55,
  
  backgroundLayers: () => ({
    bg: "BG_DOWNTOWN_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => [
    "You step into downtown Des Moines and feel it immediately:",
    "",
    "the air is tight. Like a held breath.",
    "",
    "Somewhere nearby, sirens keep starting and stopping.",
    "Not approaching. Not leaving.",
    "Just… looping.",
    "",
    `Evidence collected: ${evidenceCount(state)}/5`,
  ],
  choices: [
    { label: "Check public records", go: "public_records" },
{ label: "Find a statehouse staffer (bar)", go: "staffer_bar" },
    { label: "Follow the police tape", go: "police_tape_corner" },
    { label: "Check the Capitol grounds", go: "capitol_plaza" },
    { label: "Go to the skywalks", go: "skywalk_echo" },
    { label: "Cut through an alley", go: "alley_muggers" },
    { label: "Head back home", go: "intro_morning" },
  ],
},

police_tape_corner: {
  title: "Police Tape",
  meta: "A street corner that keeps reappearing on the news.",
  tension: 0.70,
  backgroundLayers: () => ({
    bg: "BG_POLICE_TAPE_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => {
    const got = !!state.flags.ev_police_tape;
    return [
      "Yellow tape flaps in a wind you can’t feel.",
      "",
      "Officers stand around like they’re waiting for instructions that never arrive.",
      "",
      got
        ? "You already photographed the symbol scratched into the curb."
        : "Near the curb, beneath the tape, you spot a spiral carved into the concrete—fresh, deliberate.",
    ];
  },
  choices: [
    {
      label: "Get a closer look",
      action: "setFlag",
      data: { flag: "ev_police_tape", value: true },
      go: "police_tape_corner",
    },
    { label: "Talk to the officer", go: "officer_brief" },
    { label: "Leave before you draw attention", go: "downtown_arrival" },
  ],
},

officer_brief: {
  title: "Officer",
  meta: "They don’t look at you. Not directly.",
  tension: 0.72,
  backgroundLayers: () => ({
    bg: "BG_POLICE_OFFICER_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => [
    "\"It’s nothing,\" the officer says.",
    "",
    "But their hand tightens on the radio like it’s the only real thing left.",
    "",
    "\"Go home. Stay off the roads after dark.\"",
    "",
    "Their eyes flick toward the Capitol and away again.",
    "Like they’re afraid to be caught looking at it.",
  ],
  choices: [
    { label: "Ask why the Capitol matters", go: "officer_warning" },
    { label: "Back off", go: "downtown_arrival" },
  ],
},

officer_warning: {
  title: "Not Your Business",
  meta: "The wrong question makes the air colder.",
  tension: 0.85,
  backgroundLayers: () => ({
    bg: "BG_POLICE_OFFICER_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "The officer finally looks at you.",
    "",
    "\"Don’t say that word out loud,\" they whisper.",
    "",
    "You don’t know which word they mean.",
    "",
    "Behind them, the tape snaps—hard—like something tugged it.",
  ],
  choices: [
    { label: "Step away", go: "downtown_arrival" },
    { label: "Stay and watch", go: "death_supernatural_corner" },
  ],
},

// ---------------------------------
// CAPITOL EVIDENCE PATH
// ---------------------------------

capitol_plaza: {
  title: "Capitol Grounds",
  meta: "White stone. Clean lines. Something underneath.",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "BG_CAPITOL_PLAZA_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => {
    const got = !!state.flags.ev_capitol_sigils;
    return [
      "The Capitol looks like authority made physical.",
      "",
      "But the ground near the steps feels… charged.",
      "",
      got
        ? "You can still feel the carved lines under your fingertips, even though you’re not touching them."
        : "You notice maintenance markings along the stone—except they’re not markings. They’re sigils. Hidden in plain sight.",
    ];
  },
  choices: [
    {
      label: "Photograph the sigils",
      action: "setFlag",
      data: { flag: "ev_capitol_sigils", value: true },
      go: "capitol_plaza",
    },
    { label: "Try to enter the building", go: "capitol_entry" },
    { label: "Leave", go: "downtown_arrival" },
  ],
},

capitol_entry: {
  title: "Capitol Doors",
  meta: "Security is too calm.",
  tension: 0.82,
  backgroundLayers: () => ({
    bg: "BG_CAPITOL_ENTRY_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "A guard stops you with a polite smile that doesn’t reach their eyes.",
    "",
    "\"Tours are closed,\" they say.",
    "",
    "Behind the glass, you see a hallway that looks slightly too long—",
    "like a lens stretched it.",
  ],
  choices: [
    { label: "Back off", go: "capitol_plaza" },
    { label: "Push the issue", go: "death_guarded" },
  ],
},

// ---------------------------------
// ARCHIVES / BUDGET EVIDENCE
// ---------------------------------

public_records: {
  title: "Public Records",
  meta: "Paper trails are just rituals with staplers.",
  tension: 0.60,
  backgroundLayers: () => ({
    bg: "BG_ARCHIVES_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => {
    const got = !!state.flags.ev_budget_doc;
    return [
      "The building smells like toner and old carpet.",
      "",
      got
        ? "You already copied the budget line item labeled \"Containment Retrofit.\""
        : "You find a budget document with a line item that doesn’t belong: \"Containment Retrofit — Sublevel Infrastructure.\"",
      "",
      "Sublevel… under what?",
    ];
  },
  choices: [
    {
      label: "Copy the document",
      action: "setFlag",
      data: { flag: "ev_budget_doc", value: true },
      go: "public_records",
    },
    { label: "Ask the clerk about it", go: "records_clerk" },
    { label: "Leave", go: "downtown_arrival" },
  ],
},

records_clerk: {
  title: "Clerk",
  meta: "They flinch at the wrong word.",
  tension: 0.68,
  backgroundLayers: () => ({
    bg: "BG_ARCHIVES_CLERK_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "\"That file isn't public,\" the clerk says automatically.",
    "",
    "You didn’t tell them which file.",
    "",
    "\"I mean—\"",
    "They swallow. Their eyes dart to a camera in the corner.",
    "",
    "\"Please leave.\"",
  ],
  choices: [
    { label: "Leave", go: "downtown_arrival" },
    { label: "Wait until they look away", go: "keycard_opportunity" },
  ],
},

keycard_opportunity: {
  title: "Access",
  meta: "Opportunity isn’t the same thing as safety.",
  tension: 0.80,
  backgroundLayers: () => ({
    bg: "BG_ARCHIVES_BACKROOM_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => {
    const got = !!state.flags.ev_keycard;
    return [
      "A keycard sits on the counter beside a sign-in sheet.",
      "",
      got
        ? "You already palmed the card and walked out like you belonged."
        : "If you take it, you’ll have a way into places you don’t belong.",
    ];
  },
  choices: [
    {
      label: "Take the keycard",
      action: "setFlag",
      data: { flag: "ev_keycard", value: true },
      go: "keycard_opportunity",
    },
    { label: "Don’t risk it", go: "downtown_arrival" },
    { label: "Leave now", go: "downtown_arrival" },
  ],
},

// ---------------------------------
// STAFFER AUDIO / WITNESS EVIDENCE
// ---------------------------------

staffer_bar: {
  title: "Statehouse Bar",
  meta: "Where secrets go to feel ordinary.",
  tension: 0.62,
  backgroundLayers: () => ({
    bg: "BG_BAR_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => {
    const got = !!state.flags.ev_staffer_audio;
    return [
      "A tired staffer talks too loudly to someone who isn’t listening.",
      "",
      got
        ? "You already recorded the part where they said: \"the basement isn’t a basement.\""
        : "You catch fragments: \"…the Governor’s place… sublevel… not on any plan…\"",
      "",
      "They laugh once—sharp—like a warning disguised as a joke.",
    ];
  },
  choices: [
    {
      label: "Record what they say",
      action: "setFlag",
      data: { flag: "ev_staffer_audio", value: true },
      go: "staffer_bar",
    },
    { label: "Confront them", go: "staffer_spooks" },
    { label: "Leave", go: "downtown_arrival" },
  ],
},

staffer_spooks: {
  title: "Too Close",
  meta: "You said the wrong thing.",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "BG_BAR_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "The staffer’s face drains of color.",
    "",
    "\"No,\" they whisper. \"No— you can’t—\"",
    "",
    "Their eyes focus behind you.",
    "They stand too fast and bolt for the exit.",
    "",
    "Everyone else keeps drinking like nothing happened.",
  ],
  choices: [
    { label: "Follow them outside", go: "death_car" },
    { label: "Let them go", go: "downtown_arrival" },
  ],
},

// ---------------------------------
// CONNECTING THE DOTS / UNLOCK GOVERNOR ARC
// ---------------------------------

connect_the_dots: {
  title: "Connect the Dots",
  meta: "Patterns are just proof you’re paying attention.",
  tension: 0.72,
  backgroundLayers: () => ({
    bg: "BG_WALL_EVIDENCE_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: (state) => {
    const n = evidenceCount(state);
    const lines = [
      "You spread everything out.",
      "Photos. Audio. Notes. The keycard.",
      "",
      "It isn’t one incident.",
      "It’s an infrastructure.",
      "",
      `Evidence collected: ${n}/5`,
      "",
    ];

    if (n < 3) {
      lines.push(
        "You’re close, but not close enough.",
        "The story still has too many missing teeth.",
        "",
        "You need more. Something that names the hand behind it."
      );
    } else {
      lines.push(
        "The pattern finally clicks:",
        "",
        "The sigils aren’t random.",
        "They’re anchored around state property.",
        "",
        "And the budget line isn’t funding repairs.",
        "It’s funding a *chamber*.",
        "",
        "A private one.",
        "",
        "The Governor’s residence."
      );
    }

    return lines;
  },
  choices: (state) => {
    const n = evidenceCount(state);
    if (n >= 3) {
      return [
        { label: "Go to the Governor’s residence", go: "governor_house" },
        { label: "One more pass through the city", go: "downtown_arrival" },
      ];
    }
    return [
      { label: "Back", go: "intro_morning" },
      { label: "Return downtown", go: "downtown_arrival" },
      { label: "Check public records", go: "public_records" },
      { label: "Go to the statehouse bar", go: "staffer_bar" },
      { label: "Check the Capitol again", go: "capitol_plaza" },
    ];
  },
},

// ---------------------------------
// DEATHS (loop endings / variety)
// ---------------------------------

death_muggers: {
  title: "Mugged",
  meta: "Wrong place. Wrong timing. Same ending.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "BG_ALLEY_DEATH_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "You hear footsteps behind you.",
    "",
    "Then you hear them on both sides.",
    "",
    "A voice: \"Wallet.\"",
    "",
    "You try to talk. Try to move.",
    "The alley decides for you.",
    "",
    "As you fall, you catch a whisper that isn’t theirs:",
    "",
    "\"It’s already open.\"",
  ],
  choices: (state) => [{ label: "Wake up", go: wakeNode(state) }],
},

death_car: {
  title: "Impact",
  meta: "The crosswalk was green. It always is.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "BG_CAR_DEATH_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "You step off the curb.",
    "",
    "A car surges forward like it was waiting for the exact second you moved.",
    "",
    "No brakes.",
    "No swerve.",
    "",
    "As you hit the pavement, you see the traffic signal change—",
    "too late to matter.",
  ],
  choices: (state) => [{ label: "Wake up", go: wakeNode(state) }],
},

death_supernatural_corner: {
  title: "The Corner",
  meta: "It notices you noticing it.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "BG_SUPERNATURAL_DEATH_PLACEHOLDER",
    fg: null,
    light: "LIGHT_SUPERNATURAL_DEATH_PLACEHOLDER",
    glow: "GLOW_SUPERNATURAL_DEATH_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "The streetlight flickers.",
    "",
    "For half a second, you’re standing somewhere else.",
    "A place shaped like Des Moines… but wrong.",
    "",
    "Your body tries to correct itself.",
    "Reality disagrees.",
    "",
    "You collapse like a sentence cut in the middle.",
  ],
  choices: (state) => [{ label: "Wake up", go: wakeNode(state) }],
},

death_guarded: {
  title: "Removed",
  meta: "Authority doesn’t need explanations.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "BG_CAPITOL_GUARD_DEATH_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "The guard’s smile never changes.",
    "",
    "Two more appear without you seeing where they came from.",
    "",
    "\"You’re done for today,\" one of them says.",
    "",
    "The world narrows to a hallway, then to a door, then to nothing.",
    "",
    "You die without drama.",
    "That’s almost the worst part.",
  ],
  choices: (state) => [{ label: "Wake up", go: wakeNode(state) }],
},

// ---------------------------------
// ENTRY POINTS TO DEATHS (exploration choices)
// ---------------------------------

alley_muggers: {
  title: "Alley",
  meta: "A shortcut that feels like a dare.",
  tension: 0.82,
  backgroundLayers: () => ({
    bg: "BG_ALLEY_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "The alley smells like wet brick and pennies.",
    "",
    "You hear a laugh that stops too quickly.",
    "",
    "Someone steps into your path.",
    "Someone steps behind you.",
  ],
  choices: [
    { label: "Give them what they want", go: "death_muggers" },
    { label: "Run", check: { stat: "agility", dc: 4 }, onPass: "downtown_arrival", onFail: "death_muggers" },
  ],
},

// ===============================
// PART 1 — GOVERNOR → MIRROR DOOR
// Backgrounds are PLACEHOLDERS
// ===============================

governor_house: {
  title: "The Governor’s Residence",
  meta: "Nothing looks wrong. That’s the problem.",
  tension: 0.55,
  backgroundLayers: () => ({
    bg: "BG_GOVERNOR_HOUSE_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "The house is spotless. Too spotless.",
    "",
    "Every surface feels curated — not lived in, not warm.",
    "Like it exists for cameras that aren’t here right now.",
    "",
    "There’s a bookshelf against the far wall.",
    "It doesn’t fit the room.",
  ],
  choices: [
    { label: "Inspect the bookshelf", go: "governor_bunker_stairs" },
    { label: "Leave while you still can", go: "final_death" },
  ],
},

governor_bunker_stairs: {
  title: "Below the House",
  meta: "This isn’t part of the floor plan.",
  tension: 0.65,
  backgroundLayers: () => ({
    bg: "BG_BUNKER_STAIRS_PLACEHOLDER",
    fg: null,
    light: "LIGHT_BUNKER_PLACEHOLDER",
    glow: null,
    screen: null,
  }),
  text: [
    "The bookshelf slides aside without resistance.",
    "",
    "Stairs descend into darkness.",
    "Not basement darkness.",
    "Older.",
    "",
    "Your phone loses signal halfway down.",
    "The air gets heavier with every step.",
  ],
  choices: [
    { label: "Keep going", go: "governor_bunker" },
    { label: "Turn back", go: "final_death" },
  ],
},

governor_bunker: {
  title: "The Chamber",
  meta: "This was never about safety.",
  tension: 0.75,
  backgroundLayers: () => ({
    bg: "BG_BUNKER_CHAMBER_PLACEHOLDER",
    fg: "FG_SIGILS_PLACEHOLDER",
    light: "LIGHT_SIGIL_PLACEHOLDER",
    glow: "GLOW_SIGIL_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "The room is enormous.",
    "",
    "Not reinforced concrete.",
    "Stone. Carved.",
    "",
    "Government servers hum beside ritual circles.",
    "Cables feed symbols cut into the floor.",
    "",
    "This wasn’t built to survive an apocalypse.",
    "It was built to *manage* one.",
  ],
  choices: [
    { label: "Approach the lectern", go: "spell_tome" },
  ],
},

spell_tome: {
  title: "The Tome",
  meta: "It recognizes you.",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "BG_TOME_CLOSEUP_PLACEHOLDER",
    fg: null,
    light: "LIGHT_TOME_PLACEHOLDER",
    glow: "GLOW_TOME_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "The book is already open.",
    "",
    "Not inviting.",
    "Not threatening.",
    "",
    "Waiting.",
    "",
    "As you touch it, the room tilts —",
    "not physically, but *conceptually*.",
    "",
    "You don’t read the spell.",
    "You remember it.",
  ],
  choices: [
    {
      label: "Take the tome",
      action: "setFlag",
      data: { flag: "has_spell_tome", value: true },
      go: "apartment_pre_summon",
    },
  ],
},

apartment_pre_summon: {
  title: "Your Apartment",
  meta: "It feels smaller now.",
  tension: 0.62,
  backgroundLayers: () => ({
    bg: "BG_APARTMENT_NIGHT_PLACEHOLDER",
    fg: "FG_APARTMENT_PLACEHOLDER",
    light: "LIGHT_APARTMENT_PLACEHOLDER",
    glow: "GLOW_APARTMENT_PLACEHOLDER",
    screen: null,
  }),
  text: (state) => {
    const hasTome = !!state?.flags?.has_spell_tome;
    return [
      "The apartment hasn’t changed.",
      "",
      "You have.",
      "",
      "The mirror hums faintly.",
      "Not sound — pressure.",
      "",
      hasTome
        ? "The tome feels heavier in your hands than it should."
        : "You feel unprepared — like you came back empty-handed.",
      "",
      "You understand now.",
      "It was never just glass.",
    ];
  },
  choices: [
    { label: "Stand before the mirror", go: "mirror_summon" },
    { label: "Delay (you feel time tightening)", go: "final_death" },
  ],
},

mirror_summon: {
  title: "The Mirror",
  meta: "You are not in control.",
  tension: 0.82,
  backgroundLayers: () => ({
    bg: "BG_MIRROR_RITUAL_PLACEHOLDER",
    fg: "FG_MIRROR_HANDS_PLACEHOLDER",
    light: "LIGHT_MIRROR_PLACEHOLDER",
    glow: "GLOW_MIRROR_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "You speak the words forward.",
    "",
    "The mirror ripples.",
    "Like water pretending to be solid.",
    "",
    "Hands press against the surface.",
    "They don’t grab you.",
    "",
    "They wait.",
  ],
  choices: [
    {
      label: "Accept the invitation",
      action: "setFlag",
      data: { flag: "mirror_door_opened", value: true },
      go: "demon_realm_entry",
    },
  ],
},

demon_realm_entry: {
  title: "The Other Des Moines",
  meta: "The seals are thinner here.",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "BG_DEMON_CITY_PLACEHOLDER",
    fg: "FG_DEMON_CITY_PLACEHOLDER",
    light: "LIGHT_DEMON_CITY_PLACEHOLDER",
    glow: "GLOW_DEMON_CITY_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "The skyline is the same.",
    "",
    "The streets are familiar.",
    "",
    "But the sky bleeds violet and red.",
    "Buildings breathe.",
    "Graffiti watches you back.",
    "",
    "This isn’t hell.",
    "It’s Des Moines without permission.",
  ],
  choices: [
    { label: "Move toward the city’s center", go: "loop_core" },
  ],
},

loop_core: {
  title: "The Seal",
  meta: "You have been here every time.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "BG_SEAL_CORE_PLACEHOLDER",
    fg: "FG_SEAL_RUNES_PLACEHOLDER",
    light: "LIGHT_SEAL_PLACEHOLDER",
    glow: "GLOW_SEAL_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "The seal pulses weakly.",
    "",
    "Cracked. Strained.",
    "Holding.",
    "",
    "Understanding hits you all at once:",
    "",
    "You die because reality needs somewhere to fail.",
    "",
    "And someone has been pulling you back.",
  ],
  choices: [
    { label: "Touch the seal", go: "break_seal" },
  ],
},

break_seal: {
  title: "The Choice",
  meta: "Survival has a cost.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "BG_SEAL_BREAK_PLACEHOLDER",
    fg: null,
    light: "LIGHT_SEAL_BREAK_PLACEHOLDER",
    glow: "GLOW_SEAL_BREAK_PLACEHOLDER",
    screen: null,
  }),
  text: [
    "The seal recognizes you.",
    "",
    "It always has.",
    "",
    "Breaking it will end the loop.",
    "You will live.",
    "",
    "Everything else will follow.",
  ],
  choices: [
    {
      label: "Break the seal",
      action: "setFlag",
      data: { flag: "seal_broken", value: true },
      go: "part1_finale",
    },
  ],
},

part1_finale: {
  title: "Morning That Continues",
  meta: "You survived.",
  tension: 0.85,
  backgroundLayers: () => ({
    bg: "BG_CITY_CHAOS_PLACEHOLDER",
    fg: null,
    light: null,
    glow: null,
    screen: null,
  }),
  text: [
    "The day does not reset.",
    "",
    "Sirens scream outside.",
    "The sky flickers.",
    "",
    "Something howls — free for the first time.",
    "",
    "You are alive.",
    "",
    "The city is not safe anymore.",
  ],
  choices: [
    { label: "Continue", go: "part2_intro" }, // make this next
  ],
},

day_warning: {
  title: "Late Light",
  meta: "Last chance.",
  tension: 0.95,
  backgroundLayers: () => ({
    bg: "BG_DAY_WARNING_PLACEHOLDER",
    fg: null,
    light: "LIGHT_DAY_WARNING_PLACEHOLDER",
    glow: "GLOW_DAY_WARNING_PLACEHOLDER",
    screen: null,
  }),
  text: (state) => [
    "The light changes.",
    "",
    "Not sunset. Not weather.",
    "Something *deciding* the day is almost over.",
    "",
    "Your phone tries to show the time—",
    "and the numbers smear into a spiral before it shuts itself off.",
    "",
    "Across the street, a stranger turns their head in perfect sync with you.",
    "",
    "Their mouth moves without sound:",
    "",
    "\"Go. Now.\"",
  ],
  choices: (state) => [
    { label: "Move (don’t waste seconds)", go: "downtown_arrival" },
    { label: "Run home", go: "intro_morning" },
  ],
},

death_end_of_day: {
  title: "End of Day",
  meta: "It catches up. It always does.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "BG_END_OF_DAY_PLACEHOLDER",
    fg: null,
    light: "LIGHT_END_OF_DAY_PLACEHOLDER",
    glow: "GLOW_END_OF_DAY_PLACEHOLDER",
    screen: null,
  }),
  text: () => [
    "The air changes first.",
    "",
    "Not colder. Not warmer.",
    "Just… heavier.",
    "",
    "Streetlights flicker as if they’re reconsidering reality.",
    "Your phone shows the time for half a second—",
    "then the numbers melt into a spiral.",
    "",
    "You feel it in your teeth.",
    "In your lungs.",
    "",
    "It’s the same every time:",
    "the day deciding it’s done with you.",
    "",
    "You try to move—",
    "and your body forgets how.",
    "",
    "You die like a sentence cut off mid-word.",
  ],
  choices: (state) => [{ label: "Wake up", go: wakeNode(state) }],
},

final_death: {
  title: "You Leave",
  meta: (state) => {
    const n = evidenceCount(state);
    return n >= 3
      ? "Containment failsafe."
      : "Wrong place. Wrong timing. Same ending.";
  },
  tension: 1.0,

  onEnter: (state) => {
    const n = evidenceCount(state);

    // ✅ RECORD FAILSAFE MEMORY
    if (n >= 3) {
      state.flags = state.flags || {};
      state.flags.failsafe_seen = true;
    }
  },

  backgroundLayers: (state) => {
    const n = evidenceCount(state);
    return n >= 3
      ? {
          bg: "BG_FINAL_DEATH_FAILSAFE_PLACEHOLDER",
          fg: null,
          light: "LIGHT_FINAL_DEATH_FAILSAFE_PLACEHOLDER",
          glow: "GLOW_FINAL_DEATH_FAILSAFE_PLACEHOLDER",
          screen: null,
        }
      : {
          bg: "BG_FINAL_DEATH_RANDOM_PLACEHOLDER",
          fg: null,
          light: "LIGHT_FINAL_DEATH_RANDOM_PLACEHOLDER",
          glow: "GLOW_FINAL_DEATH_RANDOM_PLACEHOLDER",
          screen: null,
        };
  },

  text: (state) => {
    const n = evidenceCount(state);

    // CLEAN FAILSAFE (>= 3 evidence)
    if (n >= 3) {
      return [
        "You turn your back on the house.",
        "On the bookshelf that doesn’t belong.",
        "",
        "The street outside is quiet—controlled.",
        "Not empty. *Managed.*",
        "",
        "Your phone buzzes once.",
        "",
        "No notification.",
        "Just a single vibration like a system check.",
        "",
        "Then the air *thins*.",
        "",
        "It doesn’t get colder.",
        "It gets… less forgiving.",
        "",
        "You inhale and feel your lungs hesitate—",
        "like they’re waiting for authorization.",
        "",
        "A soft click comes from nowhere.",
        "The kind of click a door makes when it seals.",
        "",
        "Your vision narrows to a clean white point.",
        "No pain. No panic.",
        "",
        "Just a quiet, final understanding:",
        "",
        "You found too much.",
        "So the city corrects you.",
        "",
        "You die like a process that completed successfully.",
      ];
    }

    // RANDOM / VIOLENT (< 3 evidence)
    return [
      "You decide you’re done.",
      "",
      "You leave the property fast, heart loud in your ears.",
      "Like speed can outrun whatever you felt inside that house.",
      "",
      "The sidewalk seems to stretch—",
      "not longer, just… repeating.",
      "",
      "A car idles at the curb with its headlights off.",
      "You don’t remember seeing it a second ago.",
      "",
      "Someone laughs from the back seat.",
      "It doesn’t sound human enough to belong to a person.",
      "",
      "You walk faster.",
      "",
      "Footsteps appear behind you—",
      "too close, too many, too synchronized.",
      "",
      "A hand grabs your shoulder.",
      "",
      "The streetlight above you flickers and the world hiccups—",
      "for half a second you’re somewhere else: a version of Des Moines shaped wrong.",
      "",
      "Your body tries to correct itself.",
      "Reality doesn’t let it.",
      "",
      "You hit the pavement hard.",
      "You don’t remember falling.",
      "",
      "The last thing you hear is a whisper that isn’t theirs:",
      "",
      "\"Not yet.\"",
    ];
  },

  choices: (state) => [{ label: "Wake up", go: wakeNode(state) }],
},

};

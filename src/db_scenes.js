// db_scenes.js

function tvNewsKey(state) {
  const n = state.newsBeat ?? 0;
  if (n >= 3) return "tv_news_3";
  if (n >= 2) return "tv_news_2";
  if (n >= 1) return "tv_news_1";
  return "tv_news_0";
}

const TOTAL_EVIDENCE = 6;

function evidenceCount(state) {
  const f = state.flags || {};
  return [
    f.ev_police_tape,
    f.ev_budget_doc,
    f.ev_keycard,
    f.ev_staffer_audio,
    f.ev_capitol_sigils,
    f.ev_work_pc_archive,
  ].filter(Boolean).length;
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
  // ============================================================
// ACT 0 — PART 1
// LOCATION 1: APARTMENT (slow, dense intro hub)
// ============================================================

intro_game: {
  title: "Morning",
  meta: "A normal day.",
  tension: 0.08,
  backgroundLayers: () => ({
    bg: "intro_bg",
    light: "intro_light",
    glow: "intro_glow",
    fg: "intro_fg",
  }),
  text: () => [
    "Your alarm goes off at the wrong time.",
    "",
    "You shut it off anyway.",
    "",
    "A weekday. A routine.",
    "Shower. Coffee. Keys.",
    "",
    "Nothing feels wrong.",
    "",
    "That almost makes you late.",
  ],
  choices: [{ label: "Get up", go: "intro_morning" }],
},

intro_morning: {
  title: "Apartment",
  meta: "The room is familiar — almost too familiar.",
  tension: 0.22,

  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),

  text: (state) => {
    const b = state.beat ?? 0;

    // After any death, you remember.
    if (state.flags?.loop_awareness) {
      return [
        "You are awake.",
        "",
        "Your heart is racing.",
        "",
        "You remember dying.",
        "",
        "The apartment looks exactly the same.",
        "",
        "That is not comforting.",
      ];
    }

    // First time
    if (!state.flags?.apt_first_time) {
      state.flags.apt_first_time = true;
      return [
        "Your apartment smells faintly like old coffee and warm dust.",
        "",
        "Traffic noise filters in from somewhere outside.",
        "You can’t place the direction.",
        "",
        "Everything is where it should be.",
        "",
        "That makes it easy not to think too hard about it.",
      ];
    }

    // Early revisits
    if (b <= 1) {
      return [
        "The apartment looks the same.",
        "",
        "You still take a second longer than you expect to confirm that.",
      ];
    }

    // Later (still Act 0)
    return [
      "You start noticing how staged it feels.",
      "",
      "Like the room resets itself when you stop looking.",
    ];
  },

  choices: (state) => {
    const c = [];

    // Core apartment areas
    c.push(
      { label: "Check the TV", action: "advance", data: { beat: 1, newsBeat: 1 }, go: "apartment_tv" },
      { label: "Search the coffee table", go: "apartment_coffee" },
      { label: "Look in the bathroom mirror", action: "advance", data: { beat: 1, newsBeat: 1 }, go: "apartment_mirror" },
      { label: "Check the front door", go: "apartment_door" },
      { label: "Search the couch", go: "apartment_couch" },
      { label: "Check the kitchen counter", go: "apartment_kitchen" },
      { label: "Go to work", go: "commute_to_office" }
    );

    // Gate leaving: do NOT allow downtown yet without leads
    if (state.flags?.lead_downtown) {
      c.push({ label: "Leave the apartment (follow your lead)", action: "travelDowntown" });
    } else {
      c.push({ label: "Try to leave (something stops you)", go: "apartment_leave_blocked" });
    }

    return c;
  },
},

// ------------------------------------------------------------
// COFFEE TABLE (close-up POV)
// ------------------------------------------------------------
apartment_coffee: {
  title: "Coffee Table",
  meta: "Cluttered.",
  tension: 0.35,

  backgroundLayers: () => ({
    bg: "apartment_coffee_bg",
    light: "apartment_light",
    glow: "apartment_glow",
  }),

  text: (state) => {
    state.flags.apartment_visits = (state.flags.apartment_visits ?? 0) + 1;
    const seen = !!state.flags.searched_coffee;
    const seen2 = !!state.flags.searched_coffee_twice;
    const seen3 = !!state.flags.searched_coffee_thrice;

    if (!seen) {
      state.flags.searched_coffee = true;
      return [
        "Receipts.",
        "Old mail.",
        "An unpaid utility bill.",
        "",
        "A heavy-paper city flyer sits under a coaster like it belongs there.",
        "",
        "“Civic Preparedness Is Everyone’s Responsibility.”",
        "",
        "No date.",
        "No phone number.",
        "",
        "Just a seal you don’t recognize.",
      ];
    }

    // Second visit: flyer footer mutates
    if (!seen2) {
      state.flags.searched_coffee_twice = true;
      return [
        "You unfold the flyer again.",
        "",
        "You swear the bottom line wasn’t there before:",
        "",
        "“Authorized by the Office of Municipal Continuity.”",
        "",
        "Your bill has a new fee listed too:",
        "",
        "“Infrastructure Surcharge — Sublevel.”",
      ];
    }

    // Third visit: hidden slip appears (seed lead)
    if (!seen3) {
      state.flags.searched_coffee_thrice = true;
      state.flags.seed_retrofit_memo = true; // pays off later in Records
      state.flags.lead_downtown = true;       // NOW leaving can be enabled slowly
      return [
        "You pinch the paper at the fold.",
        "",
        "Something slides out — a thin maintenance slip tucked inside like a bookmark.",
        "",
        "WORK ORDER (Facilities)",
        "“Containment Retrofit — Sublevel Infrastructure”",
        "",
        "There’s a stamped spiral made of linked circles.",
        "",
        "At the bottom: a downtown address.",
        "",
        "You don’t like how official it looks.",
      ];
    }

    return [
      "You’ve already pulled everything apart.",
      "",
      "The flyer feels heavier than paper should.",
      "",
      "Like it remembers your hands.",
    ];
  },

  loot: { chance: 0.65, table: ["lucky_coin"] },

  choices: [
    { label: "Pocket anything useful", action: "setFlag", data: { flag: "coffee_pocketed", value: true }, go: "intro_morning" },
    { label: "Back", go: "intro_morning" },
  ],
},

// ------------------------------------------------------------
// TV (uses your existing TV story system)
// ------------------------------------------------------------
apartment_tv: {
  title: "Television",
  meta: (state) => {
    // keep your existing meta style if you want — leaving simple here
    const seenCount = Object.keys(state.flags.tv_seen || {}).length;
    return `Local news. Stories watched: ${seenCount}`;
  },
  tension: 0.55,

  backgroundLayers: (state) => ({
    bg: "tv_bg",
    light: "tv_light",
    glow: "tv_glow",

    screen: tvNewsKey(state),
    screenX: 0.23,
    screenY: 0.62,
    screenScale: 0.34,
    screenRot: -0.035,

    fg: "tv_fg",
    fgX: 0.23,
    fgY: 0.62,
    fgScale: 0.34,
    fgRot: -0.035,
    lockFg: true,
  }),

  text: (state) => {
    tvInit(state);

    const currentId = state.flags.tv_current_story_id;
    const current = currentId ? tvGetStoryById(currentId) : null;

    if (current) {
      return [
        current.headline,
        "",
        ...current.body,
      ];
    }

    const next = tvNextStory(state);
    return [
      "The screen hums with static under the broadcast.",
      "",
      "Tonight’s headline:",
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
        data: { storyId: next.id, unlocks: next.unlocks, evidence: next.evidence },
        // no go needed; applyTVStory sets flags and StoryScene will rerender
      },
      { label: "Turn it off", go: "intro_morning" },
    ];
  },
},

// ------------------------------------------------------------
// MIRROR (KEEP wrong + demon escalation)
// ------------------------------------------------------------
apartment_mirror: {
  title: "The Bathroom",
  meta: "The light hums softly.",
  tension: 0.65,

  // ✅ keep your variant logic + assets
  backgroundLayers: (state) => {
    const v = state.flags?.mirrorVariant ?? "normal";
    return {
      bg:
        v === "demon"
          ? "apartment_mirror_demon"
          : v === "wrong"
          ? "apartment_mirror_wrong"
          : "apartment_mirror",
      light: "apartment_light",
      glow: "apartment_glow",
    };
  },

  text: (state) => {
  state.flags = state.flags || {};

  // --------- DEMON HOLD DECAY (prevents "stuck demon") ----------
  // If demon is active, it should not persist forever.
  if (state.flags.mirrorVariant === "demon") {
    state.flags.mirror_demon_hold = (state.flags.mirror_demon_hold ?? 2) - 1;
    if (state.flags.mirror_demon_hold <= 0) {
      state.flags.mirrorVariant = "normal";
      delete state.flags.mirror_demon_hold;
      // NOTE: mirror_demon_started stays true (progression memory)
    }
  }

  const stares = state.flags.mirror_stare_count ?? 0;
  const v = state.flags.mirrorVariant ?? "normal";

  // --------- WRONG COUNTING (only once per visit, only when wrong) ----------
  if (v === "wrong") {
    if (!state.flags._wrong_counted_this_visit) {
      state.flags._wrong_counted_this_visit = true;
      state.flags.mirror_wrong_hits = (state.flags.mirror_wrong_hits ?? 0) + 1;
    }

    // Lead once after 3 wrong hits total
    if ((state.flags.mirror_wrong_hits ?? 0) >= 3 && !state.flags.mirror_lead_seen) {
      state.flags.mirror_lead_seen = true;
      return [
        "The reflection stops pretending.",
        "",
        "For one frame — one *perfect* frame —",
        "a set of coordinates burns into the glass like a watermark.",
        "",
        "Then it’s gone.",
        "",
        "But you *know* you saw it."
      ];
    }
  } else {
    // reset per-visit guard when not wrong
    state.flags._wrong_counted_this_visit = false;
  }

  if (!state.flags.mirror_intro_seen) {
    state.flags.mirror_intro_seen = true;
    return [
      "You stare into the mirror.",
      "",
      "Your reflection stares back.",
      "",
      "For a moment, you feel like you’re watching a feed —",
      "not a surface.",
    ];
  }

  if (v === "wrong") {
    return [
      "Your reflection is… off.",
      "",
      "Not like a distortion.",
      "Like a decision.",
      "",
      "It blinks a half-beat late.",
      "",
      "And you realize you’ve been holding your breath without noticing.",
    ];
  }

  if (state.flags.fracture_note_survived && !state.flags.mirror_residue_taken) {
    return "mirror_residue_mark";
  }

  if (v === "demon") {
    // give the demon clue once after it first triggers
    if (!state.flags.demon_clue_given && state.flags.mirror_demon_started) {
      state.flags.demon_clue_given = true;
      return "mirror_demon_clue";
    }

    return [
      "The mirror looks too deep.",
      "",
      "The glass bows outward — just slightly.",
      "",
      "Not breaking.",
      "Not cracking.",
      "",
      "As if something behind it is leaning closer.",
    ];
  }

  return [
    "You look again.",
    "",
    "The longer you stay, the more the room feels staged around the mirror.",
    "",
    `You’ve stared ${stares} time${stares === 1 ? "" : "s"}.`,
  ];
},

  choices: [
    // ✅ This action already contains your wrong/demon chance logic
    { label: "Keep staring", action: "stareMirror", go: "apartment_mirror" },

    // Small risk choice to make it adult / tense
    { label: "Touch the glass", action: "loseSanity", data: { amount: 1 }, go: "apartment_mirror_touch" },

    // Back out resets "visit guards" so wrong can happen again later
    { label: "Turn away", action: "resetMirrorVisit", go: "intro_morning" },
  ],
},


apartment_mirror_touch: {
  title: "The Bathroom",
  meta: "Cold.",
  tension: 0.72,

  backgroundLayers: (state) => {
    const v = state.flags?.mirrorVariant ?? "normal";
    return {
      bg:
        v === "demon"
          ? "apartment_mirror_demon"
          : v === "wrong"
          ? "apartment_mirror_wrong"
          : "apartment_mirror",
      light: "apartment_light",
      glow: "apartment_glow",
    };
  },

  text: (state) => {
    const v = state.flags?.mirrorVariant ?? "normal";

if (v === "wrong" && !state.flags._wrong_counted_this_visit) {
  state.flags._wrong_counted_this_visit = true;
  state.flags.mirror_wrong_hits = (state.flags.mirror_wrong_hits ?? 0) + 1;
}

    if (v === "demon") {
      return [
        "Your fingertip meets the glass.",
        "",
        "It yields — like skin over water.",
        "",
        "You yank your hand back and find your pulse is racing.",
        "",
        "Somewhere in the apartment, something clicks —",
        "as if acknowledging input.",
      ];
    }

    return [
      "The glass is colder than it should be.",
      "",
      "Not cold like winter.",
      "",
      "Cold like a server room.",
      "",
      "For a second you swear you feel faint vibration under your skin.",
    ];
  },

  choices: [
    // If demon is active, touching should be dangerous
    { label: "Step back", go: "apartment_mirror" },
    { label: "Leave the bathroom", action: "resetMirrorVisit", go: "intro_morning" },
    { label: "Don’t blink (bad idea)", action: "stareMirror", go: "apartment_mirror" },
  ],
},

// ------------------------------------------------------------
// FRONT DOOR (blocked progression + paranoia)
// ------------------------------------------------------------
apartment_door: {
  title: "Front Door",
  meta: "The threshold.",
  tension: 0.45,

  backgroundLayers: () => ({
    bg: "apartment_door_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),

  text: (state) => {
    const tried = state.flags.door_checked ?? 0;
    state.flags.door_checked = tried + 1;

    if (tried === 0) {
      return [
        "You check the lock out of habit.",
        "",
        "It’s locked.",
        "",
        "The deadbolt looks… newer than you remember.",
      ];
    }

    if (tried === 1) {
      return [
        "You press your ear to the door.",
        "",
        "No footsteps.",
        "No voices.",
        "",
        "And yet you feel watched —",
        "not from outside.",
        "",
        "From the hallway.",
      ];
    }

    return [
      "The peephole shows the corridor.",
      "",
      "It looks normal.",
      "",
      "That almost makes it worse.",
    ];
  },

  choices: [
    { label: "Try the handle", go: "apartment_leave_blocked" },
    { label: "Back", go: "intro_morning" },
  ],
},

apartment_leave_blocked: {
  title: "Front Door",
  meta: "Not yet.",
  tension: 0.55,

  backgroundLayers: () => ({
    bg: "apartment_door_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),

  text: (state) => {
    if (state.flags.lead_downtown) {
      return [
        "Your hand pauses on the handle.",
        "",
        "You remember the work order.",
        "The stamped spiral.",
        "The downtown address.",
        "",
        "Leaving feels less like “going out”…",
        "and more like “stepping into a system.”",
      ];
    }

    return [
      "You turn the handle.",
      "",
      "The latch releases.",
      "",
      "But the door doesn’t open.",
      "",
      "Not stuck.",
      "Not jammed.",
      "",
      "Just… refusing.",
      "",
      "Like it’s waiting for you to have a reason.",
    ];
  },

  choices: (state) => [
    ...(state.flags.lead_downtown
      ? [{ label: "Leave (follow the downtown address)", action: "travelDowntown" }]
      : []),
    { label: "Back away", go: "intro_morning" },
  ],
},

// ------------------------------------------------------------
// LIVING ROOM SUB-AREAS (same background, different content)
// ------------------------------------------------------------
apartment_couch: {
  title: "Couch",
  meta: "Where people sit and pretend they’re safe.",
  tension: 0.30,

  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),

  text: (state) => {
    if (state.flags.searched_couch) {
      return [
        "You lift the cushions again.",
        "",
        "Nothing new.",
        "",
        "Still, the fabric feels warmer than the room.",
      ];
    }

    state.flags.searched_couch = true;

    // Small “adult” risk: hidden staple / cut
    if (!state.flags.couch_cut_once) {
      state.flags.couch_cut_once = true;
      return [
        "You slide your hand between the cushions.",
        "",
        "Something sharp bites your finger.",
        "",
        "A staple — bent upward like it wanted to be found.",
        "",
        "You pull back and see a thin line of blood.",
      ];
    }

    return [
      "Under the couch you find dust, a lost receipt, and…",
      "",
      "a coin you don’t recognize.",
      "",
      "It’s warm when you pick it up.",
    ];
  },

  choices: [
    { label: "Wrap your finger", action: "takeDamage", data: { amount: 1, reason: "Cut finger." }, go: "apartment_couch_after" },
    { label: "Ignore it", action: "loseSanity", data: { amount: 1 }, go: "apartment_couch_after" },
    { label: "Back", go: "intro_morning" },
  ],
},

apartment_couch_after: {
  title: "Couch",
  meta: "A tiny injury can feel like a warning.",
  tension: 0.38,

  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),

  text: () => [
    "It’s not much blood.",
    "",
    "But it’s enough to make you aware of your body again.",
    "",
    "Enough to make the room feel slightly less like a set.",
  ],

  choices: [{ label: "Back", go: "intro_morning" }],
},

apartment_kitchen: {
  title: "Kitchen Counter",
  meta: "Small domestic rituals.",
  tension: 0.28,

  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),

  text: (state) => {
    const n = state.flags.kitchen_checks ?? 0;
    state.flags.kitchen_checks = n + 1;

    if (n === 0) {
      return [
        "A mug in the sink.",
        "",
        "You don’t remember using it.",
        "",
        "The coffee smell is stronger here —",
        "like it’s trying to convince you it’s morning.",
      ];
    }

    if (n === 1) {
      state.flags.lead_downtown = state.flags.lead_downtown || true; // kitchen can also seed leaving
      return [
        "A sticky note sits on the counter.",
        "",
        "Your handwriting.",
        "",
        "But you don’t remember writing it.",
        "",
        "It reads:",
        "",
        "“DON’T SAY ‘LOOP’ OUT LOUD.”",
      ];
    }

    return [
      "The sticky note is still there.",
      "",
      "It feels like an instruction.",
      "Not a reminder.",
    ];
  },

  choices: [
    { label: "Pocket the note", action: "setFlag", data: { flag: "note_pocketed", value: true }, go: "intro_morning" },
    { label: "Back", go: "intro_morning" },
  ],
},

// ============================================================
// ACT 0 — OFFICE (Location 2)
// Goal: slow exploration + first real conspiracy thread
// ============================================================

// --- Commute into work (slow mood setter) ---
commute_to_office: {
  title: "Commute",
  meta: "Traffic moves like it’s being edited.",
  tension: 0.35,
  backgroundLayers: () => ({ bg: "BG_COMMUTE_PLACEHOLDER" }),
  text: (state) => [
    "Traffic crawls.",
    "",
    "You sit through three lights that never quite sync.",
    "",
    "A billboard flickers between ads—",
    "and a city seal you don’t recognize.",
    "",
    "Your phone says it’s the right time.",
    "Your dashboard clock disagrees by twelve minutes.",
  ],
  choices: [
    { label: "Keep driving", go: "office_arrival" },
  ],
},

// -------------------------
// ACT 0 PART 2 — ARRIVAL
// -------------------------
office_arrival: {
  title: "Office Building",
  meta: "The lobby smells like bleach and warmed plastic.",
  tension: 0.45,
  backgroundLayers: withBackground("office"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.office_seen = true;
    state.flags.office_visits = (state.flags.office_visits ?? 0) + 1;
  },
  text: () => [
    "The lobby lights don’t buzz.",
    "They *hiss*.",
    "",
    "The security desk is unattended.",
    "A sign reads: VISITORS MUST CHECK IN.",
    "",
    "No one checks you in.",
  ],
  choices: [
    { label: "Go to your floor", go: "office_floor_act0" },
    { label: "Check the security desk", go: "office_security_desk" },
    { label: "Step back outside", go: "office_outside_smoke" },
  ],
},

office_security_desk: {
  title: "Security Desk",
  meta: "A logbook. A key tray. A camera that seems awake.",
  tension: 0.55,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    const took = !!state.flags.ev_office_security_log;
    return [
      "A paper logbook sits open.",
      "",
      "Most names are ordinary.",
      "",
      "Then you see it:",
      "",
      "— MAYOR’S OFFICE — OBSERVER — ACTIVE —",
      "",
      ...(took ? ["You already photographed the page.", ""] : []),
      "The pen beside it is still wet.",
    ];
  },
  choices: (state) => {
    state.flags = state.flags || {};
    const took = !!state.flags.ev_office_security_log;
    return [
      ...(took ? [] : [
        {
          label: "Photograph the log page (evidence)",
          action: "collectEvidence",
          data: { flag: "ev_office_security_log", evidence: 1 },
          go: "office_security_desk",
        },
      ]),
      { label: "Back", go: "office_arrival" },
    ];
  },
},

office_outside_smoke: {
  title: "Outside",
  meta: "Cold air. A normal world pretending.",
  tension: 0.38,
  backgroundLayers: () => ({ bg: "BG_OFFICE_OUTSIDE_PLACEHOLDER" }),
  text: () => [
    "The air feels cleaner than it should.",
    "",
    "Across the street, someone watches the building.",
    "Not you.",
    "",
    "The moment you look directly at them—",
    "they’re already walking away.",
  ],
  choices: [
    { label: "Go back inside", go: "office_arrival" },
  ],
},

// -------------------------
// ACT 0 PART 3 — THE FLOOR
// -------------------------
office_floor_act0: {
  title: "Your Floor",
  meta: "Cubicles. Fluorescents. Silence with teeth.",
  tension: 0.50,
  backgroundLayers: withBackground("office"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.office_floor_visits = (state.flags.office_floor_visits ?? 0) + 1;
  },
  text: (state) => [
    "Your coworkers are here.",
    "They move like routine is a script.",
    "",
    "Nobody says good morning.",
    "",
    "A printer prints something.",
    "No one pressed print.",
    "",
    `You feel the urge to check your desk. (${state.flags.office_floor_visits}/?)`,
  ],
  choices: [
    { label: "Go to your desk", go: "office_desk" },
    { label: "Check the breakroom", go: "office_breakroom_act0" },
    { label: "Check the copy room", go: "office_copyroom" },
    { label: "Use the restroom", go: "office_restroom" },
    { label: "Walk toward the executive hallway", go: "office_exec_hall" },
    {
  label: "Keep going (push through the afternoon)",
  action: "advance",
  data: { beat: 1 },
  go: "office_floor"
}

  ],
},

office_breakroom_act0: {
  title: "Breakroom",
  meta: "Microwave hum. Coffee that tastes like apology.",
  tension: 0.52,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    const searched = !!state.flags.office_breakroom_searched;
    return [
      "Someone left a paper cup in the sink.",
      "",
      "A bulletin board is crowded with announcements.",
      "",
      ...(searched
        ? ["The board looks the same.", "Except now you notice the staples form a little circle.", ""]
        : ["One flyer is pinned under three other flyers like it’s being hidden.", ""]),
    ];
  },
  choices: (state) => {
    state.flags = state.flags || {};
    const searched = !!state.flags.office_breakroom_searched;
    return [
      ...(searched ? [] : [
        {
          label: "Search the bulletin board",
          action: "setFlag",
          data: { flag: "office_breakroom_searched", value: true },
          go: "office_breakroom_board_act0",
        },
      ]),
      { label: "Back", go: "office_floor_act0" },
    ];
  },
},

office_breakroom_board_act0: {
  title: "Bulletin Board",
  meta: "A flyer tries to disappear under your fingertips.",
  tension: 0.62,
  backgroundLayers: withBackground("office"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    // soft gate: give the player a “lead” without letting them sprint to the end
    state.flags.lead_union_room = true;
  },
  text: () => [
    "You peel back the top flyers.",
    "",
    "Underneath is a printed notice with no letterhead:",
    "",
    "“CONTINUITY COMPLIANCE TRAINING”",
    "Mandatory.",
    "No date.",
    "",
    "Below it, hand-written in pen:",
    "",
    "“If you remember the *click*, stop going home.”",
  ],
  choices: [
    { label: "Back", go: "office_breakroom_act0" },
  ],
},

office_copyroom: {
  title: "Copy Room",
  meta: "Warm toner. The feeling of being watched through paper.",
  tension: 0.58,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    const found = !!state.flags.ev_office_copy_memo;
    return [
      "A stack of pages sits in the output tray.",
      "",
      "It isn’t your department’s format.",
      "",
      "The top page is labeled:",
      "",
      "EXECUTIVE CONTINUITY — INTERNAL",
      "",
      ...(found ? ["You already took the memo.", ""] : ["Your hand hovers over it.", ""]),
    ];
  },
  choices: (state) => {
    state.flags = state.flags || {};
    const found = !!state.flags.ev_office_copy_memo;
    return [
      ...(found ? [] : [
        {
          label: "Take the memo (evidence)",
          action: "collectEvidence",
          data: { flag: "ev_office_copy_memo", evidence: 1 },
          go: "office_copyroom_taken",
        },
      ]),
      { label: "Back", go: "office_floor_act0" },
    ];
  },
},

office_copyroom_taken: {
  title: "Copy Room",
  meta: "Paper shouldn’t feel warm like skin.",
  tension: 0.70,
  backgroundLayers: withBackground("office"),
  text: (state) => [
    "You slide the memo into your bag.",
    "",
    "The copier *clicks* once—",
    "as if it noticed.",
    "",
    ...(state.flags?.failsafe_seen ? ["You remember another click. A different one.", ""] : []),
  ],
  choices: [
    { label: "Back", go: "office_floor_act0" },
  ],
},

office_restroom: {
  title: "Restroom",
  meta: "Same mirror problem. Different lighting.",
  tension: 0.60,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    const peeked = !!state.flags.office_restroom_peeked;
    return [
      "The restroom is too clean.",
      "",
      "The mirror above the sink shows you—",
      "and then half a second later, it updates.",
      "",
      ...(peeked
        ? ["You already checked the stall.", "The feeling doesn’t leave.", ""]
        : ["One stall door is slightly open.", ""]),
    ];
  },
  choices: (state) => {
    state.flags = state.flags || {};
    const peeked = !!state.flags.office_restroom_peeked;
    return [
      ...(peeked ? [] : [
        { label: "Look inside the open stall", action: "loseSanity", data: { amount: 1 }, go: "office_restroom_stall" },
      ]),
      { label: "Back", go: "office_floor_act0" },
    ];
  },
},

office_restroom_stall: {
  title: "Restroom Stall",
  meta: "A place people leave things when they can’t carry them.",
  tension: 0.72,
  backgroundLayers: withBackground("office"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.lead_keycard = true;
  },
  text: () => [
    "Inside the stall is a small zip bag taped under the tank lid.",
    "",
    "You pull it free.",
    "",
    "A keycard falls into your palm.",
    "",
    "It’s stamped with a city seal.",
    "",
    "Not your company’s.",
  ],
  choices: [
    { label: "Take the keycard", action: "addItem", data: { item: "city_keycard", qty: 1 }, go: "office_restroom" },
  ],
},

office_exec_hall: {
  title: "Executive Hallway",
  meta: "Carpet gets thicker. Air gets colder.",
  tension: 0.68,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    const doorUnlocked = !!state.flags.exec_door_unlocked;
    return [
      "A frosted glass door blocks the end of the hall.",
      "",
      "Behind it: quiet offices with no personal items.",
      "",
      doorUnlocked
        ? "The lock light is green."
        : "The lock light is red.",
      "",
      "A small panel reads:",
      "MUNICIPAL CONTINUITY LIAISON",
    ];
  },
  choices: (state) => {
    state.flags = state.flags || {};
    const hasCard = (state.inventory || []).includes("city_keycard") || state.inventory?.some?.(x => x?.id === "city_keycard");
    const unlocked = !!state.flags.exec_door_unlocked;

    return [
      ...(unlocked ? [
        { label: "Enter", go: "office_exec_liaison" },
      ] : [
        ...(hasCard ? [
          { label: "Swipe the city keycard", action: "setFlag", data: { flag: "exec_door_unlocked", value: true }, go: "office_exec_hall" },
        ] : [
          { label: "Try the door (locked)", action: "loseSanity", data: { amount: 1 }, go: "office_exec_hall_locked" },
        ]),
      ]),
      { label: "Back", go: "office_floor_act0" },
    ];
  },
},

office_exec_hall_locked: {
  title: "Executive Hallway",
  meta: "The lock feels like it recognizes you.",
  tension: 0.76,
  backgroundLayers: withBackground("office"),
  text: () => [
    "The panel flashes:",
    "",
    "UNAUTHORIZED",
    "",
    "Then, smaller:",
    "",
    "“Not yet.”",
  ],
  choices: [
    { label: "Back", go: "office_exec_hall" },
  ],
},

// -------------------------
// ACT 0 PART 4 — LIAISON ROOM + PC (your computer engine UI)
// -------------------------
office_exec_liaison: {
  title: "Liaison Office",
  meta: "Everything here looks staged. Like a set.",
  tension: 0.78,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.office_liaison_seen = true;
    return [
      "A desk. A lamp. A framed city seal.",
      "",
      "No family photos.",
      "No nameplate.",
      "",
      "A workstation sits powered on.",
      "",
      "On the desk: a sticky note with a single word:",
      "`ARCHIVE`",
      "",
      "Your hands hover over the mouse.",
      "You can feel the room listening.",
    ];
  },
  choices: [
    // IMPORTANT: this uses your built-in PC engine mode
    { label: "Sit down at the computer", go: "workpc_desktop" },
    { label: "Search the desk drawers", go: "office_liaison_drawers" },
    { label: "Back out slowly", go: "office_floor_act0" },
  ],
},

office_liaison_drawers: {
  title: "Desk Drawers",
  meta: "Locked. Not all locks are metal.",
  tension: 0.82,
  backgroundLayers: withBackground("office"),
  text: (state) => {
    state.flags = state.flags || {};
    const took = !!state.flags.ev_office_usb;
    return [
      "You open the top drawer.",
      "",
      "Inside: a cheap USB drive with a handwritten label:",
      "",
      "“LOOP / MAYOR / PROTOCOL”",
      "",
      ...(took ? ["You already took it.", ""] : ["It feels heavier than it should.", ""]),
    ];
  },
  choices: (state) => {
    state.flags = state.flags || {};
    const took = !!state.flags.ev_office_usb;
    return [
      ...(took ? [] : [
        { label: "Take the USB", action: "addItem", data: { item: "usb_loop", qty: 1 }, go: "office_liaison_drawers_take" }
      ]),
      { label: "Back", go: "office_exec_liaison" },
    ];
  },
},

office_liaison_drawers_take: {
  title: "Desk Drawers",
  meta: "You feel like you stole something that already belonged to you.",
  tension: 0.88,
  backgroundLayers: withBackground("office"),
  text: () => [
    "You pocket the USB.",
    "",
    "The lamp flickers once.",
    "",
    "Somewhere inside the building,",
    "a door closes softly.",
  ],
  choices: [
    { label: "Back", go: "office_exec_liaison" },
  ],
},

// ============================================================
// ACT 1 — OFFICE EXIT (slow “end of day” that leads to first loop death)
// ============================================================

office_end_of_day: {
  title: "End of Day",
  meta: "You blink and the office is emptier than it should be.",
  tension: 0.62,
  backgroundLayers: withBackground("office"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.office_end_day_seen = true;
  },
  text: (state) => [
    "It’s late.",
    "",
    "You don’t remember the hours passing.",
    "",
    "Your inbox has replies you never received.",
    "",
    "Your computer wallpaper looks like the city at night—",
    "the seal in the corner, watching.",
    "",
    `Evidence feels heavier in your bag. (${(state.flags?.evidence_count ?? 0)}+)`,
  ],
  choices: [
    { label: "Leave the office", go: "office_exit_evening" },
    { label: "Stay a little longer (dangerous)", action: "loseSanity", data: { amount: 1 }, go: "office_stay_late" },
  ],
},

office_stay_late: {
  title: "After Hours",
  meta: "The building doesn’t like witnesses.",
  tension: 0.78,
  backgroundLayers: withBackground("office"),
  text: () => [
    "The lights dim.",
    "",
    "You hear footsteps where there shouldn’t be anyone.",
    "",
    "A soft laugh—",
    "like someone heard a joke you didn’t.",
  ],
  choices: [
    { label: "Leave NOW", go: "office_exit_evening" },
  ],
},

office_exit_evening: {
  title: "Street Outside",
  meta: "The world pretends it’s normal.",
  tension: 0.55,
  backgroundLayers: () => ({ bg: "BG_OFFICE_EVENING_PLACEHOLDER" }),
  text: (state) => [
    "You step outside into evening traffic.",
    "",
    "The sky is the color it’s supposed to be.",
    "",
    "You think about dinner.",
    "",
    "You never hear the car.",
    "",
    ...(state.flags?.ev_work_pc_archive ? ["In your mind: a click. A warning. A door.", ""] : []),
  ],
  choices: [
    { label: "—", go: "death_car" },
  ],
},

  // ============================================================
// ACT 0 — PART 1
// LOCATION 2: OFFICE (slow-burn “normal” with cracks)
// Uses your existing office layered assets.
// ============================================================

// Optional: if you want a clean “go to work” entry point from Apartment
office_commute: {
  title: "Commute",
  meta: "Same route. Same faces.",
  tension: 0.22,
  backgroundLayers: () => ({
    bg: "BG_COMMUTE_PLACEHOLDER",
  }),
  text: (state) => {
    // subtle pressure ramp
    state.flags.office_commute_count = (state.flags.office_commute_count ?? 0) + 1;

    const n = state.flags.office_commute_count;
    if (n === 1) {
      return [
        "Traffic crawls.",
        "",
        "You sit through three lights that never quite sync.",
        "",
        "Someone in the car next to you keeps glancing over.",
        "",
        "Probably nothing.",
      ];
    }

    if (n === 2) {
      return [
        "The same billboard appears twice.",
        "",
        "You tell yourself it’s because you weren’t paying attention.",
        "",
        "But your hands are tight on the wheel anyway.",
      ];
    }

    return [
      "You arrive without remembering the last two turns.",
      "",
      "That’s normal, you think.",
      "",
      "It isn’t.",
    ];
  },
  choices: [{ label: "Go in", go: "office_lobby" }],
},

// ------------------------------------------------------------
// OFFICE LOBBY (entry)
// ------------------------------------------------------------
office_lobby: {
  title: "Office Lobby",
  meta: "Fluorescent calm.",
  tension: 0.35,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (!state.flags.office_lobby_seen) {
      state.flags.office_lobby_seen = true;
      return [
        "The lobby smells like carpet cleaner and printer toner.",
        "",
        "A security camera watches the doors without blinking.",
        "",
        "A framed poster on the wall reads:",
        "",
        "“COMPLIANCE IS CARE.”",
        "",
        "You’ve walked past it a hundred times.",
        "Today, you notice the wording.",
      ];
    }

    return [
      "The poster is still there.",
      "",
      "The camera still watches.",
      "",
      "People pass through like they’re trying not to leave fingerprints on the air.",
    ];
  },
  choices: [
    { label: "Go to your floor", go: "office_floor" },
    { label: "Check the bulletin by the elevators", go: "office_bulletin" },
    { label: "Step into the breakroom", go: "office_breakroom" },
    { label: "Leave (not yet)", go: "office_leave_attempt" },
  ],
},

office_leave_attempt: {
  title: "Office Lobby",
  meta: "You could leave. You just… don’t.",
  tension: 0.40,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: () => [
    "You turn toward the doors.",
    "",
    "Your feet hesitate like they’re waiting for permission.",
    "",
    "You hate that you noticed it.",
  ],
  choices: [
    { label: "Go to your floor", go: "office_floor" },
    { label: "Breakroom", go: "office_breakroom" },
    { label: "Bulletin", go: "office_bulletin" },
  ],
},

// ------------------------------------------------------------
// BULLETIN (puzzle seed: repeated phrasing / dates)
// ------------------------------------------------------------
office_bulletin: {
  title: "Elevator Bulletin",
  meta: "Corporate updates.",
  tension: 0.42,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    const seen = state.flags.office_bulletin_seen ?? 0;
    state.flags.office_bulletin_seen = seen + 1;

    if (seen === 0) {
      return [
        "A cluster of memos is pinned under a plastic cover.",
        "",
        "“Facilities: Sublevel Retrofit — Schedule Updated”",
        "",
        "The word “sublevel” makes your stomach tighten.",
        "",
        "You don’t know why.",
      ];
    }

    if (seen === 1) {
      state.flags.seed_retrofit_memo = true; // ties to the Apartment work order seed if they found it
      return [
        "You read the Facilities memo again.",
        "",
        "There’s a stamp at the bottom — faint, almost decorative:",
        "",
        "A spiral made of linked circles.",
        "",
        "Under it, in small type:",
        "“Authorized by Municipal Continuity.”",
        "",
        "The exact phrase from the flyer…",
        "except you haven’t told anyone about that flyer.",
      ];
    }

    return [
      "The memos feel like they’re written for someone else.",
      "",
      "But they keep using language that sounds like it’s for you.",
    ];
  },
  choices: [
    { label: "Photograph the memo (lead)", action: "setFlag", data: { flag: "lead_downtown", value: true }, go: "office_lobby" },
    { label: "Back", go: "office_lobby" },
  ],
},

// ------------------------------------------------------------
// OFFICE FLOOR (hub within office)
// ------------------------------------------------------------
office_floor: {
  title: "Your Floor",
  meta: "Keyboard clacks. Forced normalcy.",
  tension: 0.50,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (!state.flags.office_floor_seen) {
      state.flags.office_floor_seen = true;
      return [
        "Fluorescent lights hum overhead — a constant tone like a dentist drill.",
        "",
        "Everyone looks busy in that careful way people look busy when they don’t want to be noticed.",
        "",
        "Your boss is already watching you approach.",
      ];
    }

    if (state.flags.pc_archive_found) {
      return [
        "The office feels smaller now.",
        "",
        "Not physically.",
        "",
        "Like the building has decided you belong to it.",
      ];
    }

    return [
      "The day moves in tiny transactions.",
      "",
      "Email. Reply. Smile. Repeat.",
      "",
      "You keep thinking about the word: sublevel.",
    ];
  },
  choices: [
    { label: "Go to your desk", go: "office_desk" },
    { label: "Breakroom", go: "office_breakroom" },
    { label: "HR hallway", go: "office_hr_hall" },
    { label: "Talk to your boss", go: "office_boss" },
    { label: "Go grab coffee", go: "office_coffee" },
    { label: "Head out after work", go: "office_after_work_exit" },
  ],
},

// ------------------------------------------------------------
// BOSS (pressure + sanity)
// ------------------------------------------------------------
office_boss: {
  title: "Your Boss",
  meta: "Practiced irritation.",
  tension: 0.62,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (!state.flags.boss_first_contact) {
      state.flags.boss_first_contact = true;
      return [
        "\"You're late,\" they snap — even if you aren't.",
        "",
        "They list your supposed mistakes like they’re reading from a script.",
        "",
        "Halfway through, you realize the script includes details you never told anyone.",
        "",
        "Your skin prickles.",
      ];
    }

    return [
      "Your boss looks at you like they’re trying to remember which version of you is scheduled today.",
      "",
      "\"Just… do your work,\" they say.",
      "",
      "It lands like a warning.",
    ];
  },
  choices: [
    { label: "Apologize with charm (charm)", check: { stat: "charm", dc: 3 }, onPass: "office_boss_pass", onFail: "office_boss_fail" },
    { label: "Say nothing", go: "office_boss_fail" },
  ],
},

office_boss_pass: {
  title: "HR-Approved Humor",
  meta: "You land it. Barely.",
  tension: 0.55,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: () => [
    "Your boss blinks, then laughs — once.",
    "",
    "\"Fine. Just… don’t make it a thing.\"",
    "",
    "For a moment, everything feels normal.",
    "",
    "That moment does not last.",
  ],
  choices: [{ label: "Back to work", action: "gainXp", data: { amount: 10 }, go: "office_floor" }],
},

office_boss_fail: {
  title: "Marked",
  meta: "Your name becomes an entry.",
  tension: 0.70,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    state.flags.marked_at_work = true;
    return [
      "Your boss writes something down without looking at the page.",
      "",
      "Like the act of writing matters more than what’s written.",
      "",
      "You feel smaller for the rest of the day.",
    ];
  },
  choices: [
    { label: "Back to your desk", action: "loseSanity", data: { amount: 1 }, go: "office_desk" },
    { label: "Breakroom", go: "office_breakroom" },
  ],
},

// ------------------------------------------------------------
// BREAKROOM (slow, readable clues + minor loot)
// ------------------------------------------------------------
office_breakroom: {
  title: "Breakroom",
  meta: "Microwaves and polite lies.",
  tension: 0.45,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    const n = state.flags.breakroom_visits ?? 0;
    state.flags.breakroom_visits = n + 1;

    if (n === 0) {
      return [
        "Someone left a birthday card on the counter.",
        "",
        "It’s addressed to a person who doesn’t work here anymore.",
        "",
        "The cake in the fridge is sliced as if people keep taking a piece…",
        "but the slices never get smaller.",
      ];
    }

    if (n === 1) {
      return [
        "A bulletin board hangs near the vending machine.",
        "",
        "A printed notice is pinned crookedly:",
        "",
        "“MANDATORY WELLNESS CHECK-IN”",
        "",
        "Below it, in smaller type:",
        "“Failure to comply may result in corrective scheduling.”",
      ];
    }

    return [
      "The breakroom feels staged —",
      "a place designed to be harmless.",
      "",
      "You can’t shake the thought that it’s also designed to be observed.",
    ];
  },
  loot: { chance: 0.25, table: ["bandage"] },
  choices: [
    { label: "Read the bulletin board", go: "office_breakroom_board" },
    { label: "Back to the floor", go: "office_floor" },
  ],
},

office_breakroom_board: {
  title: "Breakroom Bulletin",
  meta: "Pinned instructions.",
  tension: 0.52,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (!state.flags.read_breakroom_board) {
      state.flags.read_breakroom_board = true;
      return [
        "The board is cluttered with normal things:",
        "lost keys, a potluck signup sheet, a coupon someone never took down.",
        "",
        "Then one page catches your eye.",
        "",
        "“FACILITIES ACCESS UPDATE”",
        "",
        "“Sublevel access restricted to authorized personnel.”",
        "",
        "There’s a stamp at the bottom:",
        "a spiral made of linked circles.",
      ];
    }

    return [
      "The facilities notice is still there.",
      "",
      "You can’t stop reading the phrase “Sublevel access restricted.”",
      "",
      "Restricted from whom?",
    ];
  },
  choices: [
    { label: "Pull the page down (risk)", go: "office_board_risk" },
    { label: "Back", go: "office_breakroom" },
  ],
},

office_board_risk: {
  title: "Breakroom Bulletin",
  meta: "Paper is evidence. Evidence is risk.",
  tension: 0.66,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (state.flags.board_page_taken) {
      return [
        "You already took the notice.",
        "",
        "The pinholes remain like little punctures in the story.",
      ];
    }

    state.flags.board_page_taken = true;
    state.flags.lead_downtown = true;

    return [
      "You slide the page free from the pushpins.",
      "",
      "The paper is warm in your hands.",
      "",
      "Not from the room.",
      "",
      "From something that used it recently.",
      "",
      "You fold it and pocket it like it’s contraband.",
    ];
  },
  choices: [{ label: "Back to the floor", action: "loseSanity", data: { amount: 1 }, go: "office_floor" }],
},

// ------------------------------------------------------------
// DESK + PC (puzzle: find a hidden “archive”)
// ------------------------------------------------------------
office_desk: {
  title: "Your Desk",
  meta: "Familiar tools.",
  tension: 0.55,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    const n = state.flags.desk_checks ?? 0;
    state.flags.desk_checks = n + 1;

    if (n === 0) {
      return [
        "Your monitor wakes up with a polite chime.",
        "",
        "A calendar reminder pops up:",
        "",
        "“WELLNESS CHECK-IN — REQUIRED.”",
        "",
        "You don’t remember scheduling it.",
      ];
    }

    if (n === 1) {
      return [
        "You check your email.",
        "",
        "A message is already open — unsent.",
        "",
        "Subject:",
        "“CONTAINMENT RETROFIT CONFIRMATION”",
        "",
        "You didn’t write it.",
      ];
    }

    return [
      "Your hands hover over the keyboard.",
      "",
      "For a second, you’re not sure what would happen if you typed the wrong word.",
    ];
  },
  choices: [
    {
  label: "Sit down at the computer",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
},
    { label: "Search your drawers", go: "office_drawers" },
    { label: "Back", go: "office_floor" },
  ],
},

office_drawers: {
  title: "Desk Drawers",
  meta: "Personal, barely.",
  tension: 0.58,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (state.flags.searched_drawers) {
      return [
        "Pens.",
        "Receipts.",
        "A stale mint.",
        "",
        "Nothing else.",
        "",
        "But you keep expecting to find something that proves you’re not imagining this.",
      ];
    }

    state.flags.searched_drawers = true;

    return [
      "Under a stack of sticky notes, you find a small first-aid packet.",
      "",
      "It looks newer than everything else.",
      "",
      "Like someone stocked it for you.",
    ];
  },
  loot: { chance: 1, table: ["bandage"] },
  choices: [
    { label: "Back", go: "office_desk" },
  ],
},

// ------------------------------------------------------------
// OFFICE PC — NOW IN PC MODE (engine UI)
// ------------------------------------------------------------

office_pc: {
  title: "",
  meta: "",
  tension: 0.62,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),

  uiMode: "computer",

  // Desktop view (dynamic)
  computerUI: (state) => {
    state.flags = state.flags || {};

    state.flags.pc_visits = (state.flags.pc_visits ?? 0) + 1;
    const v = state.flags.pc_visits;

    const seeded = !!state.flags.pc_archive_seeded;
    const found = !!state.flags.pc_archive_found;

    // Gate the archive until 2+ visits unless already found
    let archiveGo = "office_pc_archive_locked";
    if (found) archiveGo = "office_pc_archive";
    else if (v >= 2) {
      state.flags.pc_archive_seeded = true;
      archiveGo = "office_pc_archive";
    }

    const wallpaperText = found
      ? "WORKSTATION // ARCHIVE PRESENT"
      : seeded
      ? "WORKSTATION // SOMETHING CHANGED"
      : "WORKSTATION";

    const hint = found
      ? "The folder remains. Like it expects you."
      : v < 2
      ? "A warning flashes and vanishes too fast to read."
      : "A folder appears that wasn’t there a moment ago.";

    // triggered desktop moments (not automatic overall; only once per visit)
state.flags._pc_visit_tick = (state.flags._pc_visit_tick ?? 0) + 1;

if (state.flags.pc_visits === 1 && !state.flags._pc_moment_first_visit) {
  state.flags._pc_moment_first_visit = true;
  state.flags._pc_moment_hint = "first_visit_sync";
}

if (state.flags.pc_visits === 2 && !state.flags._pc_moment_second_visit) {
  state.flags._pc_moment_second_visit = true;
  state.flags._pc_moment_hint = "second_visit_warning";
}

    return {
      type: "desktop",
      wallpaperText,
      hint,
      icons: [
        { icon: "folder", key: "ARCHIVE", label: "ARCHIVE", go: archiveGo },
        { icon: "file", key: "POLICY", label: "IT_Policy.txt", go: "office_pc_decoy_policy" },
        { icon: "folder", key: "RECYCLE", label: "Recycle Bin", go: "office_pc_recycle" },
        { icon: "file", key: "MSG", label: "message.tmp", go: "office_pc_doc_hint" },
        // show only after the city has spoken to you
...(state.flags.oversight_contact || state.flags.failsafe_seen
  ? [{ icon: "warning", key: "SYS_GUARD", label: "SYS_GUARD.exe", go: "office_pc_haunted" }]
  : []),
      ],
    };
  },

  text: () => [],

},

// Optional decoy file to slow the player down
office_pc_decoy_policy: {
  title: "",
  meta: "",
  tension: 0.55,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  uiMode: "computer",
  computerUI: {
    type: "error",
    title: "IT_Policy.txt",
    message: [
      "WORKSTATION ACCEPTABLE USE POLICY",
      "",
      "• Do not install unauthorized software.",
      "• Do not access restricted files.",
      "• All activity may be monitored.",
      "",
      "You’ve read this before.",
      "",
      "Today, the last line feels personal:",
      "",
      "“Compliance ensures stability.”",
    ],
    buttons: [{
  label: "Back",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
],
  },
  text: () => [],
},

office_pc_recycle: {
  title: "",
  meta: "",
  tension: 0.50,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  uiMode: "computer",

  computerUI: (state) => {
    const found = !!state.flags?.pc_archive_found;
    const v = state.flags?.pc_visits ?? 0;

    let archiveGo = "office_pc_archive_locked";
    if (found) archiveGo = "office_pc_archive";
    else if (v >= 2) archiveGo = "office_pc_archive";

    return {
      type: "desktop",
      wallpaperText: "RECYCLE BIN",
      hint: "Empty. Like someone already cleaned it.",
      icons: [
        { icon: "folder", key: "ARCHIVE", label: "ARCHIVE", go: archiveGo },
        { icon: "file", key: "TRASH", label: "readme.tmp", go: "office_pc_recycle_readme" },
        { icon: "file", key: "BACK", label: "Back",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}

      ],
    };
  },

  text: () => [],

  choices: [{
  label: "Back",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
],
},

office_pc_recycle_readme: {
  title: "",
  meta: "",
  tension: 0.66,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  uiMode: "computer",
  computerUI: {
    type: "error",
    title: "readme.tmp",
    message: [
      "TEMP FILE",
      "",
      "If you found this, you were looking.",
      "",
      "That means the workstation noticed you.",
    ],
    buttons: [{ label: "Back", go: "office_pc_recycle" }],
  },
  text: () => [],
},

// ------------------------------------------------------------
// ARCHIVE — LOCKED VIEW (visit-gated)
// ------------------------------------------------------------
office_pc_archive_locked: {
  title: "",
  meta: "",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  uiMode: "computer",

  computerUI: (state) => {
    const v = state.flags?.pc_visits ?? 0;
    return {
      type: "error",
      title: "ARCHIVE",
      message: [
        "This folder is currently in use.",
        "",
        "Access is restricted.",
        "",
        v < 2
          ? "A warning flashes and vanishes too fast to read."
          : "You could swear it wasn’t locked a second ago.",
      ],
      buttons: [
        {
  label: "Back",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
,
      ],
    };
  },

  text: () => [],
},

// ------------------------------------------------------------
// ARCHIVE — OPEN (folder desktop style)
// ------------------------------------------------------------
office_pc_archive: {
  title: "",
  meta: "",
  tension: 0.85,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),

  uiMode: "computer",

  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.pc_archive_found = true;
    state.flags.ev_work_pc_archive = true; // evidence hook

    // optional: bump evidence counter once
    state.flags.evidence_count = state.flags.evidence_count ?? 0;
    if (!state.flags._ev_pc_archive_counted) {
      state.flags._ev_pc_archive_counted = true;
      state.flags.evidence_count += 1;
    }
  },

  computerUI: {
    type: "desktop",
    wallpaperText: "ARCHIVE",
    hint: "Files don’t want to be found. This one does.",
    icons: [
      { icon: "file", label: "CONTINUITY_PROTOCOLS.txt", go: "office_doc_continuity" },
      { icon: "file", label: "INCIDENT_LOG_12A.txt", go: "office_doc_incident" },
      { icon: "file", label: "SUBLEVEL_ACCESS.csv", go: "office_doc_sublevel" },
      { icon: "folder", label: "BACK", go: "office_pc" },
    ],
    buttons: [
      { label: "BACK", go: "office_pc" },
      
    ],
  },

  text: () => [],
},


// ------------------------------------------------------------
// READABLE “FILES” — AS PC MODALS (type: error)
// ------------------------------------------------------------
office_doc_continuity: {
  uiMode: "computer",

  onEnter: (state) => {
    state.flags = state.flags || {};
    // Optional: mark that the player read it
    state.flags.ev_read_continuity = true;

    // Optional: only apply sanity once (reading "truth" stings once)
    if (!state.flags._sanity_continuity_once) {
      state.flags._sanity_continuity_once = true;
      // if you want consequence:
      // state.maxSanity = state.maxSanity ?? 10;
      // state.sanity = clamp((state.sanity ?? state.maxSanity) - 1, 0, state.maxSanity);
    }
  },

  // ✅ For the desktop-modal system: return LINES ONLY.
  // Your desktop click opens these lines in a window (modal).
  computerUI: (state) => ({
    lines: [
      "CONTINUITY_PROTOCOLS.txt",
      "----------------------------------------",
      "CONTINUITY PROTOCOLS — INTERNAL",
      "Version: 3.1",
      "",
      "1. Maintain civic stability through routine reinforcement.",
      "",
      "2. If instability spikes, initiate corrective scheduling.",
      "",
      "3. If subject exhibits pattern recognition beyond tolerance:",
      "   — reduce exposure",
      "   — redirect attention",
      "   — apply failsafe if necessary",
      "",
      "4. Do not confirm loop terminology in subject presence.",
      "",
      "5. Municipal Continuity Authority supersedes departmental policy.",
      "",
      "Signed:",
      "Office of Executive Continuity",
      "",
      ...(state.flags?.seed_retrofit_memo
        ? ["You swallow. You saw that word: “failsafe.”", ""]
        : []),
      "Your cursor blinks at the bottom of the file.",
      "It feels like it’s waiting for you to type a confession.",
    ],
  }),

  // ✅ Not used in PC mode, so remove them to avoid confusion
  text: () => [],
},

office_doc_incident: {
  title: "",
  meta: "",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),

  uiMode: "computer",

  computerUI: {
    type: "error",
    title: "INCIDENT_LOG_12A.txt",
    message: [
      "INCIDENT LOG — 12A",
      "",
      "Time: 17:42",
      "Location: Crosswalk (Downtown perimeter)",
      "",
      "Outcome: Correction successful.",
      "",
      "Subject response: minimal vocalization.",
      "Public reaction: non-interference consistent with reinforcement.",
      "",
      "Notes:",
      "— Subject awareness trending upward.",
      "— Recommend controlled exposure to reduce curiosity.",
      "",
      "Filed under: MUNICIPAL CONTINUITY",
    ],
    buttons: [{ label: "Back", go: "office_pc_archive" }],
  },

  text: () => [],

  choices: [{ label: "Back", action: "loseSanity", data: { amount: 1 }, go: "office_pc_archive" }],
},

office_doc_sublevel: {
  title: "",
  meta: "",
  tension: 0.94,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),

  uiMode: "computer",

  computerUI: (state) => {
    state.flags = state.flags || {};
    state.flags.seed_governor_name = true;

    return {
      type: "error",
      title: "SUBLEVEL_ACCESS.csv",
      message: [
        "SUBLEVEL ACCESS — EXPORT",
        "",
        "DEPT,ROLE,STATUS",
        "MUNICIPAL_CONTINUITY,ADMIN,ACTIVE",
        "EXEC_CONTINUITY,OVERSIGHT,ACTIVE",
        "GOV_OFFICE,CUSTODIAN,ACTIVE",
        "",
        "One line is unredacted for a split second before the file refreshes:",
        "",
        "… MAYOR’S OFFICE — OBSERVER — ACTIVE …",
        "",
        "Then it’s gone.",
        "",
        "You didn’t touch anything.",
      ],
      buttons: [{ label: "Back", go: "office_pc_archive" }],
    };
  },

  text: () => [],

  choices: [{ label: "Back", action: "loseSanity", data: { amount: 1 }, go: "office_pc_archive" }],
},

// ------------------------------------------------------------
// HR HALLWAY (danger: minor injury + pressure)
// ------------------------------------------------------------
office_hr_hall: {
  title: "HR Hallway",
  meta: "Quiet where it shouldn’t be.",
  tension: 0.72,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    const n = state.flags.hr_hall_visits ?? 0;
    state.flags.hr_hall_visits = n + 1;

    if (n === 0) {
      return [
        "The hallway outside HR is always colder.",
        "",
        "Not the air.",
        "",
        "The feeling.",
        "",
        "A door at the end has a frosted window.",
        "The light behind it never changes.",
      ];
    }

    if (n === 1) {
      return [
        "A soft clicking sound comes from behind the frosted glass.",
        "",
        "Like a keyboard.",
        "",
        "Like someone typing without stopping.",
      ];
    }

    return [
      "You shouldn’t be here.",
      "",
      "But part of you wants to see if the building reacts when you ignore its cues.",
    ];
  },
  choices: [
    { label: "Approach the frosted door", go: "office_hr_door" },
    { label: "Back to the floor", go: "office_floor" },
  ],
},

office_hr_door: {
  title: "HR Door",
  meta: "A boundary disguised as policy.",
  tension: 0.86,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    if (state.flags.hr_door_opened) {
      return [
        "The door is closed again.",
        "",
        "You can’t tell if it ever opened.",
        "",
        "Your finger still stings where it touched the handle.",
      ];
    }

    return [
      "The handle is warm.",
      "",
      "That’s wrong.",
      "",
      "You set your hand on it anyway.",
      "",
      "The warmth is not skin warmth.",
      "It’s machine warmth.",
    ];
  },
  choices: [
    { label: "Open it", go: "office_hr_event" },
    { label: "Back off", action: "loseSanity", data: { amount: 1 }, go: "office_floor" },
  ],
},

office_hr_event: {
  title: "Corrective Scheduling",
  meta: "You shouldn’t have done that.",
  tension: 0.95,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  text: (state) => {
    state.flags.hr_door_opened = true;

    // mild injury: paper cut from a “form” shoved through
    return [
      "The door opens one inch.",
      "",
      "Not enough to see inside.",
      "Enough to receive something.",
      "",
      "A form slides out through the gap like it was waiting there.",
      "",
      "You grab it.",
      "",
      "Paper cuts your finger — sharp, precise.",
      "",
      "The door closes.",
      "",
      "The form reads:",
      "",
      "“WELLNESS CHECK-IN — NOW.”",
      "",
      "At the bottom, stamped in faint ink:",
      "a spiral made of linked circles.",
    ];
  },
  choices: [
    { label: "Pocket the form", action: "takeDamage", data: { amount: 1, reason: "Paper cut." }, go: "office_floor" },
    { label: "Drop it (you still read it)", action: "loseSanity", data: { amount: 1 }, go: "office_floor" },
  ],
},

// ------------------------------------------------------------
// COFFEE (optional buy, small heal)
// ------------------------------------------------------------
office_coffee: {
  title: "Coffee Shop",
  meta: "A smile that feels practiced.",
  tension: 0.30,
  backgroundLayers: () => ({
    bg: "coffee_bg",
    light: "coffee_light",
    glow: "coffee_glow",
    fg: "coffee_fg",
  }),
  text: () => [
    "A chalkboard menu lists drinks you’re pretty sure aren’t legal.",
    "",
    "A tip jar rattles when nobody touches it.",
    "",
    "Still… coffee is coffee.",
  ],
  choices: [
    { label: "Buy coffee ($4)", action: "buyItem", data: { id: "coffee", price: 4 }, go: "office_floor" },
    { label: "Back", go: "office_floor" },
  ],
},

// ------------------------------------------------------------
// AFTER WORK EXIT (this can lead into your existing first death)
// ------------------------------------------------------------
office_after_work_exit: {
  title: "After Work",
  meta: "You made it through the day.",
  tension: 0.55,
  backgroundLayers: () => ({
    bg: "BG_CITY_EVENING_PLACEHOLDER",
  }),
  onEnter: (state) => {
    // sets loop awareness after the first death happens
    // do NOT set first_death_seen here if you already do it elsewhere
  },
  text: (state) => {
    // If they found the archive, escalate dread
    if (state.flags.pc_archive_found) {
      return [
        "You step outside into evening traffic.",
        "",
        "The sky is the color it’s supposed to be.",
        "",
        "Your phone buzzes once.",
        "",
        "No notification.",
        "",
        "Just a single vibration like a system check.",
        "",
        "You think about the word “failsafe.”",
      ];
    }

    return [
      "You step outside into evening traffic.",
      "",
      "The sky is the color it’s supposed to be.",
      "",
      "You think about dinner.",
      "",
      "You never hear the car.",
    ];
  },
  choices: [
    { label: "Head home", go: "death_car" }, // you already have death_car looping back
    { label: "Take the long way (don’t)", action: "loseSanity", data: { amount: 1 }, go: "death_car" },
  ],
},


// ============================================================
// ACT 0 — PART 2
// LOCATION 3: STREET / CROSSWALK (first public death)
// ============================================================

street_evening: {
  title: "Evening",
  meta: "The air feels too clean.",
  tension: 0.55,
  backgroundLayers: () => ({
    bg: "street_evening_bg",
    light: "street_evening_light",
    glow: "street_evening_glow",
    fg: "street_evening_fg",
  }),
  text: (state) => {
    if (!state.flags.street_evening_seen) {
      state.flags.street_evening_seen = true;
      return [
        "You step out into the evening like the day never happened.",
        "",
        "Streetlights buzz.",
        "Cars pass with their headlights too white.",
        "",
        "A pedestrian across the street pauses at the curb, staring forward.",
        "",
        "Not at you.",
        "",
        "At the crosswalk signal.",
      ];
    }

    return [
      "The street looks normal.",
      "",
      "That’s what makes your body tense.",
      "",
      "Because normal feels like a mask you’re not supposed to touch.",
    ];
  },
  choices: [
    { label: "Walk toward the crosswalk", go: "crosswalk_approach" },
    { label: "Check your phone", go: "street_phone_boundary" },
    { label: "Turn back (avoid it)", action: "loseSanity", data: { amount: 1 }, go: "street_turn_back" },
  ],
},

street_phone_boundary: {
  title: "Phone",
  meta: "No signal.",
  tension: 0.62,
  backgroundLayers: () => ({
    bg: "street_evening_bg",
    light: "street_evening_light",
    glow: "street_evening_glow",
    fg: "street_evening_fg",
  }),
  text: () => [
    "Your phone shows bars.",
    "",
    "But nothing loads.",
    "",
    "Maps flashes a message:",
    "",
    "“Unable to establish civic boundary.”",
    "",
    "Then it closes itself.",
    "",
    "Like it’s embarrassed.",
  ],
  choices: [{ label: "Put it away", go: "crosswalk_approach" }],
},

street_turn_back: {
  title: "Evening",
  meta: "You try not to be curious.",
  tension: 0.70,
  backgroundLayers: () => ({
    bg: "street_evening_bg",
    light: "street_evening_light",
    glow: "street_evening_glow",
    fg: "street_evening_fg",
  }),
  text: () => [
    "You turn back toward home.",
    "",
    "Your feet feel heavy.",
    "",
    "Like the pavement is resisting you in tiny increments.",
    "",
    "You hate that you noticed.",
  ],
  choices: [
    { label: "Force yourself to keep walking", go: "crosswalk_approach" },
  ],
},

crosswalk_approach: {
  title: "Crosswalk",
  meta: "Routine geometry.",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "crosswalk_bg",
    light: "crosswalk_light",
    glow: "crosswalk_glow",
    fg: "crosswalk_fg",
  }),
  text: (state) => {
    if (!state.flags.crosswalk_first_seen) {
      state.flags.crosswalk_first_seen = true;
      return [
        "The signal counts down.",
        "",
        "A little digital man stands still, waiting to be allowed to move.",
        "",
        "You watch other people wait without impatience.",
        "",
        "Not like they’re being polite.",
        "",
        "Like they’ve been trained.",
      ];
    }

    return [
      "The signal changes.",
      "",
      "You feel it in your teeth before you see it.",
      "",
      "A tiny click in the air.",
      "",
      "As if something in the city just advanced a step.",
    ];
  },
  choices: [
    { label: "Cross", go: "death_crosswalk" },
    { label: "Wait another cycle", action: "loseSanity", data: { amount: 1 }, go: "crosswalk_wait_cycle" },
  ],
},

crosswalk_wait_cycle: {
  title: "Crosswalk",
  meta: "You delay the inevitable.",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "crosswalk_bg",
    light: "crosswalk_light",
    glow: "crosswalk_glow",
    fg: "crosswalk_fg",
  }),
  text: () => [
    "You wait.",
    "",
    "The digital man changes.",
    "Counts down.",
    "Returns to standing still.",
    "",
    "A car passes slowly like it’s studying you.",
    "",
    "A woman across the street whispers something under her breath.",
    "",
    "You can’t hear the words.",
    "But you can hear the certainty.",
  ],
  choices: [
    { label: "Cross", go: "death_crosswalk" },
  ],
},

death_crosswalk: {
  title: "Crosswalk",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_bg",
    light: "crosswalk_light",
    glow: "crosswalk_glow",
    fg: "crosswalk_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.first_public_death = true;
    state.flags.loop_awareness = true;

    // Optional: if you have a death FX system tied to node meta
    state.flags.last_death = "crosswalk";

    // Health/Sanity impact for the *memory* of dying (not physical — loop)
    state.hp = Math.max(1, (state.hp ?? 10) - 2);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 2);
  },
  text: (state) => [
    "The signal turns.",
    "",
    "You step forward.",
    "",
    "A car accelerates.",
    "",
    "There is no hesitation.",
    "No correction.",
    "",
    "The last thing you notice is how quiet everyone else stays.",
    "",
    ...(state.flags.ev_work_pc_archive
      ? ["A line from the file flashes in your mind:", "“Outcome: Correction successful.”", ""]
      : []),
    "Then —",
    "",
    "nothing.",
  ],
  choices: [
    { label: "—", go: "loop_wakeup_1" },
  ],
},

loop_wakeup_1: {
  title: "Morning",
  meta: "Again.",
  tension: 0.72,
  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),
  text: () => [
    "You wake up gasping.",
    "",
    "Your throat burns like you screamed into your pillow.",
    "",
    "Your heart is racing.",
    "",
    "You remember the impact.",
    "",
    "The apartment looks exactly the same.",
    "",
    "That is not comforting.",
  ],
  choices: [
    { label: "Get up", go: "intro_morning" },
    { label: "Stare at the ceiling (count your breaths)", action: "loseSanity", data: { amount: 1 }, go: "loop_wakeup_2" },
  ],
},

loop_wakeup_2: {
  title: "Morning",
  meta: "The room feels staged.",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),
  text: () => [
    "You count your breaths.",
    "",
    "One.",
    "Two.",
    "Three.",
    "",
    "At five, you realize something:",
    "",
    "You can still taste last night’s air.",
    "",
    "The loop didn’t reset you cleanly.",
    "",
    "It reset the room.",
  ],
  choices: [{ label: "Get up", go: "intro_morning" }],
},

  // ============================================================
// ACT 0 — PART 2
// LOCATION 4: DOWNTOWN ARRIVAL + PUBLIC RECORDS ANNEX
// First “lead-driven” location, not open-world.
// ============================================================

downtown_arrival: {
  title: "Downtown",
  meta: "The city feels like it’s holding its breath.",
  tension: 0.82,
  backgroundLayers: () => ({
    bg: "downtown_bg",
    light: "downtown_light",
    glow: "downtown_glow",
    fg: "downtown_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.downtown_seen = true;
  },
  text: (state) => {
    if (!state.flags.lead_downtown) {
      return [
        "You shouldn’t be here.",
        "",
        "Not because it’s dangerous.",
        "",
        "Because you don’t have a reason yet.",
        "",
        "And the city seems to require reasons.",
      ];
    }

    const lines = [
      "You follow the address.",
      "",
      "Downtown looks normal at first glance —",
      "glass, brick, buses, people who don’t meet each other’s eyes.",
      "",
      "Then you notice something repeating:",
      "",
      "The spiral stamp.",
      "Linked circles.",
      "On stickers. On paper. On tiny plaques near doors.",
      "",
      "Municipal Continuity.",
    ];

    if (state.flags.ev_work_pc_archive) {
      lines.push(
        "",
        "Your skin prickles.",
        "",
        "Because you’ve seen it in the ARCHIVE.",
        "And the files weren’t supposed to be real."
      );
    }

    return lines;
  },
  choices: (state) => {
    if (!state.flags.lead_downtown) {
      return [
        { label: "Go back (find a reason)", go: "intro_morning" },
      ];
    }

    return [
      { label: "Approach the Public Records Annex", go: "records_exterior" },
      { label: "Walk the block (look for other entrances)", go: "downtown_walk_block" },
      { label: "Head toward the crosswalk perimeter", go: "crosswalk_perimeter" },
      { label: "Leave downtown (for now)", go: "intro_morning" },
    ];
  },
},

downtown_walk_block: {
  title: "Downtown",
  meta: "You learn by circling.",
  tension: 0.86,
  backgroundLayers: () => ({
    bg: "downtown_bg",
    light: "downtown_light",
    glow: "downtown_glow",
    fg: "downtown_fg",
  }),
  text: (state) => {
    state.flags.downtown_laps = (state.flags.downtown_laps ?? 0) + 1;
    const n = state.flags.downtown_laps;

    if (n === 1) {
      return [
        "You circle the block slowly.",
        "",
        "A man smoking outside a building keeps his eyes forward.",
        "",
        "But his posture says he’s watching everything.",
        "",
        "You pass a door with a small plaque:",
        "",
        "“EXECUTIVE CONTINUITY — OVERSIGHT”",
        "",
        "No hours listed.",
        "No receptionist in sight.",
      ];
    }

    if (n === 2) {
      state.flags.seed_exec_continuity_office = true;
      return [
        "You circle again.",
        "",
        "The plaque is still there.",
        "",
        "You swear the letters look deeper, like they were pressed into the metal.",
        "",
        "You don’t approach the door.",
        "",
        "Not yet.",
      ];
    }

    return [
      "You circle until your feet feel numb.",
      "",
      "Downtown has too many cameras.",
      "",
      "Not visible ones.",
      "",
      "The kind you feel in your spine.",
    ];
  },
  choices: [
    { label: "Back to the Records Annex", go: "records_exterior" },
    { label: "Leave downtown", go: "intro_morning" },
  ],
},

records_exterior: {
  title: "Public Records Annex",
  meta: "A building designed to be uninteresting.",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "records_ext_bg",
    light: "records_ext_light",
    glow: "records_ext_glow",
    fg: "records_ext_fg",
  }),
  text: (state) => {
    const lines = [
      "The building is plain.",
      "",
      "A place meant to discourage curiosity.",
      "",
      "The sign reads: PUBLIC RECORDS ANNEX",
      "",
      "There’s a smaller placard beneath it:",
      "",
      "“Certain records restricted under Municipal Continuity Authority.”",
    ];

    if (state.flags.seed_retrofit_memo) {
      lines.push(
        "",
        "You think about the word on the work order:",
        "“Containment.”"
      );
    }

    return lines;
  },
  choices: [
    { label: "Go inside", go: "records_lobby" },
    { label: "Inspect the placard", go: "records_placard" },
    { label: "Leave (for now)", go: "downtown_arrival" },
  ],
},

records_placard: {
  title: "Placard",
  meta: "Authority in small print.",
  tension: 0.90,
  backgroundLayers: () => ({
    bg: "records_ext_bg",
    light: "records_ext_light",
    glow: "records_ext_glow",
    fg: "records_ext_fg",
  }),
  text: (state) => {
    state.flags.ev_records_stamp_match = true;
    return [
      "You lean closer.",
      "",
      "A seal is pressed into the corner of the placard:",
      "",
      "A spiral made of linked circles.",
      "",
      "Exactly like the one on your flyer.",
      "Exactly like the one in the office memos.",
      "",
      "This isn’t a coincidence.",
      "",
      "It’s a system.",
    ];
  },
  choices: [{ label: "Inside", go: "records_lobby" }],
},

records_lobby: {
  title: "Records Lobby",
  meta: "Quiet, staffed, controlled.",
  tension: 0.90,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    if (!state.flags.records_lobby_seen) {
      state.flags.records_lobby_seen = true;
      return [
        "The air smells like paper and toner.",
        "",
        "A clerk sits behind thick glass.",
        "",
        "A sign on the counter reads:",
        "",
        "“REQUESTS REQUIRE VALID JUSTIFICATION.”",
        "",
        "Another sign, smaller:",
        "“Certain topics may require supervisory oversight.”",
        "",
        "You feel the building waiting to learn what kind of person you are.",
      ];
    }

    return [
      "The clerk doesn’t look up immediately.",
      "",
      "Not because they’re busy.",
      "",
      "Like they’re letting the camera record you standing there.",
    ];
  },
  choices: [
    { label: "Speak to the clerk", go: "records_clerk" },
    { label: "Search the public brochure rack", go: "records_brochure_rack" },
    { label: "Look for a restroom (explore hallway)", go: "records_hallway" },
    { label: "Leave the building", go: "records_exterior" },
  ],
},

records_brochure_rack: {
  title: "Brochure Rack",
  meta: "Free information. Curated.",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    if (state.flags.records_brochure_taken) {
      return [
        "The brochures are still perfectly aligned.",
        "",
        "Like someone resets the rack when nobody is watching.",
      ];
    }

    state.flags.records_brochure_taken = true;
    state.flags.ev_records_budget_page = true;

    return [
      "You pull a brochure free.",
      "",
      "“HOW TO REQUEST PUBLIC RECORDS”",
      "",
      "Most of it is normal.",
      "",
      "But one page lists restricted topics.",
      "",
      "You catch a phrase that doesn’t belong in civic paperwork:",
      "",
      "“Continuity Events — Classification Level: SUBLEVEL”",
      "",
      "Your fingers tighten on the paper.",
    ];
  },
  choices: [
    { label: "Pocket it", go: "records_lobby" },
    { label: "Read it again", action: "loseSanity", data: { amount: 1 }, go: "records_brochure_read" },
  ],
},

records_brochure_read: {
  title: "Brochure",
  meta: "The words feel rehearsed.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: () => [
    "You reread the page.",
    "",
    "It’s written like someone is trying to be helpful.",
    "",
    "But the phrasing is wrong —",
    "",
    "like it was translated from a language used only inside systems.",
  ],
  choices: [{ label: "Back", go: "records_lobby" }],
},

records_hallway: {
  title: "Records Hallway",
  meta: "Doors you’re not meant to open.",
  tension: 0.94,
  backgroundLayers: () => ({
    bg: "records_hall_bg",
    light: "records_hall_light",
    glow: "records_hall_glow",
    fg: "records_hall_fg",
  }),
  text: (state) => {
    const n = state.flags.records_hall_visits ?? 0;
    state.flags.records_hall_visits = n + 1;

    if (n === 0) {
      return [
        "The hallway is narrow and too quiet.",
        "",
        "A door at the end says:",
        "AUTHORIZED PERSONNEL ONLY",
        "",
        "Another door has no sign at all.",
        "",
        "That one worries you more.",
      ];
    }

    if (n === 1) {
      return [
        "You hear paper moving behind one door.",
        "",
        "Not shuffling.",
        "",
        "Like someone turning pages carefully.",
        "",
        "As if reading aloud to themselves in silence.",
      ];
    }

    state.flags.ev_records_name_fragment = true;
    return [
      "A filing cart sits in the hall.",
      "",
      "A folder on top is labeled in black marker:",
      "",
      "“CONTINUITY OVERSIGHT / MAYOR’S OFFICE”",
      "",
      "A hand reaches out from inside the doorway and pulls the cart away quickly.",
      "",
      "You didn’t see a face.",
      "",
      "But you feel the message:",
      "",
      "You are not invisible here.",
    ];
  },
  choices: [
    { label: "Back to the lobby", go: "records_lobby" },
    { label: "Approach the AUTHORIZED door (bad idea)", action: "loseSanity", data: { amount: 1 }, go: "records_authorized_door" },
  ],
},

records_authorized_door: {
  title: "Authorized Door",
  meta: "A boundary disguised as policy.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "records_hall_bg",
    light: "records_hall_light",
    glow: "records_hall_glow",
    fg: "records_hall_fg",
  }),
  text: () => [
    "You reach for the handle.",
    "",
    "It’s warm.",
    "",
    "Not from sunlight.",
    "",
    "From use.",
    "",
    "A voice behind you says, casually:",
    "",
    "\"That door doesn’t open for the public.\"",
  ],
  choices: [
    { label: "Turn around", go: "records_clerk" },
    { label: "Pretend you were lost", go: "records_clerk" },
  ],
},

records_clerk: {
  title: "Clerk",
  meta: "They know what you’re here for.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    const hasAnyEvidence =
      !!state.flags.ev_work_pc_archive ||
      !!state.flags.seed_retrofit_memo ||
      !!state.flags.ev_records_stamp_match;

    if (!state.flags.records_clerk_intro) {
      state.flags.records_clerk_intro = true;
      return [
        "The clerk looks up slowly.",
        "",
        "Their eyes flick to your hands.",
        "To your pockets.",
        "",
        "\"Request?\" they ask.",
        "",
        "Not “How can I help.”",
        "Just: request.",
      ];
    }

    if (!hasAnyEvidence) {
      return [
        "\"What are you looking for?\"",
        "",
        "You open your mouth.",
        "",
        "And realize you don’t know what words are safe to say here.",
        "",
        "\"We can’t process vague curiosity,\" the clerk says.",
        "",
        "\"We require justification.\"",
      ];
    }

    return [
      "\"Justification,\" the clerk repeats, watching your face.",
      "",
      "\"If you have a document number, we can help.\"",
      "",
      "\"If you don’t…\"",
      "",
      "They tilt their head slightly.",
      "",
      "\"…then you’re guessing.\"",
    ];
  },
  choices: (state) => {
    const choices = [];

    // Soft puzzle: you need to present *something*
    if (state.flags.seed_retrofit_memo) {
      choices.push({
        label: "Mention the work order stamp (linked circles)",
        go: "records_clerk_stamp_response",
      });
    }

    if (state.flags.ev_work_pc_archive) {
      choices.push({
        label: "Mention “Municipal Continuity Authority”",
        go: "records_clerk_continuity_response",
      });
    }

    choices.push(
      { label: "Ask for general budget records", go: "records_clerk_budget_response" },
      { label: "Back away (observe first)", go: "records_lobby" }
    );

    return choices;
  },
},

records_clerk_stamp_response: {
  title: "Clerk",
  meta: "You touched the right word.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags.records_stamp_confirmed = true;
    return [
      "The clerk’s expression changes for half a second.",
      "",
      "Not surprise.",
      "",
      "Recognition.",
      "",
      "\"That stamp isn’t supposed to circulate,\" they say.",
      "",
      "\"Where did you see it?\"",
      "",
      "The question feels like a trap.",
    ];
  },
  choices: [
    { label: "Lie (it was on a flyer)", check: { stat: "charm", dc: 3 }, onPass: "records_clerk_lie_pass", onFail: "records_clerk_lie_fail" },
    { label: "Tell the truth (work order)", go: "records_clerk_truth" },
  ],
},

records_clerk_lie_pass: {
  title: "Clerk",
  meta: "You keep it vague.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags.records_access_level1 = true;
    return [
      "\"A flyer,\" you say.",
      "",
      "The clerk studies you.",
      "",
      "\"Then you want public paperwork.\"",
      "",
      "They slide a form under the glass.",
      "",
      "\"Fill it out. Don’t write the wrong words.\"",
    ];
  },
  choices: [
    { label: "Take the request form", go: "records_form_fill" },
    { label: "Leave with the form", go: "records_exterior" },
  ],
},

records_clerk_lie_fail: {
  title: "Clerk",
  meta: "They smell the lie.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: () => [
    "You speak.",
    "",
    "The clerk’s eyes narrow.",
    "",
    "\"No,\" they say softly.",
    "",
    "\"That’s not true.\"",
    "",
    "They don’t raise their voice.",
    "",
    "That’s what scares you.",
  ],
  choices: [
    { label: "Back off", action: "loseSanity", data: { amount: 1 }, go: "records_lobby" },
    { label: "Try again (truth)", go: "records_clerk_truth" },
  ],
},

records_clerk_truth: {
  title: "Clerk",
  meta: "Now you’re on the record.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags.records_truth_told = true;
    state.flags.records_access_level1 = true;
    return [
      "You say the words: work order.",
      "",
      "The clerk doesn’t react like a civilian clerk.",
      "",
      "They react like someone who knows what those orders are for.",
      "",
      "\"Fine,\" they say.",
      "",
      "\"Level One access only.\"",
      "",
      "A form slides out beneath the glass.",
      "",
      "\"Fill it out. Carefully.\"",
    ];
  },
  choices: [
    { label: "Take the request form", go: "records_form_fill" },
    { label: "Leave with the form", go: "records_exterior" },
  ],
},

records_clerk_continuity_response: {
  title: "Clerk",
  meta: "You said the wrong right thing.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => [
    "You say: Municipal Continuity Authority.",
    "",
    "The clerk’s eyes flick toward a camera you didn’t notice.",
    "",
    "\"We don’t say that phrase at the counter,\" they say.",
    "",
    "Not angry.",
    "",
    "Afraid.",
    "",
    ...(state.flags.ev_work_pc_archive
      ? ["You think about the file that warned: don’t confirm loop terminology in subject presence.", ""]
      : []),
    "\"Fill out a request,\" the clerk says quickly.",
  ],
  choices: [
    { label: "Take the request form", action: "loseSanity", data: { amount: 1 }, go: "records_form_fill" },
    { label: "Back away", go: "records_lobby" },
  ],
},

records_clerk_budget_response: {
  title: "Clerk",
  meta: "Paper trail first.",
  tension: 0.90,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags.records_access_level1 = true;
    return [
      "\"Budget,\" the clerk repeats.",
      "",
      "\"We have plenty of that.\"",
      "",
      "\"Most of it meaningless.\"",
      "",
      "They slide a form under the glass.",
      "",
      "\"Fill it out.\"",
    ];
  },
  choices: [
    { label: "Take the request form", go: "records_form_fill" },
    { label: "Back", go: "records_lobby" },
  ],
},

records_form_fill: {
  title: "Request Form",
  meta: "The wrong words matter.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "records_form_bg",
    light: "records_form_light",
    glow: "records_form_glow",
    fg: "records_form_fg",
  }),
  text: (state) => [
    "The form has boxes and polite language.",
    "",
    "It asks what you’re requesting.",
    "",
    "It asks why.",
    "",
    "At the bottom, in tiny print:",
    "",
    "“Requests may be reviewed by Executive Continuity Oversight.”",
    "",
    "You suddenly understand the building isn’t just storing records.",
    "",
    "It’s filtering people.",
  ],
  choices: [
    { label: "Request: Infrastructure surcharge / sublevel retrofit", go: "records_form_submit_retrofit" },
    { label: "Request: Budget line items (general)", go: "records_form_submit_budget" },
    { label: "Back off (don’t submit yet)", go: "records_lobby" },
  ],
},

records_form_submit_retrofit: {
  title: "Request Submitted",
  meta: "Now you wait.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  onEnter: (state) => {
    state.flags.records_request_retrofit = true;
    state.flags.unlock_records_level1 = true;
  },
  text: () => [
    "You slide the form back under the glass.",
    "",
    "The clerk reads it without moving their lips.",
    "",
    "Then stamps it once.",
    "",
    "The linked-circle spiral.",
    "",
    "\"Come back later,\" they say.",
    "",
    "\"And don’t bring attention with you.\"",
  ],
  choices: [
    { label: "Leave (process what you learned)", go: "downtown_arrival" },
    { label: "Try to push for immediate access (risky)", action: "loseSanity", data: { amount: 1 }, go: "records_push_access" },
  ],
},

records_form_submit_budget: {
  title: "Request Submitted",
  meta: "Paperwork as a leash.",
  tension: 0.94,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  onEnter: (state) => {
    state.flags.records_request_budget = true;
    state.flags.unlock_records_level1 = true;
  },
  text: () => [
    "You submit the form.",
    "",
    "The clerk stamps it once.",
    "",
    "\"Level One only,\" they say.",
    "",
    "\"Anything else requires oversight.\"",
    "",
    "They slide a thin packet out under the glass.",
    "",
    "Just a few pages.",
    "But they feel heavy.",
  ],
  choices: [
    { label: "Take the packet", go: "records_packet_read" },
    { label: "Leave with it", go: "downtown_arrival" },
  ],
},

records_packet_read: {
  title: "Packet",
  meta: "The truth hides in numbers.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "records_packet_bg",
    light: "records_packet_light",
    glow: "records_packet_glow",
    fg: "records_packet_fg",
  }),
  onEnter: (state) => {
    state.flags.ev_records_budget_page = true;
  },
  text: () => [
    "The packet is budget summaries and allocations.",
    "",
    "Most of it is bland.",
    "",
    "Then you see a line item that doesn’t belong:",
    "",
    "“CIVIC STABILITY OPERATIONS — CONTINUITY EVENTS”",
    "",
    "Under it:",
    "“SUBLEVEL INFRASTRUCTURE.”",
    "",
    "This isn’t a rumor.",
    "",
    "It’s funded.",
  ],
  choices: [
    { label: "Pocket the packet", go: "downtown_arrival" },
    { label: "Go back to the clerk", go: "records_clerk" },
  ],
},

records_push_access: {
  title: "Clerk",
  meta: "You lean too hard.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: () => [
    "\"No,\" the clerk says immediately.",
    "",
    "Not loud.",
    "",
    "Final.",
    "",
    "\"If you force this, you’ll trigger oversight.\"",
    "",
    "\"And you don’t want them paying attention to you yet.\"",
  ],
  choices: [
    { label: "Back off", go: "records_lobby" },
    { label: "Leave now", go: "downtown_arrival" },
  ],
},

  // ============================================================
// ACT 0 — PART 3
// LOCATION 1: APARTMENT (POST-RECORDS / POST-LOOP SHIFT)
// Mirror wrong + demon preserved and escalated.
// ============================================================

apartment_post_records: {
  title: "Apartment",
  meta: "It’s the same… except it isn’t.",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.apartment_post_records_seen = true;

    // subtle escalation: each loop day adds pressure
    state.flags.loop_day = (state.flags.loop_day ?? 1);
  },
  text: (state) => {
    const lines = [
      "You step into your apartment and the air feels… reset.",
      "",
      "Not cleaned.",
      "Replaced.",
    ];

    if (state.flags.ev_records_stamp_match || state.flags.ev_records_budget_page) {
      lines.push(
        "",
        "You can’t unsee the linked-circle stamp now.",
        "",
        "It’s everywhere in your mind like a watermark."
      );
    }

    if (state.flags.loop_awareness) {
      lines.push(
        "",
        "You remember dying.",
        "",
        "The room pretends you didn’t."
      );
    }

    return lines;
  },
  choices: [
    { label: "Check the mirror", go: "apartment_mirror" }, // ✅ keep your existing mirror variant node id
    { label: "Check the TV", go: "apartment_tv" },         // if you have it already
    { label: "Search the kitchen", go: "apartment_kitchen_search" },
    { label: "Check the bedroom drawer", go: "apartment_drawer_search" },
    { label: "Look at the front door (listen)", go: "apartment_door_listen" },
    { label: "Write notes (ground yourself)", action: "gainSanity", data: { amount: 1 }, go: "apartment_post_records_notes" },
    { label: "Leave the apartment", go: "apartment_leave_post_records" },
  ],
},

apartment_post_records_notes: {
  title: "Notes",
  meta: "Memory doesn’t survive the loop unless you force it to.",
  tension: 0.65,
  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.notes_written = (state.flags.notes_written ?? 0) + 1;

    const n = state.flags.notes_written;

    if (n === 1) {
      return [
        "You write down everything you remember.",
        "",
        "Crosswalk. Silence. The word: correction.",
        "",
        "Records Annex. Linked circles. Sublevel.",
        "",
        "Your hand cramps.",
        "",
        "But the page feels real.",
      ];
    }

    if (n === 2) {
      state.flags.notes_anchor = true;
      return [
        "You add a second page.",
        "",
        "A new rule:",
        "",
        "If you feel normal, you’re missing something.",
        "",
        "You underline it until the paper thins.",
      ];
    }

    return [
      "You keep writing.",
      "",
      "You’re not sure if the notebook will survive the reset.",
      "",
      "But it makes you feel less alone inside your own head.",
    ];
  },
  choices: [{ label: "Back", go: "apartment_post_records" }],
},

apartment_kitchen_search: {
  title: "Kitchen",
  meta: "A place for routine. And hidden things.",
  tension: 0.74,
  backgroundLayers: () => ({
    bg: "kitchen_bg",
    light: "kitchen_light",
    glow: "kitchen_glow",
    fg: "kitchen_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const n = state.flags.kitchen_searches ?? 0;
    state.flags.kitchen_searches = n + 1;

    if (n === 0) {
      return [
        "You open cabinets like you’re checking your own life for tampering.",
        "",
        "Everything is where it should be.",
        "",
        "Which is the problem.",
        "",
        "A sticky note on the inside of the cabinet door reads:",
        "",
        "“DON’T SAY CONTINUITY OUT LOUD.”",
      ];
    }

    if (n === 1) {
      state.flags.found_small_magnet = true;
      return [
        "Behind the spice rack, you find a small magnet.",
        "",
        "Not decorative.",
        "",
        "Industrial.",
        "",
        "Stamped with linked circles.",
        "",
        "It feels like a key to something that isn’t supposed to have a key.",
      ];
    }

    return [
      "You search again.",
      "",
      "The kitchen stays cooperative.",
      "",
      "Like it’s letting you win a little.",
    ];
  },
  choices: [
    { label: "Back", go: "apartment_post_records" },
  ],
},

apartment_drawer_search: {
  title: "Bedroom Drawer",
  meta: "Personal history is the easiest thing to rewrite.",
  tension: 0.78,
  backgroundLayers: () => ({
    bg: "bedroom_bg",
    light: "bedroom_light",
    glow: "bedroom_glow",
    fg: "bedroom_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    if (state.flags.found_building_pass) {
      return [
        "The drawer is open.",
        "",
        "The pass is still there.",
        "",
        "You don’t remember getting it.",
        "",
        "But your fingerprints are on it anyway.",
      ];
    }

    // Gate the pass: either they wrote notes twice OR have records evidence
    const canSpawn =
      (state.flags.notes_written ?? 0) >= 2 ||
      !!state.flags.ev_records_budget_page ||
      !!state.flags.ev_records_name_fragment;

    if (!canSpawn) {
      return [
        "You dig through the drawer.",
        "",
        "Receipts. Old chargers. A pen with no ink.",
        "",
        "Nothing that helps.",
        "",
        "You feel the loop laughing softly in the background.",
      ];
    }

    state.flags.found_building_pass = true;
    state.flags.unlock_downtown_attempt2 = true;

    return [
      "Under the liner, you find a plastic access pass.",
      "",
      "No logo.",
      "No name.",
      "",
      "Just a barcode and a linked-circle stamp in faint ink.",
      "",
      "On the back, handwritten:",
      "",
      "“ANNEX BASEMENT — SERVICE.”",
    ];
  },
  choices: [
    { label: "Back", go: "apartment_post_records" },
  ],
},

apartment_door_listen: {
  title: "Front Door",
  meta: "Something is always on the other side.",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "door_bg",
    light: "door_light",
    glow: "door_glow",
    fg: "door_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.door_listens = (state.flags.door_listens ?? 0) + 1;

    const n = state.flags.door_listens;

    if (n === 1) {
      return [
        "You press your ear to the door.",
        "",
        "At first: nothing.",
        "",
        "Then: a faint clicking sound.",
        "",
        "Like a pen tapping paper.",
        "",
        "Like a form being stamped again and again.",
      ];
    }

    if (n === 2) {
      return [
        "You listen again.",
        "",
        "This time you hear a voice outside — soft, calm.",
        "",
        "\"Not yet,\" it says.",
        "",
        "It doesn’t sound like it’s speaking to another person.",
      ];
    }

    return [
      "You listen until you realize the sound is inside the door.",
      "",
      "Not outside.",
      "",
      "Inside the door like the apartment has a throat.",
    ];
  },
  choices: [
    { label: "Back away", action: "loseSanity", data: { amount: 1 }, go: "apartment_post_records" },
  ],
},

apartment_leave_post_records: {
  title: "Leaving",
  meta: "The city rewards movement… and punishes it.",
  tension: 0.84,
  backgroundLayers: () => ({
    bg: "hallway_bg",
    light: "hallway_light",
    glow: "hallway_glow",
    fg: "hallway_fg",
  }),
  text: (state) => {
    const lines = [
      "You step into the hallway.",
      "",
      "Your neighbor’s door is closed.",
      "",
      "You can’t remember their name.",
      "",
      "You hate that you can’t remember their name.",
    ];

    if (!state.flags.lead_downtown) {
      lines.push(
        "",
        "You still need a reason to go downtown.",
        "",
        "But now you have one: the pass."
      );
    }

    return lines;
  },
  choices: (state) => {
    const c = [];

    c.push({ label: "Go to work (keep the routine)", go: "office_lobby" });

    if (state.flags.lead_downtown) {
      c.push({ label: "Go downtown (Records Annex)", go: "downtown_arrival" });
    }

    if (state.flags.unlock_downtown_attempt2) {
      c.push({ label: "Go downtown (Annex basement service door)", go: "annex_service_exterior" });
    }

    c.push({ label: "Go back inside", go: "apartment_post_records" });

    return c;
  },
},

// ============================================================
// ACT 0 — PART 3
// DOWNTOWN: ANNEX BASEMENT SERVICE DOOR (Attempt #2)
// Gated by: found_building_pass / unlock_downtown_attempt2
// ============================================================

annex_service_exterior: {
  title: "Annex — Service Alley",
  meta: "You weren’t invited back here.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    if (!state.flags.unlock_downtown_attempt2) {
      return [
        "You find the alley by accident.",
        "",
        "A locked service door blocks the way.",
        "",
        "You don’t have anything that belongs here.",
      ];
    }

    return [
      "The alley smells like damp concrete and toner exhaust.",
      "",
      "A steel door sits under a security light.",
      "",
      "A small plate reads:",
      "",
      "“ANNEX BASEMENT — SERVICE”",
      "",
      "Under it, faint in the metal:",
      "linked circles.",
    ];
  },
  choices: (state) => {
    const c = [
      { label: "Approach the door", go: "annex_service_door" },
      { label: "Leave the alley", go: "downtown_arrival" },
    ];

    return c;
  },
},

annex_service_door: {
  title: "Service Door",
  meta: "A lock that expects compliance.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    const hasPass = !!state.flags.found_building_pass;
    const hasMagnet = !!state.flags.found_small_magnet;

    if (!hasPass) {
      return [
        "A keypad, a card reader, and a deadbolt.",
        "",
        "You could force it.",
        "",
        "But you get the feeling the building would notice.",
      ];
    }

    const lines = [
      "You hold the pass near the reader.",
      "",
      "The light blinks once.",
      "",
      "Not green.",
      "Not red.",
      "",
      "Just… acknowledgement.",
    ];

    if (hasMagnet) {
      lines.push(
        "",
        "Your magnet tugs gently toward the seam of the door.",
        "",
        "Like it wants to find something hidden inside the frame."
      );
    }

    return lines;
  },
  choices: (state) => {
    const c = [];

    if (state.flags.found_building_pass) {
      c.push({ label: "Swipe the pass", go: "annex_swipe_pass" });
    } else {
      c.push({ label: "Back", go: "annex_service_exterior" });
    }

    if (state.flags.found_small_magnet) {
      c.push({ label: "Run the magnet along the frame", go: "annex_magnet_frame" });
    }

    c.push({ label: "Leave", go: "annex_service_exterior" });

    return c;
  },
},

annex_magnet_frame: {
  title: "Door Frame",
  meta: "Hidden mechanisms love magnets.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    state.flags.annex_magnet_used = true;

    if (!state.flags.annex_seam_found) {
      state.flags.annex_seam_found = true;
      return [
        "The magnet drags along the frame.",
        "",
        "Halfway down, it catches — hard.",
        "",
        "You feel a hidden seam under the metal.",
        "",
        "A second panel, disguised as part of the frame.",
        "",
        "A cheap trick done perfectly.",
      ];
    }

    return [
      "You find the seam immediately this time.",
      "",
      "It’s like the door wants you to keep touching it.",
    ];
  },
  choices: [
    { label: "Press the hidden panel", go: "annex_hidden_panel" },
    { label: "Back", go: "annex_service_door" },
  ],
},

annex_hidden_panel: {
  title: "Hidden Panel",
  meta: "A second lock for curious people.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    state.flags.annex_hidden_panel_pressed = true;

    return [
      "You press the panel.",
      "",
      "A tiny click answers from inside the wall.",
      "",
      "Not the door.",
      "",
      "The wall.",
      "",
      "A thin slot opens just wide enough to accept something.",
      "",
      "A paper label under it reads:",
      "",
      "“REQUEST TOKEN.”",
    ];
  },
  choices: [
    { label: "Back off (this is wrong)", action: "loseSanity", data: { amount: 1 }, go: "annex_service_door" },
    { label: "Try swiping the pass again", go: "annex_swipe_pass" },
  ],
},

annex_swipe_pass: {
  title: "Reader",
  meta: "The system decides what you are.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    state.flags.annex_swipes = (state.flags.annex_swipes ?? 0) + 1;
    const n = state.flags.annex_swipes;

    // Gate basement entry behind at least ONE record evidence OR archive evidence
    const hasAuthorityLanguage =
      !!state.flags.ev_records_stamp_match ||
      !!state.flags.ev_records_budget_page ||
      !!state.flags.ev_work_pc_archive ||
      !!state.flags.records_access_level1;

    if (!hasAuthorityLanguage) {
      return [
        "You swipe the pass.",
        "",
        "The reader blinks red.",
        "",
        "A tiny speaker chirps:",
        "",
        "“INVALID ROLE.”",
        "",
        "Not “invalid card.”",
        "",
        "Role.",
      ];
    }

    // After they have “authority language”, allow entry on 2nd swipe (slow)
    if (n < 2) {
      return [
        "You swipe the pass.",
        "",
        "The light blinks.",
        "",
        "A pause.",
        "",
        "Then a calm beep — like the system is thinking.",
        "",
        "The deadbolt doesn’t move.",
        "",
        "But you hear a mechanism wake up inside the door.",
        "",
        "Try again.",
      ];
    }

    state.flags.annex_basement_unlocked = true;

    return [
      "You swipe again.",
      "",
      "Green.",
      "",
      "The deadbolt retracts with a heavy, reluctant sound.",
      "",
      "For a second, the alley feels colder.",
      "",
      "Like the building exhaled.",
      "",
      "The door is open.",
    ];
  },
  choices: (state) => {
    if (!state.flags.annex_basement_unlocked) {
      return [
        { label: "Back off", go: "annex_service_exterior" },
        { label: "Try again", go: "annex_swipe_pass" },
      ];
    }

    return [
      { label: "Go downstairs", go: "annex_basement_stairs" },
      { label: "Change your mind (leave)", go: "annex_service_exterior" },
    ];
  },
},

annex_basement_stairs: {
  title: "Basement Stairs",
  meta: "The air changes.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_stairs_bg",
    light: "annex_stairs_light",
    glow: "annex_stairs_glow",
    fg: "annex_stairs_fg",
  }),
  text: (state) => {
    state.flags.basement_steps = (state.flags.basement_steps ?? 0) + 1;

    const lines = [
      "Concrete steps descend into a dim corridor.",
      "",
      "Your footsteps sound wrong.",
      "",
      "Not loud.",
      "",
      "Recorded.",
    ];

    if (state.flags.workpc_notes_seen || state.flags.ev_work_pc_archive) {
      lines.push(
        "",
        "You remember the warning:",
        "",
        "“The archive is a door.”"
      );
    }

    return lines;
  },
  choices: [
    { label: "Continue", go: "annex_basement_corridor" },
    { label: "Go back up", action: "loseSanity", data: { amount: 1 }, go: "annex_service_exterior" },
  ],
},

annex_basement_corridor: {
  title: "Basement Corridor",
  meta: "Not public. Not safe.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    // First time: you get “caught” softly (pushback)
    if (!state.flags.basement_first_contact) {
      state.flags.basement_first_contact = true;

      return [
        "The corridor smells like wet paper and old electricity.",
        "",
        "A door at the end reads:",
        "",
        "“EXECUTIVE CONTINUITY — OVERSIGHT”",
        "",
        "There’s no handle.",
        "",
        "Just a smooth plate with the linked-circle spiral.",
        "",
        "You take one step closer —",
        "",
        "and the lights flicker like a warning.",
      ];
    }

    return [
      "The oversight door waits at the end of the corridor.",
      "",
      "You feel the system measuring your courage.",
    ];
  },
  choices: [
    { label: "Touch the spiral plate", go: "annex_oversight_plate" },
    { label: "Search the corridor (look for files)", go: "annex_basement_search" },
    { label: "Retreat upstairs", go: "annex_service_exterior" },
  ],
},

annex_basement_search: {
  title: "Basement",
  meta: "Evidence lives in corners.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    state.flags.basement_searches = (state.flags.basement_searches ?? 0) + 1;
    const n = state.flags.basement_searches;

    if (n === 1) {
      state.flags.ev_basement_signage = true;
      return [
        "You find a maintenance clipboard on a shelf.",
        "",
        "Most of the checklist is boring.",
        "",
        "Then a line that isn’t:",
        "",
        "“VERIFY CORRECTION PATHWAYS — CROSSWALK PERIMETER.”",
        "",
        "Your hands shake.",
      ];
    }

    if (n === 2 && !state.flags.found_keyring) {
      state.flags.found_keyring = true;
      return [
        "Behind a conduit box, you find a small keyring.",
        "",
        "One key is stamped with: “12A”",
        "",
        "Another key is blank.",
        "",
        "But it’s warm.",
      ];
    }

    return [
      "You search until your nerves feel raw.",
      "",
      "Basements are where cities hide things.",
      "",
      "This one hides intentions.",
    ];
  },
  choices: [
    { label: "Back to the corridor", go: "annex_basement_corridor" },
  ],
},

annex_oversight_plate: {
  title: "Oversight",
  meta: "This is where the city looks back.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    // Soft fail: pushback + harm, not a hard stop
    state.flags.oversight_touched = true;

    // If sanity low, you get a harsher response
    const sanity = state.sanity ?? 10;

    if (sanity <= 4) {
      state.hp = Math.max(1, (state.hp ?? 10) - 2);
      state.sanity = Math.max(0, sanity - 2);

      return [
        "Your finger touches the spiral plate.",
        "",
        "Cold shoots up your arm like you touched a live wire.",
        "",
        "Your vision whites out for a second.",
        "",
        "When it returns, you’re standing three steps back.",
        "",
        "You don’t remember moving.",
        "",
        "A voice in the ceiling says softly:",
        "",
        "\"Not yet.\"",
      ];
    }

    state.hp = Math.max(1, (state.hp ?? 10) - 1);
    state.sanity = Math.max(0, sanity - 1);

    return [
      "You touch the spiral plate.",
      "",
      "It vibrates — faint, like a phone on silent.",
      "",
      "Your teeth ache.",
      "",
      "The lights flicker.",
      "",
      "Then the corridor’s intercom clicks on.",
      "",
      "\"Public access ends here,\" a voice says.",
      "",
      "Not angry.",
      "",
      "Kind.",
      "",
      "Like you’re a child reaching for a stove.",
      "",
      "\"Go home.\"",
    ];
  },
  choices: [
    { label: "Stumble back upstairs", go: "annex_service_exterior" },
    { label: "Try the key labeled 12A (if you found it)", go: "annex_try_key_12a" },
    { label: "Search the corridor again", action: "loseSanity", data: { amount: 1 }, go: "annex_basement_search" },
  ],
},

annex_try_key_12a: {
  title: "12A",
  meta: "A lock recognizes you.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    if (!state.flags.found_keyring) {
      return [
        "You don’t have any keys.",
        "",
        "Only the memory of wanting one.",
      ];
    }

    // Gate: the key is for a future door, not yet here
    state.flags.key_12a_confirmed = true;

    return [
      "You hold the 12A key up to the oversight plate.",
      "",
      "Nothing obvious happens.",
      "",
      "Then a tiny click answers from inside the wall.",
      "",
      "Not opening.",
      "",
      "Acknowledging.",
      "",
      "A small green light flashes once and dies.",
      "",
      "You just proved something:",
      "",
      "The system knows what 12A means.",
    ];
  },
  choices: [
    { label: "Retreat upstairs", go: "annex_service_exterior" },
    { label: "Leave downtown", go: "downtown_arrival" },
  ],
},

// ============================================================
// ACT 0 — PART 4
// - Records follow-up: request "approved"
// - Request Token item created
// - Token slot at annex wall panel becomes usable
// - PC becomes horror weapon: cursor moves / it types back
// - Meaningful death branch based on evidence count
// ============================================================

// -------------------------------
// Utility-ish: evidence count gate
// (We keep it inline as repeats in nodes; you can refactor later.)
// Evidence flags used here:
// ev_work_pc_archive, ev_records_stamp_match, ev_records_budget_page,
// ev_records_name_fragment, ev_basement_signage, key_12a_confirmed
// -------------------------------

// ============================================================
// DOWNTOWN: RETURN TO RECORDS (FOLLOW-UP)
// ============================================================

records_return: {
  title: "Public Records Annex",
  meta: "You came back. That matters.",
  tension: 0.94,
  backgroundLayers: () => ({
    bg: "records_ext_bg",
    light: "records_ext_light",
    glow: "records_ext_glow",
    fg: "records_ext_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.records_returns = (state.flags.records_returns ?? 0) + 1;

    const lines = [
      "The Records Annex looks the same.",
      "",
      "But now you notice the cameras.",
      "Not the obvious ones.",
      "The subtle ones — disguised in architecture.",
    ];

    if (state.flags.records_request_budget || state.flags.records_request_retrofit) {
      lines.push(
        "",
        "You’re here for your request.",
        "",
        "A stamp can change your life.",
        "Or end it."
      );
    } else {
      lines.push(
        "",
        "You don’t have a request on file.",
        "",
        "Not officially.",
        "",
        "But you still feel pulled toward the counter."
      );
    }

    return lines;
  },
  choices: [
    { label: "Go inside", go: "records_followup_lobby" },
    { label: "Circle the building (look for staff door)", go: "records_followup_walk" },
    { label: "Leave downtown", go: "downtown_arrival" },
  ],
},

records_followup_walk: {
  title: "Annex Perimeter",
  meta: "You learn the building’s habits.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "records_ext_bg",
    light: "records_ext_light",
    glow: "records_ext_glow",
    fg: "records_ext_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const n = state.flags.records_perimeter_laps ?? 0;
    state.flags.records_perimeter_laps = n + 1;

    if (n === 0) {
      return [
        "You walk the perimeter slowly.",
        "",
        "A staff entrance sits under a flickering light.",
        "",
        "A small sign reads:",
        "“OVERSIGHT DELIVERIES ONLY.”",
        "",
        "It has no handle.",
        "",
        "Just a slot like a mailbox.",
      ];
    }

    if (n === 1) {
      state.flags.seed_records_slot = true;
      return [
        "You pass the staff entrance again.",
        "",
        "The slot looks deeper than it should.",
        "",
        "Like it goes somewhere that isn’t inside the building.",
      ];
    }

    return [
      "You finish another lap.",
      "",
      "The building stays boring on purpose.",
      "",
      "Authority disguised as paperwork.",
    ];
  },
  choices: [
    { label: "Back to main entrance", go: "records_return" },
    { label: "Try the staff slot (bad idea)", action: "loseSanity", data: { amount: 1 }, go: "records_staff_slot_try" },
  ],
},

records_staff_slot_try: {
  title: "Staff Slot",
  meta: "It feels like a throat.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_ext_bg",
    light: "records_ext_light",
    glow: "records_ext_glow",
    fg: "records_ext_fg",
  }),
  text: () => [
    "You lean closer to the slot.",
    "",
    "Cold air breathes out against your face.",
    "",
    "Not a draft.",
    "",
    "A deliberate exhale.",
    "",
    "You step back fast.",
  ],
  choices: [
    { label: "Stop doing that", go: "records_return" },
  ],
},

records_followup_lobby: {
  title: "Records Lobby",
  meta: "Now you’re on file.",
  tension: 0.96,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};

    if (!state.flags.records_followup_seen) {
      state.flags.records_followup_seen = true;
      return [
        "The clerk is already looking at you when you enter.",
        "",
        "That’s the first thing that feels wrong.",
        "",
        "The second thing is the stack of forms on the counter.",
        "",
        "They’re perfectly aligned.",
        "Perfectly waiting.",
      ];
    }

    return [
      "The lobby is quiet.",
      "",
      "The clerk watches you like they’re waiting for a specific sentence.",
    ];
  },
  choices: [
    { label: "Go to the counter", go: "records_followup_counter" },
    { label: "Check the brochure rack again", go: "records_followup_rack" },
    { label: "Look down the hallway (unauthorized)", go: "records_followup_hall" },
    { label: "Leave the lobby", go: "records_return" },
  ],
},

records_followup_rack: {
  title: "Brochure Rack",
  meta: "It resets itself.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    if (state.flags.records_rack_mark_seen) {
      return [
        "The brochures are aligned again.",
        "",
        "You hate how neat it is.",
      ];
    }

    state.flags.records_rack_mark_seen = true;
    return [
      "A new brochure has appeared in the rack.",
      "",
      "“REQUEST TOKEN GUIDELINES”",
      "",
      "You pull it free.",
      "",
      "The paper is warm.",
      "",
      "The last line reads:",
      "",
      "“Tokens may be issued for approved requests.”",
      "",
      "Approved by who?",
    ];
  },
  choices: [
    { label: "Pocket it", go: "records_followup_lobby" },
    { label: "Read it closely (hurts)", action: "loseSanity", data: { amount: 1 }, go: "records_followup_lobby" },
  ],
},

records_followup_hall: {
  title: "Hallway",
  meta: "The building knows your curiosity.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "records_hall_bg",
    light: "records_hall_light",
    glow: "records_hall_glow",
    fg: "records_hall_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.records_followup_hall = (state.flags.records_followup_hall ?? 0) + 1;

    if (state.flags.records_followup_hall === 1) {
      return [
        "You take two steps into the hall.",
        "",
        "A printer behind a door starts running.",
        "",
        "No one touched it.",
        "",
        "The sound is like teeth grinding.",
        "",
        "You turn back.",
      ];
    }

    return [
      "You don’t go far this time.",
      "",
      "The building feels… attentive.",
    ];
  },
  choices: [
    { label: "Back to the lobby", go: "records_followup_lobby" },
  ],
},

records_followup_counter: {
  title: "Clerk",
  meta: "They act like you’re inevitable.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};

    const hasRequest = !!state.flags.records_request_budget || !!state.flags.records_request_retrofit;
    const alreadyToken = !!state.flags.found_request_token;

    if (!hasRequest) {
      return [
        "\"No request on file,\" the clerk says softly.",
        "",
        "\"Not under your name.\"",
        "",
        "Their eyes flick toward the camera.",
        "",
        "\"Come back when you have justification.\"",
      ];
    }

    if (alreadyToken) {
      return [
        "The clerk’s posture stays stiff.",
        "",
        "\"You received your token,\" they say.",
        "",
        "\"Do not lose it.\"",
        "",
        "\"Do not show it to anyone.\"",
      ];
    }

    // The creepy approval moment
    state.flags.records_request_approved = true;

    return [
      "The clerk slides a small black envelope under the glass.",
      "",
      "No branding.",
      "No seal.",
      "",
      "\"Approved,\" they say.",
      "",
      "Not like paperwork.",
      "",
      "Like a verdict.",
      "",
      "\"This is for you.\"",
    ];
  },
  choices: (state) => {
    const c = [];
    const hasRequest = !!state.flags.records_request_budget || !!state.flags.records_request_retrofit;

    if (hasRequest && !state.flags.found_request_token) {
      c.push({ label: "Open the envelope", go: "records_token_open" });
    }

    c.push({ label: "Ask who approved it", go: "records_token_who" });
    c.push({ label: "Leave the counter", go: "records_followup_lobby" });
    return c;
  },
},

records_token_who: {
  title: "Clerk",
  meta: "Wrong question.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: () => [
    "\"Who approved it?\" you ask.",
    "",
    "The clerk’s eyes go glassy for a moment.",
    "",
    "\"Oversight,\" they say.",
    "",
    "\"Don’t ask me to say names.\"",
    "",
    "\"Names make things… real.\"",
  ],
  choices: [
    { label: "Back", go: "records_followup_counter" },
  ],
},

records_token_open: {
  title: "Envelope",
  meta: "It feels like contraband.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_token_bg",
    light: "records_token_light",
    glow: "records_token_glow",
    fg: "records_token_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.found_request_token = true;

    // This enables the annex hidden slot to accept it
    state.flags.annex_request_token_ready = true;

    // Also unlocks next downtown attempt
    state.flags.unlock_downtown_attempt3 = true;
  },
  text: () => [
    "Inside the envelope is a thin plastic token.",
    "",
    "Matte black.",
    "No barcode.",
    "",
    "Just the linked-circle spiral.",
    "",
    "On the back, tiny etched letters:",
    "",
    "“INSERT TO PROCEED.”",
    "",
    "Your hands start sweating immediately.",
  ],
  choices: [
    { label: "Pocket the token", go: "records_followup_lobby" },
    { label: "Leave the building", go: "downtown_arrival" },
  ],
},

// ============================================================
// ANNEX: USE THE TOKEN SLOT (ties to Part 3 hidden panel)
// ============================================================

annex_token_slot: {
  title: "Service Frame Slot",
  meta: "It wants the token.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    const hasToken = !!state.flags?.found_request_token;
    if (!state.flags?.annex_hidden_panel_pressed) {
      return [
        "You don’t see any slot.",
        "",
        "Just metal and a sealed frame.",
        "",
        "You feel like you’re missing a step.",
      ];
    }

    if (!hasToken) {
      return [
        "The slot is open — waiting.",
        "",
        "A label reads:",
        "“REQUEST TOKEN.”",
        "",
        "You don’t have one.",
      ];
    }

    return [
      "The slot looks too clean.",
      "",
      "Like it was opened recently.",
      "",
      "Like someone expected you.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "annex_service_door" }];
    if (state.flags.annex_hidden_panel_pressed && state.flags.found_request_token) {
      c.unshift({ label: "Insert the token", go: "annex_token_insert" });
    }
    return c;
  },
},

annex_token_insert: {
  title: "Token",
  meta: "A system handshake.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.annex_token_inserted = true;

    // The token "consumes" itself (you can change later)
    state.flags.found_request_token = false;

    // Unlocks a deeper route / oversight acknowledgment
    state.flags.oversight_acknowledged = true;
  },
  text: () => [
    "You slide the token into the slot.",
    "",
    "It disappears immediately.",
    "",
    "No clunk.",
    "No return.",
    "",
    "A soft tone hums through the metal.",
    "",
    "Then the service door’s reader flashes once:",
    "",
    "— not green —",
    "",
    "A pale blue.",
    "",
    "Like the system just changed its mind about what you are.",
  ],
  choices: [
    { label: "Swipe the pass", go: "annex_swipe_pass_post_token" },
    { label: "Back away", action: "loseSanity", data: { amount: 1 }, go: "annex_service_exterior" },
  ],
},

annex_swipe_pass_post_token: {
  title: "Reader",
  meta: "Now it recognizes the request.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_alley_bg",
    light: "annex_alley_light",
    glow: "annex_alley_glow",
    fg: "annex_alley_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    if (!state.flags.found_building_pass) {
      return [
        "You don’t have a pass.",
        "",
        "Only the memory of needing one.",
      ];
    }

    // Let them unlock basement easier if token inserted
    if (state.flags.oversight_acknowledged) {
      state.flags.annex_basement_unlocked = true;
      return [
        "You swipe the pass.",
        "",
        "The reader blinks pale blue again.",
        "",
        "The deadbolt retracts instantly.",
        "",
        "No hesitation this time.",
        "",
        "The door opens like it’s letting you through on purpose.",
      ];
    }

    return [
      "You swipe the pass.",
      "",
      "The reader hesitates.",
      "",
      "Like it’s waiting for something you haven’t done yet.",
    ];
  },
  choices: (state) => {
    if (state.flags.annex_basement_unlocked) {
      return [
        { label: "Go downstairs", go: "annex_basement_corridor_post_token" },
        { label: "Leave", go: "annex_service_exterior" },
      ];
    }
    return [
      { label: "Back", go: "annex_service_door" },
    ];
  },
},

annex_basement_corridor_post_token: {
  title: "Basement Corridor",
  meta: "You’re deeper now. Not safer.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    if (!state.flags.post_token_corridor_seen) {
      state.flags.post_token_corridor_seen = true;
      return [
        "The corridor is the same — but the lights are steadier.",
        "",
        "Like the building has decided you belong here.",
        "",
        "That thought makes your stomach turn.",
        "",
        "At the end, the Oversight plate waits.",
        "",
        "A tiny line of text glows above it now:",
        "",
        "“REQUEST ACCEPTED.”",
      ];
    }

    return [
      "“REQUEST ACCEPTED.”",
      "",
      "The words remain.",
      "",
      "You feel watched from behind the walls.",
    ];
  },
  choices: [
    { label: "Touch the Oversight plate", go: "annex_oversight_post_token" },
    { label: "Search the corridor again", go: "annex_basement_search" },
    { label: "Retreat upstairs", go: "annex_service_exterior" },
  ],
},

annex_oversight_post_token: {
  title: "Oversight",
  meta: "This is where it speaks.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};

    // evidence score for meaningful consequences
    const ev =
      (state.flags.ev_work_pc_archive ? 1 : 0) +
      (state.flags.ev_records_stamp_match ? 1 : 0) +
      (state.flags.ev_records_budget_page ? 1 : 0) +
      (state.flags.ev_records_name_fragment ? 1 : 0) +
      (state.flags.ev_basement_signage ? 1 : 0) +
      (state.flags.key_12a_confirmed ? 1 : 0);

    state.flags.oversight_contact = true;

    if (ev >= 3) {
      // “Cleaner” containment / failsafe branch (still bad, but controlled)
      state.flags.failsafe_seen = true; // your requested global flag
      state.sanity = Math.max(0, (state.sanity ?? 10) - 1);

      return [
        "You touch the plate.",
        "",
        "It’s warm now.",
        "",
        "A calm, clinical voice speaks from everywhere:",
        "",
        "\"Containment protocol engaged.\"",
        "",
        "\"Subject exhibits pattern recognition.\"",
        "",
        "\"Failsafe will be applied with minimal disruption.\"",
        "",
        "You feel a click behind your eyes.",
        "",
        "Like something locking into place.",
      ];
    }

    // low evidence = violent / messy correction
    state.hp = Math.max(1, (state.hp ?? 10) - 2);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 2);

    return [
      "You touch the plate.",
      "",
      "The metal goes ice-cold instantly.",
      "",
      "The lights strobe.",
      "",
      "Your ears ring with a high tone that feels like punishment.",
      "",
      "A voice hisses through the intercom:",
      "",
      "\"You don’t have enough to be here.\"",
      "",
      "\"Go back.\"",
      "",
      "Your knees buckle.",
    ];
  },
  choices: (state) => {
    const ev =
      (state.flags.ev_work_pc_archive ? 1 : 0) +
      (state.flags.ev_records_stamp_match ? 1 : 0) +
      (state.flags.ev_records_budget_page ? 1 : 0) +
      (state.flags.ev_records_name_fragment ? 1 : 0) +
      (state.flags.ev_basement_signage ? 1 : 0) +
      (state.flags.key_12a_confirmed ? 1 : 0);

    // Meaningful death / correction branches begin here
    if (ev >= 3) {
      return [
        { label: "Blink (too slow)", go: "death_failsafe_clean" },
        { label: "Retreat upstairs", go: "annex_service_exterior" },
      ];
    }

    return [
      { label: "Collapse", go: "death_correction_violent" },
      { label: "Crawl back", action: "loseSanity", data: { amount: 1 }, go: "annex_service_exterior" },
    ];
  },
},

// ============================================================
// MEANINGFUL DEATH BRANCHES (Act 0 early)
// ============================================================

death_failsafe_clean: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.failsafe_seen = true;
    state.flags.last_death = "failsafe_clean";
    state.hp = Math.max(1, (state.hp ?? 10) - 1);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 1);
  },
  text: () => [
    "Your vision narrows gently.",
    "",
    "Not panic.",
    "Not violence.",
    "",
    "A controlled dimming.",
    "",
    "Like someone lowering the lights in a theater.",
    "",
    "The voice speaks again, almost kind:",
    "",
    "\"We will reset you with minimal distress.\"",
    "",
    "You feel the click.",
    "",
    "Then nothing.",
  ],
  choices: [{ label: "—", go: "loop_wakeup_after_failsafe" },
            { label: "…", go: "loop_fracture_trigger" },

  ],
  
},

death_correction_violent: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.last_death = "correction_violent";
    state.hp = Math.max(1, (state.hp ?? 10) - 3);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 3);
  },
  text: () => [
    "The lights strobe faster.",
    "",
    "Your stomach flips like falling from a height.",
    "",
    "Something slams you sideways —",
    "",
    "Not a person.",
    "",
    "Pressure.",
    "",
    "A force that doesn’t need hands.",
    "",
    "Your head hits concrete.",
    "",
    "The last sound you hear is the intercom whispering:",
    "",
    "\"Correction.\"",
  ],
  choices: [{ label: "—", go: "loop_wakeup_after_correction" }],
},

loop_wakeup_after_failsafe: {
  title: "Morning",
  meta: "The clean reset feels worse.",
  tension: 0.86,
  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),
  text: (state) => [
    "You wake up in bed.",
    "",
    "No bruises.",
    "No blood.",
    "",
    "That’s the first horror.",
    "",
    "The second is the memory of the click.",
    "",
    ...(state.flags?.failsafe_seen ? ["You remember the click… and you know it wasn’t in the building.", "It was inside you."] : []),
    "",
    "Your phone screen lights up by itself.",
    "",
    "A single notification appears:",
    "",
    "“WORKSTATION RECOMMENDED.”",
  ],
  choices: [
    { label: "Get up", go: "apartment_post_records" },
    { label: "Go to work (the routine pulls you)", go: "office_lobby" },
  ],
},

loop_wakeup_after_correction: {
  title: "Morning",
  meta: "You don’t reset cleanly.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "apartment_bg",
    light: "apartment_light",
    glow: "apartment_glow",
    fg: "apartment_fg",
  }),
  text: () => [
    "You wake up choking on air.",
    "",
    "Your body remembers impact.",
    "",
    "Your head aches like you hit concrete.",
    "",
    "The room looks staged, too neat.",
    "",
    "Like it’s trying to convince you nothing happened.",
    "",
    "You can’t stop shaking.",
  ],
  choices: [
    { label: "Get up", go: "apartment_post_records" },
    { label: "Go to work (maybe the workstation can explain)", go: "office_lobby" },
  ],
},

// ============================================================
// OFFICE: PC BECOMES HORROR WEAPON (PC MODE)
// This plugs into your existing office_pc / workpc_* ecosystem.
// Add a new node you can branch into from office_pc desktop.
// ============================================================

office_pc_haunted: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  uiMode: "computer",
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.pc_haunt_seen = true;
  },
  computerUI: (state) => {
    // Use your existing "error" type to show a modal-like message (engine style)
    const lines = [];

    const ev =
      (state.flags.ev_work_pc_archive ? 1 : 0) +
      (state.flags.ev_records_stamp_match ? 1 : 0) +
      (state.flags.ev_records_budget_page ? 1 : 0) +
      (state.flags.ev_records_name_fragment ? 1 : 0) +
      (state.flags.ev_basement_signage ? 1 : 0) +
      (state.flags.key_12a_confirmed ? 1 : 0);

    lines.push("WORKSTATION NOTICE");
    lines.push("");
    lines.push("You should not have touched the Oversight plate.");

    if (state.flags.failsafe_seen) {
      lines.push("");
      lines.push("We applied failsafe with minimal disruption.");
      lines.push("You remember the click because you earned it.");
    } else {
      lines.push("");
      lines.push("Your correction was messy.");
      lines.push("That is inefficient.");
    }

    lines.push("");
    lines.push("Next step:");
    lines.push("Return to the Annex.");
    lines.push("Insert token.");
    lines.push("Do not hesitate.");

    if (ev < 3) {
      lines.push("");
      lines.push("Collect more proof.");
      lines.push("You are not allowed through yet.");
    } else {
      lines.push("");
      lines.push("You are close enough to be useful.");
    }

    // Seed a new desktop label so the player feels "watched"
    state.flags.pc_wallpaper_override = true;

    return {
      type: "error",
      title: "SYS_GUARD",
      message: lines,
      buttons: [
        {
  label: "OK",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
,
        { label: "Open ARCHIVE", go: "office_pc_archive" }, // if you kept that archive node
      ],
    };
  },
  text: () => [],
},

// OPTIONAL: Use this node to swap into haunted PC after a failsafe loop.
// You can call it from your office_pc desktop dynamic once certain flags exist.
office_pc_unlock_haunt_flag: {
  title: "Workstation",
  meta: "",
  tension: 0.88,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.pc_haunt_available = true;
  },
  text: () => [
    "The workstation hums.",
    "",
    "For a second, your cursor moves on its own.",
  ],
  choices: [
    {
  label: "Sit down at the computer",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
,
    { label: "Back away", go: "office_floor" },
  ],
},

// ============================================================
// ACT 1 — PART 1
// ANNEX SUBLEVEL: Door 12A becomes real + media evidence
// ============================================================

annex_door_12a: {
  title: "Door 12A",
  meta: "You’ve seen this number in the file. Now it’s physical.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.door_12a_seen = true;

    const hasKey = !!state.flags.found_keyring || !!state.flags.key_12a_confirmed;
    const hasAck = !!state.flags.oversight_acknowledged || !!state.flags.annex_token_inserted;

    const lines = [
      "A door sits half-hidden behind conduit and painted cinderblock.",
      "",
      "A small metal tag reads:",
      "",
      "12A",
      "",
      "No handle.",
      "Just a keyhole and a round plate stamped with linked circles.",
    ];

    if (!hasAck) {
      lines.push(
        "",
        "The air feels… resistant.",
        "",
        "Like you’re here before you’re allowed."
      );
    } else {
      lines.push(
        "",
        "The air feels smoother now.",
        "",
        "Like someone moved you to the next step."
      );
    }

    if (!hasKey) {
      lines.push(
        "",
        "You don’t have the key.",
        "",
        "But the keyhole looks like it remembers the shape of one."
      );
    }

    return lines;
  },
  choices: (state) => {
    const hasKey = !!state.flags.found_keyring || !!state.flags.key_12a_confirmed;

    const c = [
      { label: "Back to the corridor", go: "annex_basement_corridor_post_token" }, // if you’re using post-token corridor
      { label: "Back to the corridor", go: "annex_basement_corridor" },            // fallback if not
    ];

    if (hasKey) c.unshift({ label: "Use the 12A key", go: "annex_unlock_12a" });

    return c;
  },
},

annex_unlock_12a: {
  title: "Keyhole",
  meta: "The system recognizes the number.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "annex_basement_bg",
    light: "annex_basement_light",
    glow: "annex_basement_glow",
    fg: "annex_basement_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.key_12a_used = true;
    state.flags.unlock_sublevel_12a = true;
  },
  text: (state) => [
    "You insert the key.",
    "",
    "It fits perfectly.",
    "",
    "Not because it’s the right key.",
    "",
    "Because the lock is already trained for it.",
    "",
    "A soft click answers from inside the wall — deeper than the door.",
    "",
    "The linked-circle plate warms under your palm.",
    "",
    "Then the door releases with a slow, heavy breath.",
  ],
  choices: [
    { label: "Enter 12A", go: "annex_sublevel_anteroom" },
    { label: "Change your mind (retreat)", action: "loseSanity", data: { amount: 1 }, go: "annex_service_exterior" },
  ],
},

annex_sublevel_anteroom: {
  title: "Sublevel 12A",
  meta: "Not a basement anymore. Something else.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    if (!state.flags.sublevel_anteroom_seen) {
      state.flags.sublevel_anteroom_seen = true;
      return [
        "The air is colder here.",
        "",
        "Not temperature-cold.",
        "",
        "Institution-cold.",
        "",
        "A single fluorescent light hums overhead.",
        "",
        "A table sits under it with a tray of labeled folders.",
        "",
        "A wall-mounted camera watches the room without blinking.",
      ];
    }
    return [
      "The camera watches.",
      "",
      "You can feel your body trying to behave.",
    ];
  },
  choices: [
    { label: "Inspect the tray of folders", go: "sublevel_tray_folders" },
    { label: "Check the wall cabinet", go: "sublevel_wall_cabinet" },
    { label: "Listen to the room (stay still)", action: "loseSanity", data: { amount: 1 }, go: "sublevel_listen" },
    { label: "Back out to corridor", go: "annex_basement_corridor_post_token" },
    { label: "Check the terminal", go: "sublevel_terminal" },
  ],
},

sublevel_listen: {
  title: "Sublevel 12A",
  meta: "Quiet is never empty.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  text: () => [
    "You hold your breath.",
    "",
    "The fluorescent hum becomes… rhythmic.",
    "",
    "Like it’s syncing with your heartbeat.",
    "",
    "Behind the wall cabinet, you hear a faint sound:",
    "",
    "a reel turning.",
    "",
    "Like a tape recorder running.",
  ],
  choices: [
    { label: "Check the cabinet", go: "sublevel_wall_cabinet" },
    { label: "Back", go: "annex_sublevel_anteroom" },
  ],
},

sublevel_tray_folders: {
  title: "Folders",
  meta: "Paperwork as a weapon.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.sublevel_tray_checked = true;

    const lines = [
      "Three folders sit in the tray:",
      "",
      "• CORRECTION PATHWAYS — CROSSWALK PERIMETER",
      "• CONTINUITY EVENTS — BUDGET JUSTIFICATION",
      "• OBSERVER NOTES — MAYOR’S OFFICE",
      "",
      "Your fingers hover.",
      "",
      "Each folder feels like it’s expecting fingerprints.",
    ];

    if (state.flags.ev_basement_signage) {
      lines.push("", "You’ve already seen the words “Correction Pathways.”", "Now they’re filed like maintenance.");
    }

    return lines;
  },
  choices: [
    { label: "Open: CORRECTION PATHWAYS", go: "sublevel_doc_corrections" },
    { label: "Open: BUDGET JUSTIFICATION", go: "sublevel_doc_budget" },
    { label: "Open: OBSERVER NOTES", go: "sublevel_doc_observer" },
    { label: "Back", go: "annex_sublevel_anteroom" },
  ],
},

sublevel_doc_corrections: {
  title: "CORRECTION PATHWAYS",
  meta: "Clinical language for something brutal.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_doc_bg",
    light: "sublevel_doc_light",
    glow: "sublevel_doc_glow",
    fg: "sublevel_doc_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_sublevel_corrections = true;
  },
  text: () => [
    "CORRECTION PATHWAYS — FIELD SUMMARY",
    "",
    "• Trigger: boundary curiosity",
    "• Preferred site: crosswalk perimeter",
    "• Public compliance: high",
    "",
    "Note:",
    "“Public will not intervene when reinforcement is consistent.”",
    "",
    "You swallow hard.",
    "",
    "It reads like a training document.",
  ],
  choices: [
    { label: "Back", go: "sublevel_tray_folders" },
  ],
},

sublevel_doc_budget: {
  title: "BUDGET JUSTIFICATION",
  meta: "Numbers hide motives.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_doc_bg",
    light: "sublevel_doc_light",
    glow: "sublevel_doc_glow",
    fg: "sublevel_doc_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_sublevel_budget = true;
  },
  text: () => [
    "CONTINUITY EVENTS — BUDGET JUSTIFICATION",
    "",
    "Line item: CIVIC STABILITY OPERATIONS",
    "Allocation: SUBLEVEL INFRASTRUCTURE",
    "",
    "Approval chain:",
    "• Executive Continuity Oversight",
    "• Governor’s Office — Custodian",
    "",
    "There’s a signature line.",
    "",
    "It’s been redacted with thick ink.",
    "",
    "But the pressure indents the page like a bruise.",
  ],
  choices: [
    { label: "Back", go: "sublevel_tray_folders" },
  ],
},

sublevel_doc_observer: {
  title: "OBSERVER NOTES",
  meta: "Mayor’s Office. Observer. Active.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_doc_bg",
    light: "sublevel_doc_light",
    glow: "sublevel_doc_glow",
    fg: "sublevel_doc_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_sublevel_observer = true;
    state.flags.seed_mayor_observer = true;
  },
  text: () => [
    "OBSERVER NOTES — MAYOR’S OFFICE",
    "",
    "“Subject continues to test the boundary.”",
    "",
    "“Do not remove them yet.”",
    "",
    "“The loop is stabilizing their behavior.”",
    "",
    "A final note, underlined three times:",
    "",
    "“When they remember the click, they become useful.”",
    "",
    "Your skin crawls.",
  ],
  choices: [
    { label: "Back", go: "sublevel_tray_folders" },
  ],
},

sublevel_wall_cabinet: {
  title: "Wall Cabinet",
  meta: "Locked. Of course.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const hasDocNo = !!state.flags.lead_doc_number;   // set by mirror/pc in this act
    const opened = !!state.flags.sublevel_cabinet_opened;

    if (opened) {
      return [
        "The cabinet hangs open.",
        "",
        "Inside: a tape recorder and a thin manila envelope.",
        "",
        "Both feel like traps you’re meant to spring.",
      ];
    }

    if (!hasDocNo) {
      return [
        "A small combination dial and a label:",
        "",
        "“REQ DOC #”",
        "",
        "You don’t know the number.",
        "",
        "The cabinet doesn’t feel patient.",
      ];
    }

    return [
      "The label reads “REQ DOC #”",
      "",
      "You have a number now.",
      "",
      "You hate how it makes your hand steadier.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "annex_sublevel_anteroom" }];

    if (state.flags.lead_doc_number && !state.flags.sublevel_cabinet_opened) {
      c.unshift({ label: "Enter the doc number", go: "sublevel_cabinet_unlock" });
    }
    if (state.flags.sublevel_cabinet_opened) {
      c.unshift({ label: "Play the tape", go: "sublevel_tape_play" });
      c.unshift({ label: "Open the envelope", go: "sublevel_envelope_open" });
    }
    return c;
  },
},

sublevel_cabinet_unlock: {
  title: "Doc #",
  meta: "You comply, and the system rewards it.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.sublevel_cabinet_opened = true;
    state.flags.ev_sublevel_media = true;
  },
  text: (state) => [
    "You dial the number.",
    "",
    "The cabinet clicks open instantly.",
    "",
    "No resistance.",
    "",
    "Like it was never locked.",
    "",
    "Inside: a tape recorder labeled “OBSERVER AUDIO”",
    "",
    "And a thin envelope stamped with linked circles.",
    "",
    `The cabinet label updates itself in faint digital ink:`,
    "",
    `"DOC ${state.flags.lead_doc_number} — RECEIVED"`,
  ],
  choices: [
    { label: "Play the tape", go: "sublevel_tape_play" },
    { label: "Open the envelope", go: "sublevel_envelope_open" },
    { label: "Back", go: "annex_sublevel_anteroom" },
  ],
},

sublevel_tape_play: {
  title: "Tape Recorder",
  meta: "The Observer speaks like a report.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_doc_bg",
    light: "sublevel_doc_light",
    glow: "sublevel_doc_glow",
    fg: "sublevel_doc_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_observer_audio = true;
  },
  text: (state) => [
    "You press PLAY.",
    "",
    "A calm voice begins:",
    "",
    "\"Observer log. Mayor’s Office.\"",
    "",
    "\"Subject demonstrates increased recall following failsafe exposure.\"",
    "",
    "\"Recommendation: allow controlled breach toward Oversight to ensure compliance.\"",
    "",
    "\"Governor’s Custodian has been notified.\"",
    "",
    "The tape clicks.",
    "",
    "\"If the mirror shows them a number, it’s working.\"",
    "",
    "Your mouth goes dry.",
  ],
  choices: [
    { label: "Stop the tape", go: "annex_sublevel_anteroom" },
    { label: "Listen again (bad for sanity)", action: "loseSanity", data: { amount: 1 }, go: "sublevel_tape_play" },
  ],
},

sublevel_envelope_open: {
  title: "Envelope",
  meta: "A directive. Not a letter.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_doc_bg",
    light: "sublevel_doc_light",
    glow: "sublevel_doc_glow",
    fg: "sublevel_doc_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_directive_found = true;
  },
  text: () => [
    "Inside is a single sheet.",
    "",
    "EXECUTIVE CONTINUITY — DIRECTIVE",
    "",
    "“Maintain subject engagement.”",
    "",
    "“Do not disclose loop terminology.”",
    "",
    "“Permit discovery in stages.”",
    "",
    "Signature block:",
    "",
    "MAYOR’S OFFICE — OBSERVER",
    "",
    "Counter-signed:",
    "GOVERNOR’S OFFICE — CUSTODIAN",
    "",
    "It isn’t signed like a person.",
    "",
    "It’s signed like a role.",
  ],
  choices: [
    { label: "Back", go: "annex_sublevel_anteroom" },
    { label: "Leave before you’re noticed", go: "annex_service_exterior" },
  ],
},

// ============================================================
// ACT 1 — PART 1
// MIRROR LEAD: doc number + location hint (no removal of variants)
// ============================================================

mirror_lead_docnumber: {
  title: "The Mirror",
  meta: "It stops being metaphorical.",
  tension: 1.0,
  backgroundLayers: withBackground("apartment"), // or your mirror backgroundLayers
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.mirror_lead_seen = true;

    // Generate a stable doc number once per run
    if (!state.flags.lead_doc_number) {
      const base = 1200 + ((state.meta?.startedAt ?? Date.now()) % 800); // stable-ish
      state.flags.lead_doc_number = `REQ-${Math.floor(base)}A`;
    }

    return [
      "The glass bows outward.",
      "",
      "Not breaking.",
      "Not cracking.",
      "",
      "A line of text forms in the fog on the inside surface:",
      "",
      `${state.flags.lead_doc_number}`,
      "",
      "Then a second line, smaller:",
      "",
      "“12A — CABINET”",
      "",
      "Your reflection smiles a half-second late.",
    ];
  },
  choices: [
    { label: "Back away", action: "loseSanity", data: { amount: 1 }, go: "apartment_post_records" },
    { label: "Keep staring (risk demon)", action: "loseSanity", data: { amount: 1 }, go: "apartment_mirror" }, // returns to your existing system
  ],
},

mirror_lead_coordinates: {
  title: "The Mirror",
  meta: "A location you didn’t ask for.",
  tension: 1.0,
  backgroundLayers: withBackground("apartment"),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.mirror_coords_seen = true;
    state.flags.unlock_sublevel_12a_hint = true;

    return [
      "The mirror goes black.",
      "",
      "Then white text appears like a terminal:",
      "",
      "ANNEX / SERVICE ALLEY",
      "BASEMENT ACCESS",
      "DOOR 12A",
      "",
      "A final line flashes too fast to read.",
      "",
      "You realize your hands are wet.",
      "",
      "Not water.",
    ];
  },
  choices: [
    { label: "Back away", action: "loseSanity", data: { amount: 1 }, go: "apartment_post_records" },
    { label: "Force yourself to remember the last line", action: "loseSanity", data: { amount: 1 }, go: "mirror_lead_docnumber" },
  ],
},

// ============================================================
// ACT 1 — PART 1
// PC WEAPON: Workstation can also surface the doc number.
// ============================================================

office_pc_doc_hint: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "office_bg",
    light: "office_light",
    glow: "office_glow",
    fg: "office_fg",
  }),
  uiMode: "computer",
  computerUI: (state) => {
    state.flags = state.flags || {};
    if (!state.flags.lead_doc_number) state.flags.lead_doc_number = "REQ-12A";

    return {
      type: "error",
      title: "WORKSTATION MESSAGE",
      message: [
        "You blink and the cursor has moved.",
        "",
        "A line types itself:",
        "",
        `DOC NUMBER: ${state.flags.lead_doc_number}`,
        "",
        "Next:",
        "ANNEX BASEMENT — CABINET",
        "",
        "Do not ask who is typing.",
      ],
      buttons: [
        {
  label: "Ok",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
,
        { label: "Open ARCHIVE", go: "office_pc_archive" },
      ],
    };
  },
  text: () => [],
},

// ============================================================
// ACT 1 — PART 2
// OFFICE AFTER HOURS: first ally (janitor/custodian)
// ============================================================

office_afterhours: {
  title: "Office (After Hours)",
  meta: "The building is quieter when it thinks it won.",
  tension: 0.92,
  backgroundLayers: () => ({
    bg: "office_bg_night",
    light: "office_light_night",
    glow: "office_glow_night",
    fg: "office_fg_night",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.office_afterhours_seen = true;
  },
  text: (state) => {
    const lines = [
      "The office feels wrong after hours.",
      "",
      "Not abandoned.",
      "Monitored.",
      "",
      "Your footsteps echo too neatly — like the hallway is recording you.",
    ];

    if (state.flags.ev_observer_audio) {
      lines.push(
        "",
        "You keep thinking about the tape:",
        "",
        "“If the mirror shows them a number, it’s working.”"
      );
    }

    return lines;
  },
  choices: [
    {
  label: "Go to your workstation",
  action: "enterPCMode",
  data: { nodeId: "office_pc" }
}
,
    { label: "Check the break room", go: "office_breakroom_night" },
    { label: "Listen near the supply closet", go: "office_supply_closet_door" },
    { label: "Leave the office", go: "apartment_post_records" },
  ],
},

office_breakroom_night: {
  title: "Break Room",
  meta: "Vending machines hum like insects.",
  tension: 0.90,
  backgroundLayers: () => ({
    bg: "office_break_bg",
    light: "office_break_light",
    glow: "office_break_glow",
    fg: "office_break_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const n = state.flags.breakroom_visits ?? 0;
    state.flags.breakroom_visits = n + 1;

    if (n === 0) {
      return [
        "A paper cup sits in the sink.",
        "",
        "Fresh.",
        "",
        "Someone was here recently.",
        "",
        "A sticky note is taped to the coffee machine:",
        "",
        "“DON’T SAY IT IN THE HALLS.”",
      ];
    }

    if (n === 1) {
      return [
        "The cup is gone.",
        "",
        "The sticky note is gone.",
        "",
        "Only a faint rectangle of cleaner smell remains.",
      ];
    }

    return [
      "The break room pretends it was never touched.",
      "",
      "You’re starting to hate how good the loop is at tidying.",
    ];
  },
  choices: [
    { label: "Back", go: "office_afterhours" },
  ],
},

office_supply_closet_door: {
  title: "Supply Closet",
  meta: "A door the building forgets to lock.",
  tension: 0.98,
  backgroundLayers: () => ({
    bg: "office_hall_night_bg",
    light: "office_hall_night_light",
    glow: "office_hall_night_glow",
    fg: "office_hall_night_fg",
  }),
  text: (state) => {
    const lines = [
      "You stop outside the supply closet.",
      "",
      "A soft sound comes from inside:",
      "",
      "a mop bucket rolling an inch… then stopping.",
      "",
      "Like someone froze mid-task.",
    ];

    if (state.flags.seed_mayor_observer) {
      lines.push(
        "",
        "You remember the folder title:",
        "",
        "OBSERVER NOTES — MAYOR’S OFFICE."
      );
    }

    return lines;
  },
  choices: [
    { label: "Open the door", go: "office_janitor_meet" },
    { label: "Back away", action: "loseSanity", data: { amount: 1 }, go: "office_afterhours" },
  ],
},

office_janitor_meet: {
  title: "Custodial",
  meta: "He looks like someone who learned to survive by not seeing.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.met_janitor = true;
  },
  text: (state) => {
    const hasTape = !!state.flags.ev_observer_audio;
    const hasDirective = !!state.flags.ev_directive_found;

    const lines = [
      "A janitor stands inside the closet.",
      "",
      "Not startled.",
      "",
      "Like he knew you’d come.",
      "",
      "His badge reads: CUSTODIAL SERVICES.",
      "",
      "But the lanyard is old — the kind used in government buildings.",
    ];

    if (hasTape || hasDirective) {
      lines.push(
        "",
        "His eyes flick to your hands.",
        "",
        "\"You took things,\" he says quietly.",
        "",
        "\"That makes you dangerous.\""
      );
    } else {
      lines.push(
        "",
        "\"You shouldn’t be here,\" he says.",
        "",
        "\"But you already are.\""
      );
    }

    return lines;
  },
  choices: [
    { label: "Ask about the Governor’s Custodian", go: "office_janitor_custodian" },
    { label: "Tell him about the loop (carefully)", go: "office_janitor_loop" },
    { label: "Show him the doc number / token story", go: "office_janitor_doc" },
    { label: "Back away", go: "office_afterhours" },
  ],
},

office_janitor_custodian: {
  title: "Custodial",
  meta: "A role, not a person.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: () => [
    "At the word “Custodian,” his jaw tightens.",
    "",
    "\"Don’t say it in the building,\" he whispers.",
    "",
    "\"Words travel.\"",
    "",
    "\"The Governor’s Custodian isn’t a janitor.\"",
    "",
    "\"It’s… a hand. A handler.\"",
    "",
    "He looks past you like he’s watching a camera you can’t see.",
  ],
  choices: [
    { label: "Ask what he remembers", go: "office_janitor_memory" },
    { label: "Back", go: "office_janitor_meet" },
  ],
},

office_janitor_memory: {
  title: "Custodial",
  meta: "He’s afraid to know.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.janitor_almost_awake = true;
  },
  text: () => [
    "\"Sometimes,\" he says, \"I remember a different day.\"",
    "",
    "\"Then the lights flicker and it’s gone.\"",
    "",
    "\"They don’t reset everybody the same.\"",
    "",
    "\"Some of us get… residue.\"",
    "",
    "He swallows.",
    "",
    "\"If you want help, you need the phrase.\"",
  ],
  choices: [
    { label: "What phrase?", go: "office_janitor_phrase_hint" },
    { label: "Back", go: "office_janitor_meet" },
  ],
},

office_janitor_phrase_hint: {
  title: "Custodial",
  meta: "A password disguised as bureaucracy.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: () => [
    "\"It’s a line they use when they’re moving something behind the scenes,\" he says.",
    "",
    "\"You say it to the Records clerk.\"",
    "",
    "\"They’ll act like it’s normal.\"",
    "",
    "\"And then they’ll give you what you actually need.\"",
    "",
    "He leans closer:",
    "",
    "\"I can’t say it here.\"",
    "",
    "\"The building listens.\"",
  ],
  choices: [
    { label: "Nod (leave)", go: "office_afterhours" },
    { label: "Press him anyway", action: "loseSanity", data: { amount: 1 }, go: "office_janitor_refuses" },
  ],
},

office_janitor_refuses: {
  title: "Custodial",
  meta: "He won’t die for your curiosity.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: () => [
    "He flinches like you struck him.",
    "",
    "\"No.\"",
    "",
    "\"If I say it here, it’ll be logged.\"",
    "",
    "\"If it’s logged, it becomes a correction pathway.\"",
    "",
    "\"Go to Records.\"",
  ],
  choices: [
    { label: "Leave", go: "office_afterhours" },
  ],
},

office_janitor_loop: {
  title: "Custodial",
  meta: "You test the word.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.loop_awareness = true;

    return [
      "You don’t call it a loop.",
      "",
      "You describe it instead:",
      "",
      "The resets.",
      "The click.",
      "The city correcting you.",
      "",
      "He nods once, slow.",
      "",
      "\"Yeah,\" he whispers.",
      "",
      "\"That’s what it is.\"",
      "",
      "\"And if you want to break it… you need a fracture.\"",
      "",
      "\"Something that survives reset.\"",
    ];
  },
  choices: [
    { label: "Back", go: "office_janitor_meet" },
  ],
},

office_janitor_doc: {
  title: "Custodial",
  meta: "He reacts to specifics.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: (state) => {
    const hasDoc = !!state.flags.lead_doc_number;
    const hasTokenHistory = state.flags.annex_token_inserted || state.flags.oversight_acknowledged;

    const lines = [];

    if (hasDoc) {
      lines.push(
        "You mention the doc number.",
        "",
        "His face tightens.",
        "",
        "\"That’s real,\" he says.",
        "\"That’s an issued pathway.\""
      );
    } else {
      lines.push(
        "You tell him you saw a cabinet label: REQ DOC #.",
        "",
        "\"Then you need a number,\" he says.",
        "\"Mirror or workstation.\""
      );
    }

    if (hasTokenHistory) {
      lines.push(
        "",
        "\"You inserted a token?\"",
        "",
        "He exhales like you just confessed to walking into traffic.",
        "",
        "\"Okay,\" he says. \"Okay. Then you’re close.\""
      );
    }

    lines.push(
      "",
      "\"Go to Records. Get the stamp.\"",
      "",
      "\"Then go back to 12A.\""
    );

    return lines;
  },
  choices: [
    { label: "Leave (go to Records)", go: "records_return" },
    { label: "Back", go: "office_janitor_meet" },
  ],
},

// ============================================================
// ACT 1 — PART 2
// RECORDS: phrase -> clerk gives "fracture stamp"
// ============================================================

records_phrase_gate: {
  title: "Records Counter",
  meta: "Say the right words. Wrong words get you corrected.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};

    const knowsPhrase = !!state.flags.phrase_known;      // set by PC or mirror or tape in this act
    const already = !!state.flags.fracture_stamp_obtained;

    if (already) {
      return [
        "The clerk avoids your eyes.",
        "",
        "The stamp is already yours.",
        "",
        "\"Don’t come back,\" they whisper.",
      ];
    }

    if (!knowsPhrase) {
      return [
        "The clerk looks up.",
        "",
        "\"Do you have a request?\"",
        "",
        "You feel the wrongness of every possible answer.",
        "",
        "You don’t have the phrase.",
      ];
    }

    return [
      "You say the phrase softly.",
      "",
      "The clerk’s face goes blank — not confused.",
      "",
      "Like someone flipped them into a role.",
      "",
      "\"One moment,\" they say.",
      "",
      "They reach under the counter.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "records_followup_lobby" }];

    if (state.flags.phrase_known && !state.flags.fracture_stamp_obtained) {
      c.unshift({ label: "Hold out your hand", go: "records_get_fracture_stamp" });
    }

    return c;
  },
},

records_get_fracture_stamp: {
  title: "Counter",
  meta: "Paperwork becomes a key.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "records_lobby_bg",
    light: "records_lobby_light",
    glow: "records_lobby_glow",
    fg: "records_lobby_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.fracture_stamp_obtained = true;
    state.flags.ev_fracture_stamp = true;

    // This is the “reset survivor” enabler.
    // We'll use it to keep ONE thing across a loop.
    state.flags.fracture_ready = true;
  },
  text: () => [
    "The clerk presses a small stamp into your palm.",
    "",
    "Heavy metal. Warm.",
    "",
    "The face of it is the linked-circle spiral — but cracked.",
    "",
    "A hairline fracture through the symbol.",
    "",
    "\"Don’t use it twice,\" the clerk whispers.",
    "",
    "\"The city notices patterns.\"",
  ],
  choices: [
    { label: "Leave the counter", go: "records_followup_lobby" },
    { label: "Leave the building", go: "downtown_arrival" },
  ],
},

// ============================================================
// ACT 1 — PART 2
// SUBLEVEL 12A: terminal unlock via fracture stamp
// ============================================================

sublevel_terminal: {
  title: "Terminal",
  meta: "Old screen. New authority.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const hasStamp = !!state.flags.fracture_stamp_obtained;

    if (!hasStamp) {
      return [
        "A terminal sits under the camera.",
        "",
        "The screen is on, but blank.",
        "",
        "A label under it reads:",
        "",
        "“AUTH: FRACTURE REQUIRED”",
        "",
        "You don’t have authorization.",
      ];
    }

    return [
      "The terminal screen flickers.",
      "",
      "It displays one line:",
      "",
      "INSERT STAMP → PRESS ENTER",
      "",
      "You don’t know how a stamp inserts into a terminal.",
      "",
      "But your hand aches like it remembers doing it.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "annex_sublevel_anteroom" }];

    if (state.flags.fracture_stamp_obtained) {
      c.unshift({ label: "Use the fracture stamp", go: "sublevel_terminal_stamp" });
    }

    return c;
  },
},

sublevel_terminal_stamp: {
  title: "Terminal",
  meta: "You commit a small crime against reality.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "sublevel_anteroom_bg",
    light: "sublevel_anteroom_light",
    glow: "sublevel_anteroom_glow",
    fg: "sublevel_anteroom_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.sublevel_terminal_authed = true;

    // This unlocks the cabinet even if doc# hasn't been gained,
    // but ideally you still need doc# for full reward.
    state.flags.unlock_cabinet_path = true;

    // The terminal provides the phrase (if you avoided the janitor hints)
    state.flags.phrase_known = true;
    state.flags.phrase_text = state.flags.phrase_text || "REQUESTING CONTINUITY EXCEPTION — STAGE TWO";
  },
  text: (state) => [
    "You press the stamp face to the terminal frame.",
    "",
    "The symbol lights up — cracked spiral glowing like a bruise.",
    "",
    "The screen types by itself:",
    "",
    `PHRASE: "${state.flags.phrase_text}"`,
    "",
    "Then:",
    "",
    "DOC NUMBER REQUIRED.",
    "CABINET: ACTIVE.",
    "",
    "The terminal adds a final line:",
    "",
    "DO NOT SAY THE PHRASE IN THE HALLS.",
  ],
  choices: [
    { label: "Back", go: "annex_sublevel_anteroom" },
    { label: "Go to wall cabinet", go: "sublevel_wall_cabinet" },
    { label: "Leave (go to Records)", go: "records_return" },
  ],
},

// ============================================================
// ACT 1 — PART 2
// LOOP FRACTURE: one note survives reset (once)
// ============================================================

loop_fracture_trigger: {
  title: "A Crack",
  meta: "Something survives.",
  tension: 1.0,
  backgroundLayers: withBackground("apartment"),
  onEnter: (state) => {
    state.flags = state.flags || {};

    // Only trigger once
    if (state.flags.loop_fracture_done) return;

    // Require stamp + at least one "death memory"
    const eligible =
      !!state.flags.ev_fracture_stamp &&
      (state.flags.failsafe_seen || state.flags.last_death);

    if (eligible) {
      state.flags.loop_fracture_done = true;
      state.flags.fracture_note_survived = true;

      // Give a tangible carry-forward: a "marked page" flag.
      state.flags.ev_marked_page = true;

      // Sanity swing: terrifying but empowering
      state.sanity = Math.max(0, (state.sanity ?? 10) - 1);
    }
  },
  text: (state) => {
    if (!state.flags.loop_fracture_done) {
      return [
        "The day resets.",
        "",
        "Like always.",
      ];
    }

    return [
      "You wake up.",
      "",
      "The room is staged.",
      "The air is normal.",
      "",
      "Then you see it.",
      "",
      "A page on your nightstand.",
      "",
      "Your handwriting.",
      "",
      "It shouldn’t be here after a reset.",
      "",
      "Across the top, in ink you didn’t write:",
      "",
      "“PATTERN DETECTED.”",
      "",
      "Your phone vibrates once.",
      "",
      "No notification.",
      "",
      "Just a pulse.",
    ];
  },
  choices: [
    { label: "Get up", go: "apartment_post_records" },
    { label: "Go to the mirror (confirm)", go: "apartment_mirror" },
    { label: "Go to work (the workstation will react)", go: "office_afterhours" },
  ],
},

// ============================================================
// ACT 1 — PART 2
// MIRROR RESIDUE: physical mark after fracture
// ============================================================

mirror_residue_mark: {
  title: "The Mirror",
  meta: "It left something behind.",
  tension: 1.0,
  backgroundLayers: withBackground("apartment"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.mirror_residue_taken = true;
    state.flags.ev_mirror_residue = true;
  },
  text: () => [
    "You wipe the fog off the mirror.",
    "",
    "Your fingers come away stained.",
    "",
    "Not blood.",
    "",
    "Ink.",
    "",
    "A faint linked-circle spiral remains on your skin — cracked like the stamp.",
    "",
    "The mirror didn’t just show you something.",
    "",
    "It tagged you.",
  ],
  choices: [
    { label: "Back away", action: "loseSanity", data: { amount: 1 }, go: "apartment_post_records" },
  ],
},

// ============================================================
// ACT 1 — PART 3
// SABOTAGE: Correction Pathways (Crosswalk Perimeter)
// Unlock: Municipal Services Tunnel -> Continuity Hall
// Hostile UI: Workstation fights back (PC mode)
// ============================================================

// ------------------------------------------------------------
// DOWNTOWN: CROSSWALK PERIMETER (the correction site)
// ------------------------------------------------------------

crosswalk_perimeter: {
  title: "Crosswalk Perimeter",
  meta: "This is where they correct you.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_bg",
    light: "crosswalk_light",
    glow: "crosswalk_glow",
    fg: "crosswalk_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_seen = true;
  },
  text: (state) => {
    const lines = [
      "The crosswalk looks normal.",
      "",
      "Cars pass.",
      "People pass.",
      "",
      "But the air here feels… pressurized.",
      "",
      "Like an invisible boundary is waiting for you to touch it.",
    ];

    if (state.flags.ev_sublevel_corrections || state.flags.ev_basement_signage) {
      lines.push(
        "",
        "You recognize it as a site.",
        "",
        "Not a place.",
        "",
        "A tool."
      );
    }

    if (state.flags.ev_mirror_residue) {
      lines.push(
        "",
        "Your skin still carries the cracked spiral mark.",
        "",
        "You feel it itch when you step closer to the curb."
      );
    }

    return lines;
  },
  choices: [
    { label: "Watch the pedestrian signal (time the pattern)", go: "crosswalk_watch_pattern" },
    { label: "Inspect the curb pole", go: "crosswalk_inspect_pole" },
    { label: "Step into the street (test the boundary)", go: "crosswalk_test_boundary" },
    { label: "Leave", go: "downtown_arrival" },
  ],
},

crosswalk_watch_pattern: {
  title: "Crosswalk",
  meta: "Repetition hides the machinery.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_bg",
    light: "crosswalk_light",
    glow: "crosswalk_glow",
    fg: "crosswalk_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_pattern_watched = (state.flags.crosswalk_pattern_watched ?? 0) + 1;
  },
  text: (state) => {
    const n = state.flags.crosswalk_pattern_watched ?? 0;

    if (n === 1) {
      return [
        "You watch the signal cycle.",
        "",
        "WALK.",
        "DON’T WALK.",
        "",
        "Normal timing.",
        "",
        "Then a tiny detail:",
        "",
        "A one-second flicker at the moment it changes.",
        "",
        "Like the system checking if you noticed.",
      ];
    }

    if (n === 2) {
      state.flags.crosswalk_flicker_window_known = true;
      return [
        "You watch again.",
        "",
        "The flicker is consistent.",
        "",
        "One second.",
        "",
        "A perfect window.",
        "",
        "Not for pedestrians —",
        "",
        "For cameras.",
      ];
    }

    return [
      "You can predict the flicker now.",
      "",
      "You hate that you can predict it.",
    ];
  },
  choices: [
    { label: "Back", go: "crosswalk_perimeter" },
  ],
},

crosswalk_inspect_pole: {
  title: "Curb Pole",
  meta: "Infrastructure is always the disguise.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_pole_bg",
    light: "crosswalk_pole_light",
    glow: "crosswalk_pole_glow",
    fg: "crosswalk_pole_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const hasResidue = !!state.flags.ev_mirror_residue;
    const hasStamp = !!state.flags.ev_fracture_stamp;

    const lines = [
      "The pole is painted city-gray.",
      "",
      "A push-button.",
      "A speaker grille.",
      "A small camera housing pointed down.",
      "",
      "And beneath the paint, faintly:",
      "",
      "linked circles.",
    ];

    if (!hasResidue && !hasStamp) {
      lines.push(
        "",
        "You don’t have anything that feels like authority.",
        "",
        "Touching it feels like volunteering to be corrected."
      );
    } else {
      lines.push(
        "",
        "Your hand hovers near the housing.",
        "",
        "The cracked spiral on your skin prickles like static."
      );
    }

    return lines;
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "crosswalk_perimeter" }];

    // Requires either stamp OR mirror residue to interact deeper
    if (state.flags.ev_fracture_stamp || state.flags.ev_mirror_residue) {
      c.unshift({ label: "Feel for a seam (behind the housing)", go: "crosswalk_find_seam" });
    }

    return c;
  },
},

crosswalk_find_seam: {
  title: "Seam",
  meta: "They never expect citizens to touch the edges.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_pole_bg",
    light: "crosswalk_pole_light",
    glow: "crosswalk_pole_glow",
    fg: "crosswalk_pole_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_seam_found = true;
  },
  text: () => [
    "Your fingers find a seam behind the camera housing.",
    "",
    "A hidden panel, held by two screws.",
    "",
    "Not tamper-proof.",
    "",
    "Just… assumed.",
    "",
    "A small label inside the seam reads:",
    "",
    "“FIELD NODE — PATHWAY.”",
  ],
  choices: [
    { label: "Try to open it (needs timing)", go: "crosswalk_open_panel_gate" },
    { label: "Back", go: "crosswalk_inspect_pole" },
  ],
},

crosswalk_open_panel_gate: {
  title: "Panel",
  meta: "The camera has to blink.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_pole_bg",
    light: "crosswalk_pole_light",
    glow: "crosswalk_pole_glow",
    fg: "crosswalk_pole_fg",
  }),
  text: (state) => {
    const knowsWindow = !!state.flags.crosswalk_flicker_window_known;
    if (!knowsWindow) {
      return [
        "You put pressure on the panel.",
        "",
        "The camera housing makes a tiny adjustment sound.",
        "",
        "Like it’s focusing on your hand.",
        "",
        "You stop.",
        "",
        "You need a blind spot.",
      ];
    }

    return [
      "You wait for the signal change.",
      "",
      "One second.",
      "",
      "A flicker.",
      "",
      "A perfect blind moment.",
      "",
      "If you move fast, you can open it without being logged.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "crosswalk_perimeter" }];

    if (state.flags.crosswalk_flicker_window_known) {
      c.unshift({ label: "Open it during the flicker", go: "crosswalk_open_panel" });
    } else {
      c.unshift({ label: "Watch the pattern first", go: "crosswalk_watch_pattern" });
    }

    return c;
  },
},

crosswalk_open_panel: {
  title: "Field Node",
  meta: "A small machine running a big lie.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_panel_bg",
    light: "crosswalk_panel_light",
    glow: "crosswalk_panel_glow",
    fg: "crosswalk_panel_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_panel_opened = true;
  },
  text: (state) => {
    const lines = [
      "The panel pops open.",
      "",
      "Inside: a small module with a blinking LED.",
      "",
      "A slot labeled:",
      "",
      "“AUTH TAG”",
      "",
      "And a second, smaller switch:",
      "",
      "“MAINTENANCE — TEST”",
    ];

    if (!state.flags.ev_mirror_residue && !state.flags.ev_fracture_stamp) {
      lines.push(
        "",
        "You feel instantly stupid.",
        "",
        "You opened the box but you still don’t have the right kind of permission."
      );
    } else {
      lines.push(
        "",
        "Your cracked spiral mark tingles.",
        "",
        "The module responds to you like it recognizes the scar."
      );
    }

    return lines;
  },
  choices: (state) => {
    const c = [{ label: "Close the panel", go: "crosswalk_perimeter" }];

    // You can try to sabotage in two ways:
    // A) "Tag it" with mirror residue (physical, creepy)
    // B) "Stamp it" with fracture stamp (bureaucratic, weird)
    if (state.flags.ev_mirror_residue) c.unshift({ label: "Press your stained fingers to the AUTH TAG slot", go: "crosswalk_tag_with_residue" });
    if (state.flags.ev_fracture_stamp) c.unshift({ label: "Press the fracture stamp to the module", go: "crosswalk_tag_with_stamp" });

    // Maintenance test is risky unless you have tag applied
    c.unshift({ label: "Flip MAINTENANCE—TEST (risky)", go: "crosswalk_flip_test" });

    return c;
  },
},

crosswalk_tag_with_residue: {
  title: "AUTH TAG",
  meta: "It likes your mark.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_panel_bg",
    light: "crosswalk_panel_light",
    glow: "crosswalk_panel_glow",
    fg: "crosswalk_panel_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_tagged = true;
    state.flags.crosswalk_tag_type = "residue";
    state.flags.ev_crosswalk_tamper = true;
  },
  text: () => [
    "You press your stained fingers to the slot.",
    "",
    "The ink on your skin warms like living thing.",
    "",
    "The LED changes from green to pale blue.",
    "",
    "The module emits a quiet tone.",
    "",
    "Not an alarm.",
    "",
    "An acknowledgement.",
    "",
    "You realize the city can *recognize* you now.",
  ],
  choices: [
    { label: "Flip MAINTENANCE—TEST", go: "crosswalk_flip_test" },
    { label: "Close the panel", go: "crosswalk_perimeter" },
  ],
},

crosswalk_tag_with_stamp: {
  title: "Stamp",
  meta: "Authority as a bruise.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_panel_bg",
    light: "crosswalk_panel_light",
    glow: "crosswalk_panel_glow",
    fg: "crosswalk_panel_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_tagged = true;
    state.flags.crosswalk_tag_type = "stamp";
    state.flags.ev_crosswalk_tamper = true;
  },
  text: () => [
    "You press the fracture stamp against the module casing.",
    "",
    "The cracked spiral glows faintly.",
    "",
    "The LED shifts to pale blue.",
    "",
    "A line scrolls across a tiny hidden screen:",
    "",
    "“FRACTURE AUTH ACCEPTED.”",
    "",
    "Your stomach drops.",
    "",
    "You just authenticated sabotage with paperwork.",
  ],
  choices: [
    { label: "Flip MAINTENANCE—TEST", go: "crosswalk_flip_test" },
    { label: "Close the panel", go: "crosswalk_perimeter" },
  ],
},

crosswalk_flip_test: {
  title: "Maintenance Test",
  meta: "Do it wrong and you become the correction.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_panel_bg",
    light: "crosswalk_panel_light",
    glow: "crosswalk_panel_glow",
    fg: "crosswalk_panel_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};

    // If not tagged, the system bites.
    if (!state.flags.crosswalk_tagged) {
      state.hp = Math.max(1, (state.hp ?? 10) - 2);
      state.sanity = Math.max(0, (state.sanity ?? 10) - 2);
      state.flags.crosswalk_bite = true;

      return [
        "You flip the switch.",
        "",
        "The module emits a sharp tone —",
        "a sound that feels like a dentist drill inside your skull.",
        "",
        "Your vision sparks white.",
        "",
        "The switch snaps back by itself.",
        "",
        "A voice from the pole speaker whispers:",
        "",
        "\"No.\"",
      ];
    }

    // Tagged = success (fracture event)
    state.flags.crosswalk_sabotaged = true;
    state.flags.unlock_municipal_tunnel = true;
    state.flags.loop_fracture_level = (state.flags.loop_fracture_level ?? 0) + 1;

    return [
      "You flip the switch.",
      "",
      "The LED pulses pale blue twice.",
      "",
      "Then goes dark.",
      "",
      "For one second, the whole intersection feels… unmoored.",
      "",
      "The traffic noise mutes like someone hit pause.",
      "",
      "Then reality resumes.",
      "",
      "A tiny hatch under the module pops open.",
      "",
      "Inside is a laminated card:",
      "",
      "“MUNICIPAL SERVICES — TUNNEL ACCESS”",
      "",
      "You pocket it before you can think.",
    ];
  },
  choices: (state) => {
    if (state.flags.crosswalk_sabotaged) {
      return [
        { label: "Leave immediately", go: "downtown_arrival" },
        { label: "Find the tunnel access point", go: "municipal_tunnel_entrance" },
      ];
    }

    return [
      { label: "Back away (holding your head)", go: "crosswalk_perimeter" },
      { label: "Watch the pattern first", go: "crosswalk_watch_pattern" },
    ];
  },
},

crosswalk_test_boundary: {
  title: "Street",
  meta: "A bad habit. A predictable punishment.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "crosswalk_bg",
    light: "crosswalk_light",
    glow: "crosswalk_glow",
    fg: "crosswalk_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.crosswalk_boundary_tests = (state.flags.crosswalk_boundary_tests ?? 0) + 1;

    const n = state.flags.crosswalk_boundary_tests;

    if (n === 1) {
      state.sanity = Math.max(0, (state.sanity ?? 10) - 1);
      return [
        "You step one foot off the curb.",
        "",
        "Nothing happens.",
        "",
        "Then the pole speaker clicks.",
        "",
        "\"Not like that,\" it whispers.",
        "",
        "You step back fast.",
      ];
    }

    state.hp = Math.max(1, (state.hp ?? 10) - 1);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 1);
    return [
      "You step into the street again.",
      "",
      "A pressure pushes against your chest — hard.",
      "",
      "Not wind.",
      "",
      "Authority.",
      "",
      "You stumble back to the curb, heart racing.",
      "",
      "A pedestrian passes you without looking.",
    ];
  },
  choices: [
    { label: "Back", go: "crosswalk_perimeter" },
  ],
},

// ------------------------------------------------------------
// NEW LOCATION: MUNICIPAL SERVICES TUNNEL (unlocked by sabotage)
// ------------------------------------------------------------

municipal_tunnel_entrance: {
  title: "Municipal Access",
  meta: "The city has veins.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_entrance_bg",
    light: "tunnel_entrance_light",
    glow: "tunnel_entrance_glow",
    fg: "tunnel_entrance_fg",
  }),
  text: (state) => {
    const unlocked = !!state.flags.unlock_municipal_tunnel;
    if (!unlocked) {
      return [
        "You find a locked utility hatch near the annex perimeter.",
        "",
        "There’s no handle.",
        "",
        "Just a municipal seal and a keyplate.",
        "",
        "You don’t belong here.",
      ];
    }

    return [
      "You find the access hatch.",
      "",
      "The municipal seal is scratched — linked circles carved into it.",
      "",
      "You slide the tunnel access card against the keyplate.",
      "",
      "A quiet click answers.",
      "",
      "The hatch releases.",
    ];
  },
  choices: (state) => {
    if (!state.flags.unlock_municipal_tunnel) {
      return [
        { label: "Back", go: "downtown_arrival" },
      ];
    }
    return [
      { label: "Go down", go: "municipal_tunnel_inside" },
      { label: "Change your mind", go: "downtown_arrival" },
      { label: "Find the conduit panel (override latch)", go: "tunnel_conduit_panel" },
    ];
  },
},

municipal_tunnel_inside: {
  title: "Municipal Tunnel",
  meta: "Not meant for citizens. Not meant for light.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_bg",
    light: "tunnel_light",
    glow: "tunnel_glow",
    fg: "tunnel_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.tunnel_entered = true;
  },
  text: () => [
    "Concrete walls sweat.",
    "",
    "Pipes run overhead like ribs.",
    "",
    "A faint hum travels through them —",
    "",
    "like the city’s nervous system is carrying a message.",
    "",
    "You follow the tunnel toward a door marked:",
    "",
    "“CONTINUITY — AUTHORIZED PERSONNEL”",
  ],
  choices: [
    { label: "Approach the Continuity door", go: "continuity_hall_door" },
    { label: "Search the tunnel side alcove", go: "tunnel_alcove_search" },
    { label: "Go back up", go: "downtown_arrival" },
  ],
},

tunnel_alcove_search: {
  title: "Tunnel Alcove",
  meta: "Tools and leftovers.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_bg",
    light: "tunnel_light",
    glow: "tunnel_glow",
    fg: "tunnel_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const n = state.flags.tunnel_searches ?? 0;
    state.flags.tunnel_searches = n + 1;

    if (n === 0) {
      state.flags.ev_tunnel_signage = true;
      return [
        "You find a clipboard with route codes.",
        "",
        "One line is circled:",
        "",
        "“HALLWAY CAM BLINK — 00:01”",
        "",
        "It matches the crosswalk flicker window.",
        "",
        "Same architecture.",
        "Same design language.",
      ];
    }

    if (n === 1 && !state.flags.found_conduit_key) {
      state.flags.found_conduit_key = true;
      return [
        "Behind a pipe bracket, you find a small key labeled:",
        "",
        "“CONDUIT / PANEL”",
        "",
        "It’s sticky with old tape residue.",
        "",
        "Someone kept using it and putting it back.",
      ];
    }

    return [
      "You search again.",
      "",
      "The tunnel keeps giving you the feeling that it’s been used recently.",
      "",
      "By someone who doesn’t want to be seen.",
    ];
  },
  choices: [
    { label: "Back", go: "municipal_tunnel_inside" },
  ],
},

// ------------------------------------------------------------
// CONTINUITY HALL: Restricted hallway + hostile UI escalation
// ------------------------------------------------------------

continuity_hall_door: {
  title: "Continuity Door",
  meta: "A boundary that expects obedience.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_door_bg",
    light: "continuity_door_light",
    glow: "continuity_door_glow",
    fg: "continuity_door_fg",
  }),
  text: (state) => {
    const hasCard = !!state.flags.unlock_municipal_tunnel;
    const hasResidue = !!state.flags.ev_mirror_residue;
    const hasStamp = !!state.flags.ev_fracture_stamp;

    const lines = [
      "A keyplate waits beside the door.",
      "",
      "A camera dome above it rotates a fraction, then stops.",
    ];

    if (hasCard) lines.push("", "Your tunnel card got you this far.", "But the keyplate is different.");
    if (!hasResidue && !hasStamp) lines.push("", "You don’t feel like the system will accept you here.", "Not yet.");
    if (hasResidue || hasStamp) lines.push("", "Your cracked spiral mark prickles.", "Like the system recognizes the category you belong to.");

    return lines;
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "municipal_tunnel_inside" }];

    if (state.flags.ev_mirror_residue || state.flags.ev_fracture_stamp) {
      c.unshift({ label: "Swipe / present authorization", go: "continuity_hall_enter" });
    } else {
      c.unshift({ label: "You need authorization (leave)", go: "municipal_tunnel_inside" });
    }

    return c;
  },
},

continuity_hall_enter: {
  title: "Continuity Hall",
  meta: "Where paperwork becomes architecture.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_hall_bg",
    light: "continuity_hall_light",
    glow: "continuity_hall_glow",
    fg: "continuity_hall_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.continuity_hall_entered = true;

    // Escalate hostility
    state.flags.ui_hostile_level = Math.min(3, (state.flags.ui_hostile_level ?? 0) + 1);
  },
  text: (state) => {
    const lvl = state.flags.ui_hostile_level ?? 0;

    const lines = [
      "The hallway is too clean.",
      "",
      "Not maintained-clean.",
      "Erased-clean.",
      "",
      "Doors line the corridor with labels you shouldn’t recognize:",
      "",
      "• PATHWAY ADMIN",
      "• PUBLIC COMPLIANCE",
      "• OBSERVER LIAISON",
      "",
      "At the far end: a workstation light glows.",
    ];

    if (lvl >= 1) lines.push("", "Your phone screen flickers.", "The brightness slider moves by itself.");
    if (lvl >= 2) lines.push("", "Your map app opens and closes.", "Like it can’t decide if you’re allowed to see where you are.");
    if (lvl >= 3) lines.push("", "You hear a printer start somewhere ahead.", "No one is there.");

    return lines;
  },
  choices: [
    { label: "Enter PATHWAY ADMIN", go: "pathway_admin_room" },
    { label: "Enter OBSERVER LIAISON", go: "observer_liaison_room" },
    { label: "Approach the glowing workstation", go: "continuity_workstation_hostile" },
    { label: "Retreat (back to tunnel)", go: "municipal_tunnel_inside" },
  ],
},

pathway_admin_room: {
  title: "Pathway Admin",
  meta: "Forms that decide what happens to people.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "pathway_admin_bg",
    light: "pathway_admin_light",
    glow: "pathway_admin_glow",
    fg: "pathway_admin_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_pathway_admin_seen = true;
  },
  text: (state) => {
    const sabotaged = !!state.flags.crosswalk_sabotaged;

    const lines = [
      "A wall display shows intersection nodes like a transit map.",
      "",
      "Your crosswalk is listed as:",
      "",
      "NODE: PERIMETER-12",
    ];

    if (sabotaged) {
      lines.push(
        "",
        "Status: DE-SYNC",
        "",
        "A note appears beneath it:",
        "",
        "“FIELD NODE REQUIRES RE-SEAL.”",
        "",
        "You did that.",
        "",
        "The city noticed."
      );
      state.flags.ev_de_sync_confirmed = true;
    } else {
      lines.push(
        "",
        "Status: STABLE",
        "",
        "A phrase pulses under the node:",
        "",
        "“REINFORCEMENT CONSISTENT.”"
      );
    }

    return lines;
  },
  choices: [
    { label: "Back to hall", go: "continuity_hall_enter" },
  ],
},

observer_liaison_room: {
  title: "Observer Liaison",
  meta: "Mayor’s Office, but the desk is empty.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "observer_room_bg",
    light: "observer_room_light",
    glow: "observer_room_glow",
    fg: "observer_room_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_observer_room_seen = true;
  },
  text: (state) => {
    const lines = [
      "A desk sits under a single lamp.",
      "",
      "No personal items.",
      "",
      "Just a tray of sealed envelopes.",
      "",
      "Each stamped with linked circles.",
      "",
      "A sticky note on the tray reads:",
      "",
      "“IF SUBJECT ARRIVES, DO NOT ENGAGE DIRECTLY.”",
    ];

    if (state.flags.ev_sublevel_observer || state.flags.ev_observer_audio) {
      lines.push(
        "",
        "You recognize the handwriting style from the directive.",
        "",
        "This room isn’t for paperwork.",
        "",
        "It’s for watching."
      );
    }

    return lines;
  },
  choices: [
    { label: "Check the lower drawer (if you know)", go: "observer_sealkey_drawer" },
    { label: "Open one envelope", go: "observer_envelope_open" },
    { label: "Back to hall", go: "continuity_hall_enter" },
  ],
},

observer_envelope_open: {
  title: "Envelope",
  meta: "A message without a sender.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "observer_room_bg",
    light: "observer_room_light",
    glow: "observer_room_glow",
    fg: "observer_room_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_observer_envelope = true;
    state.flags.seed_break_loop_goal = true;
  },
  text: () => [
    "Inside is a single card.",
    "",
    "Printed in clean, official font:",
    "",
    "“YOU CAN’T BREAK THE LOOP FROM INSIDE THE PATHWAY.”",
    "",
    "A second line, hand-written underneath:",
    "",
    "“Break the pathway.”",
    "",
    "“Then the loop stutters.”",
    "",
    "“Then you run.”",
  ],
  choices: [
    { label: "Back", go: "observer_liaison_room" },
    { label: "Back to hall", go: "continuity_hall_enter" },
  ],
},

// ------------------------------------------------------------
// HOSTILE WORKSTATION (PC MODE) — it tries to stop you
// ------------------------------------------------------------

continuity_workstation_hostile: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_hall_bg",
    light: "continuity_hall_light",
    glow: "continuity_hall_glow",
    fg: "continuity_hall_fg",
  }),
  uiMode: "computer",
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.continuity_pc_seen = true;
  },
  computerUI: (state) => {
    state.flags = state.flags || {};
    const lvl = state.flags.ui_hostile_level ?? 1;

    // This workstation is hostile: it closes options unless you have proof.
    const ev =
      (state.flags.ev_work_pc_archive ? 1 : 0) +
      (state.flags.ev_sublevel_observer ? 1 : 0) +
      (state.flags.ev_observer_audio ? 1 : 0) +
      (state.flags.ev_de_sync_confirmed ? 1 : 0) +
      (state.flags.ev_crosswalk_tamper ? 1 : 0) +
      (state.flags.ev_fracture_stamp ? 1 : 0) +
      (state.flags.ev_mirror_residue ? 1 : 0);

    const msg = [];
    msg.push("CONTINUITY WORKSTATION");
    msg.push("");
    msg.push("UNAUTHORIZED ACCESS DETECTED.");

    if (lvl >= 2) {
      msg.push("");
      msg.push("WINDOW FOCUS OVERRIDE: ENABLED");
      msg.push("CURSOR CONTROL: PARTIAL");
    }

    msg.push("");
    msg.push("STATUS:");

    if (state.flags.crosswalk_sabotaged) {
      msg.push("FIELD NODE: DE-SYNC");
      msg.push("RE-SEAL REQUIRED");
    } else {
      msg.push("FIELD NODE: STABLE");
      msg.push("COMPLIANCE: NORMAL");
    }

    msg.push("");

    if (ev >= 4) {
      msg.push("You have enough proof to be dangerous.");
      msg.push("That means you’re allowed one question.");
    } else {
      msg.push("You do not have enough proof.");
      msg.push("You are not allowed questions.");
      msg.push("");
      msg.push("GO HOME.");
    }

    // Buttons: if low evidence, it forces you out; if enough, gives you "Latch override" hint.
    const buttons = [];
    if (ev >= 4) {
      buttons.push({ label: "Request Latch Override", go: "continuity_latch_override" });
      buttons.push({ label: "Open Logs", go: "continuity_logs_view" });
    } else {
      buttons.push({ label: "OK", go: "continuity_hall_enter" });
    }

    return {
      type: "error",
      title: "SYS_GUARD",
      message: msg,
      buttons,
    };
  },
  text: () => [],
},

continuity_logs_view: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_hall_bg",
    light: "continuity_hall_light",
    glow: "continuity_hall_glow",
    fg: "continuity_hall_fg",
  }),
  uiMode: "computer",
  computerUI: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_continuity_logs = true;

    return {
      type: "dos",
      input: "typed",
      lines: [
        "C:\\CONTINUITY>TYPE ACCESS.LOG",
        "",
        "ENTRY: OBSERVER_LIAISON — OPEN",
        "ENTRY: PATHWAY_ADMIN — OPEN",
        "ENTRY: SUBJECT_PRESENT — TRUE",
        "",
        "NOTICE: FIELD NODE DE-SYNC DETECTED",
        "ACTION: INITIATE RE-SEAL",
        "",
        "NEXT: LATCH OVERRIDE REQUIRED",
        "LOCATION: SERVICE CONDUIT PANEL",
        "",
        "C:\\CONTINUITY>",
      ],
      prompt: "C:\\CONTINUITY>",
    };
  },
  text: () => [],
  choices: [
    { label: "Back", go: "continuity_workstation_hostile" },
  ],
},

continuity_latch_override: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_hall_bg",
    light: "continuity_hall_light",
    glow: "continuity_hall_glow",
    fg: "continuity_hall_fg",
  }),
  uiMode: "computer",
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.latch_override_hint = true;
  },
  computerUI: {
    type: "error",
    title: "LATCH OVERRIDE",
    message: [
      "OVERRIDE REQUIRES PHYSICAL ACCESS.",
      "",
      "SERVICE CONDUIT PANEL LOCATION:",
      "MUNICIPAL TUNNEL — ALCOVE",
      "",
      "TOOL: CONDUIT / PANEL KEY",
      "",
      "WARNING:",
      "RE-SEAL TEAM WILL ARRIVE AFTER OVERRIDE.",
      "",
      "RUN FAST.",
    ],
    buttons: [
      { label: "OK", go: "continuity_hall_enter" },
    ],
  },
  text: () => [],
},

// ------------------------------------------------------------
// TUNNEL: CONDUIT PANEL -> latch override (puzzle step)
// ------------------------------------------------------------

tunnel_conduit_panel: {
  title: "Conduit Panel",
  meta: "A physical latch holding a metaphysical lie.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_bg",
    light: "tunnel_light",
    glow: "tunnel_glow",
    fg: "tunnel_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const hasKey = !!state.flags.found_conduit_key;
    const hasHint = !!state.flags.latch_override_hint || !!state.flags.ev_continuity_logs;

    if (!hasHint) {
      return [
        "A metal panel sits behind a pipe bend.",
        "",
        "You wouldn’t notice it unless you were already paranoid.",
      ];
    }

    if (!hasKey) {
      return [
        "The panel has a simple keyhole.",
        "",
        "You need the conduit key.",
        "",
        "The tunnel alcove might have one.",
      ];
    }

    return [
      "You kneel in front of the panel.",
      "",
      "Your conduit key fits perfectly.",
      "",
      "That makes your stomach drop.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "municipal_tunnel_inside" }];

    if ((state.flags.latch_override_hint || state.flags.ev_continuity_logs) && !state.flags.found_conduit_key) {
      c.unshift({ label: "Search the alcove", go: "tunnel_alcove_search" });
    }
    if ((state.flags.latch_override_hint || state.flags.ev_continuity_logs) && state.flags.found_conduit_key) {
      c.unshift({ label: "Unlock the panel", go: "tunnel_conduit_unlock" });
    }

    return c;
  },
},

tunnel_conduit_unlock: {
  title: "Panel",
  meta: "You flip a switch you were never meant to touch.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_panel_bg",
    light: "tunnel_panel_light",
    glow: "tunnel_panel_glow",
    fg: "tunnel_panel_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.latch_override_done = true;

    // This is the sabotage payoff: the loop "stutters" and opens next path.
    state.flags.loop_stutter = true;
    state.flags.unlock_escape_route = true;
  },
  text: (state) => [
    "The panel swings open.",
    "",
    "Inside: a small latch switch labeled:",
    "",
    "LATCH OVERRIDE — FIELD NODE",
    "",
    "You flip it.",
    "",
    "Somewhere above, the city… hesitates.",
    "",
    "Lights dim in the tunnel for half a second.",
    "",
    "Then return.",
    "",
    "A distant alarm begins — not loud.",
    "Administrative.",
    "",
    "Like someone filed a complaint against reality.",
    "",
    "A speaker in the tunnel crackles:",
    "",
    "\"RE-SEAL TEAM DISPATCHED.\"",
    "",
    "You run.",
  ],
  choices: [
    { label: "Run back to the hatch", go: "tunnel_escape_run" },
    { label: "Run deeper (wrong but possible)", action: "loseSanity", data: { amount: 1 }, go: "tunnel_deeper_wrongway" },
  ],
},

tunnel_escape_run: {
  title: "Run",
  meta: "The city wants you tidy. You refuse.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_run_bg",
    light: "tunnel_run_light",
    glow: "tunnel_run_glow",
    fg: "tunnel_run_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.escape_run_started = true;

    // Consequence: health loss, but not death (yet)
    state.hp = Math.max(1, (state.hp ?? 10) - 1);

    return [
      "You sprint.",
      "",
      "Your shoes skid on damp concrete.",
      "",
      "Behind you, footsteps appear — not echo.",
      "",
      "Real steps.",
      "",
      "The tunnel lights strobe in a slow, bureaucratic rhythm.",
      "",
      "Like someone stamped “DENIED” on the ceiling over and over.",
    ];
  },
  choices: [
    { label: "Climb the hatch", go: "escape_hatch_climb" },
    { label: "Hide in the alcove (risky)", go: "escape_hide_alcove" },
  ],
},

escape_hide_alcove: {
  title: "Hide",
  meta: "Playing dead for a living city.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_bg",
    light: "tunnel_light",
    glow: "tunnel_glow",
    fg: "tunnel_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.escape_hide_attempt = (state.flags.escape_hide_attempt ?? 0) + 1;

    // If sanity is low, hiding is worse.
    const sanity = state.sanity ?? 10;

    if (sanity <= 4) {
      state.hp = Math.max(1, (state.hp ?? 10) - 2);
      state.sanity = Math.max(0, sanity - 1);
      return [
        "You squeeze into the alcove.",
        "",
        "Your breathing is too loud.",
        "",
        "The footsteps stop right outside.",
        "",
        "A flashlight beam sweeps once.",
        "",
        "A voice says softly:",
        "",
        "\"There you are.\"",
        "",
        "Pain blooms behind your eyes.",
      ];
    }

    state.sanity = Math.max(0, sanity - 1);
    return [
      "You hide in the alcove.",
      "",
      "The footsteps pass by — slow, methodical.",
      "",
      "You hold still until your muscles cramp.",
      "",
      "When it’s quiet again, you taste metal in your mouth.",
      "",
      "You didn’t get caught.",
      "",
      "But you feel logged.",
    ];
  },
  choices: [
    { label: "Climb the hatch now", go: "escape_hatch_climb" },
    { label: "Run anyway", go: "escape_hatch_climb" },
  ],
},

tunnel_deeper_wrongway: {
  title: "Deeper",
  meta: "Bad choice. Real consequences.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "tunnel_deep_bg",
    light: "tunnel_deep_light",
    glow: "tunnel_deep_glow",
    fg: "tunnel_deep_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.tunnel_wrongway = true;

    state.hp = Math.max(1, (state.hp ?? 10) - 2);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 1);

    return [
      "You run deeper into the tunnel.",
      "",
      "The air turns colder and wetter.",
      "",
      "The pipes overhead start to hum louder.",
      "",
      "Your phone flashes:",
      "",
      "NO SIGNAL",
      "",
      "Then:",
      "",
      "SUBJECT OUT OF ROUTE",
      "",
      "You realize the tunnel is guiding you —",
      "",
      "and you just left the path it expects.",
    ];
  },
  choices: [
    { label: "Turn back (find the hatch)", go: "tunnel_escape_run" },
  ],
},

escape_hatch_climb: {
  title: "Exit",
  meta: "Back to streetlight and lies.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "hatch_exit_bg",
    light: "hatch_exit_light",
    glow: "hatch_exit_glow",
    fg: "hatch_exit_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.escape_route_used = true;

    // Act progression gate: you’ve successfully “broken the pathway” once.
    state.flags.pathway_broken_once = true;
    state.flags.unlock_act1_part4 = true;
  },
  text: () => [
    "You climb the hatch ladder.",
    "",
    "Your hands slip on metal rungs.",
    "",
    "Above, the city sounds normal.",
    "",
    "That’s the lie it tells best.",
    "",
    "You shove the hatch shut and stagger into the night.",
    "",
    "Your heart is still trying to outrun the paperwork.",
  ],
  choices: [
    { label: "Go home", go: "apartment_hall_reseal" },
    { label: "Go to work (workstation will react)", go: "office_afterhours" },
    { label: "Go to Records (see what changed)", go: "records_return" },
  ],
},

// ============================================================
// ACT 1 — PART 4
// RETALIATION + ALLY FOLLOWUP + COUNTER-PROTOCOL OBJECTIVE
// Mirror demon escalation drops clue (does NOT remove demon/wrong)
// ============================================================

// ------------------------------------------------------------
// RETALIATION 1: APARTMENT HALLWAY (normal place becomes hostile)
// ------------------------------------------------------------

apartment_hall_reseal: {
  title: "Apartment Hall",
  meta: "The building feels… alerted.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "apartment_hall_bg",
    light: "apartment_hall_light",
    glow: "apartment_hall_glow",
    fg: "apartment_hall_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.reseal_presence = true;
    state.flags.reseal_hall_seen = true;

    // Retaliation escalates if you broke a pathway / did latch override
    const heat =
      (state.flags.pathway_broken_once ? 1 : 0) +
      (state.flags.latch_override_done ? 1 : 0) +
      (state.flags.crosswalk_sabotaged ? 1 : 0);

    state.flags.reseal_heat = Math.min(3, (state.flags.reseal_heat ?? 0) + heat);
  },
  text: (state) => {
    const heat = state.flags.reseal_heat ?? 0;

    const lines = [
      "Your apartment hallway looks normal.",
      "",
      "Same carpet.",
      "Same buzzing light.",
      "",
      "But the air is wrong.",
      "",
      "Too clean.",
      "Too quiet.",
    ];

    if (heat >= 1) {
      lines.push(
        "",
        "A faint chemical smell lingers.",
        "",
        "Like someone wiped the hallway with a disinfectant meant for crime scenes."
      );
    }
    if (heat >= 2) {
      lines.push(
        "",
        "Down the hall, a door is open.",
        "",
        "Not yours.",
        "",
        "Inside, you hear paper shuffling.",
        "",
        "Like someone organizing a life."
      );
    }
    if (heat >= 3) {
      lines.push(
        "",
        "A low voice speaks from behind a door:",
        "",
        "\"Subject out of route.\"",
        "",
        "You freeze.",
        "",
        "You’ve never heard them speak aloud before."
      );
    }

    return lines;
  },
  choices: [
    { label: "Go inside (lock the door)", go: "apartment_reseal_inside" },
    { label: "Look down the hall (risk it)", action: "loseSanity", data: { amount: 1 }, go: "apartment_reseal_peek" },
    { label: "Go to the mirror (confirm the city noticed)", go: "apartment_mirror" },
  ],
},

apartment_reseal_peek: {
  title: "Hallway",
  meta: "You look anyway. You always look.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "apartment_hall_bg",
    light: "apartment_hall_light",
    glow: "apartment_hall_glow",
    fg: "apartment_hall_fg",
  }),
  text: (state) => {
    const heat = state.flags.reseal_heat ?? 0;

    if (heat <= 1) {
      return [
        "You lean out and look down the hall.",
        "",
        "Nothing obvious.",
        "",
        "Just the feeling of being watched.",
        "",
        "Your phone screen flickers once.",
      ];
    }

    // Higher heat = consequences
    state.hp = Math.max(1, (state.hp ?? 10) - 1);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 1);

    return [
      "You look down the hall.",
      "",
      "A figure stands near the stairwell — still as a signpost.",
      "",
      "Not a neighbor.",
      "",
      "They’re wearing a city-maintenance jacket.",
      "",
      "But the jacket is too clean.",
      "",
      "They turn their head slowly toward you.",
      "",
      "And you feel your thoughts get… indexed.",
      "",
      "You shut the door hard, heart hammering.",
    ];
  },
  choices: [
    { label: "Inside. Now.", go: "apartment_reseal_inside" },
  ],
},

apartment_reseal_inside: {
  title: "Apartment",
  meta: "Home is a checkpoint now.",
  tension: 0.98,
  backgroundLayers: withBackground("apartment"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.apartment_locked = true;

    // If you have fracture note, it "ticks" here:
    if (state.flags.fracture_note_survived) state.flags.fracture_tick = (state.flags.fracture_tick ?? 0) + 1;
  },
  text: (state) => {
    const lines = [
      "You lock the door.",
      "",
      "The sound is too loud in the quiet apartment.",
      "",
      "For a moment you just stand there and listen.",
    ];

    if (state.flags.fracture_note_survived) {
      lines.push(
        "",
        "On your nightstand, the surviving page sits where you left it.",
        "",
        "The ink looks darker tonight.",
        "",
        "Like it’s still drying."
      );
    }

    lines.push(
      "",
      "You need a plan.",
      "",
      "Not curiosity.",
      "",
      "A plan."
    );

    return lines;
  },
  choices: [
    { label: "Sit down and write a plan", go: "counterprotocol_intro" },
    { label: "Go to sleep (risk reset)", go: "loop_sleep_attempt" },
    { label: "Check the mirror", go: "apartment_mirror" },
    { label: "Leave for work (dangerous)", go: "office_reseal_elevator" },
  ],
},

loop_sleep_attempt: {
  title: "Sleep",
  meta: "You don’t trust waking up anymore.",
  tension: 0.92,
  backgroundLayers: withBackground("apartment"),
  text: (state) => {
    const heat = state.flags.reseal_heat ?? 0;

    const lines = [
      "You lie down.",
      "",
      "Your body tries to sleep like it’s still allowed to be simple.",
      "",
      "The ceiling stares back.",
    ];

    if (heat >= 2) {
      lines.push(
        "",
        "You hear footsteps in the hall.",
        "",
        "Slow. Patient.",
        "",
        "Administrative."
      );
    }

    lines.push(
      "",
      "Somewhere in the apartment, something clicks.",
      "",
      "Not the lock.",
      "",
      "A deeper click.",
      "",
      "The one you remember."
    );

    state.flags.last_death = "sleep"; // for your death loop logic if needed
    return lines;
  },
  choices: [
    { label: "Get up (don’t sleep)", action: "loseSanity", data: { amount: 1 }, go: "apartment_reseal_inside" },
    { label: "Sleep anyway", go: "death_end_of_day" }, // your existing death node
  ],
},

// ------------------------------------------------------------
// RETALIATION 2: OFFICE ELEVATOR (normal path becomes trap)
// ------------------------------------------------------------

office_reseal_elevator: {
  title: "Office Elevator",
  meta: "The building wants you contained.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "office_elevator_bg",
    light: "office_elevator_light",
    glow: "office_elevator_glow",
    fg: "office_elevator_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.reseal_elevator_seen = true;

    // Escalate UI hostility a notch
    state.flags.ui_hostile_level = Math.min(3, (state.flags.ui_hostile_level ?? 0) + 1);
  },
  text: (state) => {
    const lines = [
      "The elevator doors open.",
      "",
      "The car is empty.",
      "",
      "But the mirror-polished wall reflects you wrong —",
      "",
      "like you’re half a second behind yourself.",
    ];

    if (state.flags.pathway_broken_once) {
      lines.push(
        "",
        "On the control panel, a new button exists:",
        "",
        "B2 — CONTINUITY",
        "",
        "It wasn’t there before.",
        "",
        "The city is offering you a path.",
        "",
        "That’s how you know it’s a trap."
      );
    }

    return lines;
  },
  choices: (state) => {
    const c = [
      { label: "Go to your floor (act normal)", go: "office_afterhours" },
      { label: "Step out (don’t ride it)", go: "office_afterhours" },
    ];

    if (state.flags.pathway_broken_once) {
      c.unshift({ label: "Press B2 (Continuity)", action: "loseSanity", data: { amount: 1 }, go: "elevator_trap_b2" });
    }

    return c;
  },
},

elevator_trap_b2: {
  title: "Elevator",
  meta: "The city routes you like mail.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "office_elevator_bg",
    light: "office_elevator_light",
    glow: "office_elevator_glow",
    fg: "office_elevator_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    state.flags.elevator_trap_triggered = true;

    state.sanity = Math.max(0, (state.sanity ?? 10) - 1);

    return [
      "The doors close.",
      "",
      "The elevator does not move.",
      "",
      "Instead, the lights dim —",
      "",
      "and the speaker clicks on.",
      "",
      "\"Re-seal in progress,\" a calm voice says.",
      "",
      "\"Please remain still.\"",
      "",
      "A faint hiss vents from the ceiling.",
      "",
      "You press buttons.",
      "Nothing responds.",
    ];
  },
  choices: [
    { label: "Force the doors (hurt yourself)", action: "takeDamage", data: { amount: 2 }, go: "elevator_escape_force" },
    { label: "Stay still (bad choice)", action: "loseSanity", data: { amount: 1 }, go: "elevator_stay_still" },
  ],
},

elevator_escape_force: {
  title: "Elevator Doors",
  meta: "Pain is still real. Use it.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "office_elevator_bg",
    light: "office_elevator_light",
    glow: "office_elevator_glow",
    fg: "office_elevator_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.ev_elevator_escape = true;
  },
  text: () => [
    "You jam your fingers into the seam and pull.",
    "",
    "The doors fight you like muscle.",
    "",
    "Then give.",
    "",
    "A gap opens.",
    "",
    "Cold hallway air hits your face like relief.",
    "",
    "You slip out and run before the doors can change their mind.",
  ],
  choices: [
    { label: "Run to custodial closet", go: "office_janitor_followup" },
    { label: "Run to workstation", go: "continuity_pc_reaction" },
  ],
},

elevator_stay_still: {
  title: "Elevator",
  meta: "Compliance is how it wins.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "office_elevator_bg",
    light: "office_elevator_light",
    glow: "office_elevator_glow",
    fg: "office_elevator_fg",
  }),
  text: (state) => {
    state.hp = Math.max(1, (state.hp ?? 10) - 3);
    state.sanity = Math.max(0, (state.sanity ?? 10) - 2);
    state.flags.failsafe_seen = true; // ties into your “remember the click” line

    return [
      "You stand still.",
      "",
      "The hiss grows louder.",
      "",
      "Your limbs feel heavy.",
      "",
      "The world narrows into a tunnel.",
      "",
      "And then —",
      "",
      "a click.",
      "",
      "So deep you feel it in your teeth.",
      "",
      "When the doors open again, you’re somewhere else.",
      "",
      "And you can’t remember walking there.",
    ];
  },
  choices: [
    { label: "Stagger out", go: "office_afterhours" },
  ],
},

// ------------------------------------------------------------
// ALLY FOLLOW-UP: Janitor slips the real exploit (Exception Form)
// ------------------------------------------------------------

office_janitor_followup: {
  title: "Custodial",
  meta: "He’s already waiting. That’s the terrifying part.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.janitor_followup_seen = true;
  },
  text: (state) => {
    const broke = !!state.flags.pathway_broken_once || !!state.flags.latch_override_done;

    const lines = [
      "He shuts the closet door behind you.",
      "",
      "\"You did something,\" he says.",
      "",
      "\"I felt it.\"",
    ];

    if (broke) {
      lines.push(
        "",
        "\"The city stuttered.\"",
        "",
        "\"That means you can make it bleed.\""
      );
    } else {
      lines.push(
        "",
        "\"Don’t do anything loud yet,\" he whispers.",
        "",
        "\"Not until you can survive the retaliation.\""
      );
    }

    lines.push(
      "",
      "He reaches into his jacket and produces a folded form.",
      "",
      "Old paper. Official stamp. Linked circles in the header.",
      "",
      "\"This is how they move exceptions through the system,\" he says.",
      "",
      "\"It’s also how you poison it.\""
    );

    return lines;
  },
  choices: [
    { label: "Take the form", go: "counterprotocol_get_form" },
    { label: "Ask who he really works for", action: "loseSanity", data: { amount: 1 }, go: "janitor_truth_hint" },
    { label: "Leave", go: "office_afterhours" },
  ],
},

janitor_truth_hint: {
  title: "Custodial",
  meta: "He won’t say it. He can’t.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: () => [
    "He looks away.",
    "",
    "\"I work for whoever makes the hallway stop watching me,\" he says.",
    "",
    "\"Sometimes that’s the city.\"",
    "",
    "\"Sometimes that’s you.\"",
    "",
    "\"Sometimes that’s nobody.\"",
  ],
  choices: [
    { label: "Back", go: "office_janitor_followup" },
  ],
},

// ------------------------------------------------------------
// COUNTER-PROTOCOL: Real objective with 3 components
// (Form + Signature + Seal Key)
// ------------------------------------------------------------

counterprotocol_intro: {
  title: "A Plan",
  meta: "Curiosity is how the system trains you. Planning is how you fight back.",
  tension: 0.90,
  backgroundLayers: withBackground("apartment"),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.counterprotocol_started = true;

    // Track components (simple flags)
    state.flags.cp_form = !!state.flags.cp_form;
    state.flags.cp_signature = !!state.flags.cp_signature;
    state.flags.cp_sealkey = !!state.flags.cp_sealkey;
  },
  text: (state) => {
    const got = [
      state.flags.cp_form ? "✓ Exception Form" : "✗ Exception Form",
      state.flags.cp_signature ? "✓ Custodian Signature" : "✗ Custodian Signature",
      state.flags.cp_sealkey ? "✓ Seal Key" : "✗ Seal Key",
    ];

    return [
      "You need a counter-protocol.",
      "",
      "Something that can be processed by the system —",
      "but produces the wrong outcome.",
      "",
      "You write it down like a recipe:",
      "",
      "COUNTER-PROTOCOL REQUIREMENTS:",
      ...got,
      "",
      "If you can assemble all three, you can file an exception that breaks the pathway logic.",
      "",
      "If the pathway breaks, the loop stops having rails.",
      "",
      "If the loop loses rails… you can run off it.",
    ];
  },
  choices: [
    { label: "Go to work (find ally / signature)", go: "office_afterhours" },
    { label: "Go to Records (systems love paperwork)", go: "records_return" },
    { label: "Go to the mirror (risk clue)", action: "loseSanity", data: { amount: 1 }, go: "apartment_mirror" },
    { label: "Back", go: "apartment_reseal_inside" },
  ],
},

counterprotocol_get_form: {
  title: "Exception Form",
  meta: "A loophole printed on dead trees.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.cp_form = true;
    state.flags.ev_exception_form = true;
  },
  text: () => [
    "You unfold the form.",
    "",
    "CONTINUITY EXCEPTION REQUEST",
    "",
    "Fields you can’t answer yet:",
    "",
    "• SEAL KEY (required)",
    "• CUSTODIAN SIGNATURE (required)",
    "• REQUESTED OUTCOME (must match authorized outcomes list)",
    "",
    "A warning line at the bottom:",
    "",
    "“UNAUTHORIZED OUTCOMES WILL TRIGGER CORRECTION.”",
    "",
    "He taps the paper once.",
    "",
    "\"We’re going to request an authorized outcome,\" he says.",
    "",
    "\"And use it to cause an unauthorized result.\"",
  ],
  choices: [
    { label: "Ask for the signature", go: "counterprotocol_signature_gate" },
    { label: "Leave", go: "office_afterhours" },
  ],
},

counterprotocol_signature_gate: {
  title: "Signature",
  meta: "He won’t sign until you can survive the cost.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const heat = state.flags.reseal_heat ?? 0;
    const hasSealKey = !!state.flags.cp_sealkey;

    const lines = [
      "\"Not yet,\" he says.",
      "",
      "\"A signature is a promise.\"",
      "\"A promise gets noticed.\"",
    ];

    if (!hasSealKey) {
      lines.push(
        "",
        "\"Get the seal key first.\"",
        "",
        "\"Without it, the form is bait.\"",
        "\"With it, the form is a weapon.\""
      );
    } else {
      lines.push(
        "",
        "He sees the seal key in your hand.",
        "",
        "He exhales.",
        "",
        "\"Okay,\" he says softly.",
        "\"Now it matters.\""
      );
    }

    if (heat >= 2) {
      lines.push(
        "",
        "\"Also,\" he adds, \"they’re looking for you.\"",
        "",
        "\"If you file this too soon, they’ll correct you mid-sentence.\""
      );
    }

    return lines;
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "office_janitor_followup" }];

    if (state.flags.cp_sealkey) {
      c.unshift({ label: "Get the signature", go: "counterprotocol_get_signature" });
    } else {
      c.unshift({ label: "Where do I get the seal key?", go: "sealkey_hint" });
    }

    return c;
  },
},

sealkey_hint: {
  title: "Seal Key",
  meta: "Not a metal key. A concept shaped like one.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  text: () => [
    "\"It’s in Continuity,\" he says.",
    "",
    "\"A drawer. A box. A panel.\"",
    "",
    "\"They call it a seal key because it seals pathways.\"",
    "",
    "\"But if you take it…\"",
    "",
    "\"You can unseal one.\"",
    "",
    "He hesitates.",
    "",
    "\"The workstation can show you where. If it decides you’re allowed.\"",
  ],
  choices: [
    { label: "Go to Continuity Hall (dangerous)", go: "municipal_tunnel_inside" },
    { label: "Go to the hostile workstation", go: "continuity_workstation_hostile" },
    { label: "Back", go: "office_janitor_followup" },
  ],
},

counterprotocol_get_signature: {
  title: "Signature",
  meta: "He signs like he’s bleeding.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "closet_bg",
    light: "closet_light",
    glow: "closet_glow",
    fg: "closet_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.cp_signature = true;
    state.flags.ev_custodian_signature = true;
  },
  text: () => [
    "He takes the form.",
    "",
    "His pen pauses above the signature line like it’s a cliff edge.",
    "",
    "Then he signs.",
    "",
    "The ink looks too dark — almost metallic.",
    "",
    "\"Now you’re not just curious,\" he whispers.",
    "",
    "\"Now you’re a problem.\"",
  ],
  choices: [
    { label: "Back", go: "office_janitor_followup" },
    { label: "Leave (hide the form)", go: "office_afterhours" },
  ],
},

// ------------------------------------------------------------
// CONTINUITY PC REACTION: UI gets nastier after you stuttered the loop
// ------------------------------------------------------------

continuity_pc_reaction: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_hall_bg",
    light: "continuity_hall_light",
    glow: "continuity_hall_glow",
    fg: "continuity_hall_fg",
  }),
  uiMode: "computer",
  computerUI: (state) => {
    state.flags = state.flags || {};

    // Hostility: if you broke pathway, it tries to stop you harder
    const broke = !!state.flags.pathway_broken_once || !!state.flags.latch_override_done;
    const hasProof =
      (state.flags.ev_continuity_logs ? 1 : 0) +
      (state.flags.ev_de_sync_confirmed ? 1 : 0) +
      (state.flags.ev_observer_envelope ? 1 : 0) +
      (state.flags.ev_directive_found ? 1 : 0) +
      (state.flags.ev_observer_audio ? 1 : 0);

    const lines = [];
    lines.push("SYS_GUARD ACTIVE");
    lines.push("");
    lines.push("NOTICE:");
    lines.push("RE-SEAL TEAM DISPATCHED");
    lines.push("");

    if (broke) {
      lines.push("You caused a DE-SYNC.");
      lines.push("That is not permitted.");
      lines.push("");
      lines.push("Your access will be corrected.");
      lines.push("");
    }

    if (hasProof >= 3) {
      lines.push("…but you have documentation.");
      lines.push("Documentation forces process.");
      lines.push("");
      lines.push("PROCEDURE AVAILABLE:");
      lines.push("— SEAL KEY LOCATION (ONE TIME)");
    } else {
      lines.push("You do not have enough documentation.");
      lines.push("");
      lines.push("GO HOME.");
    }

    const buttons = [];
    if (hasProof >= 3) {
      buttons.push({ label: "Show Seal Key Location", go: "sealkey_location_reveal" });
    }
    buttons.push({ label: "OK", go: "continuity_hall_enter" });

    return {
      type: "error",
      title: "SYS_GUARD",
      message: lines,
      buttons,
    };
  },
  text: () => [],
},

sealkey_location_reveal: {
  title: "",
  meta: "",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "continuity_hall_bg",
    light: "continuity_hall_light",
    glow: "continuity_hall_glow",
    fg: "continuity_hall_fg",
  }),
  uiMode: "computer",
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.sealkey_location_known = true;
  },
  computerUI: {
    type: "dos",
    input: "typed",
    lines: [
      "C:\\CONTINUITY>WHERE /SEALKEY",
      "",
      "RESULT:",
      "OBSERVER LIAISON — LOWER DRAWER",
      "TRAY: AUTH OUTCOMES LIST",
      "",
      "NOTE:",
      "ONE TIME REMOVAL WILL BE LOGGED.",
      "",
      "C:\\CONTINUITY>",
    ],
    prompt: "C:\\CONTINUITY>",
  },
  text: () => [],
  choices: [
    { label: "Back", go: "continuity_hall_enter" },
    { label: "Go to Observer Liaison room", go: "observer_sealkey_drawer" },
  ],
},

observer_sealkey_drawer: {
  title: "Observer Liaison",
  meta: "A drawer that holds the city’s permissions.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "observer_room_bg",
    light: "observer_room_light",
    glow: "observer_room_glow",
    fg: "observer_room_fg",
  }),
  text: (state) => {
    state.flags = state.flags || {};
    const known = !!state.flags.sealkey_location_known;
    const taken = !!state.flags.cp_sealkey;

    if (taken) {
      return [
        "The lower drawer is shut.",
        "",
        "The air around it feels tighter than the room.",
        "",
        "You already took what you shouldn’t have.",
      ];
    }

    if (!known) {
      return [
        "The desk drawers look ordinary.",
        "",
        "But you feel like the room is waiting for you to make the wrong move.",
      ];
    }

    return [
      "You kneel at the lower drawer.",
      "",
      "It’s heavier than it should be.",
      "",
      "Like it contains more than objects.",
      "",
      "You pull it open slowly.",
    ];
  },
  choices: (state) => {
    const c = [{ label: "Back", go: "observer_liaison_room" }];
    if (state.flags.sealkey_location_known && !state.flags.cp_sealkey) {
      c.unshift({ label: "Search the drawer", go: "observer_sealkey_take" });
    }
    return c;
  },
},

observer_sealkey_take: {
  title: "Lower Drawer",
  meta: "You steal permission.",
  tension: 1.0,
  backgroundLayers: () => ({
    bg: "observer_room_bg",
    light: "observer_room_light",
    glow: "observer_room_glow",
    fg: "observer_room_fg",
  }),
  onEnter: (state) => {
    state.flags = state.flags || {};
    state.flags.cp_sealkey = true;
    state.flags.ev_seal_key = true;

    // Taking it increases heat
    state.flags.reseal_heat = Math.min(3, (state.flags.reseal_heat ?? 0) + 1);
  },
  text: () => [
    "Inside the drawer is a thin metal case.",
    "",
    "Stamped with linked circles.",
    "",
    "You open it.",
    "",
    "A small key rests inside — not for a lock.",
    "",
    "For a seal.",
    "",
    "Beside it, a laminated list:",
    "",
    "AUTHORIZED OUTCOMES:",
    "• ROUTE SUBJECT HOME",
    "• INITIATE FAILSAFE",
    "• RE-SEAL FIELD NODE",
    "• TRANSFER SUBJECT TO OVERSIGHT",
    "",
    "You take the key.",
    "",
    "The drawer clicks softly as if satisfied.",
  ],
  choices: [
    { label: "Leave now", go: "continuity_hall_enter" },
    { label: "Back to tunnel (fast)", go: "municipal_tunnel_inside" },
  ],
},

// ------------------------------------------------------------
// MIRROR DEMON CLUE DROP (keeps demon terrifying, but gives progress)
// This is a special node you can jump to DURING demon escalation.
// ------------------------------------------------------------

mirror_demon_clue: {
  title: "The Mirror",
  meta: "It wants you scared. It also wants you moving.",
  tension: 1.0,
  backgroundLayers: withBackground("apartment"),
  onEnter: (state) => {
    state.flags = state.flags || {};

    // One-time clue drop
    if (!state.flags.demon_clue_given) {
      state.flags.demon_clue_given = true;

      // Gives the player a needed direction without “saving” them
      state.flags.sealkey_location_known = true;

      // Demon leaves a new “phrase fragment” for later acts
      state.flags.demon_phrase_fragment = "TRANSFER SUBJECT TO OVERSIGHT";
      state.flags.ev_demon_clue = true;
    }
  },
  text: (state) => [
    "The mirror goes wrong.",
    "",
    "Not the usual wrong.",
    "",
    "The glass bows outward.",
    "",
    "A shape presses from the other side — amused, patient.",
    "",
    "Then the surface clears just long enough to show text:",
    "",
    "OBSERVER LIAISON — LOWER DRAWER",
    "",
    "A second line appears, as if typed by fingernail:",
    "",
    state.flags.demon_phrase_fragment ? `"${state.flags.demon_phrase_fragment}"` : "\"TRANSFER SUBJECT TO OVERSIGHT\"",
    "",
    "Your reflection grins.",
    "",
    "\"You want out?\" it mouths silently.",
    "",
    "\"Then steal permission.\"",
  ],
  choices: [
    { label: "Back away (shaking)", action: "loseSanity", data: { amount: 2 }, go: "apartment_reseal_inside" },
    { label: "Keep staring (risk death)", action: "loseSanity", data: { amount: 1 }, go: "apartment_mirror" }, // returns to your demon logic
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
      `Evidence collected: ${evidenceCount(state)}/${TOTAL_EVIDENCE}`,
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

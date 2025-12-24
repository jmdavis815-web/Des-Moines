import { LOCATIONS } from "./db_locations.js";
import { setTime, advanceMinutes } from "./state.js"; // ✅ add these exports in state.js

// -------------------- ITEM HELPERS --------------------
function itemKey(locId, areaId, itemId) {
  return `${locId}.${areaId}.${itemId}`;
}

function isItemTaken(state, locId, areaId, itemId) {
  return !!state.taken?.[itemKey(locId, areaId, itemId)];
}

function isItemRevealed(state, locId, areaId, itemId) {
  return !!state.revealed?.[itemKey(locId, areaId, itemId)];
}

function passesRequires(state, requires) {
  if (!requires) return true;

  // demon gate
  if (requires.demon === true && !state.flags?.demon_mode) return false;
  if (requires.demon === false && state.flags?.demon_mode) return false;

  // flags
  if (requires.flagsAll) {
    for (const f of requires.flagsAll) if (!state.flags?.[f]) return false;
  }
  if (requires.flagsAny) {
    let ok = false;
    for (const f of requires.flagsAny) if (state.flags?.[f]) ok = true;
    if (!ok) return false;
  }
  if (requires.flagsNone) {
    for (const f of requires.flagsNone) if (state.flags?.[f]) return false;
  }

  // optional time gate (hour)
  if (requires.hourMin != null || requires.hourMax != null) {
    const hour = Math.floor((state.time?.minutes ?? 0) / 60) % 24;
    if (requires.hourMin != null && hour < requires.hourMin) return false;
    if (requires.hourMax != null && hour >= requires.hourMax) return false;
  }

  return true;
}

function computeVisibility(state, item) {
  // not hidden => visible if passes requires
  if (!item.hidden) return true;

  // hidden items become visible if revealed flag is set
  if (item.revealBy?.search && item.revealedOnSearch) return true; // optional legacy
  if (isItemRevealed(state, state.locationId, state.areaId, item.itemId)) return true;

  // reveal automatically in demon mode if configured
  if (item.revealBy?.demon && state.flags?.demon_mode) return true;

  // reveal automatically if some flag(s) are set
  if (item.revealBy?.flagsAll) {
    for (const f of item.revealBy.flagsAll) if (!state.flags?.[f]) return false;
    return true;
  }

  return false;
}

function areaItemsAvailable(state, locId, areaId) {
  const area = LOCATIONS[locId]?.areas?.[areaId];
  const items = area?.items ?? [];

  const out = [];

  for (const it of items) {
    // once/taken gate
    if (it.once && isItemTaken(state, locId, areaId, it.itemId)) continue;

    // requires gate
    if (!passesRequires(state, it.requires)) continue;

    // visibility gate (hidden/secret)
    const visible = computeVisibility(
      // use loc/area context properly:
      { ...state, locationId: locId, areaId },
      it
    );
    if (!visible) continue;

    out.push(it);
  }

  return out;
}

// -------------------- TIME + HOURS HELPERS --------------------
function getHour(state) {
  return Math.floor((state.time?.minutes ?? 0) / 60) % 24;
}

function isWithinHours(hour, hours) {
  if (!hours) return true;

  const open = hours.open ?? 0;
  const close = hours.close ?? 24;

  // normal window (e.g. 9 -> 17)
  if (open < close) return hour >= open && hour < close;

  // overnight window (e.g. 17 -> 2)
  return hour >= open || hour < close;
}

function isAreaAvailableNow(state, locId, areaKey) {
  const loc = LOCATIONS[locId];
  const area = loc?.areas?.[areaKey];
  const hours = area?.hours ?? loc?.hours;
  return isWithinHours(getHour(state), hours);
}

function isAreaUnlocked(state, locId, areaKey) {
  if (!state.unlockedAreas) return !LOCATIONS[locId]?.areas?.[areaKey]?.locked;
  return !!state.unlockedAreas[`${locId}.${areaKey}`];
}

function areaNodeId(locId, areaKey) {
  return `area_${locId}_${areaKey}`;
}

// -------------------- BACKGROUNDS (FROM LOCATIONS) --------------------
function bgFromLoc(locId, areaId) {
  return (state) => {
    const loc = LOCATIONS[locId];
    if (!loc) return {};

    const area = loc.areas?.[areaId];
    const normalize = (bg) => (typeof bg === "string" ? { bg } : bg || {});

    const locBg  = normalize(loc.bg);
    const areaBg = normalize(area?.bg);

    // --- decide variant ---
    const hour = getHour(state);
    const isDemon = !!state.flags?.demon_mode;
    const isNight = (hour >= 20 || hour < 6);

    let variantKey = null;
    if (isDemon) variantKey = "demon";
    else if (isNight) variantKey = "night";

    const v = variantKey ? normalize(area?.variants?.[variantKey]) : {};

    // ✅ merge full objects so screen/screenMask/etc survive
    const merged = { ...locBg, ...areaBg, ...v };

    // ✅ return EVERYTHING (plus safe defaults)
    return {
      ...merged,
      bg: merged.bg ?? "BG_PLACEHOLDER",
      light: merged.light ?? null,
      glow: merged.glow ?? null,
      fg: merged.fg ?? null,

      intensity: merged.intensity ?? 0,

      // (optional) also return these if you’re using them in StoryScene
      screen: merged.screen ?? null,
      screenAlpha: merged.screenAlpha ?? null,
      screenBlend: merged.screenBlend ?? null,
      screenX: merged.screenX ?? null,
      screenY: merged.screenY ?? null,
      screenScale: merged.screenScale ?? null,
      screenRot: merged.screenRot ?? null,
      screenMask: merged.screenMask ?? null,
      screenFit: merged.screenFit ?? null,
      screenFg: merged.screenFg ?? null,
      screenFgAlpha: merged.screenFgAlpha ?? null,
    };
  };
}

function onEnterArea(locId, areaKey) {
  return (state) => {
    state.locationId = locId;
    state.areaId = areaKey;
  };
}

function bgFromState() {
  return (state) => bgFromLoc(state.locationId, state.areaId)(state);
}

// -------------------- TRAVEL CHOICE BUILDER --------------------
function pushTravelChoice(c, state, locId, areaKey, label) {
  const unlocked = isAreaUnlocked(state, locId, areaKey);
  const available = isAreaAvailableNow(state, locId, areaKey);

  c.push({
    label:
      label +
      (unlocked ? "" : " (locked)") +
      (available ? "" : " (closed)"),
    go:
      unlocked && available
        ? areaNodeId(locId, areaKey)
        : (!available ? "closed_area" : "locked_area"),
  });
}

// ------------------------------------------------------------
// Small helper: formatted time meta (optional)
function metaTime(state) {
  const mins = state.time?.minutes ?? 0;
  const h = Math.floor(mins / 60) % 24;
  const m = String(mins % 60).padStart(2, "0");
  return `Time: ${h}:${m}   Demon: ${state.flags?.demon_mode ? "ON" : "off"}`;
}

// -------------------- ROOM NODES --------------------
export const ROOM_NODES = {
  // db_rooms.js (or wherever ROOM_NODES lives)
  
// MAIN NODES

  // =========================
  // APARTMENT: BEDROOM (START)
  // =========================
  intro_dream: {
  title: "Dreamscape",
  meta: (state) => metaTime(state),
  tension: 0.1,

  onEnter: (state, scene) => {
    onEnterArea("apartment", "apartment_bedroom")(state);

    if (!state.flags.time_set_intro) {
      state.flags.time_set_intro = true;
      setTime(state, 5, 12);
    }

    // 🔊 play ghost moan ONCE
    if (!state.flags.ghost_moan_played) {
      state.flags.ghost_moan_played = true;
      scene.sound.play("ghost_moan", {
        volume: 0.6,
        loop: false,
      });
    }

    // bleed into jump after a moment (once)
if (!state.flags.ghost_jump_queued) {
  state.flags.ghost_jump_queued = true;

  scene.time.delayedCall(6500, () => {
    // quick flash / fade
    scene.cameras.main.flash(120, 255, 255, 255);

    // optional tiny shake for impact
    scene.cameras.main.shake(180, 0.012);

    // switch node
    state.nodeId = "ghost_dream_jump";
    scene.renderNode?.(); // re-render StoryScene node
  });
}

  },

  backgroundLayers: {
    bg: "ghost_dream",
    fg: "intro_fg",
    light: "intro_light",
  },

  text: [
    "'You did this...' the voice whispers.",
    "",
    "You: 'Where the hell am I!?'",
    "",
    "'Am I dead?'",
    "",
  ],
},

ghost_dream_jump: {
  title: "Dreamscape",
  meta: (state) => metaTime(state),
  tension: 0.5,

  onEnter: (state, scene) => {
    // play jump scare once
    if (!state.flags.ghost_jump_played) {
      state.flags.ghost_jump_played = true;
      scene.sound.play("jump_scare", { volume: 0.9 });
    }
  },

  backgroundLayers: {
    bg: "ghost_dream_jump",
    fg: "intro_fg",
    light: "intro_light",
  },

  text: [
    "—",
    "",
    "It’s right in front of you.",
  ],

  choices: [
    { label: "Wake up!", go: "room_apartment_apartment_hub" }
  ],
},

room_apartment_apartment_hub: {
  title: "Apartment",
  meta: (state) => metaTime(state),
  tension: 0.1,
  onEnter: (state, scene) => {
    onEnterArea("apartment", "apartment_hub")(state);

    if (!state.flags.time_set_intro) {
      state.flags.time_set_intro = true;
      setTime(state, 5, 12);
    }
  },
  backgroundLayers: bgFromState(),
  text: [
    "The streets of Des Moines stir outside your window.",
  ],
  choices: [ { label: "Continue", go: "room_apartment_apartment_bedroom_dream" } ],
},

  room_apartment_apartment_bedroom_dream: {
  title: "Bedroom",
  meta: (state) => metaTime(state),
  tension: 0.1,

  onEnter: (state) => {
    onEnterArea("apartment", "apartment_bedroom")(state);

    if (!state.flags.time_set_intro) {
      state.flags.time_set_intro = true;
      setTime(state, 5, 22);
    }
  },

  backgroundLayers: bgFromState(),

  text: [
    "You sit up in bed soaked in sweat.",
    "",
    "Your sheets twist around you as you try to catch your breath.",
    "",
    "'Just a dream, it was just a dream...' you mutter.",
    "",
  ],

  choices: [
  {
    label: "Next",
    onChoose: (state, scene) => {
  if (state.flags._dream_transition_running) return true;
  state.flags._dream_transition_running = true;

  const normalBg = bgFromLoc(state.locationId, state.areaId)(state).bg;
  const demonBg = bgFromLoc(state.locationId, state.areaId)({
    ...state,
    flags: { ...(state.flags || {}), demon_mode: true },
  }).bg;

  // --- START HORROR MUSIC (one-shot per transition) ---
  // Use a handle on the scene so we can fade/stop it cleanly.
  if (!scene._introHorrorSfx && scene.cache?.audio?.exists("intro_horror")) {
    scene._introHorrorSfx = scene.sound.add("intro_horror", {
      volume: 0,     // start silent, fade in
      loop: false,   // usually best for a sting; set true if you want it looping
    });
    scene._introHorrorSfx.play();

    // fade in quickly
    scene.tweens.add({
      targets: scene._introHorrorSfx,
      volume: 0.55,
      duration: 220,
      ease: "Sine.easeOut",
    });
  }

  const tA = scene.bleedToBg(demonBg);
  if (!tA) return true;

  tA.once("complete", () => {
    const tB = scene.bleedToBg(normalBg);
    if (!tB) return;

    tB.once("complete", () => {
      // --- FADE OUT + STOP HORROR MUSIC ---
      const sfx = scene._introHorrorSfx;
      if (sfx) {
        scene.tweens.add({
          targets: sfx,
          volume: 0,
          duration: 250,
          ease: "Sine.easeIn",
          onComplete: () => {
            try { sfx.stop(); } catch {}
            try { sfx.destroy(); } catch {}
            scene._introHorrorSfx = null;
          },
        });
      }

      setTime(state, 6, 0);
      scene.transitionToNode("room_apartment_apartment_bedroom_wakeup_real");
    });
  });

  return true; // consume click (prevents immediate re-render)
}
  },
],
},


room_apartment_apartment_bedroom_wakeup_real: {
  title: "Bedroom",
  meta: (state) => metaTime(state),
  tension: 0.25,

  onEnter: (state, scene) => {
    onEnterArea("apartment", "apartment_bedroom")(state);
    setTime(state, 6, 0);

    // start looping alarm and keep a handle on the StoryScene instance
    if (!scene._alarmSfx) {
      scene._alarmSfx = scene.sound.add("alarm_clock", { volume: 0.7, loop: false });
      scene._alarmSfx.play();
    }
  },

  backgroundLayers: bgFromState(),

  text: [
    "BEEP. BEEP. BEEP.",
    "",
    "Your alarm claws you back into your body.",
  ],

  choices: [
  {
    label: "Get up",
    onChoose: (state, scene) => {
      // stop + destroy alarm
      try { scene._alarmSfx?.stop(); } catch {}
      try { scene._alarmSfx?.destroy(); } catch {}
      scene._alarmSfx = null;

      // go to bathroom
      scene.transitionToNode("area_apartment_apartment_bathroom");
      return true; // consume click
    },
  },
],

},

area_apartment_apartment_bathroom: {
  title: "Bathroom",
  meta: (state) => metaTime(state),
  tension: 0.2,
  onEnter: (state, scene) => {
    onEnterArea("apartment", "apartment_bathroom")(state);
    setTime(state, 6, 4);
  },

  backgroundLayers: bgFromState(),

  text: [ 
    "'What a weird dream...' you say trying to shake it off.",
    "",
    "'It felt so real...'",
    "",
    "'Maybe I should get some coffee.'",
  ],

  choices: [
    { label: "Continue", go: "area_apartment_apartment_living_room" },
  ],
},

area_apartment_apartment_living_room: {
  title: "Living Room",
  meta: (state) => metaTime(state),
  tension: 0.2,
  onEnter: (state, scene) => {
    onEnterArea("apartment", "apartment_living_room")(state);
    setTime(state, 6, 23);
  },

  backgroundLayers: bgFromState(),

  text: [ 
    "The apartment is quiet in the early morning light.",
  ],

  choices: [
    { label: "Watch TV", go: "apartment_apartment_tv" },
    { label: "Check Coffee Table", go: "apartment_apartment_coffee_table" },
    { label: "Check Couch", go: "apartment_apartment_couch" },
    { label: "Kitchen", go: "apartment_apartment_kitchen" },   
    { label: "Front Door", go: "apartment_apartment_front_door" },
    { label: "Bathroom", go: "apartment_apartment_bathroom" },
  ],
},

take_coffee_from_kitchen: {
  title: "Coffee",
  meta: (state) => metaTime(state),
  tension: 0.05,
  onEnter: (state) => {
    state.pendingTake = {
      locId: "apartment",
      areaId: "apartment_kitchen",
      itemId: "coffee",
      backGo: "area_apartment_apartment_kitchen",
    };
  },
  backgroundLayers: bgFromState(),
  text: [
    "You grab a coffee.",
    "",
    "It smells like it wants to fix you.",
  ],
  choices: [{ label: "Take it", go: "take_item_generic" }],
},

take_bandage_from_bathroom: {
  title: "Bandages",
  meta: (state) => metaTime(state),
  tension: 0.05,
  onEnter: (state) => {
    state.pendingTake = {
      locId: "apartment",
      areaId: "apartment_bathroom",
      itemId: "bandage",
      backGo: "area_apartment_apartment_bathroom",
    };
  },
  backgroundLayers: bgFromState(),
  text: [
    "A cheap box of bandages under the sink.",
    "",
    "Like someone expected you to get hurt.",
  ],
  choices: [{ label: "Take it", go: "take_item_generic" }],
},

take_lost_watch_from_couch: {
  title: "Something Valuable",
  meta: (state) => metaTime(state),
  tension: 0.12,
  onEnter: (state) => {
    state.pendingTake = {
      locId: "apartment",
      areaId: "apartment_living_room",
      itemId: "lost_watch",
      backGo: "area_apartment_apartment_living_room",
    };
  },
  backgroundLayers: bgFromState(),
  text: [
    "Between the cushions—",
    "",
    "a watch.",
    "",
    "Still ticking.",
  ],
  choices: [{ label: "Take it", go: "take_item_generic" }],
},

area_apartment_apartment_kitchen: {
  title: "Kitchen",
  meta: (state) => metaTime(state),
  tension: 0.1,

  onEnter: (state) => {
    onEnterArea("apartment", "apartment_kitchen")(state);
  },

  backgroundLayers: bgFromState(),

  text: [
    "The kitchen looks normal.",
    "",
    "But the air feels… staged.",
  ],

  choices: (state) => {
    const c = [];

    // Coffee (one-time)
    if (!state.flags.got_coffee) {
      c.push({
        label: "Grab Coffee",
        onChoose: (state, scene) => {
          state.flags.got_coffee = true;
          scene.transitionToNode("take_coffee_from_kitchen");
          return true;
        },
      });
    }

    // Quick search reveal (optional)
    c.push({
      label: "Search",
      onChoose: (state) => {
        // reuse your existing search mechanic if you want
        state.ui = state.ui || {};
        state.ui.lastToast = "You search the counters. Nothing new.";
        // return undefined → StoryScene will re-render this node
      },
    });

    c.push({ label: "Back", go: "area_apartment_apartment_living_room" });
    return c;
  },
},





room_apartment_bathroom_mirror: {
  title: "The Mirror",
  meta: (state) => metaTime(state),
  tension: 0.45,

  backgroundLayers: (state) => {
    const v = state.flags?.mirrorVariant ?? "normal";

    return {
      bg:
        v === "demon"
          ? "apartment_mirror_demon"
          : v === "wrong"
          ? "apartment_mirror_wrong"
          : "apartment_mirror",
      // if you want overlays:
      // fg: state.flags?.demon_mode ? "demon_fg" : null,
    };
  },

  onEnter: (state) => {
    onEnterArea("apartment", "apartment_bathroom")(state);

    state.flags = state.flags || {};
    state.flags.mirror_stare = state.flags.mirror_stare ?? 0;

    // If demon mode is ON globally, the mirror is already dangerous.
    if (state.flags.demon_mode) {
      state.flags.mirrorVariant = "demon";
    } else {
      state.flags.mirrorVariant = state.flags.mirrorVariant ?? "normal";
    }
  },

  text: (state) => {
    const v = state.flags?.mirrorVariant ?? "normal";

    if (state.flags?.demon_mode) {
      return [
        "Your reflection is late.",
        "",
        "It catches up with a smile that isn’t yours.",
      ];
    }

    if (v === "wrong") {
      return [
        "Your reflection blinks out of sync.",
        "",
        "Just enough to prove it isn’t you.",
      ];
    }

    if (v === "demon") {
      return [
        "The glass isn’t glass anymore.",
        "",
        "It’s a surface that remembers fire.",
      ];
    }

    return [
      "Your reflection looks tired.",
      "",
      "But the eyes look… awake.",
    ];
  },

  choices: (state) => {
    const c = [];

    c.push({
      label: "Keep staring",
      onChoose: (state, scene) => {
        state.flags.mirror_stare = (state.flags.mirror_stare ?? 0) + 1;

        // Escalation path (normal world):
        // 1–2 stares: wrong variant (sanity loss)
        // 3+ stares: brief demon flash + more sanity
        if (!state.flags.demon_mode) {
          if (state.flags.mirror_stare === 2) {
            state.flags.mirrorVariant = "wrong";

            const loss = 2;
            state.sanity = Math.max(0, state.sanity - loss);
            state.ui = state.ui || {};
            state.ui.lastToast = `Your stomach turns (-${loss} SAN)`;

            // Optional: tiny crack FX without killing the player
            // (only if you already expose something similar)
            // playDeathFX(scene, { shakeDuration: 180, vignetteAlpha: 0.3, crackChance: 1, crackAlpha: 0.2, autoCleanupMs: 500 });
          }

          if (state.flags.mirror_stare >= 3) {
            state.flags.mirrorVariant = "demon";

            const loss = 3;
            state.sanity = Math.max(0, state.sanity - loss);

            // If you want a *visual-only* demon bleed here:
            const normalBg = "apartment_mirror_wrong";
            const demonBg = "apartment_mirror_demon";

            if (scene?.textures?.exists(normalBg) && scene.textures.exists(demonBg)) {
              const tA = scene.bleedToBg(demonBg);
              tA?.once("complete", () => {
                const tB = scene.bleedToBg(normalBg);
                tB?.once("complete", () => {
                  // restore state variant back to wrong after flash
                  state.flags.mirrorVariant = "wrong";
                  // allow engine to re-render
                  scene.renderNode?.();
                });
              });
              return true; // consume click (we handle re-render)
            }

            // fallback: just re-render
            state.flags.mirrorVariant = "wrong";
          }
        }

        // Demon mode path: staring is actively harmful
        if (state.flags.demon_mode) {
          const dmg = 2;
          state.hp = Math.max(0, state.hp - dmg);

          if (state.hp <= 0) {
            scene.transitionToNode("room_apartment_mirror_death");
            return true;
          }
        }

        // return undefined so StoryScene re-renders this node normally
      },
    });

    c.push({
      label: "Touch the glass",
      onChoose: (state, scene) => {
        // Normal world: touching wrong glass hurts sanity
        if (!state.flags.demon_mode) {
          const v = state.flags.mirrorVariant ?? "normal";
          if (v === "wrong") {
            const loss = 4;
            state.sanity = Math.max(0, state.sanity - loss);
            state.ui = state.ui || {};
            state.ui.lastToast = `Cold pain behind your eyes (-${loss} SAN)`;
          } else {
            state.ui = state.ui || {};
            state.ui.lastToast = "It’s cold. Too cold.";
          }
          // re-render
          return;
        }

        // Demon mode: touching can kill
        const dmg = 999;
        state.hp = Math.max(0, state.hp - dmg);
        scene.transitionToNode("room_apartment_mirror_death");
        return true;
      },
    });

    c.push({
      label: "Look away",
      onChoose: (state) => {
        // reset for later visits (optional)
        state.flags.mirrorVariant = state.flags.demon_mode ? "demon" : "normal";
        state.flags.mirror_stare = 0;
      },
    });

    c.push({ label: "Back", go: "area_apartment_apartment_bathroom" });

    return c;
  },
},

room_apartment_mirror_death: {
  title: "The Mirror",
  meta: "",
  tension: 1.0,

  onEnter: (state, scene) => {
    // optional: play death fx / sound you already preload
    try { scene.sound?.play?.("death_scream", { volume: 0.65 }); } catch {}
    // if you have a final death system, route there instead
    // scene.transitionToNode("final_death");
  },

  backgroundLayers: {
    bg: "apartment_demon_death",
  },

  text: [
    "The mirror accepts you.",
    "",
    "Not as a reflection—",
    "as an answer.",
  ],

  choices: [{ label: "…", go: "MenuScene" }], // replace with your actual death flow
},






  

// -------------------- GENERIC ACTION NODES --------------------

take_item_generic: {
  title: "Taken",
  meta: "",
  tension: 0,
  onEnter: (state) => {
    const p = state.pendingTake;
    if (!p) return;

    const { locId, areaId, itemId, backGo } = p;
    const key = `${locId}.${areaId}.${itemId}`;

    state.taken[key] = true;
    state.inventory[itemId] = (state.inventory[itemId] ?? 0) + 1;

    // clear
    state.pendingTake = null;

    // optional UI toast
    state.ui.lastToast = `Picked up: ${itemId}`;
  },
  backgroundLayers: bgFromState(),
  text: (state) => [state.ui?.lastToast ?? "Taken."],
  choices: (state) => [{ label: "Back", go: state.pendingTake?.backGo ?? "area_apartment_apartment_living_room" }],
},

act_search_area: {
  title: "Search",
  tension: 0.15,
  onEnter: (state) => {
    const locId = state.locationId;
    const areaId = state.areaId;
    const area = LOCATIONS[locId]?.areas?.[areaId];
    const items = area?.items ?? [];

    let found = 0;

    for (const it of items) {
      if (!it.hidden) continue;
      if (!it.revealBy?.search) continue;

      // still must pass hard requires (optional — your choice)
      if (!passesRequires(state, it.requires)) continue;

      const k = `${locId}.${areaId}.${it.itemId}`;
      if (!state.revealed[k]) {
        state.revealed[k] = true;
        found++;
      }
    }

    state.ui.lastToast =
      found > 0 ? `You find something (${found}).` : "You don’t find anything new.";
  },
  backgroundLayers: bgFromState(),
  text: (state) => [state.ui?.lastToast ?? "You search."],
  choices: (state) => [{ label: "Back", go: /* set per-room */ "room_apartment_apartment_living_room" }],
},

};



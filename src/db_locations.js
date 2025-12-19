// db_locations.js
export const LOCATIONS = {
  apartment: {
    id: "apartment",
    title: "Your Apartment",
    tier: "local",
    x: 240,
    y: 440,
    locked: false,
  },

  // --- Core city hub (unlocked early via travel or TV) ---
  downtown: {
    id: "downtown",
    title: "Downtown",
    tier: "city",
    x: 420,
    y: 320,
    locked: true, // unlock_downtown
  },

  // --- Leads unlocked via TV stories ---
  riverfront: {
    id: "riverfront",
    title: "Riverfront",
    tier: "local",
    x: 520,
    y: 520,
    locked: true, // unlock_riverfront
  },

  old_church: {
    id: "old_church",
    title: "Old Church",
    tier: "local",
    x: 180,
    y: 560,
    locked: true, // unlock_old_church
  },

  "8th_mercer": {
    id: "8th_mercer",
    title: "8th & Mercer",
    tier: "local",
    x: 340,
    y: 560,
    locked: true, // unlock_8th_mercer
  },

  city_hall: {
    id: "city_hall",
    title: "City Hall Records",
    tier: "city",
    x: 520,
    y: 250,
    locked: true, // unlock_city_hall
  },

  county_hospital: {
    id: "county_hospital",
    title: "County Hospital",
    tier: "city",
    x: 640,
    y: 300,
    locked: true, // unlock_county_hospital
  },

  university_lab: {
    id: "university_lab",
    title: "State University Lab",
    tier: "city",
    x: 700,
    y: 220,
    locked: true, // unlock_university_lab
  },

  industrial_park: {
    id: "industrial_park",
    title: "West Edge Industrial Park",
    tier: "city",
    x: 740,
    y: 420,
    locked: true, // unlock_industrial_park
  },

  helio_dyne_office: {
    id: "helio_dyne_office",
    title: "HelioDyne Office",
    tier: "city",
    x: 600,
    y: 180,
    locked: true, // unlock_helio_dyne_office
  },

  task_force_hq: {
    id: "task_force_hq",
    title: "Task Force HQ",
    tier: "city",
    x: 460,
    y: 160,
    locked: true, // unlock_task_force_hq
  },
};

export const CITY_MARKERS = Object.values(LOCATIONS)
  .filter(loc => loc.tier === "city")
  .map(loc => ({
    id: loc.id,

    // Convert pixel coords (your LOCATIONS x/y)
    // into normalized 0–1 values for the map screen
    x: loc.x / 1920,
    y: loc.y / 1080,
  }));
import { ITEM_DB } from "./db_items.js";

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function getTotalStats(state) {
  const total = { ...(state.stats || {}) };
  const equipped = state.equipped || {};

  for (const slot of Object.keys(equipped)) {
    const id = equipped[slot];
    if (!id) continue;

    const def = ITEM_DB[id];
    if (!def?.modifiers) continue;

    for (const [k, v] of Object.entries(def.modifiers)) {
      total[k] = (total[k] || 0) + v;
    }
  }

  return total;
}

// -------------------------
// INVENTORY HELPERS
// -------------------------
function hasItem(state, id) {
  return !!state.inventory?.includes(id);
}

function getFlag(state, key) {
  return !!state.flags?.[key];
}

function setFlag(state, key, val = true) {
  state.flags ??= {};
  state.flags[key] = val;
}

// Optional: generic requirement checker
function meetsRequirements(state, req) {
  if (!req) return true;

  if (req.flags) {
    for (const f of req.flags) if (!getFlag(state, f)) return false;
  }

  if (req.notFlags) {
    for (const f of req.notFlags) if (getFlag(state, f)) return false;
  }

  if (req.items) {
    for (const it of req.items) if (!hasItem(state, it)) return false;
  }

  if (req.notItems) {
    for (const it of req.notItems) if (hasItem(state, it)) return false;
  }

  if (req.demonOnly && !state.flags?.demon_mode) return false;
  if (req.nightOnly) {
    const hour = Math.floor((state.time?.minutes ?? 0) / 60) % 24;
    const isNight = hour >= 20 || hour < 6;
    if (!isNight) return false;
  }

  return true;
}

export function ensureInventory(state) {
  if (!state.inventory || !Array.isArray(state.inventory)) state.inventory = [];
  return state.inventory;
}

export function getInvQty(state, id) {
  const inv = ensureInventory(state);
  const stack = inv.find(s => s?.id === id);
  return stack ? (Number(stack.qty) || 0) : 0;
}

export function addItem(state, id, qty = 1) {
  if (!id) return false;
  qty = Number(qty);
  if (!Number.isFinite(qty) || qty <= 0) return false;

  const inv = ensureInventory(state);
  const stack = inv.find(s => s?.id === id);

  if (stack) stack.qty = (Number(stack.qty) || 0) + qty;
  else inv.push({ id, qty });

  return true;
}

export function removeItem(state, id, qty = 1) {
  if (!id) return false;
  qty = Number(qty);
  if (!Number.isFinite(qty) || qty <= 0) return false;

  const inv = ensureInventory(state);
  const stack = inv.find(s => s?.id === id);
  if (!stack) return false;

  const cur = Number(stack.qty) || 0;
  if (cur < qty) return false;

  stack.qty = cur - qty;
  if (stack.qty <= 0) {
    state.inventory = inv.filter(s => s?.id !== id);
  }
  return true;
}

// -------------------------
// SHOP / SELLING HELPERS
// -------------------------
export function isSellable(def) {
  if (!def) return false;
  // "junk" or explicit sellOnly flag
  return def.sellOnly === true || def.type === "junk";
}

export function getSellPrice(def, multiplier = 0.6) {
  const base = Number(def?.price ?? 0);
  const m = Number(multiplier);

  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(m) || m <= 0) return Math.max(1, Math.floor(base * 0.6));

  return Math.max(1, Math.floor(base * m));
}

/**
 * Sells qty of itemId if sellable, removes from inventory, adds cash.
 * Returns { ok, soldQty, cashGained, message }
 */
export function sellItem(state, itemId, qty = 1, multiplier = 0.6) {
  const def = ITEM_DB[itemId];
  if (!def) return { ok: false, soldQty: 0, cashGained: 0, message: "Unknown item." };
  if (!isSellable(def)) return { ok: false, soldQty: 0, cashGained: 0, message: "You can't sell that." };

  qty = Number(qty);
  if (!Number.isFinite(qty) || qty <= 0) qty = 1;

  const have = getInvQty(state, itemId);
  if (have <= 0) return { ok: false, soldQty: 0, cashGained: 0, message: "You don't have any." };

  const sellQty = Math.min(have, qty);
  const priceEach = getSellPrice(def, multiplier);
  if (priceEach <= 0) return { ok: false, soldQty: 0, cashGained: 0, message: "Worthless." };

  // remove + pay
  const removed = removeItem(state, itemId, sellQty);
  if (!removed) return { ok: false, soldQty: 0, cashGained: 0, message: "Couldn't sell item." };

  state.cash = Number.isFinite(state.cash) ? state.cash : 0;
  const cashGained = priceEach * sellQty;
  state.cash += cashGained;

  return {
    ok: true,
    soldQty: sellQty,
    cashGained,
    message: `Sold ${def.name} x${sellQty} for $${cashGained}.`,
  };
}

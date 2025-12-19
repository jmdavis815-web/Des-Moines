import { ITEM_DB } from "./db_items.js";

export function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export function getTotalStats(state) {
  const total = { ...state.stats };
  for (const slot of Object.keys(state.equipped)) {
    const id = state.equipped[slot];
    if (!id) continue;
    const def = ITEM_DB[id];
    if (!def?.modifiers) continue;
    for (const [k, v] of Object.entries(def.modifiers)) {
      total[k] = (total[k] || 0) + v;
    }
  }
  return total;
}

export function addItem(state, id, qty = 1) {
  const stack = state.inventory.find(s => s.id === id);
  if (stack) stack.qty += qty;
  else state.inventory.push({ id, qty });
}

export function removeItem(state, id, qty = 1) {
  const stack = state.inventory.find(s => s.id === id);
  if (!stack) return false;
  stack.qty -= qty;
  if (stack.qty <= 0) state.inventory = state.inventory.filter(s => s.id !== id);
  return true;
}

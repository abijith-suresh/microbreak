/**
 * True when a page-wide game key handler should leave the event alone:
 * browser shortcuts, typing into a field, any key while focus is in the
 * new-game menu panel (data-game-menu), or Enter/Space on a focused control outside
 * the game's own keys (marked with data-game-keys).
 */
export function shouldIgnoreGameKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  const target = e.target;
  if (!(target instanceof Element)) return false;
  if (target.closest("input, textarea, select, [contenteditable], [data-game-menu]")) return true;
  if (e.key !== "Enter" && e.key !== " ") return false;
  const control = target.closest("a, button");
  return control !== null && control.closest("[data-game-keys]") === null;
}

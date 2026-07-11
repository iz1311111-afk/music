export function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('mg_user') || 'null'); } catch (e) { return null; }
}
export function saveUser(u) {
  try { localStorage.setItem('mg_user', JSON.stringify(u)); } catch (e) {}
}

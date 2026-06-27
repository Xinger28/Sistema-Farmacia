/**
 * auth.js — Manejo de autenticación y sesión
 */

export function getToken()    { return localStorage.getItem('token'); }
export function getUser()     {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
}
export function isLoggedIn()  { return !!getToken() && !!getUser(); }

export function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

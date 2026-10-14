/**
 * DiagnosTech — Accounts & session (front-end demo)
 *
 * Accounts live in this browser's localStorage and passwords are salted and
 * PBKDF2-hashed, but this is NOT real authentication: anyone with access to the
 * browser can read or edit the data, and role checks here are only UX.
 * Replace the internals of Auth.* with API calls (server-side sessions, role
 * checks, rate limiting, email verification) before production.
 */
const Auth = (() => {
  'use strict';

  const USERS_KEY = 'diagnostech-users';
  const SESSION_KEY = 'diagnostech-session';
  const ITERATIONS = 100000;
  const HOME = { patient: 'dashboard.html', doctor: 'doctor_dashboard.html' };
  const ROLES = Object.keys(HOME);

  /* ---------- Safe storage ---------- */
  const store = {
    get(area, key) {
      try { return window[area].getItem(key); } catch (e) { return null; }
    },
    set(area, key, value) {
      try { window[area].setItem(key, value); return true; } catch (e) { return false; }
    },
    remove(area, key) {
      try { window[area].removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  /* ---------- Helpers ---------- */
  const fail = (field, message) => ({ ok: false, field, message });
  const normEmail = (v) => String(v ?? '').trim().toLowerCase();
  const cleanName = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const toHex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  const randomHex = (bytes = 16) => toHex(crypto.getRandomValues(new Uint8Array(bytes)));

  const safeEqual = (a, b) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  };

  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    if (window.crypto && window.crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
        key,
        256
      );
      return 'pbkdf2$' + toHex(bits);
    }
    /* Non-secure contexts (plain http) have no SubtleCrypto: weak, demo-only fallback. */
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    const str = salt + password;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'weak$' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  /* ---------- Users ---------- */
  const readUsers = () => {
    try {
      const v = JSON.parse(store.get('localStorage', USERS_KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  };
  const writeUsers = (users) => store.set('localStorage', USERS_KEY, JSON.stringify(users));
  const toPublic = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

  /* Demo accounts so the prototype works out of the box (password: demo1234). */
  const DEMO_PASSWORD = 'demo1234';
  const DEMO = [
    { name: 'Bcen Bulawan', email: 'bcen.bulawan@laverdad.edu.ph', role: 'patient' },
    { name: 'Bcen Bulawan', email: 'bcen.bulawan@diagnostech.com', role: 'doctor' },
  ];

  const ready = (async () => {
    const users = readUsers();
    let changed = false;
    for (const d of DEMO) {
      if (users.some((u) => u.email === d.email)) continue;
      const salt = randomHex();
      users.push({
        id: randomHex(8),
        name: d.name,
        email: d.email,
        role: d.role,
        salt,
        hash: await hashPassword(DEMO_PASSWORD, salt),
        createdAt: Date.now(),
      });
      changed = true;
    }
    if (changed) writeUsers(users);
  })().catch(() => { /* seeding is best-effort */ });

  /* ---------- Name helpers (single source of truth for every page) ---------- */
  const words = (n) => cleanName(n).split(' ').filter(Boolean);
  const stripTitle = (n) => cleanName(n).replace(/^dr\.?\s+/i, '');
  const firstName = (u) => words(stripTitle(u.name))[0] || 'there';
  const lastName = (u) => {
    const w = words(stripTitle(u.name));
    return w[w.length - 1] || '';
  };
  const displayName = (u) => (u.role === 'doctor' ? 'Dr. ' + stripTitle(u.name) : cleanName(u.name));
  const welcomeName = (u) => (u.role === 'doctor' ? 'Dr. ' + (lastName(u) || stripTitle(u.name)) : firstName(u));
  const initials = (u) => {
    const w = words(stripTitle(u.name));
    const a = (w[0] && w[0][0]) || '?';
    const b = w.length > 1 ? w[w.length - 1][0] : '';
    return (a + b).toUpperCase();
  };
  const homeFor = (u) => HOME[u && u.role] || 'login.html';

  /* ---------- Session ---------- */
  function startSession(user, remember) {
    store.remove('sessionStorage', SESSION_KEY);
    store.remove('localStorage', SESSION_KEY);
    return store.set(remember ? 'localStorage' : 'sessionStorage', SESSION_KEY, JSON.stringify({ uid: user.id, at: Date.now() }));
  }

  function current() {
    const raw = store.get('sessionStorage', SESSION_KEY) || store.get('localStorage', SESSION_KEY);
    if (!raw) return null;
    try {
      const { uid } = JSON.parse(raw);
      const user = readUsers().find((u) => u.id === uid);
      return user ? toPublic(user) : null;
    } catch (e) {
      return null;
    }
  }

  function logout() {
    store.remove('sessionStorage', SESSION_KEY);
    store.remove('localStorage', SESSION_KEY);
    window.location.replace('login.html');
  }

  /* Redirects away when nobody (or the wrong role) is signed in. UX only, not security. */
  function guard(role) {
    const user = current();
    if (!user) {
      window.location.replace('login.html');
      return null;
    }
    if (role && user.role !== role) {
      window.location.replace(homeFor(user));
      return null;
    }
    window.addEventListener('storage', (e) => {
      if (e.key === SESSION_KEY && !e.newValue && !current()) window.location.replace('login.html');
    });
    return user;
  }

  /* Fills [data-user-*] placeholders; textContent only, so names can never inject HTML. */
  function applyUser(user) {
    const set = (attr, value) => {
      document.querySelectorAll('[' + attr + ']').forEach((el) => { el.textContent = value; });
    };
    set('data-user-name', displayName(user));
    set('data-user-welcome', welcomeName(user));
    set('data-user-email', user.email);
    set('data-user-initials', initials(user));
  }

  /* ---------- Register / login ---------- */
  async function register({ name, email, password, role }) {
    await ready;
    name = cleanName(name);
    email = normEmail(email);

    if (name.length < 2 || name.length > 60) return fail('name', 'Enter your full name (2–60 characters).');
    if (!isEmail(email)) return fail('email', 'Enter a valid email address.');
    if (typeof password !== 'string' || password.length < 8) return fail('password', 'Use at least 8 characters for your password.');
    if (!ROLES.includes(role)) return fail('role', 'Choose Patient or Doctor.');

    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      return fail('email', 'An account with this email already exists. Try signing in.');
    }

    const salt = randomHex();
    const user = {
      id: randomHex(8),
      name,
      email,
      role,
      salt,
      hash: await hashPassword(password, salt),
      createdAt: Date.now(),
    };
    users.push(user);

    if (!writeUsers(users)) return fail(null, 'Could not save your account: browser storage is unavailable.');
    if (!startSession(user, false)) return fail(null, 'Account created, but a session could not start. Please sign in.');
    return { ok: true, user: toPublic(user) };
  }

  async function login({ email, password, role, remember }) {
    await ready;
    email = normEmail(email);
    password = String(password ?? '');

    const user = readUsers().find((u) => u.email === email);
    if (!user) {
      await hashPassword(password, randomHex()); /* keep timing similar to a real check */
      return fail(null, 'Incorrect email or password.');
    }

    const attempt = await hashPassword(password, user.salt);
    if (!safeEqual(attempt, user.hash)) return fail(null, 'Incorrect email or password.');

    if (role && role !== user.role) {
      return fail('role', 'This account is registered as a ' + user.role + '. Select "' + user.role + '" and try again.');
    }
    if (!startSession(user, !!remember)) return fail(null, 'Could not start a session: browser storage is unavailable.');
    return { ok: true, user: toPublic(user) };
  }

  return { register, login, logout, current, guard, applyUser, homeFor, displayName, firstName, welcomeName, initials };
})();

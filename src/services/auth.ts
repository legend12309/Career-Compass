import { User, Role } from '../types';

const USERS_KEY = 'cc_users_v2';
const SESSION_KEY = 'cc_auth_session_v2';

export interface StoredUser extends User {
  // TODO: mocked client-side password hash for browser prototype — real security requires a server with bcrypt + JWT.
  passwordHash: string;
}

/**
 * Hashes a plaintext password using SHA-256 (Web Crypto API) with a deterministic fallback.
 * TODO: mocked — replace with server-side bcrypt.hash(password, 12) when migrating to Express + MongoDB + JWT.
 */
export async function hashPassword(password: string): Promise<string> {
  const salted = `cc_salt_v1:${password}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(salted);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash if subtle crypto is unavailable
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}

let seedInitializedPromise: Promise<StoredUser[]> | null = null;

async function ensureSeedUsers(): Promise<StoredUser[]> {
  if (seedInitializedPromise) {
    return seedInitializedPromise;
  }
  seedInitializedPromise = (async () => {
    try {
      const demoUserHash = await hashPassword('demo123');
      const demoAdminHash = await hashPassword('admin123');

      const seedList: StoredUser[] = [
        {
          id: 'user-demo-1',
          name: 'Aarav Mehta',
          email: 'demo@careercompass.org',
          passwordHash: demoUserHash,
          role: 'user',
          active: true,
          onboarded: true,
          createdAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: 'admin-demo-1',
          name: 'Platform Coordinator',
          email: 'admin@careercompass.org',
          passwordHash: demoAdminHash,
          role: 'admin',
          active: true,
          onboarded: true,
          createdAt: '2026-08-15T09:00:00.000Z',
        },
      ];

      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify(seedList));
        return seedList;
      }

      const parsed: StoredUser[] = JSON.parse(raw);
      let changed = false;
      for (const seed of seedList) {
        if (!parsed.some((u) => u.email.toLowerCase() === seed.email.toLowerCase())) {
          parsed.push(seed);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return [];
    } finally {
      seedInitializedPromise = null;
    }
  })();

  return seedInitializedPromise;
}

function readAllUsersSync(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSeedCredentials() {
  return [
    {
      label: 'Demo User (demo)',
      email: 'demo@careercompass.org',
      password: 'demo123',
      role: 'user' as Role,
      description: 'Full-Stack Development career profile',
    },
    {
      label: 'Demo Admin (demo)',
      email: 'admin@careercompass.org',
      password: 'admin123',
      role: 'admin' as Role,
      description: 'Manage users & career resources',
    },
  ];
}

export async function getCurrentUser(): Promise<User | null> {
  await ensureSeedUsers();
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.userId) return null;

    const users = readAllUsersSync();
    const latest = users.find((u) => u.id === session.userId);
    if (!latest || !latest.active) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const { passwordHash: _, ...safeUser } = latest;
    return safeUser;
  } catch {
    return null;
  }
}

/**
 * Strictly retrieves the authenticated, active user from the current session.
 * Throws if not logged in or if deactivated.
 */
export async function requireSessionUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Your session has expired or is inactive. Please sign in again.');
  }
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const users = await ensureSeedUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  const inputHash = await hashPassword(password);
  if (!found || found.passwordHash !== inputHash) {
    throw new Error('Invalid email or password. Please check your details and try again.');
  }

  if (!found.active) {
    throw new Error('This account has been deactivated by an administrator.');
  }

  const { passwordHash: _, ...safeUser } = found;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: safeUser.id }));
  return safeUser;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: Role = 'user'
): Promise<User> {
  const users = await ensureSeedUsers();
  const cleanName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (cleanName.length < 2 || cleanName.length > 80) {
    throw new Error('Please enter your name (between 2 and 80 characters).');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name: cleanName,
    email: normalizedEmail,
    passwordHash,
    role,
    active: true,
    onboarded: role === 'admin', // Regular users go through the 3-step onboarding wizard first
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const { passwordHash: _, ...safeUser } = newUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: safeUser.id }));
  return safeUser;
}

export async function markCurrentUserOnboarded(): Promise<User> {
  const current = await requireSessionUser();
  const users = readAllUsersSync();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], onboarded: true };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { passwordHash: _, ...safe } = users[idx];
    return safe;
  }
  return { ...current, onboarded: true };
}

export async function updateCurrentUserName(newName: string): Promise<User> {
  const current = await requireSessionUser();
  const clean = newName.trim().slice(0, 80);
  if (clean.length < 2) {
    throw new Error('Name must be at least 2 characters.');
  }
  const users = readAllUsersSync();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], name: clean };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { passwordHash: _, ...safe } = users[idx];
    return safe;
  }
  return current;
}

export async function removeCurrentUserRecord(): Promise<void> {
  const current = await requireSessionUser();
  const users = readAllUsersSync();
  const filtered = users.filter((u) => u.id !== current.id);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  localStorage.removeItem(SESSION_KEY);
}

export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

// Admin-only User Management (Role checked inside service layer)
export async function listUsers(): Promise<User[]> {
  const actor = await requireSessionUser();
  if (actor.role !== 'admin') {
    throw new Error('Unauthorized: Admin access is required to view users.');
  }
  const users = await ensureSeedUsers();
  return users.map(({ passwordHash: _, ...safe }) => safe);
}

export async function toggleUserActiveStatus(targetUserId: string): Promise<User> {
  const actor = await requireSessionUser();
  if (actor.role !== 'admin') {
    throw new Error('Unauthorized: Only administrators can change user status.');
  }
  if (targetUserId === actor.id) {
    throw new Error('You cannot deactivate your own active administrator account.');
  }

  const users = await ensureSeedUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx < 0) {
    throw new Error('User not found.');
  }

  const target = users[idx];
  const nextActive = !target.active;

  if (!nextActive && target.role === 'admin') {
    const activeAdmins = users.filter((u) => u.role === 'admin' && u.active);
    if (activeAdmins.length <= 1) {
      throw new Error('Cannot deactivate the last remaining active administrator.');
    }
  }

  users[idx] = { ...target, active: nextActive };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  const { passwordHash: _, ...safe } = users[idx];
  return safe;
}

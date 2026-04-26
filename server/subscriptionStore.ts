// ============================================================
// Simple file-based subscription store
// Stores subscription data in data/subscriptions.json
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const STORE_PATH = join(DATA_DIR, 'subscriptions.json');
const ADMIN_PATH = join(DATA_DIR, 'admin.json');

export interface AdminConfig {
  globalFree: boolean;
  globalFreeUntil: string | null;
}

export function readAdminConfig(): AdminConfig {
  try {
    if (!existsSync(ADMIN_PATH)) return { globalFree: false, globalFreeUntil: null };
    const raw = readFileSync(ADMIN_PATH, 'utf-8');
    return JSON.parse(raw) as AdminConfig;
  } catch {
    return { globalFree: false, globalFreeUntil: null };
  }
}

export function writeAdminConfig(config: AdminConfig): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(ADMIN_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function isGlobalFree(): boolean {
  const config = readAdminConfig();
  if (config.globalFree) return true;
  if (config.globalFreeUntil) {
    const until = new Date(config.globalFreeUntil);
    if (until.getTime() > Date.now()) return true;
  }
  return false;
}

export interface SubscriptionRecord {
  stripeCustomerId: string;
  subscriptionId: string;
  status: string;
  expiresAt: number;
}

type SubscriptionStore = Record<string, SubscriptionRecord>;

function readStore(): SubscriptionStore {
  try {
    if (!existsSync(STORE_PATH)) return {};
    const raw = readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as SubscriptionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SubscriptionStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function getSubscription(email: string): SubscriptionRecord | null {
  const store = readStore();
  return store[email.toLowerCase()] ?? null;
}

export function setSubscription(email: string, data: SubscriptionRecord): void {
  const store = readStore();
  store[email.toLowerCase()] = data;
  writeStore(store);
}

export function isSubscribed(email: string): boolean {
  const record = getSubscription(email.toLowerCase());
  if (!record) return false;
  if (record.status !== 'active') return false;
  if (record.expiresAt && record.expiresAt < Date.now()) return false;
  return true;
}

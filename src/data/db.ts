import { openDatabaseSync } from 'expo-sqlite';

import type { DayLog, Settings } from '../core/types';

/** One SQLite file on her phone: a row per logged day, and her settings. Nothing leaves the phone from here. */
const db = openDatabaseSync('moonday.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS days (date TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
`);

export function loadDays(): DayLog[] {
  return db.getAllSync<{ data: string }>('SELECT data FROM days').map((r) => JSON.parse(r.data) as DayLog);
}

/** Saves a day. A cleared day is kept as an empty entry, so clearing it reaches a shared phone too. */
export function putDay(d: DayLog): void {
  db.runSync('INSERT OR REPLACE INTO days (date, data) VALUES (?, ?)', d.date, JSON.stringify(d));
}

export function loadSettings(): Partial<Settings> {
  const row = db.getFirstSync<{ value: string }>("SELECT value FROM settings WHERE key = 'settings'");
  return row ? (JSON.parse(row.value) as Partial<Settings>) : {};
}

export function putSettings(s: Settings): void {
  db.runSync("INSERT OR REPLACE INTO settings (key, value) VALUES ('settings', ?)", JSON.stringify(s));
}

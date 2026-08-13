import { eq } from 'drizzle-orm';
import { AppLang } from '../i18n';
import { useStore } from '../store';
import { getDb } from './client';
import { userSettings } from './schema';

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const rows = await db.select().from(userSettings).where(eq(userSettings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.insert(userSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: userSettings.key, set: { value } });
}

export async function loadSettingsIntoStore(): Promise<void> {
  const appLang = await getSetting('appLang');
  const nativeLang = await getSetting('nativeLang');
  const patch: Partial<{ appLang: AppLang; nativeLang: string }> = {};
  if (appLang === 'en' || appLang === 'zh-Hant' || appLang === 'ko') {
    patch.appLang = appLang;
  }
  if (nativeLang) patch.nativeLang = nativeLang;
  if (Object.keys(patch).length) useStore.setState(patch);
}

export function persistAppLang(lang: AppLang): void {
  void setSetting('appLang', lang);
}

export function persistNativeLang(lang: string): void {
  void setSetting('nativeLang', lang);
}

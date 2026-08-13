import { useStore } from '../store';
import { en } from './en';
import { ko } from './ko';
import { AppLang, Translations } from './types';
import { zhHant } from './zh-Hant';

export type { AppLang, AppLangOption, Translations } from './types';
export { APP_LANGS } from './types';

const bundles: Record<AppLang, Translations> = {
  en,
  'zh-Hant': zhHant,
  ko,
};

export function getTranslations(lang: AppLang): Translations {
  return bundles[lang];
}

/** Read UI strings for the current app language. */
export function useT(): Translations {
  const appLang = useStore((s) => s.appLang);
  return getTranslations(appLang);
}

export function categoryLabel(tr: Translations, key: string): string {
  return tr.categories[key] ?? key;
}

export function posLabel(tr: Translations, key: string): string {
  return tr.pos[key] ?? key;
}

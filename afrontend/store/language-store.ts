import { create } from "zustand";
import {
  getSupportedLanguages,
  translateText as fetchTranslateText,
  translateBatch as fetchTranslateBatch,
  checkTranslationHealth,
  type TranslationHealthResponse,
} from "@/lib/api/translate";

export interface LanguageState {
  selectedLang: string; // FLORES-200 code (e.g. 'eng_Latn', 'hin_Deva')
  supportedLanguages: Record<string, string>;
  isServiceConnected: boolean;
  healthInfo: TranslationHealthResponse | null;
  isTranslating: boolean;
  cache: Record<string, string>;

  /* Actions */
  setLanguage: (lang: string) => void;
  checkHealth: () => Promise<boolean>;
  loadLanguages: () => Promise<void>;
  translate: (text: string, targetLang?: string, srcLang?: string) => Promise<string>;
  translateBatch: (texts: string[], targetLang?: string, srcLang?: string) => Promise<string[]>;
}

const DEFAULT_LANGUAGES: Record<string, string> = {
  eng_Latn: "English",
  hin_Deva: "Hindi (हिंदी)",
  mar_Deva: "Marathi (मराठी)",
  tam_Taml: "Tamil (தமிழ்)",
  tel_Telu: "Telugu (తెలుగు)",
  ben_Beng: "Bengali (বাংলা)",
  guj_Gujr: "Gujarati (ગુજરાતી)",
  kan_Knda: "Kannada (ಕನ್ನಡ)",
  pan_Guru: "Punjabi (ਪੰਜਾਬੀ)",
  mal_Mlym: "Malayalam (മലയാളം)",
  urd_Arab: "Urdu (اردو)",
  ory_Orya: "Odia (ଓଡ଼ିଆ)",
  asm_Beng: "Assamese (অসমীয়া)",
};

const STORAGE_KEY = "arthsaathi_preferred_lang";
const CACHE_STORAGE_KEY = "arthsaathi_trans_cache";

function getInitialLanguage(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  }
  return "eng_Latn";
}

function getInitialCache(): Record<string, string> {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(CACHE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore parse error
    }
  }
  return {};
}

function saveCacheToStorage(cache: Record<string, string>) {
  if (typeof window !== "undefined") {
    try {
      const keys = Object.keys(cache);
      if (keys.length > 1200) {
        const trimmed: Record<string, string> = {};
        keys.slice(keys.length - 1000).forEach((k) => {
          trimmed[k] = cache[k];
        });
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
        return;
      }
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // ignore storage quota error
    }
  }
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  selectedLang: getInitialLanguage(),
  supportedLanguages: DEFAULT_LANGUAGES,
  isServiceConnected: false,
  healthInfo: null,
  isTranslating: false,
  cache: getInitialCache(),

  setLanguage: (lang: string) => {
    set({ selectedLang: lang });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  },

  checkHealth: async () => {
    const health = await checkTranslationHealth();
    // Live is ONLY true when real model inference is active (not mock-fallback)
    const isLiveModel = Boolean(
      health &&
      health.status === "ok" &&
      health.device !== "mock-fallback" &&
      (health as any).is_real_model !== false
    );
    set({
      isServiceConnected: isLiveModel,
      healthInfo: health,
    });
    return isLiveModel;
  },

  loadLanguages: async () => {
    try {
      const langs = await getSupportedLanguages();
      if (langs && Object.keys(langs).length > 0) {
        set({ supportedLanguages: langs });
      }
    } catch {
      // Use fallback defaults
    }
  },

  translate: async (text: string, targetLang?: string, srcLang: string = "eng_Latn") => {
    const tgt = targetLang || get().selectedLang;
    if (!text || tgt === srcLang) return text;

    const cacheKey = `${srcLang}->${tgt}:${text}`;
    const cached = get().cache[cacheKey];
    if (cached) return cached;

    set({ isTranslating: true });
    try {
      const translated = await fetchTranslateText(text, tgt, srcLang);
      // Only cache if valid translation returned
      if (translated && (tgt === srcLang || translated.trim().toLowerCase() !== text.trim().toLowerCase())) {
        const updatedCache = { ...get().cache, [cacheKey]: translated };
        saveCacheToStorage(updatedCache);
        set({ cache: updatedCache });
      }
      return translated;
    } finally {
      set({ isTranslating: false });
    }
  },

  translateBatch: async (texts: string[], targetLang?: string, srcLang: string = "eng_Latn") => {
    const tgt = targetLang || get().selectedLang;
    if (!texts || texts.length === 0 || tgt === srcLang) return texts;

    const results: string[] = [];
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];
    const currentCache = get().cache;

    texts.forEach((txt, idx) => {
      const cacheKey = `${srcLang}->${tgt}:${txt}`;
      if (currentCache[cacheKey]) {
        results[idx] = currentCache[cacheKey];
      } else {
        missingIndices.push(idx);
        missingTexts.push(txt);
      }
    });

    if (missingTexts.length === 0) {
      return results;
    }

    set({ isTranslating: true });
    try {
      const translatedBatch = await fetchTranslateBatch(missingTexts, tgt, srcLang);
      const newCache = { ...currentCache };
      let hasNewValid = false;

      missingIndices.forEach((origIdx, batchIdx) => {
        const origText = missingTexts[batchIdx];
        const trans = translatedBatch[batchIdx] || origText;
        results[origIdx] = trans;

        // Avoid caching untranslated English fallbacks if target is vernacular
        if (trans && (tgt === srcLang || trans.trim().toLowerCase() !== origText.trim().toLowerCase())) {
          const cacheKey = `${srcLang}->${tgt}:${origText}`;
          newCache[cacheKey] = trans;
          hasNewValid = true;
        }
      });

      if (hasNewValid) {
        saveCacheToStorage(newCache);
        set({ cache: newCache });
      }
      return results;
    } finally {
      set({ isTranslating: false });
    }
  },
}));

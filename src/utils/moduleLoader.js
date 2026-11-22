/**
 * Ölçeklenebilir Tembel Yükleme (Code-Splitting) Motoru
 * Vite import.meta.glob ile her modül (modul_01..55.json) ve her büyük final
 * (final_a1..b2.json) yalnızca tıklandığında ayrı bir chunk olarak yüklenir.
 */

const moduleImporters = import.meta.glob('../data/modules/modul_*.json');
const finalImporters = import.meta.glob('../data/finals/final_*.json');

const moduleCache = new Map();
const finalCache = new Map();

/**
 * Derlemede mevcut (üretilmiş) modül ID'lerini döndürür: örn. Set(['01', '02'])
 */
export function getAvailableModuleIds() {
  const ids = new Set();
  for (const key of Object.keys(moduleImporters)) {
    const m = key.match(/modul_(\d{2})\.json$/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/**
 * Derlemede mevcut (üretilmiş) final ID'lerini döndürür: örn. Set(['final_a1'])
 */
export function getAvailableFinalIds() {
  const ids = new Set();
  for (const key of Object.keys(finalImporters)) {
    const m = key.match(/(final_[a-z0-9]+)\.json$/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/**
 * İstenen modülü tembel (lazy) olarak yükler ve bellek önbelleğinde saklar.
 * @param {string} id İki haneli modül ID'si ('01'..'55')
 */
export async function loadModule(id) {
  const padded = String(id).padStart(2, '0');
  if (moduleCache.has(padded)) return moduleCache.get(padded);

  const path = `../data/modules/modul_${padded}.json`;
  const importer = moduleImporters[path];
  if (!importer) return null;

  const mod = await importer();
  const data = mod.default || mod;
  moduleCache.set(padded, data);
  return data;
}

/**
 * İstenen Seviye Sonu Büyük Finalini tembel olarak yükler.
 * @param {string} finalId 'final_a1' | 'final_a2' | 'final_b1' | 'final_b2'
 */
export async function loadFinal(finalId) {
  if (finalCache.has(finalId)) return finalCache.get(finalId);

  const path = `../data/finals/${finalId}.json`;
  const importer = finalImporters[path];
  if (!importer) return null;

  const mod = await importer();
  const data = mod.default || mod;
  finalCache.set(finalId, data);
  return data;
}

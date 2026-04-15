/**
 * sessionStorageからキーに対応した情報をJSON形式で取得する
 *
 * @param key sessionStorageのキー
 * @returns sessionStorageから取得したJSONデータ
 */
export function loadSavedState(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

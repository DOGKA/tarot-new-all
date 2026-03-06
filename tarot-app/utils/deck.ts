/**
 * Merkezi Deck Yönetimi
 * 
 * Kart dağıtımı, orientation belirleme ve shuffle işlemleri
 * tek noktadan yönetilir.
 */

import { rng01, randomInt } from './rng';

export interface DealOptions {
  /** Ters gelme oranı (0-1 arası, default: 0.3 = %30) */
  reversedRate?: number;
  /** Ters kartlar aktif mi? (default: true) */
  reversalsEnabled?: boolean;
}

/**
 * Kart orientation'ını belirler
 * 
 * @param options - DealOptions
 * @returns "upright" veya "reversed"
 * 
 * @example
 * // Default: %30 ters gelme şansı
 * const orientation = getOrientation();
 * 
 * // Custom oran
 * const orientation = getOrientation({ reversedRate: 0.2 });
 * 
 * // Ters kartlar kapalı
 * const orientation = getOrientation({ reversalsEnabled: false });
 */
export const getOrientation = (options: DealOptions = {}): "upright" | "reversed" => {
  const { 
    reversedRate = 0.3,  // Default %30 ters
    reversalsEnabled = true 
  } = options;
  
  // Ters kartlar kapalıysa hep düz
  if (!reversalsEnabled) {
    return "upright";
  }
  
  // reversedRate olasılığıyla ters, geri kalanı düz
  return rng01() < reversedRate ? "reversed" : "upright";
};

/**
 * Array'i karıştırır (Fisher-Yates shuffle)
 * Merkezi RNG kullanır
 * 
 * @param array - Karıştırılacak array
 * @returns Yeni karıştırılmış array (orijinal değişmez)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Birden fazla kart için orientation array'i oluşturur
 * 
 * @param count - Kart sayısı
 * @param options - DealOptions
 * @returns Orientation array'i
 */
export const getOrientations = (
  count: number, 
  options: DealOptions = {}
): ("upright" | "reversed")[] => {
  return Array.from({ length: count }, () => getOrientation(options));
};

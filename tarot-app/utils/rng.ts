/**
 * Merkezi Random Number Generator
 * 
 * Tüm random işlemleri bu modülden geçer.
 * Avantajları:
 * - Test edilebilirlik (seed eklenebilir)
 * - Tutarlı davranış
 * - İleride expo-random veya crypto-based RNG'ye geçiş kolay
 */

/**
 * 0-1 arası random sayı üretir
 * İleride seed-based veya expo-random ile değiştirilebilir
 */
export const rng01 = (): number => {
  return Math.random();
};

/**
 * Verilen olasılığa göre true/false döner
 * @param probability - 0-1 arası olasılık (default: 0.5)
 */
export const randomChance = (probability: number = 0.5): boolean => {
  return rng01() < probability;
};

/**
 * Bir array'den random eleman seçer
 */
export const randomElement = <T>(array: T[]): T => {
  const index = Math.floor(rng01() * array.length);
  return array[index];
};

/**
 * 0 ile max-1 arasında random integer üretir
 */
export const randomInt = (max: number): number => {
  return Math.floor(rng01() * max);
};

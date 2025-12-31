/**
 * Simple mapping of Surah ID to start Juz.
 * This is a simplification. A surah can span multiple Juz.
 * But for "Mading Hafalan" labeling, primarily identifying the Start Juz is often sufficient,
 * or we can use a Page-to-Juz mapping if we want higher accuracy.
 *
 * Let's use a Page-to-Juz approximation or strict lookup if possible.
 * Standard Madinah Mushaf (604 pages).
 */

export const JUZ_START_PAGES = [
  0, // 0-index padding
  1, // Juz 1
  22, // Juz 2
  42, // Juz 3
  62, // Juz 4
  82, // Juz 5
  102, // Juz 6
  122, // Juz 7
  142, // Juz 8
  162, // Juz 9
  182, // Juz 10
  202, // Juz 11
  222, // Juz 12
  242, // Juz 13
  262, // Juz 14
  282, // Juz 15
  302, // Juz 16
  322, // Juz 17
  342, // Juz 18
  362, // Juz 19
  382, // Juz 20
  402, // Juz 21
  422, // Juz 22
  442, // Juz 23
  462, // Juz 24
  482, // Juz 25
  502, // Juz 26
  522, // Juz 27
  542, // Juz 28
  562, // Juz 29
  582, // Juz 30
];

export function getJuzFromPage(page: number): number {
  if (!page || page < 1) return 0;
  if (page > 604) return 30;

  // Find the index where page >= start_page
  let juz = 1;
  for (let i = 1; i <= 30; i++) {
    if (page >= JUZ_START_PAGES[i]) {
      juz = i;
    } else {
      break;
    }
  }
  return juz;
}

// Surah mapping (rough start Juz) if page is missing
export const SURAH_START_JUZ: Record<number, number> = {
  1: 1,
  2: 1,
  3: 3,
  4: 4,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: 10,
  10: 11,
  11: 11,
  12: 12,
  13: 13,
  14: 13,
  15: 14,
  16: 14,
  17: 15,
  18: 15,
  19: 16,
  20: 16,
  21: 17,
  22: 17,
  23: 18,
  24: 18,
  25: 18,
  26: 19,
  27: 19,
  28: 20,
  29: 20,
  30: 21,
  31: 21,
  32: 21,
  33: 21,
  34: 22,
  35: 22,
  36: 22,
  37: 23,
  38: 23,
  39: 23,
  40: 24,
  41: 24,
  42: 25,
  43: 25,
  44: 25,
  45: 25,
  46: 26,
  47: 26,
  48: 26,
  49: 26,
  50: 26,
  51: 26,
  52: 27,
  53: 27,
  54: 27,
  55: 27,
  56: 27,
  57: 27,
  58: 28,
  59: 28,
  60: 28,
  61: 28,
  62: 28,
  63: 28,
  64: 28,
  65: 28,
  66: 28,
  67: 29,
  68: 29,
  69: 29,
  70: 29,
  71: 29,
  72: 29,
  73: 29,
  74: 29,
  75: 29,
  76: 29,
  77: 29,
  78: 30, // ... rest 30
};

export function getJuzFromSurah(surah: number): number {
  if (surah >= 78) return 30;
  return (SURAH_START_JUZ as any)[surah] || 0;
}

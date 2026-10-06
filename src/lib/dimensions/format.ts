/** 2022-07-23 00:00 UTC+8 */
export const SERVER_START_MS = Date.UTC(2022, 6, 22, 16, 0, 0);

export const daysSince = (startMs: number, nowMs: number): number =>
  Math.floor((nowMs - startMs) / 86_400_000);

const two = (n: string) => n.padStart(2, '0');

/**
 * Normalise the dates used in static-data to YYYY.MM.DD (or YYYY.MM when the day is unknown).
 * Accepts "2022/7/23", "2022/09/23～09/28", "2023/6-2023/7", "2023/01".
 */
export const formatDate = (raw: string): string => {
  const [y = '', m = '', d = ''] = raw
    .split(/[～~-]/)[0]
    .trim()
    .split('/');
  return [y, m && two(m), d && two(d)].filter(Boolean).join('.');
};

export const yearOf = (raw: string): string => raw.split('/')[0].trim();

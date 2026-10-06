import styled, { keyframes } from 'styled-components';

export const EASE_OUT = 'cubic-bezier(0.32, 0.72, 0, 1)';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const Section = styled.section<{ $tone?: 'plain' | 'muted' }>`
  padding: 96px 24px;
  background: ${(props) =>
    props.$tone === 'muted' ? 'var(--bg-secondary)' : 'var(--bg-primary)'};

  @media (max-width: 734px) {
    padding: 64px 16px;
  }
`;

export const Container = styled.div`
  max-width: 1080px;
  margin: 0 auto;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1068px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 734px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const Tile = styled.div`
  border-radius: 14px;
  background: var(--bg-elevated);
`;

export const Appear = styled.div<{ $delay?: number }>`
  animation: ${fadeIn} 500ms ${EASE_OUT} ${(props) => props.$delay ?? 0}ms
    backwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Text link with a trailing chevron, e.g. "View on GitHub ›". */
export const TextLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-primary);
  font-size: 1.05rem;
  text-decoration: none;

  &::after {
    content: '›';
    font-size: 1.2em;
    line-height: 1;
    transition: transform 200ms ${EASE_OUT};
  }

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:hover::after {
    transform: translateX(2px);
  }
`;

export const TextButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font: inherit;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

export const Placeholder = styled.div<{ $w?: string; $h?: string }>`
  width: ${(props) => props.$w ?? '100%'};
  height: ${(props) => props.$h ?? '14px'};
  border-radius: 6px;
  background: var(--bg-tertiary);
  animation: ${pulse} 1.8s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Vue: '#41b883',
  Python: '#3572a5',
  Java: '#b07219',
  Kotlin: '#a97bff',
  Go: '#00add8',
  Rust: '#dea584',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#663399',
  mcfunction: '#e22837',
};

export const getLanguageColor = (language: string | null): string =>
  (language && languageColors[language]) || 'var(--text-muted)';

export const getIntlLocale = (language: string): string => {
  if (language === 'zh_CN') return 'zh-CN';
  if (language.startsWith('zh')) return 'zh-TW';
  return 'en';
};

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export const formatRelativeTime = (date: string, locale: string): string => {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, size] of relativeUnits) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }

  return formatter.format(0, 'minute');
};

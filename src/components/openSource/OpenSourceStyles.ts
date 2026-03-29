import styled from 'styled-components';

export const RepoSection = styled.section`
  background: var(--bg-primary);
  padding: 80px 24px 100px;

  @media (max-width: 768px) {
    padding: 56px 16px 80px;
  }
`;

export const Content = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

export const StatusContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 80px 0;
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Vue: '#42b883',
  React: '#61dafb',
  Python: '#3776ab',
  Java: '#f89820',
  Kotlin: '#7f52ff',
  Go: '#00add8',
  Rust: '#dea584',
  Shell: '#89e051',
  HTML: '#e34f26',
  CSS: '#1572b6',
  SCSS: '#cc6699',
};

export const getLanguageColor = (language: string | null): string => {
  if (!language) return 'var(--color-accent)';
  return languageColors[language] ?? 'var(--color-primary)';
};

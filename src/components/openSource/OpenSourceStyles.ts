import styled from 'styled-components';

export const RepoSection = styled.section`
  background: var(--bg-primary);
  background-image: radial-gradient(circle at top right, rgba(0, 0, 0, 0.02) 0%, transparent 60%),
                    radial-gradient(circle at bottom left, rgba(0, 0, 0, 0.02) 0%, transparent 60%);
  padding: 80px 24px 100px;
  position: relative;

  [data-theme='dark'] & {
    background-image: radial-gradient(circle at top right, rgba(255, 255, 255, 0.03) 0%, transparent 60%),
                      radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.03) 0%, transparent 60%);
  }

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

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80px 24px;
  color: var(--text-secondary);
  font-size: 1.1rem;
  text-align: center;
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--border-color);
  margin-top: 32px;
  backdrop-filter: blur(8px);
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

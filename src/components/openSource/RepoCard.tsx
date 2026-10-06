import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { IRepoType } from '@/types/IRepoType.ts';
import {
  Appear,
  EASE_OUT,
  Placeholder,
  Tile,
  formatRelativeTime,
  getIntlLocale,
  getLanguageColor,
} from './OpenSourceStyles.ts';

const Card = styled(Tile)`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 22px;
  transition:
    transform 300ms ${EASE_OUT},
    box-shadow 300ms ${EASE_OUT};

  &:hover {
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: scale(0.985);
    transition-duration: 100ms;
  }

  &:has(h3 a:focus-visible) {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:active {
      transform: none;
    }
  }
`;

const Kicker = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  color: var(--text-tertiary);
  font-size: 0.78rem;
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.$color};
`;

const Name = styled.h3`
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;

  a {
    color: var(--text-primary);
    text-decoration: none;
    outline: none;

    /* The whole tile opens the repository */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
  }
`;

const Description = styled.p`
  flex: 1;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Footer = styled.p`
  margin: 14px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
`;

interface RepoCardProps {
  repo: IRepoType;
  index: number;
}

const RepoCard = ({ repo, index }: RepoCardProps) => {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);

  const kicker = [
    repo.language || t('opensource.unknownLanguage'),
    repo.fork && t('opensource.fork'),
    repo.archived && t('opensource.archived'),
  ].filter(Boolean);

  const meta = [
    `★ ${repo.stargazers_count}`,
    formatRelativeTime(repo.pushed_at, locale),
  ];

  return (
    <Appear $delay={Math.min(index, 6) * 30}>
      <Card>
        <Kicker>
          <Dot $color={getLanguageColor(repo.language)} />
          {kicker.join(' · ')}
        </Kicker>
        <Name>
          <a href={repo.html_url} target='_blank' rel='noreferrer'>
            {repo.name}
          </a>
        </Name>
        <Description>
          {repo.description || t('opensource.noDescription')}
        </Description>
        <Footer>{meta.join(' · ')}</Footer>
      </Card>
    </Appear>
  );
};

export const RepoCardPlaceholder = () => (
  <Tile style={{ padding: '20px 22px' }} aria-hidden='true'>
    <Placeholder $w='30%' $h='10px' style={{ marginBottom: 10 }} />
    <Placeholder $w='55%' $h='18px' style={{ marginBottom: 12 }} />
    <Placeholder $h='12px' style={{ marginBottom: 8 }} />
    <Placeholder $w='80%' $h='12px' style={{ marginBottom: 18 }} />
    <Placeholder $w='35%' $h='10px' />
  </Tile>
);

export default RepoCard;

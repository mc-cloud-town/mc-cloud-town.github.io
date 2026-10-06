import {
  BranchesOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  ExportOutlined,
  GithubOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { IRepoType } from '@/types/IRepoType.ts';
import { getLanguageColor } from './OpenSourceStyles.ts';

const CardContainer = styled.a<{ $accent: string; $isVisible: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 32px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  min-height: 280px;

  /* Scroll Reveal Animation: Smoother, no will-change vram exhaustion */
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  transform: translateY(${(props) => (props.$isVisible ? 0 : '20px')});
  transition:
    opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 1s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => props.$accent};
    opacity: 0.7;
    transition:
      width 0.3s ease,
      opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 12px 32px
      color-mix(in srgb, ${(props) => props.$accent} 15%, transparent);
    border-color: ${(props) => props.$accent};

    &::before {
      width: 6px;
      opacity: 1;
    }

    .external-icon {
      color: ${(props) => props.$accent};
      transform: translate(4px, -4px) scale(1.1);
    }
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`;

const RepoTitleBlock = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RepoName = styled.h3`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.3;
  word-break: break-word;
  transition: color 0.3s ease;

  ${CardContainer}:hover & {
    color: var(--color-primary);
  }
`;

const RepoPath = styled.p`
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.95rem;
  font-family: var(--font-body);
`;

const ExternalBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 1.25rem;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;

  ${CardContainer}:hover & {
    background: var(--bg-secondary);
  }
`;

const RepoDescription = styled.p`
  margin: 0 0 24px;
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
`;

const TopicList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;

const Topic = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  ${CardContainer}:hover & {
    background: var(--bg-elevated);
    border-color: var(--border-color);
    color: var(--text-primary);
  }
`;

const DetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

const DetailTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.3s ease;

  ${CardContainer}:hover & {
    color: var(--text-primary);
  }
`;

const LanguageDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  box-shadow: 0 0 0 2px
    color-mix(in srgb, ${(props) => props.$color} 20%, transparent);
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
  margin-top: auto; /* Push footer to bottom */

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
`;

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.2s ease;

  &:hover {
    color: var(--text-primary);
    transform: translateY(-2px);
  }
`;

const UpdatedAt = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 0.85rem;
`;

const formatRepoDate = (date: string, locale: string): string =>
  new Intl.DateTimeFormat(locale.startsWith('zh') ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));

interface RepoCardProps {
  repo: IRepoType;
  index: number;
}

const RepoCard = ({ repo, index }: RepoCardProps) => {
  const { t, i18n } = useTranslation();
  const languageColor = getLanguageColor(repo.language);
  const topics = repo.topics?.slice(0, 3) ?? [];

  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When 10% of the card is visible from bottom scroll
          if (entry.isIntersecting) {
            setTimeout(
              () => {
                setIsVisible(true);
              },
              (index % 3) * 100,
            ); // 100ms tiny wave for siblings entering at same time
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px', threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  return (
    <CardContainer
      ref={cardRef}
      href={repo.html_url}
      target='_blank'
      rel='noreferrer'
      $accent={languageColor}
      $isVisible={isVisible}
    >
      <CardTop>
        <RepoTitleBlock>
          <RepoName>{repo.name}</RepoName>
          <RepoPath>{repo.full_name}</RepoPath>
        </RepoTitleBlock>
        <ExternalBadge aria-hidden='true' className='external-icon'>
          <ExportOutlined />
        </ExternalBadge>
      </CardTop>

      <RepoDescription>
        {repo.description || t('opensource.noDescription')}
      </RepoDescription>

      {topics.length > 0 && (
        <TopicList>
          {topics.map((topic) => (
            <Topic key={topic}>#{topic}</Topic>
          ))}
        </TopicList>
      )}

      <DetailRow>
        <DetailTag>
          <CodeOutlined />
          <LanguageDot $color={languageColor} />
          {repo.language || t('opensource.unknownLanguage')}
        </DetailTag>
        <DetailTag>
          <SafetyCertificateOutlined />
          {repo.license?.name || t('opensource.noLicense')}
        </DetailTag>
        {repo.homepage && (
          <DetailTag>
            <LinkOutlined />
            {t('opensource.hasWebsite')}
          </DetailTag>
        )}
        {repo.archived && (
          <DetailTag>
            <ClockCircleOutlined />
            {t('opensource.archived')}
          </DetailTag>
        )}
      </DetailRow>

      <Footer>
        <Stats>
          <Stat>
            <GithubOutlined />
            {t('opensource.sourceCode')}
          </Stat>
          <Stat>
            <StarOutlined />
            {repo.stargazers_count}
          </Stat>
          <Stat>
            <BranchesOutlined />
            {repo.forks_count}
          </Stat>
        </Stats>
        <UpdatedAt>
          <ClockCircleOutlined />
          {t('opensource.updatedOn', {
            date: formatRepoDate(repo.pushed_at, i18n.language),
          })}
        </UpdatedAt>
      </Footer>
    </CardContainer>
  );
};

export default RepoCard;

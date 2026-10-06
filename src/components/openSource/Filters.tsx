import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { SearchOutlined } from '@ant-design/icons';

import { EASE_OUT } from './OpenSourceStyles.ts';

export type SortKey = 'updated' | 'stars' | 'name';

const SORT_KEYS: SortKey[] = ['updated', 'stars', 'name'];

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;

  @media (max-width: 734px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Search = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;

  .anticon {
    position: absolute;
    left: 12px;
    color: var(--text-muted);
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 260px;
  height: 36px;
  padding: 0 12px 0 34px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 150ms ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--color-primary);
  }

  @media (max-width: 734px) {
    width: 100%;
  }
`;

const Select = styled.select`
  height: 36px;
  padding: 0 32px 0 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--bg-elevated)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Cpath d='m1 1 4 4 4-4'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  color: var(--text-primary);
  font: inherit;
  font-size: 0.95rem;
  appearance: none;
  cursor: pointer;
  outline: none;

  &:focus-visible {
    border-color: var(--color-primary);
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 28px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--border-color-strong);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  position: relative;
  flex-shrink: 0;
  padding: 0 0 14px;
  border: none;
  background: none;
  color: ${(props) =>
    props.$active ? 'var(--text-primary)' : 'var(--text-tertiary)'};
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 150ms ease;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: var(--text-primary);
    transform: scaleX(${(props) => (props.$active ? 1 : 0)});
    transition: transform 300ms ${EASE_OUT};
  }

  &:hover {
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
  }

  small {
    margin-left: 6px;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }
`;

interface FiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  language: string | null;
  onLanguageChange: (language: string | null) => void;
  languages: { name: string; count: number }[];
  total: number;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}

const Filters = ({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  languages,
  total,
  sort,
  onSortChange,
}: FiltersProps) => {
  const { t } = useTranslation();
  const tabs = [
    { key: null, label: t('opensource.allLanguages'), count: total },
    ...languages.map((lang) => ({
      key: lang.name,
      label: lang.name,
      count: lang.count,
    })),
  ];

  return (
    <>
      <Header>
        <Title>{t('opensource.allProjects')}</Title>
        <Controls>
          <Search>
            <SearchOutlined />
            <SearchInput
              type='search'
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t('opensource.searchPlaceholder')}
              aria-label={t('opensource.searchPlaceholder')}
            />
          </Search>
          <Select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            aria-label={t('opensource.sort.label')}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`opensource.sort.${key}`)}
              </option>
            ))}
          </Select>
        </Controls>
      </Header>

      <Tabs role='tablist' aria-label={t('opensource.languages')}>
        {tabs.map((tab) => (
          <Tab
            key={tab.key ?? 'all'}
            type='button'
            role='tab'
            aria-selected={language === tab.key}
            $active={language === tab.key}
            onClick={() => onLanguageChange(tab.key)}
          >
            {tab.label}
            <small>{tab.count}</small>
          </Tab>
        ))}
      </Tabs>
    </>
  );
};

export default Filters;

'use client';

import { useTranslation } from 'react-i18next';
import { GITHUB_ORG_URL, OPEN_SOURCE_ROLES } from '@/constants/openSourceRoles';
import type { IMembers } from '@/types/IMember';

/** The end credits: the tools first, then everyone. Member lists are left out if the data did not arrive. */
export const Credits = ({ members }: { members: IMembers | null }) => {
  const { t } = useTranslation();
  return (
    <section className='credits' id='credits' data-dim='end'>
      {/* the credits are part of the End: their headings are a level below its statement */}
      <h3 className='cast' data-t='note'>
        {t('dimensions.end.credits.tools')}
      </h3>
      <dl className='roles'>
        {OPEN_SOURCE_ROLES.map(([key, repos]) => (
          <div key={key}>
            <dt data-t='body'>{t(`dimensions.end.credits.roles.${key}`)}</dt>
            <dd>
              {repos.map((r) => (
                <a
                  key={r}
                  href={`${GITHUB_ORG_URL}/${r}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-t='body'
                >
                  {r}
                </a>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      {(['member', 'trial'] as const).map((group) =>
        members?.[group]?.length ? (
          <div key={group}>
            <h3 className='cast' data-t='note'>
              {t(`dimensions.end.credits.${group}`)}
            </h3>
            <p className='names' data-names={group}>
              {members[group].map((m, i) => (
                // the live data repeats some uuids, so the position is part of the key
                <span key={`${m.uuid}-${i}`}>{m.name}</span>
              ))}
            </p>
          </div>
        ) : null,
      )}
      <p>
        <a className='more' href='/member/' data-t='control'>
          {t('dimensions.end.credits.more')} <span aria-hidden='true'>→</span>
        </a>
      </p>
      <p className='serif fin' data-t='title'>
        {t('dimensions.end.credits.fin')}
      </p>
    </section>
  );
};

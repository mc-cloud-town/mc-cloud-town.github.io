'use client';

import { useTranslation } from 'react-i18next';
import type { IMembers } from '@/types/IMember';

const ROLES: [string, string[]][] = [
  [
    'core',
    [
      'Carpet-CTEC-Addition',
      'carpetmod112',
      'Carpet-Vastech-Addition',
      'carpet-shadow-117',
      'scarpet',
    ],
  ],
  [
    'server',
    [
      'ChatBridgeE',
      'MCDR-LocationMarker',
      'TimeBackup',
      'join-reminder',
      'VelocityCT',
    ],
  ],
  ['infra', ['grafana-docker', 'static-data', 'dashboard-api', 'info-command']],
  [
    'community',
    [
      'cloud-town-discord-bot',
      'TTS-Discord-Bot',
      'minecraft-resource-emoji',
      'mc-cloud-town.github.io',
    ],
  ],
];

/** The end credits: the tools first, then everyone. Member lists are left out if the data did not arrive. */
export const Credits = ({ members }: { members: IMembers | null }) => {
  const { t } = useTranslation();
  return (
    <section className='credits' id='credits' data-dim='end'>
      <h2 data-t='note'>{t('dimensions.end.credits.tools')}</h2>
      <dl className='roles'>
        {ROLES.map(([key, repos]) => (
          <div key={key}>
            <dt data-t='body'>{t(`dimensions.end.credits.roles.${key}`)}</dt>
            <dd>
              {repos.map((r) => (
                <a
                  key={r}
                  href={`https://github.com/mc-cloud-town/${r}`}
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
            <h2 data-t='note'>{t(`dimensions.end.credits.${group}`)}</h2>
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

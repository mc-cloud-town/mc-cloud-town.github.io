/** The organisation on GitHub: where the repositories live, and where to look when the list cannot be had. */
export const GITHUB_ORG_URL = 'https://github.com/mc-cloud-town';

/**
 * The organisation's repositories by what they are for, each group in the order it is read in: the one table of
 * the home page's credits and of the open-source page. The names of the groups are `dimensions.end.credits.roles.*`.
 */
export const OPEN_SOURCE_ROLES: [string, string[]][] = [
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

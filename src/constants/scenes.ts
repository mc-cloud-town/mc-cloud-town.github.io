import { STATIC_DATA_API } from '@/constants';

export type SceneId =
  | 'spawn'
  | 'town'
  | 'w1'
  | 'w2'
  | 'w3'
  | 'nether'
  | 'hall'
  | 'moon'
  | 'farm'
  | 'end'
  | 'day1';
export type Veil = 'hero' | 'side' | 'side-flip' | 'wide' | 'foot' | 'none';
export type Fx = 'push' | 'curtain' | 'slide' | 'portal' | 'fall' | 'wake';

export interface SceneDef {
  id: SceneId;
  src?: string;
  veil: Veil;
}
export interface TransitionDef {
  trigger: string;
  from: SceneId;
  to: SceneId;
  fx: Fx;
}

const progress = (id: string) =>
  `${STATIC_DATA_API}/images/survivalProgress/${id}.webp`;

/** Stacking order is DOM order: later scenes sit above earlier ones. */
export const SCENES: SceneDef[] = [
  { id: 'spawn', src: '/assets/members/CTEC_Members.webp', veil: 'hero' },
  { id: 'town', src: '/assets/homePage/CTEC_Building.webp', veil: 'side' },
  { id: 'w1', src: progress('p40'), veil: 'foot' }, // 瑪莉亞之牆
  { id: 'w2', src: progress('p33'), veil: 'side-flip' }, // 新出生點
  { id: 'w3', src: progress('p17'), veil: 'foot' }, // 全編碼全物品
  { id: 'nether', veil: 'wide' }, // six stacked images, see NETHER_IMAGES
  { id: 'hall', src: progress('p21'), veil: 'side' }, // 終界大廳
  { id: 'moon', src: progress('p14'), veil: 'foot' }, // 月宮
  { id: 'farm', src: progress('p6'), veil: 'side-flip' }, // 終界農業區
  { id: 'end', veil: 'none' }, // starfield
  { id: 'day1', src: progress('p2'), veil: 'side' }, // 開服當天
];

/** In the order of nether.ledger in the translations. */
export const NETHER_IMAGES = ['p4', 'p10', 'p12', 'p38', 'p49', 'p51'].map(
  progress,
);

/**
 * One transition per section, in page order. Neighbours never share an effect.
 * `trigger` is a selector inside the home page root.
 */
export const TRANSITIONS: TransitionDef[] = [
  { trigger: '#overworld', from: 'spawn', to: 'town', fx: 'push' },
  {
    trigger: '[data-work="overworld-0"]',
    from: 'town',
    to: 'w1',
    fx: 'curtain',
  },
  { trigger: '[data-work="overworld-1"]', from: 'w1', to: 'w2', fx: 'slide' },
  { trigger: '[data-work="overworld-2"]', from: 'w2', to: 'w3', fx: 'push' },
  { trigger: '#nether', from: 'w3', to: 'nether', fx: 'portal' },
  { trigger: '#end', from: 'nether', to: 'hall', fx: 'fall' },
  { trigger: '[data-work="end-0"]', from: 'hall', to: 'moon', fx: 'slide' },
  { trigger: '[data-work="end-1"]', from: 'moon', to: 'farm', fx: 'curtain' },
  { trigger: '#credits', from: 'farm', to: 'end', fx: 'push' },
  { trigger: '#respawn', from: 'end', to: 'day1', fx: 'wake' },
];

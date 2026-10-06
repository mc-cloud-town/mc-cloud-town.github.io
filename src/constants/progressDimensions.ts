export type ProgressDimension = 'overworld' | 'nether' | 'end';

/**
 * Which dimension a milestone belongs to, keyed by its image id.
 * Only confirmed entries are listed: the title names the dimension, or the team confirmed it.
 * Entries that are not listed show no dimension tag. Do not add guesses here.
 */
const CONFIRMED: Record<string, ProgressDimension> = {
  p4: 'nether', // 地獄大廳
  p8: 'nether', // 前往地獄1k空置域之臨時珍珠砲
  p10: 'nether', // Y0切門豬人農場地獄端
  p26: 'nether', // EOL地獄收集
  p11: 'nether', // EOL地獄收集翻新
  p12: 'nether', // 地獄1k空置域
  p49: 'nether', // 地獄大廳主炮
  p51: 'nether', // 刷花機（地獄）
  p34: 'overworld', // 主世界偽和平
  p5: 'overworld', // 主世界切門完成
  p24: 'overworld', // 主世界1k空置域
  p32: 'overworld', // Y0切門豬人農場主世界收集及裝飾
  p13: 'overworld', // EOL主世界裝飾
  p15: 'overworld', // 主世界豬人塔
  p6: 'end', // 終界農業區
  p21: 'end', // 終界大廳
  p14: 'end', // 月宮（團隊確認）
};

/** "survivalProgress/p14.webp" -> "end" */
export const dimensionOf = (imageUrl: string): ProgressDimension | undefined =>
  CONFIRMED[imageUrl.replace(/^.*\//, '').replace(/\.\w+$/, '')];

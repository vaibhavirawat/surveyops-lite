import { findVillages } from '../villages/villages.repository';
import { STAGES, listVillagesQuery } from '../villages/villages.schema';
import * as repo from './dashboard.repository';

export async function getStats() {
  // Three independent queries, so run them at the same time.
  const [stageCounts, byTehsil, recent] = await Promise.all([
    repo.countByStage(),
    repo.countByTehsil(),
    // Reuse the list query: the 5 most recently updated villages. Parsing applies the default sort.
    findVillages(listVillagesQuery.parse({ pageSize: 5 })),
  ]);

  // GROUP BY only returns stages that have rows. Fill in zeros so the chart always shows all six, in workflow order.
  const countByStageName = new Map(stageCounts.map((row) => [row.stage, row.count]));
  const byStage = STAGES.map((stage) => ({ stage, count: countByStageName.get(stage) ?? 0 }));

  const villages = byStage.reduce((sum, row) => sum + row.count, 0);
  const completed = countByStageName.get('tehsil_merged') ?? 0;
  const notStarted = countByStageName.get('not_started') ?? 0;

  return {
    totals: {
      villages,
      notStarted,
      inProgress: villages - completed - notStarted,
      completed,
      completionPercent: villages === 0 ? 0 : Math.round((completed / villages) * 1000) / 10,
    },
    byStage,
    byTehsil,
    recentlyUpdated: recent.rows,
  };
}

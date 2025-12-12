// Mocked sensitivity analysis service.
// Components should only call getSensitivityResults and never import the mock data directly.

const MOCK_SEED = 0.015;

const SOBOL_RESULTS = {
  group: [
    { name: 'Arrivals', totalEffect: 0.62, firstOrder: 0.48, uncertainty: 0.07 },
    { name: 'Routing', totalEffect: 0.54, firstOrder: 0.36, uncertainty: 0.1 },
    { name: 'Processing times', totalEffect: 0.47, firstOrder: 0.31, uncertainty: 0.08 },
    { name: 'Resources', totalEffect: 0.32, firstOrder: 0.22, uncertainty: 0.06 },
    { name: 'Schedules', totalEffect: 0.21, firstOrder: 0.1, uncertainty: 0.05 },
    { name: 'Other', totalEffect: 0.12, firstOrder: 0.06, uncertainty: 0.04 },
  ],
  parameter: [
    { name: 'Arrival rate (peak)', totalEffect: 0.44, firstOrder: 0.33, uncertainty: 0.06 },
    { name: 'Arrival rate (base)', totalEffect: 0.39, firstOrder: 0.27, uncertainty: 0.06 },
    { name: 'Routing: rework prob.', totalEffect: 0.31, firstOrder: 0.21, uncertainty: 0.08 },
    { name: 'Task A proc. time', totalEffect: 0.26, firstOrder: 0.19, uncertainty: 0.07 },
    { name: 'Task B proc. time', totalEffect: 0.22, firstOrder: 0.14, uncertainty: 0.05 },
    { name: 'Resource pool size', totalEffect: 0.19, firstOrder: 0.12, uncertainty: 0.04 },
    { name: 'Shift start offset', totalEffect: 0.14, firstOrder: 0.09, uncertainty: 0.04 },
    { name: 'Calendar breaks', totalEffect: 0.11, firstOrder: 0.06, uncertainty: 0.03 },
  ],
  runs: 1000,
};

const MORRIS_RESULTS = {
  group: [
    { name: 'Arrivals', mu: 0.41, sigma: 0.18, uncertainty: 0.09 },
    { name: 'Routing', mu: 0.35, sigma: 0.16, uncertainty: 0.08 },
    { name: 'Processing times', mu: 0.31, sigma: 0.14, uncertainty: 0.06 },
    { name: 'Resources', mu: 0.24, sigma: 0.12, uncertainty: 0.05 },
    { name: 'Schedules', mu: 0.17, sigma: 0.1, uncertainty: 0.04 },
    { name: 'Other', mu: 0.12, sigma: 0.08, uncertainty: 0.03 },
  ],
  parameter: [
    { name: 'Arrival rate (peak)', mu: 0.33, sigma: 0.17, uncertainty: 0.08 },
    { name: 'Arrival rate (base)', mu: 0.28, sigma: 0.13, uncertainty: 0.07 },
    { name: 'Routing: rework prob.', mu: 0.26, sigma: 0.15, uncertainty: 0.08 },
    { name: 'Task A proc. time', mu: 0.22, sigma: 0.12, uncertainty: 0.06 },
    { name: 'Task B proc. time', mu: 0.2, sigma: 0.1, uncertainty: 0.05 },
    { name: 'Resource pool size', mu: 0.17, sigma: 0.09, uncertainty: 0.04 },
    { name: 'Shift start offset', mu: 0.13, sigma: 0.08, uncertainty: 0.03 },
    { name: 'Calendar breaks', mu: 0.1, sigma: 0.07, uncertainty: 0.03 },
  ],
  runs: 320,
};

function stringSeed(str = '') {
  return (
    str
      .split('')
      .map(c => c.charCodeAt(0))
      .reduce((acc, curr) => acc + curr, 0) * MOCK_SEED
  );
}

function applyScenarioShift(items, seed) {
  return items.map((item, index) => {
    const offset = ((Math.sin(seed + index) + 1) / 8) * 0.06; // small, deterministic wiggle
    return {
      ...item,
      totalEffect: item.totalEffect ? Math.max(0, Math.min(1, item.totalEffect + offset - 0.03)) : undefined,
      firstOrder: item.firstOrder ? Math.max(0, Math.min(1, item.firstOrder + offset - 0.03)) : undefined,
      mu: item.mu ? Math.max(0, item.mu + offset - 0.02) : undefined,
      sigma: item.sigma ? Math.max(0, item.sigma + offset - 0.02) : undefined,
    };
  });
}

export async function getSensitivityResults(query) {
  const {
    method = 'sobol',
    kpi = 'average_cycle_time',
    scenario = 'base',
    view = 'group',
  } = query || {};

  const seed = stringSeed(`${method}-${kpi}-${scenario}-${view}`);
  const dataset = method === 'morris' ? MORRIS_RESULTS : SOBOL_RESULTS;
  const baseItems = dataset[view] || dataset.group;
  const items = applyScenarioShift(baseItems, seed).map(item => ({
    name: item.name,
    score: method === 'morris' ? item.mu : item.totalEffect,
    secondary: method === 'morris' ? item.sigma : item.firstOrder,
    uncertainty: item.uncertainty ?? 0.05,
    cases: 3000,
  }));

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        method,
        kpi,
        scenario,
        view,
        runs: dataset.runs,
        groups: (dataset[view] || []).length || items.length,
        results: items.sort((a, b) => b.score - a.score),
        mock: true,
      });
    }, 550);
  });
}

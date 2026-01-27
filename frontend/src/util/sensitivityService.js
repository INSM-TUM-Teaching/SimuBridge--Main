// Mocked sensitivity analysis data.
// Components should only call getSensitivityResults and never import the mock data directly.

const MOCK_SEED = 0.015;

const SOBOL_RESULTS = {
  group: [
    {
      name: 'arrival_distribution',
      totalEffect: 0.736044,
      firstOrder: 0.208572,
      uncertainty: 0.274754,
      firstOrderConf: 0.179189,
    },
    {
      name: 'resource_calendars',
      totalEffect: 0.311257,
      firstOrder: 0.138061,
      uncertainty: 0.211157,
      firstOrderConf: 0.119453,
    },
    {
      name: 'resource_numbers',
      totalEffect: 0.264412,
      firstOrder: 0.048778,
      uncertainty: 0.088873,
      firstOrderConf: 0.077632,
    },
    {
      name: 'tasks_resources',
      totalEffect: 0.174892,
      firstOrder: -0.017593,
      uncertainty: 0.106965,
      firstOrderConf: 0.053159,
    },
    {
      name: 'arrival_calendar',
      totalEffect: 0.168467,
      firstOrder: -0.036219,
      uncertainty: 0.087594,
      firstOrderConf: 0.06206,
    },
    {
      name: 'gateways',
      totalEffect: 0.039264,
      firstOrder: -0.004875,
      uncertainty: 0.021587,
      firstOrderConf: 0.029203,
    },
  ],
  interactions: [
    {
      groupI: 'resource_calendars',
      groupJ: 'arrival_distribution',
      s2: 0.205178,
      s2Conf: 0.259993,
    },
    {
      groupI: 'arrival_distribution',
      groupJ: 'resource_numbers',
      s2: 0.19213,
      s2Conf: 0.206106,
    },
    {
      groupI: 'tasks_resources',
      groupJ: 'resource_numbers',
      s2: 0.082717,
      s2Conf: 0.081073,
    },
    {
      groupI: 'tasks_resources',
      groupJ: 'arrival_calendar',
      s2: 0.065435,
      s2Conf: 0.074329,
    },
    {
      groupI: 'arrival_calendar',
      groupJ: 'resource_calendars',
      s2: 0.045718,
      s2Conf: 0.089202,
    },
    {
      groupI: 'arrival_calendar',
      groupJ: 'resource_numbers',
      s2: 0.043194,
      s2Conf: 0.095729,
    },
    {
      groupI: 'tasks_resources',
      groupJ: 'arrival_distribution',
      s2: 0.04238,
      s2Conf: 0.13763,
    },
    {
      groupI: 'arrival_calendar',
      groupJ: 'arrival_distribution',
      s2: 0.037346,
      s2Conf: 0.109968,
    },
    {
      groupI: 'tasks_resources',
      groupJ: 'resource_calendars',
      s2: 0.030529,
      s2Conf: 0.088014,
    },
    {
      groupI: 'gateways',
      groupJ: 'resource_numbers',
      s2: 0.024459,
      s2Conf: 0.04888,
    },
    {
      groupI: 'gateways',
      groupJ: 'tasks_resources',
      s2: 0.014177,
      s2Conf: 0.037309,
    },
    {
      groupI: 'gateways',
      groupJ: 'resource_calendars',
      s2: 0.012219,
      s2Conf: 0.04461,
    },
    {
      groupI: 'gateways',
      groupJ: 'arrival_calendar',
      s2: 0.001863,
      s2Conf: 0.034925,
    },
    {
      groupI: 'resource_calendars',
      groupJ: 'resource_numbers',
      s2: 0.000349,
      s2Conf: 0.136504,
    },
    {
      groupI: 'gateways',
      groupJ: 'arrival_distribution',
      s2: -0.005819,
      s2Conf: 0.042056,
    },
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
    {
      name: 'arrival_distribution',
      mu: 108623.812112,
      sigma: 0,
      uncertainty: 28554.038473,
      relCi: 0.2629,
    },
    {
      name: 'resource_numbers',
      mu: 53546.115,
      sigma: 0,
      uncertainty: 28134.207832,
      relCi: 0.5254,
    },
    {
      name: 'resource_calendars',
      mu: 47988.827593,
      sigma: 0,
      uncertainty: 20578.610959,
      relCi: 0.4288,
    },
    {
      name: 'arrival_calendar',
      mu: 40819.070334,
      sigma: 0,
      uncertainty: 12404.703172,
      relCi: 0.3039,
    },
    {
      name: 'gateways',
      mu: 21401.473396,
      sigma: 0,
      uncertainty: 7593.064268,
      relCi: 0.3548,
    },
    {
      name: 'tasks_resources',
      mu: 16670.763145,
      sigma: 0,
      uncertainty: 8931.90241,
      relCi: 0.5358,
    },
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

export async function getSensitivityResults(query) {
  const {
    method = 'sobol',
    kpi = 'average_cycle_time',
    scenario = 'base',
    view = 'group',
  } = query || {};

  // Choose the dataset by method
  const dataset = method === 'morris' ? MORRIS_RESULTS : SOBOL_RESULTS;
  
  // Choose the requested view array
  const baseItems = dataset[view] || dataset.group;
  const items = baseItems;

  // Map raw mock fields into the table
  const mappedItems = items.map(item => ({
    name: item.name,
    score: method === 'morris' ? item.mu : item.totalEffect,
    secondary: method === 'morris' ? item.sigma : item.firstOrder,
    uncertainty:
      method === 'sobol'
        ? item.uncertainty ?? 0.05
        : item.uncertainty ?? 0.05,
    relCi: method === 'morris' ? item.relCi : undefined,
    firstOrderConf: item.firstOrderConf,
    cases: 3000,
  }));

  // Simulatiom of network latencu and resolve the mock payload
  // Sorting ensures table shows "most important" information at the top
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        method,
        kpi,
        scenario,
        view,
        runs: dataset.runs,
        groups: (dataset[view] || []).length || mappedItems.length,
        results: mappedItems.sort((a, b) => b.score - a.score),
        interactions:
          method === 'sobol'
            ? (dataset.interactions || []).map(item => ({
                ...item,
                cases: 3000,
              }))
            : undefined,
        mock: true,
      });
    }, 550);
  });
}

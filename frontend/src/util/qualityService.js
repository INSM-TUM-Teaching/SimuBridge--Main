/**
 * This file contains helper functions for:
 * - finding event log files available in the project
 * - extracting activity names from the log
 * - providing mock quality and stability parameters for the UI
 */
import { getFile, getFiles } from './Storage.js';

const DEFAULT_LOGS = ['sample_log.xes', 'operations_2024.csv'];

/** These are the fallback activities for the demo in case:
* - log parsing will fail
* - log detects no activities
* - file can not be read
*/
const FALLBACK_ACTIVITIES = [
  'Check invoice',
  'Validate',
  'Approve claim',
  'Pay',
  'Archive',
];

//This function splits a single CSV line into values
const splitCsvLine = line => {
  const matches = line.match(/(".*?"|[^",]+)(?=,|$)/g);
  if (!matches) return [];
  return matches.map(value => value.replace(/^"|"$/g, '').trim());
};

/**
 * Extract activity names from a CSV log file
 * 
 * 1. Split file into lines
 * 2. Read the header row
 * 3. Find the activity column
 * 4. Collect uniques activity names from that column
 */
const parseActivitiesFromCsv = text => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]).map(col => col.toLowerCase());
  // Try to find a column that represents activity names
  const activityIndex = header.findIndex(col =>
    col.includes('activity') || col.includes('concept:name')
  );
  if (activityIndex < 0) return [];
  // Using a set to avoid duplicate activity names
  const activities = new Set();
  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const value = values[activityIndex];
    if (value) activities.add(value);
  }
  return [...activities];
};

// Extract activity names from XES event log
// It searches for all occurences of "concept:name" value="
const parseActivitiesFromXes = text => {
  const matches = text.match(/<string key="concept:name" value="([^"]+)"\s*\/>/g);
  if (!matches) return [];
  const activities = new Set();
  matches.forEach(match => {
    const valueMatch = match.match(/value="([^"]+)"/);
    if (valueMatch?.[1]) {
      activities.add(valueMatch[1]);
    }
  });
  return [...activities];
};

/** Returns a list of log files available in the project
 * 
 * - Reads all projects files from storage
 * - Filters for files that looks like logs
 * - If none found, return defaul created log
 * 
 */
export async function listProjectLogs(projectName) {
  if (!projectName) return [];
  const files = await getFiles(projectName);
  const logCandidates = files.filter(file =>
    ['.xes', '.csv', '.json'].some(ext => file.toLowerCase().endsWith(ext))
  );
  return logCandidates.length ? logCandidates : DEFAULT_LOGS;
}

/**
 * Returns a list of activity names for a specific log file
 * 
 * - Load a file content
 * - Decide if its XES or CSV
 * - Choose according function
 */
export async function getLogActivities(projectName, logName) {
  if (!projectName || !logName) return [];
  try {
    const file = await getFile(projectName, logName);
    const content = file?.data || '';
    let activities = [];
    // Detect XES by file extension 
    if (logName.toLowerCase().endsWith('.xes') || content.includes('<event')) {
      activities = parseActivitiesFromXes(content);
    // Detects CSV by file extension or commas
    } else if (logName.toLowerCase().endsWith('.csv') || content.includes(',')) {
      activities = parseActivitiesFromCsv(content);
    }
    if (!activities.length) {
      return FALLBACK_ACTIVITIES;
    }
    return activities;
  } catch {
    return FALLBACK_ACTIVITIES;
  }
}

/**
 * Returns mock data for quality and stability parameters
 * 
 * Replace this function with real backend results in the future
 * - id -> unique identifier
 * - name -> Nicer format for readability
 * - group -> One of "Processing Time", "Arrival Distribution", "Processing Time", "Resources"
 * - quality -> 0-100 score
 * - stability -> 0-100 score
 * - activity -> activity name if there is one, otherwise null
 */
export function getMockQualityParameters() {
  return [
    {
      id: 'arrival_rate',
      name: 'Arrival rate (cases/hour)',
      group: 'Arrival distribution',
      quality: 94,
      stability: 80,
      activity: null,
    },
    {
      id: 'inter_arrival',
      name: 'Inter-arrival time',
      group: 'Arrival distribution',
      quality: 88,
      stability: 70,
      activity: null,
    },
    {
      id: 'duration_check_invoice',
      name: 'Duration: Check invoice',
      group: 'Processing time',
      quality: 55,
      stability: 50,
      activity: 'Check invoice',
    },
    {
      id: 'duration_approve_claim',
      name: 'Duration: Approve claim',
      group: 'Processing time',
      quality: 69,
      stability: 60,
      activity: 'Approve claim',
    },
    {
      id: 'routing_a_b',
      name: 'Routing: Validate → Approve',
      group: 'Branching probability',
      quality: 10,
      stability: 30,
      activity: 'Validate',
    },
    {
      id: 'routing_b_c',
      name: 'Routing: Approve → Pay',
      group: 'Branching probability',
      quality: 26,
      stability: 38,
      activity: 'Approve',
    },
    {
      id: 'resource_team_a',
      name: 'Resource pool: Claims Team A',
      group: 'Resources',
      quality: 82,
      stability: 58,
      activity: null,
    },
    {
      id: 'resource_availability_r1',
      name: 'Resource availability: R1',
      group: 'Resources',
      quality: 88,
      stability: 62,
      activity: null,
    },
  ];
}

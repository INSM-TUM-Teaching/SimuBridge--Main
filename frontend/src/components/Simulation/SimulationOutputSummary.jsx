/**
 * SimulationOutputSummary
 * 
 * After simulation run finishes the system generates 3 files:
 * - XES file -> event log
 * - XML file -> metrics
 * - Txt file
 * 
 * This component reads XES and XML files from storage and shows a summary from them
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { getFile } from '../../util/Storage';

const XES_EXTENSION = '.xes';
const XML_EXTENSION = '.xml';

// Checks if the file name ends with ".xes" or ".xml", and if yes then returns true
const hasSupportedExtension = fileName => {
  const lower = fileName.toLowerCase();
  return lower.endsWith(XES_EXTENSION) || lower.endsWith(XML_EXTENSION);
};

const parseXmlString = raw => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'application/xml');
    return doc.getElementsByTagName('parsererror').length ? null : doc;
  } catch (err) {
    console.error('Failed to parse xml file', err);
    return null;
  }
};

// Turns a date value in a user friendly string
const formatDate = value => {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime()) ? date.toLocaleString() : null;
};

// Turns a numeric value into a formatted string with commas and decimal points
const formatNumber = value => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

// Converts miliseconds into a readable duration with hours, minutes...
// - Limits output to the first 3 non zero units
const formatDuration = millis => {
  if (typeof millis !== 'number' || millis < 0) {
    return null;
  }
  if (millis === 0) {
    return '0s';
  }
  const seconds = Math.floor(millis / 1000);
  const units = [
    { label: 'd', value: 86400 },
    { label: 'h', value: 3600 },
    { label: 'm', value: 60 },
    { label: 's', value: 1 },
  ];
  const parts = [];
  let remaining = seconds;

  // Transform duration into units
  units.forEach(unit => {
    if (remaining >= unit.value) {
      const qty = Math.floor(remaining / unit.value);
      parts.push(`${qty}${unit.label}`);
      remaining -= qty * unit.value;
    }
  });
  // Keep only 3 units to keep it shorter
  return parts.slice(0, 3).join(' ');
};


// Helper to read an XES attribute node by key, and returning it's "value" attribute
const getAttributeValue = (nodes, key, type = 'string') => {
  const node = nodes.find(element => element.getAttribute('key') === key);
  if (!node) return null;
  if (type === 'date') {
    return node.getAttribute('value');
  }
  return node.getAttribute('value');
};

/**
 * XES SUMMARY
 * 
 * Reads XES event log file and extracts:
 * - number of traces
 * - number of events
 * - number of uniques activity names
 * - number of unique resources
 * - first and last timestamp
 * - average events per trace
 * - average and max case duration
 */
const buildXesSummary = (fileName, rawContent) => {
  const doc = parseXmlString(rawContent);
  if (!doc) {
    return {
      fileName,
      type: 'XES Event Log',
      keyFacts: [{ label: 'Status', value: 'Unable to parse file' }],
    };
  }

  /**
   * In XES "trace" represent a case
   * "event" represents an event inside a trace
   */
  const traceNodes = Array.from(doc.getElementsByTagName('trace'));
  const traces = traceNodes.length;
  // We use sets here to track unique values without duplicates
  const activities = new Set();
  const resources = new Set();
  // Collect all timestamps 
  const timestamps = [];
  const caseDurations = [];
  let totalEvents = 0;

  traceNodes.forEach(traceNode => {
    const eventNodes = Array.from(traceNode.getElementsByTagName('event'));
    totalEvents += eventNodes.length;
    const traceTimestamps = [];
    eventNodes.forEach(eventNode => {
      /**
       * Activity name is usually stored in concept:name
       * Resource name is stored in org:resource
       * Timestamp is stored in time:timestamp
       */
      const stringNodes = Array.from(eventNode.getElementsByTagName('string'));
      const dateNodes = Array.from(eventNode.getElementsByTagName('date'));
      const activityName = getAttributeValue(stringNodes, 'concept:name');
      if (activityName) {
        activities.add(activityName);
      }
      const resourceName = getAttributeValue(stringNodes, 'org:resource');
      if (resourceName) {
        resources.add(resourceName);
      }
      const timestamp = getAttributeValue(dateNodes, 'time:timestamp', 'date');
      if (timestamp) {
        const parsed = new Date(timestamp).getTime();
        if (!isNaN(parsed)) {
          timestamps.push(parsed);
          traceTimestamps.push(parsed);
        }
      }
    });
    // If we have timestamps for this trace we can calculate case duration
    if (traceTimestamps.length) {
      const duration = Math.max(...traceTimestamps) - Math.min(...traceTimestamps);
      caseDurations.push(duration);
    }
  });

  const events = totalEvents;
  // Time range across all events in the file
  const firstEvent = timestamps.length ? new Date(Math.min(...timestamps)) : null;
  const lastEvent = timestamps.length ? new Date(Math.max(...timestamps)) : null;
  // Average amount of events per trace
  const avgEventsPerTrace = traces ? (events / traces).toFixed(1) : '0';
  // Average duration across traces
  const avgCaseDuration =
    caseDurations.length > 0
      ? caseDurations.reduce((sum, value) => sum + value, 0) / caseDurations.length
      : null;
  // Longest case duration
  const maxCaseDuration =
    caseDurations.length > 0 ? Math.max(...caseDurations) : null;

  // Parse values to respective title
  const keyFacts = [
    { label: 'Traces', value: traces ? traces.toLocaleString() : '0' },
    { label: 'Events', value: events ? events.toLocaleString() : '0' },
    { label: 'Unique activities', value: activities.size.toLocaleString() },
    { label: 'Unique resources', value: resources.size.toLocaleString() },
    { label: 'Avg. events / trace', value: avgEventsPerTrace },
  ];

  // Include time if the timestamps were found
  const timeFacts = [
    { label: 'First event', value: formatDate(firstEvent) },
    { label: 'Last event', value: formatDate(lastEvent) },
  ].filter(fact => fact.value);

  return {
    fileName,
    type: 'XES Event Log',
    keyFacts: [
      ...keyFacts,
      ...timeFacts,
      ...(formatDuration(avgCaseDuration)
        ? [{ label: 'Avg. case duration', value: formatDuration(avgCaseDuration) }]
        : []),
      ...(formatDuration(maxCaseDuration)
        ? [{ label: 'Longest case', value: formatDuration(maxCaseDuration) }]
        : []),
    ],
  };
};

/**
 * XML SUMMARY
 * 
 * Reads XML output file from simulation and extracts average values
 * 
 * In this part these measurements are found:
 * Total busy vs available time
 * Total resource cosst
 * Number of resource profule
 * 
 */
const buildXmlAvgSummary = (fileName, rawContent) => {
  const doc = parseXmlString(rawContent);
  if (!doc) {
    return {
      fileName,
      type: 'Simulation XML',
      keyFacts: [{ label: 'Status', value: 'Unable to parse file' }],
    };
  }

  // Reads a numeric nested XML value like:
  // resource/time/in_use/total
  const getNestedValue = (parent, tagPath) => {
    let current = parent;
    for (const tag of tagPath) {
      current = current?.getElementsByTagName(tag)?.[0] ?? null;
      if (!current) return null;
    }
    const num = Number(current.textContent);
    return Number.isFinite(num) ? num : null;
  };

  const resourceNodes = Array.from(doc.getElementsByTagName('resource'));
  const resourceCount = resourceNodes.length;
  let totalBusy = 0;
  let totalAvailable = 0;
  let totalCost = 0;


  //Aggregate metrics across all <resource> nodes.
  resourceNodes.forEach(resourceNode => {
    const inUseTotal = getNestedValue(resourceNode, ['time', 'in_use', 'total']);
    if (inUseTotal !== null) totalBusy += inUseTotal;
    const availableTotal = getNestedValue(resourceNode, ['time', 'available', 'total']);
    if (availableTotal !== null) totalAvailable += availableTotal;
    const costTotal = getNestedValue(resourceNode, ['cost', 'total']);
    if (costTotal !== null) totalCost += costTotal;
  });

  const extraRows = [
    {
      key: 'total_resource_busy_time',
      label: 'Total Resource Busy Time',
      // Percent share of busy time over total time (busy + available)
      value:
        totalBusy + totalAvailable > 0
          ? `${((totalBusy / (totalBusy + totalAvailable)) * 100).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}%`
          : '--',
    },
    {
      key: 'total_resource_available_time',
      label: 'Total Resource Available Time',
      // Percent share of available time over total time (busy + available)
      value:
        totalBusy + totalAvailable > 0
          ? `${(
              (totalAvailable / (totalBusy + totalAvailable)) *
              100
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%`
          : '--',
    },
    {
      key: 'global_utilization',
      label: 'Global Utilization (Workload)',
      value:
        totalAvailable > 0
          ? `${((totalBusy / totalAvailable) * 100).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%`
          : '--',
    },
    {
      key: 'total_resource_cost',
      label: 'Total Resource Cost',
      value: totalCost ? formatNumber(totalCost) : '--',
    },
    {
      key: 'resource_profile_count',
      label: 'Number of Resource Profiles',
      value: resourceCount ? resourceCount.toLocaleString() : '--',
    },
  ];

  const finalRows = [...extraRows];

  return {
    fileName,
    type: 'Simulation XML',
    avgMetrics: finalRows,
    keyFacts: finalRows.length
      ? [{ label: 'Avg metrics', value: finalRows.length.toLocaleString() }]
      : [{ label: 'Avg metrics', value: 'None found' }],
  };
};

const SimulationOutputSummary = ({ projectName, fileNames, filePrefix }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter file list to supported types
  // Keep names ending with .xes and .xml
  const supportedFileNames = useMemo(() => {
    if (!Array.isArray(fileNames)) {
      return [];
    }
    return fileNames.filter(fileName => hasSupportedExtension(fileName));
  }, [fileNames]);

  /**
   *  Read and summarize supported files from storage
   * 
   * This runs when:
   * - projectName changes
   * - supportedFileNames changes
   * - filePrefix changes
   * 
   */
  useEffect(() => {
    let canceled = false;
    const readFiles = async () => {
      if (!projectName || !supportedFileNames.length) {
        setSummaries([]);
        setError('');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const prefixPath = filePrefix ? `${filePrefix}/` : '';
        const fileSummaries = await Promise.all(
          supportedFileNames.map(async fileName => {
            try {
              const stored =
                (await getFile(projectName, prefixPath + fileName)) ||
                (await getFile(projectName, fileName));
              const rawContent = stored?.data;
              if (!rawContent) {
                return null;
              }
              // Decide which summary builder to use based on the file ending
              if (fileName.toLowerCase().endsWith('.xes')) {
                return buildXesSummary(fileName, rawContent);
              }
              if (fileName.toLowerCase().endsWith('.xml')) {
                return buildXmlAvgSummary(fileName, rawContent);
              }
              return null;
            } catch (err) {
              console.error('Unable to read generated file', fileName, err);
              return {
                fileName,
                type: 'Unsupported',
                keyFacts: [{ label: 'Status', value: 'Unable to read file' }],
              };
            }
          })
        );
        if (!canceled) {
          setSummaries(fileSummaries.filter(Boolean));
        }
      } catch (err) {
        console.error(err);
        if (!canceled) {
          setError('Unable to read the generated files.');
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };
    readFiles();
    return () => {
      canceled = true;
    };
  }, [projectName, supportedFileNames, filePrefix]);

  const hasSummaries = summaries.length > 0;

  // UI
  return (
    <Card
      borderRadius="3xl"
      bgGradient="linear(to-br, #0F172A, #1D4ED8)"
      color="white"
      border="none"
      boxShadow="0 24px 60px rgba(15, 23, 42, 0.35)"
      overflow="hidden"
    >
      {/* Header */}
      <CardHeader borderBottom="1px solid rgba(255, 255, 255, 0.12)">
        <Heading size="md" color="white">
          Simulation Output Summary
        </Heading>
        <Text fontSize="sm" color="whiteAlpha.800" mt={1}>
          Highlights extracted from generated XES logs and XML output files.
        </Text>
      </CardHeader>
      {/* Body */}
      <CardBody>
        {/* Loading state */}
        {loading && (
          <Flex align="center" gap={3} color="whiteAlpha.900">
            <Spinner size="sm" thickness="3px" color="white" />
            <Text fontSize="sm">Reading generated files…</Text>
          </Flex>
        )}

        {/* Empty state */}
        {!loading && !hasSummaries && (
          <Text fontSize="sm" color="whiteAlpha.800">
            Run a simulation to inspect the generated XES event logs here.
          </Text>
        )}

        {/* Error message */}
        {error && (
          <Text fontSize="sm" color="red.200" mt={2}>
            {error}
          </Text>
        )}

        {/* Summary blocks */}
        {hasSummaries && (
          <Stack spacing={5} mt={loading ? 4 : 0}>
            {summaries.map(summary => (
              <Card
                key={summary.fileName}
                borderRadius="2xl"
                bg="rgba(15, 23, 42, 0.55)"
                border="1px solid rgba(255, 255, 255, 0.08)"
                boxShadow="lg"
              >
                <CardBody>
                  <Flex
                    justify="space-between"
                    align={{ base: 'flex-start', md: 'center' }}
                    flexWrap="wrap"
                    gap={3}
                  >
                    <Heading size="sm" color="white">
                      {summary.fileName}
                    </Heading>
                    <Badge
                      colorScheme="whiteAlpha"
                      variant="subtle"
                      borderRadius="full"
                      px={4}
                      py={1}
                    >
                      {summary.type}
                    </Badge>
                  </Flex>
                  {summary.keyFacts?.length > 0 && summary.type !== 'Simulation XML' && (
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                      {summary.keyFacts.map(fact => (
                        <Box
                          key={`${summary.fileName}-${fact.label}`}
                          bg="rgba(255, 255, 255, 0.08)"
                          borderRadius="xl"
                          p={4}
                          border="1px solid rgba(255, 255, 255, 0.12)"
                          backdropFilter="blur(6px)"
                        >
                          <Text
                            fontSize="xs"
                            color="whiteAlpha.700"
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                          >
                            {fact.label}
                          </Text>
                          <Text fontSize="xl" fontWeight="700" color="white" mt={2}>
                            {fact.value || '—'}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}

                  {summary.avgMetrics?.length > 0 && (
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                      {summary.avgMetrics.map(row => (
                        <Box
                          key={row.key}
                          bg="rgba(255, 255, 255, 0.08)"
                          borderRadius="xl"
                          p={4}
                          border="1px solid rgba(255, 255, 255, 0.12)"
                          backdropFilter="blur(6px)"
                        >
                          <Text
                            fontSize="xs"
                            color="whiteAlpha.700"
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                          >
                            {row.label}
                          </Text>
                          <Text fontSize="xl" fontWeight="700" color="white" mt={2}>
                            {row.value || '—'}
                          </Text>
                          {row.detail && (
                            <Text fontSize="xs" color="whiteAlpha.700" mt={2}>
                              {row.detail}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </CardBody>
              </Card>
            ))}
          </Stack>
        )}
      </CardBody>
    </Card>
  );
};

export default SimulationOutputSummary;

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

const hasSupportedExtension = fileName =>
  fileName.toLowerCase().endsWith(XES_EXTENSION);

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

const formatDate = value => {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime()) ? date.toLocaleString() : null;
};

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
  units.forEach(unit => {
    if (remaining >= unit.value) {
      const qty = Math.floor(remaining / unit.value);
      parts.push(`${qty}${unit.label}`);
      remaining -= qty * unit.value;
    }
  });
  return parts.slice(0, 3).join(' ');
};

const getAttributeValue = (nodes, key, type = 'string') => {
  const node = nodes.find(element => element.getAttribute('key') === key);
  if (!node) return null;
  if (type === 'date') {
    return node.getAttribute('value');
  }
  return node.getAttribute('value');
};

const buildXesSummary = (fileName, rawContent) => {
  const doc = parseXmlString(rawContent);
  if (!doc) {
    return {
      fileName,
      type: 'XES Event Log',
      keyFacts: [{ label: 'Status', value: 'Unable to parse file' }],
    };
  }

  const traceNodes = Array.from(doc.getElementsByTagName('trace'));
  const traces = traceNodes.length;
  const activities = new Set();
  const resources = new Set();
  const timestamps = [];
  const caseDurations = [];
  let totalEvents = 0;

  traceNodes.forEach(traceNode => {
    const eventNodes = Array.from(traceNode.getElementsByTagName('event'));
    totalEvents += eventNodes.length;
    const traceTimestamps = [];
    eventNodes.forEach(eventNode => {
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
    if (traceTimestamps.length) {
      const duration = Math.max(...traceTimestamps) - Math.min(...traceTimestamps);
      caseDurations.push(duration);
    }
  });

  const events = totalEvents;
  const firstEvent = timestamps.length ? new Date(Math.min(...timestamps)) : null;
  const lastEvent = timestamps.length ? new Date(Math.max(...timestamps)) : null;
  const avgEventsPerTrace = traces ? (events / traces).toFixed(1) : '0';
  const avgCaseDuration =
    caseDurations.length > 0
      ? caseDurations.reduce((sum, value) => sum + value, 0) / caseDurations.length
      : null;
  const maxCaseDuration =
    caseDurations.length > 0 ? Math.max(...caseDurations) : null;

  const keyFacts = [
    { label: 'Traces', value: traces ? traces.toLocaleString() : '0' },
    { label: 'Events', value: events ? events.toLocaleString() : '0' },
    { label: 'Unique activities', value: activities.size.toLocaleString() },
    { label: 'Unique resources', value: resources.size.toLocaleString() },
    { label: 'Avg. events / trace', value: avgEventsPerTrace },
  ];

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

const SimulationOutputSummary = ({ projectName, fileNames, filePrefix }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supportedFileNames = useMemo(() => {
    if (!Array.isArray(fileNames)) {
      return [];
    }
    return fileNames.filter(fileName => hasSupportedExtension(fileName));
  }, [fileNames]);

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
              if (fileName.toLowerCase().endsWith('.xes')) {
                return buildXesSummary(fileName, rawContent);
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

  return (
    <Card
      borderRadius="3xl"
      bgGradient="linear(to-br, #0F172A, #1D4ED8)"
      color="white"
      border="none"
      boxShadow="0 24px 60px rgba(15, 23, 42, 0.35)"
      overflow="hidden"
    >
      <CardHeader borderBottom="1px solid rgba(255, 255, 255, 0.12)">
        <Heading size="md" color="white">
          Simulation Event Log Statistics
        </Heading>
        <Text fontSize="sm" color="whiteAlpha.800" mt={1}>
          Highlights extracted from the generated XES event logs.
        </Text>
      </CardHeader>
      <CardBody>
        {loading && (
          <Flex align="center" gap={3} color="whiteAlpha.900">
            <Spinner size="sm" thickness="3px" color="white" />
            <Text fontSize="sm">Reading generated files…</Text>
          </Flex>
        )}

        {!loading && !hasSummaries && (
          <Text fontSize="sm" color="whiteAlpha.800">
            Run a simulation to inspect the generated XES event logs here.
          </Text>
        )}

        {error && (
          <Text fontSize="sm" color="red.200" mt={2}>
            {error}
          </Text>
        )}

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

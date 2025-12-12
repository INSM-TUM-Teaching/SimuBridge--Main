import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiSettings,
  FiTarget,
  FiLayers,
  FiClock,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import { getSensitivityResults } from '../../util/sensitivityService';

const KPI_OPTIONS = [
  { label: 'Avg. cycle time', value: 'average_cycle_time' },
  { label: 'Throughput', value: 'throughput' },
  { label: 'Waiting time', value: 'waiting_time' },
];

const METHOD_OPTIONS = [
  { label: 'Sobol', value: 'sobol' },
  { label: 'Morris', value: 'morris' },
];

const VIEW_OPTIONS = [
  { label: 'Groups', value: 'group' },
  { label: 'Parameters', value: 'parameter' },
];

const SCENARIO_OPTIONS = [
  { label: 'Base scenario', value: 'base' },
  { label: 'Scenario A – extra resource', value: 'scenario_a' },
];

const formatPercent = value => `${Math.round(value * 100)}%`;

const SensitivityBarChart = ({ data = [], method, loading, inactive }) => {
  const maxScore = Math.max(...data.map(item => item.score), 0.01);
  const barColor = method === 'morris' ? '#0f766e' : '#2563EB';
  const uncertaintyColor = method === 'morris' ? 'teal.100' : 'blue.100';

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="260px" direction="column" gap={3}>
        <Spinner size="lg" color="blue.500" />
        <Text fontWeight="600" color="gray.700">
          Running analysis...
        </Text>
      </Flex>
    );
  }

  if (inactive) {
    return (
      <Flex align="center" justify="center" minH="260px" direction="column" gap={2}>
        <Icon as={FiActivity} boxSize={8} color="gray.400" />
        <Text color="gray.600" fontWeight="600">
          Run analysis to view results.
        </Text>
      </Flex>
    );
  }

  if (!data.length) {
    return (
      <Flex align="center" justify="center" minH="260px" direction="column" gap={2}>
        <Icon as={FiActivity} boxSize={8} color="gray.400" />
        <Text color="gray.600" fontWeight="600">
          No results yet. Adjust filters to start.
        </Text>
      </Flex>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {data.map(item => {
        const scoreWidth = Math.max((item.score / maxScore) * 100, 2);
        const uncertaintyWidth = Math.min((item.score + item.uncertainty) / maxScore, 1) * 100;
        return (
          <Box key={item.name} p={3} border="1px solid" borderColor="gray.100" borderRadius="lg" bg="white">
            <HStack justify="space-between" mb={2} align="flex-start" spacing={3}>
              <Text fontWeight="600" color="gray.800" flex="1">
                {item.name}
              </Text>
              <HStack spacing={3} flexShrink={0}>
                <Text fontSize="sm" color="gray.600">
                  {method === 'morris' ? 'Mean' : 'Total effect'}
                </Text>
                <Text fontWeight="700" color={barColor}>
                  {formatPercent(item.score)}
                </Text>
              </HStack>
            </HStack>
            <Box position="relative" w="100%" h="14px" bg="gray.50" borderRadius="full" overflow="hidden">
              <Box
                position="absolute"
                top="0"
                left="0"
                h="100%"
                w={`${uncertaintyWidth}%`}
                bg={uncertaintyColor}
                opacity={0.8}
              />
              <Box
                position="absolute"
                top="0"
                left="0"
                h="100%"
                w={`${scoreWidth}%`}
                bg={barColor}
                borderRadius="full"
              />
            </Box>
            <HStack justify="space-between" mt={2} color="gray.600" fontSize="sm">
              <HStack spacing={3}>
                <Badge colorScheme={method === 'morris' ? 'teal' : 'blue'} variant="subtle">
                  {method === 'morris' ? 'Mean' : 'Total'}: {formatPercent(item.score)}
                </Badge>
                {item.secondary !== undefined && (
                  <Badge colorScheme="purple" variant="subtle">
                    {method === 'morris' ? 'Sigma' : 'First-order'}: {formatPercent(item.secondary)}
                  </Badge>
                )}
              </HStack>
              <Badge colorScheme="orange" variant="subtle">
                Uncertainty: {formatPercent(item.uncertainty)}
              </Badge>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
};

const SensitivityAnalysisPage = ({ getData, projectName, toasting }) => {
  const currentScenarioName = getData?.()?.getCurrentScenario?.()?.scenarioName;
  const scenarioOptions = useMemo(() => {
    const data = getData?.();
    const options = [...SCENARIO_OPTIONS];
    if (data?.getAllScenarios) {
      data
        .getAllScenarios()
        .map(s => s.scenarioName)
        .forEach(name => {
          if (name && !options.find(option => option.value === name)) {
            options.push({ label: name, value: name });
          }
        });
    }
    return options;
  }, [getData]);

  const [kpi, setKpi] = useState(KPI_OPTIONS[0].value);
  const [method, setMethod] = useState(METHOD_OPTIONS[0].value);
  const [view, setView] = useState(VIEW_OPTIONS[0].value);
  const [scenario, setScenario] = useState(currentScenarioName || SCENARIO_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState();
  const [activeRunId, setActiveRunId] = useState(null);
  const [activeRunName, setActiveRunName] = useState('');
  const [sortState, setSortState] = useState({ key: 'muStar', dir: 'desc' });
  const [dirty, setDirty] = useState(false);
  const storageKey = useMemo(
    () => `${projectName || 'default'}/sensitivity_runs`,
    [projectName]
  );
  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (currentScenarioName && currentScenarioName !== scenario) {
      setScenario(currentScenarioName);
    }
  }, [currentScenarioName, scenario]);

  useEffect(() => {
    setSortState(
      method === 'morris'
        ? { key: 'muStar', dir: 'desc' }
        : { key: 'st', dir: 'desc' }
    );
  }, [method]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(savedAnalyses));
    } catch (e) {
      console.warn('Unable to persist sensitivity runs', e);
    }
  }, [storageKey, savedAnalyses]);

  const summaryTokens = useMemo(() => {
    const methodLabel = METHOD_OPTIONS.find(opt => opt.value === method)?.label || '—';
    const kpiLabel = KPI_OPTIONS.find(opt => opt.value === kpi)?.label || '—';
    const groupsLabel = result?.groups ?? '—';
    const runsLabel = result?.runs ?? '—';
    return [
      { label: 'Method', value: methodLabel },
      { label: 'KPI', value: kpiLabel },
      { label: 'Groups', value: groupsLabel },
      { label: 'Runs', value: runsLabel },
    ];
  }, [method, kpi, result]);

  const summaryIconMap = {
    Method: FiSettings,
    KPI: FiTarget,
    Groups: FiLayers,
    Runs: FiClock,
  };

  const detailConfig =
    method === 'morris'
      ? {
          headers: [
            { key: 'name', label: 'Name', numeric: false },
            { key: 'cases', label: 'Cases', numeric: true },
            { key: 'muStar', label: 'mu*', numeric: true, highlight: true },
            { key: 'muStarConf', label: 'mu* conf', numeric: true },
            { key: 'muStarRel', label: 'Rel CI of μ', numeric: true, isPercent: true },
          ],
          rows: dirty
            ? []
            : (result?.results || []).map(row => ({
                key: row.name,
                name: row.name,
                cases: row.cases ?? 0,
                muStar: row.score ?? 0,
                muStarConf: row.uncertainty ?? 0,
                muStarRel: Math.max(0, (row.uncertainty || 0) * 1.2),
              })),
          defaultSort: 'muStar',
        }
      : {
          headers: [
            { key: 'name', label: 'Group', numeric: false },
            { key: 'cases', label: 'Cases', numeric: true },
            { key: 's1', label: 'S1', numeric: true, highlight: true },
            { key: 's1Conf', label: 'S1 conf', numeric: true },
            { key: 'st', label: 'ST', numeric: true },
            { key: 'stConf', label: 'ST conf', numeric: true },
          ],
          rows: dirty
            ? []
            : (result?.results || []).map(row => ({
                key: row.name,
                name: row.name,
                cases: row.cases ?? 0,
                s1: row.secondary ?? 0,
                s1Conf: (row.uncertainty || 0) * 0.7,
                st: row.score ?? 0,
                stConf: row.uncertainty ?? 0,
              })),
          defaultSort: 'st',
        };

  const sortedDetailRows = useMemo(() => {
    if (!detailConfig.rows) return [];
    const { key, dir } = sortState;
    const sorted = [...detailConfig.rows].sort((a, b) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      if (typeof av === 'string' || typeof bv === 'string') {
        return dir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      return dir === 'asc' ? av - bv : bv - av;
    });
    return sorted;
  }, [detailConfig.rows, sortState]);

  const runAnalysis = async () => {
    const name = window.prompt('Name this analysis run');
    if (!name) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await getSensitivityResults({ kpi, method, scenario, view });
      setResult(res);
      const entry = {
        id: Date.now(),
        name,
        params: { kpi, method, scenario, view },
        result: res,
      };
      setActiveRunId(entry.id);
      setActiveRunName(entry.name);
      setSavedAnalyses(prev => [entry, ...prev].slice(0, 20));
      setDirty(false);
      toasting?.('success', 'Run complete', 'Sensitivity analysis finished');
      setSortState(method === 'morris' ? { key: 'muStar', dir: 'desc' } : { key: 'st', dir: 'desc' });
    } catch (e) {
      console.error(e);
      toasting?.('error', 'Run failed', 'Unable to run sensitivity analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = entry => {
    if (!entry) return;
    setResult(entry.result);
    setActiveRunId(entry.id);
    setActiveRunName(entry.name);
    setDirty(false);
    toasting?.('info', 'Loaded', `Loaded analysis "${entry.name}"`);
  };

  return (
    <Box
      minH="93vh"
      overflowY="auto"
      bgGradient="linear(to-br, #F6FAFF, #EEF2FF)"
      px={{ base: 4, md: 8 }}
      py={{ base: 2, md: 3 }}
    >
      <Stack spacing={4} maxW={{ base: '100%', xl: 'clamp(1200px, calc(100vw - var(--sb-width, 80px) - 64px), 1440px)' }} mx="auto">
        <Card
          borderRadius="3xl"
          bgGradient="linear(to-r, #0F172A, #1D4ED8)"
          color="white"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.25)"
          border="none"
        >
          <CardBody>
            <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={4} direction={{ base: 'column', md: 'row' }}>
              <Box>
                <Heading size="lg" mb={2}>
                  Sensitivity Analysis
                </Heading>
                <Text color="whiteAlpha.800" maxW="3xl">
                  See which parameters move your KPIs the most and where uncertainty remains.
                </Text>
              </Box>
            </Flex>
            <Box mt={5}>
              <Text fontSize="xs" color="whiteAlpha.800" mb={2} fontWeight="800" letterSpacing="0.12em">
                CURRENT OVERVIEW
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={3}>
                {[
                  {
                    key: 'active',
                    label: 'Active analysis',
                    value: activeRunName || '—',
                    icon: FiActivity,
                    highlight: Boolean(activeRunName),
                  },
                  ...summaryTokens.map(token => ({
                    key: token.label,
                    label: token.label,
                    value: token.value,
                    icon: summaryIconMap[token.label] || FiActivity,
                    highlight: false,
                  })),
                ].map(item => (
                  <Box
                    key={item.key}
                    bg="rgba(255,255,255,0.12)"
                    borderRadius="xl"
                    p={4}
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <HStack justify="space-between" mb={3}>
                      <Text fontSize="xs" letterSpacing="0.18em" color="whiteAlpha.700">
                        {item.label}
                      </Text>
                      <Icon as={item.icon} boxSize={4} color="whiteAlpha.800" />
                    </HStack>
                    <Text fontSize="xl" fontWeight="800" color="white" noOfLines={1}>
                      {item.value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </CardBody>
        </Card>

        <Card borderRadius="2xl" border="1px solid rgba(15, 23, 42, 0.08)" boxShadow="lg" bg="white">
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Configure analysis
            </Heading>
          </CardHeader>
          <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                    Method
                  </Text>
                <ButtonGroup isAttached variant="outline" w="full">
                  {METHOD_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      flex="1"
                      colorScheme={method === opt.value ? 'blue' : 'gray'}
                      variant={method === opt.value ? 'solid' : 'outline'}
                      onClick={() => {
                        setMethod(opt.value);
                        setDirty(true);
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                  KPI
                </Text>
                <Select
                  value={kpi}
                  onChange={e => {
                    setKpi(e.target.value);
                    setDirty(true);
                  }}
                  bg="gray.50"
                >
                  {KPI_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                  Scenario
                </Text>
                <Select
                  value={scenario}
                  onChange={e => {
                    setScenario(e.target.value);
                    setDirty(true);
                  }}
                  bg="gray.50"
                >
                  {scenarioOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                  View
                </Text>
                <ButtonGroup isAttached variant="outline" w="full">
                  {VIEW_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      flex="1"
                      colorScheme={view === opt.value ? 'blue' : 'gray'}
                      variant={view === opt.value ? 'solid' : 'outline'}
                      onClick={() => {
                        setView(opt.value);
                        setDirty(true);
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>
            </SimpleGrid>
            <Flex justify="space-between" align="center" mt={4} gap={3} wrap="wrap">
            <HStack spacing={2} flex="1" minW={{ base: '100%', md: '50%' }}>
              <Text fontSize="sm" color="gray.600" fontWeight="700" whiteSpace="nowrap">
                Available Analysis
              </Text>
                <Select
                  placeholder="Select saved run"
                  value={activeRunId || ''}
                  onChange={e => {
                    const entry = savedAnalyses.find(run => String(run.id) === e.target.value);
                    if (entry) {
                      setActiveRunId(entry.id);
                      setActiveRunName(entry.name);
                      setResult(entry.result);
                      setMethod(entry.params.method);
                      setKpi(entry.params.kpi);
                      setScenario(entry.params.scenario);
                      setView(entry.params.view);
                      setDirty(false);
                      setSortState(
                        entry.params.method === 'morris'
                          ? { key: 'muStar', dir: 'desc' }
                          : { key: 'st', dir: 'desc' }
                      );
                      toasting?.('info', 'Loaded', `Loaded analysis "${entry.name}"`);
                    }
                  }}
                  bg="gray.50"
                  flex="1"
                >
                  {savedAnalyses.map(entry => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </Select>
            </HStack>
            <Button colorScheme="blue" onClick={runAnalysis} isLoading={loading}>
              Run analysis
            </Button>
            </Flex>
          </CardBody>
        </Card>

        <Card borderRadius="2xl" border="1px solid rgba(15, 23, 42, 0.08)" boxShadow="md" bg="white">
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Parameter importance
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Bars show {method === 'morris' ? 'local mean effects (mu*) with interaction (sigma)' : 'global total-effect and first-order indices'}.
            </Text>
          </CardHeader>
          <CardBody>
            <SensitivityBarChart
              data={dirty ? [] : result?.results}
              method={method}
              loading={loading}
              inactive={dirty || !result}
            />
          </CardBody>
        </Card>

        <Card borderRadius="2xl" border="1px solid rgba(15, 23, 42, 0.08)" boxShadow="md" bg="white" mb={6}>
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Details
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Review the scores and uncertainty for each parameter or group.
            </Text>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table
                size="sm"
                variant="simple"
                borderRadius="lg"
                overflow="hidden"
                border="1px solid"
                borderColor="gray.100"
              >
                <Thead>
                  <Tr>
                    {detailConfig.headers.map(header => {
                      const isActive = sortState.key === header.key;
                      return (
                        <Th
                          key={header.key}
                          textAlign={header.numeric ? 'right' : 'left'}
                          bg="gray.50"
                          borderColor="gray.100"
                          py={3}
                          px={3}
                          cursor="pointer"
                          onClick={() =>
                            setSortState(prev =>
                              prev.key === header.key
                                ? { key: header.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                : { key: header.key, dir: 'desc' }
                            )
                          }
                        >
                          <HStack
                            justify={header.numeric ? 'flex-end' : 'flex-start'}
                            spacing={2}
                            color={isActive ? 'blue.600' : 'gray.700'}
                          >
                            <Text fontSize="sm" fontWeight="700">
                              {header.label}
                            </Text>
                            <Icon as={sortState.dir === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
                          </HStack>
                        </Th>
                      );
                    })}
                  </Tr>
                </Thead>
                <Tbody>
                  {loading && (
                    <Tr>
                      <Td colSpan={detailConfig.headers.length}>
                        <Flex align="center" gap={2}>
                          <Spinner size="sm" />
                          <Text fontSize="sm" color="gray.600">
                            Loading results...
                          </Text>
                        </Flex>
                      </Td>
                    </Tr>
                  )}
                  {!loading && detailConfig.rows.length === 0 && (
                    <Tr>
                      <Td colSpan={detailConfig.headers.length}>
                        <Text fontSize="sm" color="gray.600">
                          No results to display. Adjust configuration above to refresh.
                        </Text>
                      </Td>
                    </Tr>
                  )}
                    {!loading &&
                    sortedDetailRows.map(row => (
                      <Tr
                        key={row.key}
                        _hover={{ bg: 'gray.50' }}
                        transition="background 0.15s ease"
                        borderBottom="1px solid"
                        borderColor="gray.100"
                        _last={{ borderBottom: 'none' }}
                      >
                        {detailConfig.headers.map((header, idx) => {
                          const raw = row[header.key];
                          const display =
                            header.isPercent && typeof raw === 'number'
                              ? formatPercent(raw)
                              : typeof raw === 'number'
                              ? raw.toFixed(6)
                              : raw;
                          return (
                            <Td
                              key={header.key}
                              fontWeight={idx === 0 ? '700' : '500'}
                              color={idx === 0 ? 'gray.800' : 'gray.700'}
                              textAlign={header.numeric ? 'right' : 'left'}
                              bg={header.highlight ? 'blue.50' : 'transparent'}
                              py={3}
                              px={3}
                            >
                              {header.numeric && typeof raw === 'number' && header.key === 'cases'
                                ? raw.toLocaleString()
                                : display}
                            </Td>
                          );
                        })}
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </Stack>
    </Box>
  );
};

export default SensitivityAnalysisPage;

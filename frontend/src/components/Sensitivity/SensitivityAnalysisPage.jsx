import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  FiTrash2,
} from 'react-icons/fi';
import { getSensitivityResults } from '../../util/sensitivityService';
import SensitivityStackedChart from './SensitivityStackedChart';

const KPI_OPTIONS = [
  { label: 'Avg. cycle time', value: 'average_cycle_time' },
  { label: 'Throughput', value: 'throughput' },
  { label: 'Waiting time', value: 'waiting_time' },
];

const METHOD_OPTIONS = [
  { label: 'Sobol', value: 'sobol' },
  { label: 'Morris', value: 'morris' },
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
      <Flex
        align="center"
        justify="center"
        minH="260px"
        direction="column"
        gap={3}
      >
        <Spinner size="lg" color="blue.500" />
        <Text fontWeight="600" color="gray.700">
          Running analysis...
        </Text>
      </Flex>
    );
  }

  if (inactive) {
    return (
      <Flex
        align="center"
        justify="center"
        minH="260px"
        direction="column"
        gap={2}
      >
        <Icon as={FiActivity} boxSize={8} color="gray.400" />
        <Text color="gray.600" fontWeight="600">
          Run analysis to view results.
        </Text>
      </Flex>
    );
  }

  if (!data.length) {
    return (
      <Flex
        align="center"
        justify="center"
        minH="260px"
        direction="column"
        gap={2}
      >
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
        const uncertaintyWidth =
          Math.min((item.score + item.uncertainty) / maxScore, 1) * 100;
        return (
          <Box
            key={item.name}
            p={3}
            border="1px solid"
            borderColor="gray.100"
            borderRadius="lg"
            bg="white"
          >
            <HStack
              justify="space-between"
              mb={2}
              align="flex-start"
              spacing={3}
            >
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
            <Box
              position="relative"
              w="100%"
              h="14px"
              bg="gray.50"
              borderRadius="full"
              overflow="hidden"
            >
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
            <HStack
              justify="space-between"
              mt={2}
              color="gray.600"
              fontSize="sm"
            >
              <HStack spacing={3}>
                <Badge
                  colorScheme={method === 'morris' ? 'teal' : 'blue'}
                  variant="subtle"
                >
                  {method === 'morris' ? 'Mean' : 'Total'}:{' '}
                  {formatPercent(item.score)}
                </Badge>
                {item.secondary !== undefined && (
                  <Badge colorScheme="purple" variant="subtle">
                    {method === 'morris' ? 'Sigma' : 'First-order'}:{' '}
                    {formatPercent(item.secondary)}
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
  const [scenario, setScenario] = useState(
    currentScenarioName || SCENARIO_OPTIONS[0].value
  );
  const [scenarioLocked, setScenarioLocked] = useState(false);
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
  const [showOverview, setShowOverview] = useState(true);
  const [showSavedTable, setShowSavedTable] = useState(true);
  const [interactionSort, setInteractionSort] = useState({
    key: 's2',
    dir: 'desc',
  });
  const [runName, setRunName] = useState('');
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const getOptionLabel = (options, value) =>
    options.find(opt => opt.value === value)?.label || value;
  const formatRunTime = timestamp =>
    timestamp ? new Date(timestamp).toLocaleString() : '—';

  useEffect(() => {
    if (!scenarioLocked && currentScenarioName && currentScenarioName !== scenario) {
      setScenario(currentScenarioName);
    }
  }, [currentScenarioName, scenario, scenarioLocked]);

  useEffect(() => {
    setSortState(
      method === 'morris'
        ? { key: 'muStar', dir: 'desc' }
        : { key: 'st', dir: 'desc' }
    );
    if (method === 'sobol') {
      setInteractionSort({ key: 's2', dir: 'desc' });
    }
  }, [method]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(savedAnalyses));
    } catch (e) {
      console.warn('Unable to persist sensitivity runs', e);
    }
  }, [storageKey, savedAnalyses]);

  const summaryTokens = useMemo(() => {
    const methodLabel =
      METHOD_OPTIONS.find(opt => opt.value === method)?.label || '—';
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

  const sobolMainConfig = useMemo(
    () => ({
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
            s1Conf: row.firstOrderConf ?? (row.uncertainty || 0) * 0.7,
            st: row.score ?? 0,
            stConf: row.uncertainty ?? 0,
          })),
      defaultSort: 'st',
    }),
    [dirty, result]
  );

  const sobolInteractionRows = useMemo(() => {
    if (dirty) return [];
    if (Array.isArray(result?.interactions) && result.interactions.length) {
      return [...result.interactions].map((item, idx) => ({
        key: `${item.groupI}-${item.groupJ}-${idx}`,
        ...item,
      }));
    }
    return [];
  }, [dirty, result]);

  const sobolInteractionHeaders = [
    { key: 'groupI', label: 'Group i', numeric: false },
    { key: 'groupJ', label: 'Group j', numeric: false },
    { key: 's2', label: 'S2', numeric: true, highlight: true },
    { key: 's2Conf', label: 'S2 conf', numeric: true },
    { key: 'cases', label: 'Cases', numeric: true },
  ];

  const sortedInteractionRows = useMemo(() => {
    if (!sobolInteractionRows.length) return [];
    const { key, dir } = interactionSort;
    const sorted = [...sobolInteractionRows].sort((a, b) => {
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
  }, [interactionSort, sobolInteractionRows]);

  const morrisConfig = useMemo(
    () => ({
      headers: [
        { key: 'name', label: 'Name', numeric: false },
        { key: 'cases', label: 'Cases', numeric: true },
        { key: 'muStar', label: 'mu*', numeric: true, highlight: true },
        { key: 'muStarConf', label: 'mu* conf', numeric: true },
        {
          key: 'muStarRel',
          label: 'Rel CI of μ',
          numeric: true,
          isPercent: true,
        },
      ],
      rows: dirty
        ? []
        : (result?.results || []).map(row => ({
            key: row.name,
            name: row.name,
            cases: row.cases ?? 0,
            muStar: row.score ?? 0,
            muStarConf: row.uncertainty ?? 0,
            muStarRel:
              typeof row.relCi === 'number'
                ? row.relCi
                : Math.max(0, (row.uncertainty || 0) * 1.2),
          })),
      defaultSort: 'muStar',
    }),
    [dirty, result]
  );

  const sortedMainRows = useMemo(() => {
    const activeRows = method === 'morris' ? morrisConfig.rows : sobolMainConfig.rows;
    if (!activeRows) return [];
    const { key, dir } = sortState;
    const sorted = [...activeRows].sort((a, b) => {
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
  }, [morrisConfig.rows, sobolMainConfig.rows, sortState, method]);

  const runAnalysis = async name => {
    if (!name) return;
    setLoading(true);
    setResult(null);
    setIsRunModalOpen(false);
    try {
      const res = await getSensitivityResults({ kpi, method, scenario });
      const timestamp = Date.now();
      setResult(res);
      const entry = {
        id: timestamp,
        name,
        params: { kpi, method, scenario },
        result: res,
        runAt: timestamp,
      };
      setActiveRunId(entry.id);
      setActiveRunName(entry.name);
      setSavedAnalyses(prev => [entry, ...prev].slice(0, 20));
      setDirty(false);
      toasting?.('success', 'Run complete', 'Sensitivity analysis finished');
      setSortState(
        method === 'morris'
          ? { key: 'muStar', dir: 'desc' }
          : { key: 'st', dir: 'desc' }
      );
    } catch (e) {
      console.error(e);
      toasting?.('error', 'Run failed', 'Unable to run sensitivity analysis');
    } finally {
      setLoading(false);
      setRunName('');
    }
  };

  const loadAnalysis = entry => {
    if (!entry) return;
    setResult(entry.result);
    setActiveRunId(entry.id);
    setActiveRunName(entry.name);
    setMethod(entry.params.method);
    setKpi(entry.params.kpi);
    setScenario(entry.params.scenario);
    setScenarioLocked(true);
    setSortState(
      entry.params.method === 'morris'
        ? { key: 'muStar', dir: 'desc' }
        : { key: 'st', dir: 'desc' }
    );
    setInteractionSort({ key: 's2', dir: 'desc' });
    setDirty(false);
    toasting?.('info', 'Loaded', `Loaded analysis "${entry.name}"`);
  };

  const deleteAnalysis = entry => {
    if (!entry) return;
    setSavedAnalyses(prev => prev.filter(run => run.id !== entry.id));
    if (activeRunId === entry.id) {
      setActiveRunId(null);
      setActiveRunName('');
      setResult(null);
      setDirty(false);
    }
    toasting?.('info', 'Deleted', `Removed analysis "${entry.name}"`);
  };

  return (
    <Box
      minH="93vh"
      overflowY="auto"
      bgGradient="linear(to-br, #F6FAFF, #EEF2FF)"
      px={{ base: 4, md: 8 }}
      py={{ base: 2, md: 3 }}
    >
      <Stack
        spacing={4}
        maxW={{
          base: '100%',
          xl: 'clamp(1200px, calc(100vw - var(--sb-width, 80px) - 64px), 1440px)',
        }}
        mx="auto"
      >
        <Card
          borderRadius="3xl"
          bgGradient="linear(to-r, #0F172A, #1D4ED8)"
          color="white"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.25)"
          border="none"
        >
          <CardBody>
            <Flex
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
              gap={4}
              direction={{ base: 'column', md: 'row' }}
            >
              <Box>
                <Heading size="lg" mb={2}>
                  Sensitivity Analysis
                </Heading>
                <Text color="whiteAlpha.800" maxW="3xl">
                  See which parameters move your KPIs the most and where
                  uncertainty remains.
                </Text>
              </Box>
              <IconButton
                aria-label={showOverview ? 'Hide current overview' : 'Show current overview'}
                icon={showOverview ? <FiChevronUp /> : <FiChevronDown />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                alignSelf={{ base: 'flex-start', md: 'center' }}
                onClick={() => setShowOverview(prev => !prev)}
              />
            </Flex>
            <Collapse in={showOverview} animateOpacity>
              <Box mt={5}>
                <Text
                  fontSize="xs"
                  color="whiteAlpha.800"
                  mb={2}
                  fontWeight="800"
                  letterSpacing="0.12em"
                >
                  CURRENT OVERVIEW
                </Text>
                <SimpleGrid
                  columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                  spacing={3}
                >
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
                        <Text
                          fontSize="xs"
                          letterSpacing="0.18em"
                          color="whiteAlpha.700"
                        >
                          {item.label}
                        </Text>
                        <Icon
                          as={item.icon}
                          boxSize={4}
                          color="whiteAlpha.800"
                        />
                      </HStack>
                      <Text
                        fontSize="xl"
                        fontWeight="800"
                        color="white"
                        noOfLines={1}
                      >
                        {item.value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Collapse>
          </CardBody>
        </Card>

        <Card
          borderRadius="2xl"
          border="1px solid rgba(15, 23, 42, 0.08)"
          boxShadow="lg"
          bg="white"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Configure analysis
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={4}>
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
                    setScenarioLocked(true);
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
              <Flex align="flex-end">
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    setRunName('');
                    setIsRunModalOpen(true);
                  }}
                  isLoading={loading}
                  w="full"
                >
                  Run analysis
                </Button>
              </Flex>
            </SimpleGrid>
            <Box mt={6}>
              <Flex justify="space-between" align="center" mb={3} gap={2}>
                <Box>
                  <Heading size="sm" color="#0F172A" mb={1}>
                    Available analyses
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    Review previous runs and reload them to compare configurations.
                  </Text>
                </Box>
                <IconButton
                  aria-label={showSavedTable ? 'Hide saved analyses' : 'Show saved analyses'}
                  icon={showSavedTable ? <FiChevronUp /> : <FiChevronDown />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSavedTable(prev => !prev)}
                />
              </Flex>
              <Collapse in={showSavedTable} animateOpacity>
                <Box overflowX="auto" mt={2}>
                  <Table
                    size="sm"
                    variant="simple"
                    borderRadius="lg"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Thead>
                      <Tr bg="gray.50">
                        <Th py={3} px={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            Name
                          </Text>
                        </Th>
                        <Th py={3} px={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            Method
                          </Text>
                        </Th>
                        <Th py={3} px={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            KPI
                          </Text>
                        </Th>
                        <Th py={3} px={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            Scenario
                          </Text>
                        </Th>
                        <Th py={3} px={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            Last run
                          </Text>
                        </Th>
                        <Th textAlign="right" py={3} px={3}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            Action
                          </Text>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {savedAnalyses.length === 0 && (
                        <Tr>
                          <Td colSpan={6}>
                            <Text fontSize="sm" color="gray.600">
                              No saved analyses yet. Run a new analysis to see it
                              listed here.
                            </Text>
                          </Td>
                        </Tr>
                      )}
                      {savedAnalyses.map(entry => (
                        <Tr key={entry.id} _hover={{ bg: 'gray.50' }}>
                          <Td fontWeight="700" color="gray.800">
                            {entry.name}
                          </Td>
                          <Td>{getOptionLabel(METHOD_OPTIONS, entry.params.method)}</Td>
                          <Td>{getOptionLabel(KPI_OPTIONS, entry.params.kpi)}</Td>
                          <Td>{getOptionLabel(scenarioOptions, entry.params.scenario)}</Td>
                          <Td>{formatRunTime(entry.runAt || entry.id)}</Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={2}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadAnalysis(entry)}
                              >
                                Load
                              </Button>
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="Delete analysis"
                                icon={<FiTrash2 />}
                                onClick={() => deleteAnalysis(entry)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </Box>
              </Collapse>
            </Box>
          </CardBody>
        </Card>

        <Card
          borderRadius="2xl"
          border="1px solid rgba(15, 23, 42, 0.08)"
          boxShadow="md"
          bg="white"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Parameter importance
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Bars show{' '}
              {method === 'morris'
                ? 'local mean effects (mu*) with interaction (sigma)'
                : 'global total-effect and first-order indices'}
              .
            </Text>
          </CardHeader>
          {/* <CardBody>
            <SensitivityBarChart
              data={dirty ? [] : result?.results}
              method={method}
              loading={loading}
              inactive={dirty || !result}
            />
          </CardBody> */}
          <CardBody>
            <SensitivityStackedChart
              data={dirty ? [] : result?.results}
              method={method}
              loading={loading}
              inactive={dirty || !result}
            />
          </CardBody>
        </Card>

        <Card
          borderRadius="2xl"
          border="1px solid rgba(15, 23, 42, 0.08)"
          boxShadow="md"
          bg="white"
          mb={6}
        >
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Details
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Review the scores and uncertainty for each input factor.
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
                    {(method === 'morris' ? morrisConfig.headers : sobolMainConfig.headers).map(header => {
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
                                ? {
                                    key: header.key,
                                    dir: prev.dir === 'asc' ? 'desc' : 'asc',
                                  }
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
                            <Icon
                              as={
                                sortState.dir === 'asc'
                                  ? FiChevronUp
                                  : FiChevronDown
                              }
                              boxSize={4}
                            />
                          </HStack>
                        </Th>
                      );
                    })}
                  </Tr>
                </Thead>
                <Tbody>
                  {loading && (
                    <Tr>
                      <Td
                        colSpan={
                          (method === 'morris'
                            ? morrisConfig.headers
                            : sobolMainConfig.headers
                          ).length
                        }
                      >
                        <Flex align="center" gap={2}>
                          <Spinner size="sm" />
                          <Text fontSize="sm" color="gray.600">
                            Loading results...
                          </Text>
                        </Flex>
                      </Td>
                    </Tr>
                  )}
                  {!loading &&
                    (method === 'morris'
                      ? morrisConfig.rows.length === 0
                      : sobolMainConfig.rows.length === 0) && (
                    <Tr>
                      <Td
                        colSpan={
                          (method === 'morris'
                            ? morrisConfig.headers
                            : sobolMainConfig.headers
                          ).length
                        }
                      >
                        <Text fontSize="sm" color="gray.600">
                          No results to display. Adjust configuration above to
                          refresh.
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {!loading &&
                    sortedMainRows.map(row => (
                      <Tr
                        key={row.key}
                        _hover={{ bg: 'gray.50' }}
                        transition="background 0.15s ease"
                        borderBottom="1px solid"
                        borderColor="gray.100"
                        _last={{ borderBottom: 'none' }}
                      >
                        {(method === 'morris'
                          ? morrisConfig.headers
                          : sobolMainConfig.headers
                        ).map((header, idx) => {
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
                              {header.numeric &&
                              typeof raw === 'number' &&
                              header.key === 'cases'
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
            {method === 'sobol' && (
              <Box mt={6} overflowX="auto">
                <Heading size="sm" color="#0F172A" mb={2}>
                  Parameters
                </Heading>
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
                      {sobolInteractionHeaders.map(header => {
                        const isActive = interactionSort.key === header.key;
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
                              setInteractionSort(prev =>
                                prev.key === header.key
                                  ? {
                                      key: header.key,
                                      dir: prev.dir === 'asc' ? 'desc' : 'asc',
                                    }
                                  : { key: header.key, dir: 'desc' }
                              )
                            }
                          >
                            <HStack
                              justify={
                                header.numeric ? 'flex-end' : 'flex-start'
                              }
                              spacing={2}
                              color={isActive ? 'blue.600' : 'gray.700'}
                            >
                              <Text fontSize="sm" fontWeight="700">
                                {header.label}
                              </Text>
                              <Icon
                                as={
                                  interactionSort.dir === 'asc'
                                    ? FiChevronUp
                                    : FiChevronDown
                                }
                                boxSize={4}
                              />
                            </HStack>
                          </Th>
                        );
                      })}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loading && (
                      <Tr>
                        <Td colSpan={5}>
                          <Flex align="center" gap={2}>
                            <Spinner size="sm" />
                            <Text fontSize="sm" color="gray.600">
                              Loading interaction results...
                            </Text>
                          </Flex>
                        </Td>
                      </Tr>
                    )}
                    {!loading && sobolInteractionRows.length === 0 && (
                      <Tr>
                        <Td colSpan={5}>
                          <Text fontSize="sm" color="gray.600">
                            No interaction results to display.
                          </Text>
                        </Td>
                      </Tr>
                    )}
                    {!loading &&
                      sobolInteractionRows.map(row => (
                        <Tr key={row.key} _hover={{ bg: 'gray.50' }}>
                          {sobolInteractionHeaders.map((header, idx) => {
                            const raw = row[header.key];
                            const display =
                              typeof raw === 'number' ? raw.toFixed(6) : raw;
                            return (
                              <Td
                                key={header.key}
                                fontWeight={idx === 0 ? '700' : '500'}
                                color={idx <= 1 ? 'gray.800' : 'gray.700'}
                                textAlign={header.numeric ? 'right' : 'left'}
                                bg={header.highlight ? 'yellow.50' : 'transparent'}
                                py={3}
                                px={3}
                              >
                                {header.key === 'cases' && typeof raw === 'number'
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
            )}
          </CardBody>
        </Card>
      </Stack>

      <Modal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="blue.50">
          <ModalHeader>Run analysis</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.700" mb={2}>
              Name this analysis run to save and compare it later.
            </Text>
            <Input
              placeholder="e.g., Sobol – Base scenario – Avg. cycle time"
              value={runName}
              onChange={e => setRunName(e.target.value)}
              bg="white"
            />
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={() => setIsRunModalOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => runAnalysis(runName.trim())}
              isDisabled={!runName.trim()}
              isLoading={loading}
            >
              Start
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SensitivityAnalysisPage;

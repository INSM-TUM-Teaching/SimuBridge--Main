/**
 * This page is responsible for Sensitivity Analysis layer
 * 
 * To start the analysis, user need to choose:
 * - Method: Sobol or Morris
 * - KPI
 * - Scenario
 * Then press run the analysis and give the name
 * 
 * Each analysis is stored in table:
 * - It shows recent runs with the data about the model, kpi and scenario chosen
 * - Have a possibility of loading or deleting the run
 * 
 * Results are shown for:
 * - Sobol -> chart & 2 detail tables & interaction heatmap  
 * - Morris -> chart & details table
 * 
 */
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card, 
  CardBody,
  CardHeader,
  Collapse,
  Divider,
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
import SensitivitySobolHeatmap from './SensitivitySobolHeatmap';

// Available KPI targets for sensitivity analysis
// Value is what will get sent to the backend
const KPI_OPTIONS = [
  { label: 'Avg. cycle time', value: 'average_cycle_time' },
  { label: 'Throughput', value: 'throughput' },
  { label: 'Waiting time', value: 'waiting_time' },
];

// Availanle methods: Sobol and Morris
const METHOD_OPTIONS = [
  { label: 'Sobol', value: 'sobol' },
  { label: 'Morris', value: 'morris' },
];

// Default scenario offered in case project does not provide scenario name
// Additional scenarios can be added in getData.getAllScenarios()
const SCENARIO_OPTIONS = [
  { label: 'Base scenario', value: 'base' },
  { label: 'Scenario A – extra resource', value: 'scenario_a' },
];

// Convert decimal into percentage string
const formatPercent = value => `${Math.round(value * 100)}%`;

// Ensure numeric values stay non negative
const clamp0 = v => Math.max(0, Number.isFinite(v) ? v : 0);

// Splits a label into two line for better readability
const splitTwoLines = label => {
  const parts = String(label ?? '')
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean);
  const line1 = parts[0] ?? '';
  const line2 = parts.slice(1).join(' ');
  return { line1, line2 };
};

const TwoLineText = ({ value, fontSize = 'sm', fontWeight = '700', color = 'gray.800' }) => {
  const { line1, line2 } = splitTwoLines(value);
  return (
    <Text fontSize={fontSize} fontWeight={fontWeight} color={color} lineHeight="1.1" whiteSpace="normal">
      <Box as="span" display="block">
        {line1}
      </Box>
      {line2 ? (
        <Box as="span" display="block">
          {line2}
        </Box>
      ) : null}
    </Text>
  );
};

// A table header that toggles sorting ascending or descending when clicked
const SortableHeader = ({ header, activeKey, activeDir, onClick }) => {
  const isActive = activeKey === header.key;
  return (
    <Th
      key={header.key}
      textAlign={header.numeric ? 'right' : 'left'}
      bg="gray.50"
      borderColor="gray.100"
      py={3}
      px={3}
      cursor="pointer"
      onClick={onClick}
    >
      <HStack
        justify={header.numeric ? 'flex-end' : 'flex-start'}
        spacing={2}
        color={isActive ? 'blue.600' : 'gray.700'}
      >
        <Text fontSize="sm" fontWeight="700">
          {header.label}
        </Text>
        <Icon as={activeDir === 'asc' ? FiChevronUp : FiChevronDown} boxSize={4} />
      </HStack>
    </Th>
  );
};

/** 
 * Reusable table that support:
 * - loading state
 * - empty state
 * - sortable headers
 * - optional column to highlight
 */
const DataTable = ({
  headers,
  rows,
  loading,
  emptyText,
  sortState,
  setSortState,
  highlightKey, // optional
}) => (
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
          {headers.map(header => (
            <SortableHeader
              key={header.key}
              header={header}
              activeKey={sortState.key}
              activeDir={sortState.dir}
              onClick={() =>
                setSortState(prev =>
                  prev.key === header.key
                    ? { key: header.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                    : { key: header.key, dir: 'desc' }
                )
              }
            />
          ))}
        </Tr>
      </Thead>

      <Tbody>
        {loading && (
          <Tr>
            <Td colSpan={headers.length}>
              <Flex align="center" gap={2}>
                <Spinner size="sm" />
                <Text fontSize="sm" color="gray.600">
                  Loading results...
                </Text>
              </Flex>
            </Td>
          </Tr>
        )}

        {!loading && (!rows || rows.length === 0) && (
          <Tr>
            <Td colSpan={headers.length}>
              <Text fontSize="sm" color="gray.600">
                {emptyText}
              </Text>
            </Td>
          </Tr>
        )}

        {!loading &&
          rows?.map(row => (
            <Tr key={row.key} _hover={{ bg: 'gray.50' }}>
              {headers.map((header, idx) => {
                const raw = row[header.key];
                const safeNum = typeof raw === 'number' ? clamp0(raw) : raw;

                const display =
                  header.isPercent && typeof safeNum === 'number'
                    ? formatPercent(safeNum)
                    : typeof safeNum === 'number'
                    ? safeNum.toFixed(6)
                    : safeNum;

                const isCases = header.key === 'cases' && typeof safeNum === 'number';

                const isNameLike =
                  typeof raw === 'string' &&
                  (header.key === 'name' || header.key === 'groupI' || header.key === 'groupJ');

                return (
                  <Td
                    key={header.key}
                    fontWeight={idx === 0 ? '700' : '500'}
                    color={idx === 0 ? 'gray.800' : 'gray.700'}
                    textAlign={header.numeric ? 'right' : 'left'}
                    bg={highlightKey && header.key === highlightKey ? 'blue.50' : 'transparent'}
                    py={3}
                    px={3}
                    maxW={idx === 0 ? '360px' : undefined}
                  >
                    {isNameLike ? (
                      <TwoLineText
                        value={raw}
                        fontSize="sm"
                        fontWeight={idx === 0 ? '700' : '600'}
                        color={idx === 0 ? 'gray.800' : 'gray.700'}
                      />
                    ) : isCases ? (
                      clamp0(safeNum).toLocaleString()
                    ) : (
                      display
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
      </Tbody>
    </Table>
  </Box>
);

const SensitivityAnalysisPage = ({ getData, projectName, toasting }) => {
  // Read current scenario name
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

  // Configurations selected by user
  const [kpi, setKpi] = useState(KPI_OPTIONS[0].value);
  const [method, setMethod] = useState(METHOD_OPTIONS[0].value);
  
  // Default scenario, otherwise base scenario
  const [scenario, setScenario] = useState(currentScenarioName || SCENARIO_OPTIONS[0].value);
  
  // If user manually changes scenario, dont show any more data results, till user run the new analysis
  const [scenarioLocked, setScenarioLocked] = useState(false);

  // Execution state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState();

  const [activeRunId, setActiveRunId] = useState(null);
  const [activeRunName, setActiveRunName] = useState('');

  const [dirty, setDirty] = useState(false);

  // Sorting for main table depending on method: sobol or morris
  const [sortState, setSortState] = useState({ key: 'muStar', dir: 'desc' });
  const [interactionSort, setInteractionSort] = useState({ key: 's2', dir: 'desc' });

  // Storage key is saving the project name, id, all parameters, results and timestamp so different projects don't overlap
  const storageKey = useMemo(() => `${projectName || 'default'}/sensitivity_runs`, [projectName]);
  
  // Load saved analyses from sessionStorage
  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Expend or collapse toggles
  const [showOverview, setShowOverview] = useState(true);
  const [showSavedTable, setShowSavedTable] = useState(true);

  const [runName, setRunName] = useState('');
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const getOptionLabel = (options, value) => options.find(opt => opt.value === value)?.label || value;

  // Format timestamps for the saved runs table 
  const formatRunTime = timestamp => (timestamp ? new Date(timestamp).toLocaleString() : '—');

  // Keep scenario in sync with app scenario, unless user chooses otherwise
  useEffect(() => {
    if (!scenarioLocked && currentScenarioName && currentScenarioName !== scenario) {
      setScenario(currentScenarioName);
    }
  }, [currentScenarioName, scenario, scenarioLocked]);

  // When method changes, reset sorting values respective for each method 
  useEffect(() => {
    setSortState(method === 'morris' ? { key: 'muStar', dir: 'desc' } : { key: 'st', dir: 'desc' });
    if (method === 'sobol') setInteractionSort({ key: 's2', dir: 'desc' });
  }, [method]);

  // Adds saved runs to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(savedAnalyses));
    } catch (e) {
      console.warn('Unable to persist sensitivity runs', e);
    }
  }, [storageKey, savedAnalyses]);

  // Overview summary boxes shown in the header summary
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

  // Icons for the overview boxes
  const summaryIconMap = {
    Method: FiSettings,
    KPI: FiTarget,
    Groups: FiLayers,
    Runs: FiClock,
  };

  // Sobol main table configuration: Maps service outup -> table column (s1, s1conf, st, stconf)
  const sobolMainConfig = useMemo(
    () => ({
      headers: [
        { key: 'name', label: 'Group', numeric: false },
        { key: 'cases', label: 'Cases', numeric: true },
        { key: 's1', label: 'S1', numeric: true },
        { key: 's1Conf', label: 'S1 conf', numeric: true },
        { key: 'st', label: 'ST', numeric: true },
        { key: 'stConf', label: 'ST conf', numeric: true },
      ],
      rows: dirty
        ? []
        : (result?.results || []).map(row => ({
            key: row.name,
            name: row.name,
            cases: clamp0(row.cases ?? 0),
            s1: clamp0(row.secondary ?? 0),
            s1Conf: clamp0(row.firstOrderConf ?? (row.uncertainty || 0) * 0.7),
            st: clamp0(row.score ?? 0),
            stConf: clamp0(row.uncertainty ?? 0),
          })),
    }),
    [dirty, result]
  );

  //Morris main table configuration
  const morrisConfig = useMemo(
    () => ({
      headers: [
        { key: 'name', label: 'Name', numeric: false },
        { key: 'cases', label: 'Cases', numeric: true },
        { key: 'muStar', label: 'μ*', numeric: true },
        { key: 'muStarConf', label: 'σ conf', numeric: true },
        { key: 'muStarRel', label: 'Rel CI of μ', numeric: true, isPercent: true },
      ],
      rows: dirty
        ? []
        : (result?.results || []).map(row => ({
            key: row.name,
            name: row.name,
            cases: clamp0(row.cases ?? 0),
            muStar: clamp0(row.score ?? 0),
            muStarConf: clamp0(row.uncertainty ?? 0),
            muStarRel:
              typeof row.relCi === 'number'
                ? clamp0(row.relCi)
                : Math.max(0, clamp0(row.uncertainty || 0) * 1.2),
          })),
    }),
    [dirty, result]
  );

  // Sort the main tables rows based on the chosen sort column
  const sortedMainRows = useMemo(() => {
    const cfg = method === 'morris' ? morrisConfig : sobolMainConfig;
    const rows = cfg.rows || [];
    const { key, dir } = sortState;

    return [...rows].sort((a, b) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      if (typeof av === 'string' || typeof bv === 'string') {
        return dir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      const anv = clamp0(av);
      const bnv = clamp0(bv);
      return dir === 'asc' ? anv - bnv : bnv - anv;
    });
  }, [method, morrisConfig, sobolMainConfig, sortState]);

  // Seconds Sobol interaction table, only relevant for Sobol
  const sobolInteractionHeaders = [
    { key: 'groupI', label: 'Group i', numeric: false },
    { key: 'groupJ', label: 'Group j', numeric: false },
    { key: 's2', label: 'S2', numeric: true },
    { key: 's2Conf', label: 'S2 conf', numeric: true },
    { key: 'cases', label: 'Cases', numeric: true },
  ];

  // Create interaction rows from output
  const sobolInteractionRows = useMemo(() => {
    if (dirty) return [];
    if (Array.isArray(result?.interactions) && result.interactions.length) {
      return result.interactions.map((item, idx) => ({
        key: `${item.groupI}-${item.groupJ}-${idx}`,
        ...item,
        s2: clamp0(item.s2 ?? 0),
        s2Conf: clamp0(item.s2Conf ?? 0),
        cases: clamp0(item.cases ?? 0),
      }));
    }
    return [];
  }, [dirty, result]);

  // Sort the interaction rows ascending or discending
  const sortedInteractionRows = useMemo(() => {
    const rows = sobolInteractionRows || [];
    const { key, dir } = interactionSort;

    return [...rows].sort((a, b) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;

      if (typeof av === 'string' || typeof bv === 'string') {
        return dir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }

      const anv = clamp0(av);
      const bnv = clamp0(bv);
      return dir === 'asc' ? anv - bnv : bnv - anv;
    });
  }, [sobolInteractionRows, interactionSort]);

  /**
   * Run sensitivity analysis:
   * - Calls getSensitivityResults() with current configuration
   * - Saves a named run into sessionStorage
   * - Updates active run indicators
   */
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

      setSortState(method === 'morris' ? { key: 'muStar', dir: 'desc' } : { key: 'st', dir: 'desc' });
      setInteractionSort({ key: 's2', dir: 'desc' });
    } catch (e) {
      console.error(e);
      toasting?.('error', 'Run failed', 'Unable to run sensitivity analysis');
    } finally {
      setLoading(false);
      setRunName('');
    }
  };

  // Loads one of the saved runs into UI
  const loadAnalysis = entry => {
    if (!entry) return;
    setResult(entry.result);
    setActiveRunId(entry.id);
    setActiveRunName(entry.name);

    setMethod(entry.params.method);
    setKpi(entry.params.kpi);
    setScenario(entry.params.scenario);
    setScenarioLocked(true);

    setSortState(entry.params.method === 'morris' ? { key: 'muStar', dir: 'desc' } : { key: 'st', dir: 'desc' });
    setInteractionSort({ key: 's2', dir: 'desc' });

    setDirty(false);
    toasting?.('info', 'Loaded', `Loaded analysis "${entry.name}"`);
  };

  // Delete a saved run from sessionStorage  
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
        {/* Header: title with short explanation and collapsible "current overview" boxes */}
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
                  See which parameters move your KPIs the most and where uncertainty remains.
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

                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={3}>
                  {[
                    {
                      key: 'active',
                      label: 'Active analysis',
                      value: activeRunName || '—',
                      icon: FiActivity,
                    },
                    ...summaryTokens.map(token => ({
                      key: token.label,
                      label: token.label,
                      value: token.value,
                      icon: summaryIconMap[token.label] || FiActivity,
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
            </Collapse>
          </CardBody>
        </Card>

        {/* Configuration box: select method, KPI, Scenario, run analysis, Saved analysis table (load, and delete) */}
        <Card borderRadius="2xl" border="1px solid rgba(15, 23, 42, 0.08)" boxShadow="lg" bg="white">
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
                              No saved analyses yet. Run a new analysis to see it listed here.
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
                              <Button size="sm" variant="outline" onClick={() => loadAnalysis(entry)}>
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

        {/* Main results card */}
        {/* Sobol chart + details table together in the same card */}
        {/* Morris only chart, details are in the separate card*/}

        <Card borderRadius="2xl" border="1px solid rgba(15, 23, 42, 0.08)" boxShadow="md" bg="white">
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              {method === 'sobol' ? 'Parameter importance & details' : 'Parameter importance'}
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              {method === 'morris'
                ? 'Morris: μ* (mean effect) with σ (interaction/nonlinearity).'
                : 'Sobol: global total-effect and first-order indices.'}
            </Text>
          </CardHeader>

          <CardBody>
            <SensitivityStackedChart
              data={dirty ? [] : result?.results}
              method={method}
              loading={loading}
              inactive={dirty || !result}
            />

            {/* Sobol L: show details table in the same card under the chart */}
            {method === 'sobol' && (
              <>
                <Divider my={6} />
                <Heading size="sm" color="#0F172A" mb={2}>
                  Details
                </Heading>
                <Text fontSize="sm" color="gray.500" mb={4}>
                  Review the scores and uncertainty for each input factor.
                </Text>

                <DataTable
                  headers={sobolMainConfig.headers}
                  rows={sortedMainRows}
                  loading={loading}
                  emptyText="No results to display. Adjust configuration above to refresh."
                  sortState={sortState}
                  setSortState={setSortState}
                />
              </>
            )}
          </CardBody>
        </Card>

        {/* Morris details in its own card (only when morris) */}
        {method === 'morris' && (
          <Card borderRadius="2xl" border="1px solid rgba(15, 23, 42, 0.08)" boxShadow="md" bg="white">
            <CardHeader borderBottom="1px" borderColor="gray.100">
              <Heading size="md" color="#0F172A">
                Details
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Morris parameter statistics.
              </Text>
            </CardHeader>

            <CardBody>
              <DataTable
                headers={morrisConfig.headers}
                rows={sortedMainRows}
                loading={loading}
                emptyText="No results to display. Adjust configuration above to refresh."
                sortState={sortState}
                setSortState={setSortState}
              />
            </CardBody>
          </Card>
        )}

        {/* Sobol interactions: heatmap + table together in one card */}
        {method === 'sobol' && (
          <Card
            borderRadius="2xl"
            border="1px solid rgba(15, 23, 42, 0.08)"
            boxShadow="md"
            bg="white"
            mb={6}
          >
            <CardHeader borderBottom="1px" borderColor="gray.100">
              <Heading size="md" color="#0F172A">
                Sobol interactions
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Heatmap shows strongest S2 interactions between parameter groups.
              </Text>
            </CardHeader>

            <CardBody>
              <SensitivitySobolHeatmap
                interactions={dirty ? [] : sortedInteractionRows}
                topN={8}
              />

              <Divider my={6} />

              <Heading size="sm" color="#0F172A" mb={2}>
                Parameters
              </Heading>

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
                    <Tr bg="gray.50">
                      {sobolInteractionHeaders.map(header => {
                        const isActive = interactionSort.key === header.key;
                        return (
                          <Th
                            key={header.key}
                            textAlign={header.numeric ? 'right' : 'left'}
                            py={3}
                            px={3}
                            cursor="pointer"
                            onClick={() =>
                              setInteractionSort(prev =>
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
                              <Icon
                                as={interactionSort.dir === 'asc' ? FiChevronUp : FiChevronDown}
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
                        <Td colSpan={sobolInteractionHeaders.length}>
                          <Flex align="center" gap={2}>
                            <Spinner size="sm" />
                            <Text fontSize="sm" color="gray.600">
                              Loading interaction results...
                            </Text>
                          </Flex>
                        </Td>
                      </Tr>
                    )}

                    {!loading && sortedInteractionRows.length === 0 && (
                      <Tr>
                        <Td colSpan={sobolInteractionHeaders.length}>
                          <Text fontSize="sm" color="gray.600">
                            No interaction results to display.
                          </Text>
                        </Td>
                      </Tr>
                    )}

                    {!loading &&
                      sortedInteractionRows.map(row => (
                        <Tr key={row.key} _hover={{ bg: 'gray.50' }}>
                          {sobolInteractionHeaders.map((header, idx) => {
                            const raw = row[header.key];
                            const safeNum = typeof raw === 'number' ? clamp0(raw) : raw;
                            const isNameLike =
                              typeof raw === 'string' && (header.key === 'groupI' || header.key === 'groupJ');
                            const display = typeof safeNum === 'number' ? safeNum.toFixed(6) : safeNum;

                            return (
                              <Td
                                key={header.key}
                                fontWeight={idx <= 1 ? '700' : '500'}
                                color={idx <= 1 ? 'gray.800' : 'gray.700'}
                                textAlign={header.numeric ? 'right' : 'left'}
                                bg={header.key === 's2' ? 'yellow.50' : 'transparent'}
                                py={3}
                                px={3}
                                maxW={idx <= 1 ? '360px' : undefined}
                              >
                                {header.key === 'cases' && typeof safeNum === 'number' ? (
                                  safeNum.toLocaleString()
                                ) : isNameLike ? (
                                  <TwoLineText
                                    value={raw}
                                    fontSize="sm"
                                    fontWeight="700"
                                    color="gray.800"
                                  />
                                ) : (
                                  display
                                )}
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
        )}
      </Stack>

      {/* Run modal which forces the user to name the run, and triggers runAnalysis(name) */}
      <Modal isOpen={isRunModalOpen} onClose={() => setIsRunModalOpen(false)} isCentered>
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

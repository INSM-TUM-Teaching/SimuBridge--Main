/**
 * In this page Quality Informed Layer is created
 * 
 * What user can do on this page:
 * - Upload/Select the Event Log
 * - Choose activities to include in the assessment
 * - Provide a minimum and maximum activity time range
 * - Set working hours
 * 
 * The page shows:
 * - Overall Quality and Stability Score by group
 * - Detailed table with score per each parameter
 *
 * Right now this file uses getMockQualityParameters() - so it just uses the placeholder until you replace it with real data
 */
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Collapse,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Progress,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiFileText,
  FiPlay,
  FiArrowLeft,
  FiUpload,
} from 'react-icons/fi';
import { uploadFileToProject } from '../../util/Storage';
import {
  getLogActivities,
  getMockQualityParameters,
  listProjectLogs,
} from '../../util/qualityService';

// Group of parameters shown in the UI
const GROUPS = [
  'Arrival distribution',
  'Processing time',
  'Branching probability',
  'Resources',
];

// Options for the group filter in the table view
// Note: "Arrival distribution" is intentionally excluded from the table as there should be only one entry
const TABLE_GROUP_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Processing time', label: 'Processing' },
  { value: 'Branching probability', label: 'Branching' },
  { value: 'Resources', label: 'Resources' },
];

// Mapping of status and color on the progress bar and badge
const STATUS_STYLES = {
  idle: { label: 'idle', color: 'gray', progress: 0 },
  queued: { label: 'queued', color: 'purple', progress: 25 },
  running: { label: 'running', color: 'blue', progress: 55 },
  done: { label: 'done', color: 'green', progress: 100 },
  failed: { label: 'failed', color: 'red', progress: 100 },
};

/**
 * Convert numeric stability score into Low/High/Medium labels
 * - <40 = Low
 * - 40 - 70 = Medium
 * - >70 = High
 */
const scoreLabel = value => {
  if (value === null || value === undefined) return '--';
  if (value < 40) return 'Low';
  if (value < 70) return 'Medium';
  return 'High';
};

// Choose a color of the badge for the respective scores
const stabilityBadgeColor = value => {
  if (value === null || value === undefined) return 'gray';
  if (value < 40) return 'red';
  if (value < 70) return 'yellow';
  return 'green';
};

// Format Quality score to show in format "0.00-1.00"
const formatQuality = value => {
  if (value === null || value === undefined) return '--';
  return (value / 100).toFixed(2);
};

//Ensures the number stays in 0-100 range
const clampPercent = value => Math.min(100, Math.max(0, value));

// Generates "explanation" statistics numbers
// Not based on real data metrics (placeholder for demo)
const qualityIssueStats = score => {
  if (score === null || score === undefined) {
    return { incomplete: '--', inconsistent: '--', inaccurate: '--', avg: '--' };
  }
  const base = Math.round(100 - score);
  const incomplete = clampPercent(score - 8);
  const inconsistent = clampPercent(score);
  const inaccurate = clampPercent(score + 6);
  return { incomplete, inconsistent, inaccurate };
};

/**
 * Format numeric hour value into "HH:MM" label
 * As RangleSlider uses steps by 0.5 
 * So from 9.5 it trasforms time to 09:30
 */ 
const formatTime = value => {
  if (value === null || value === undefined) return '--:--';
  const hours = Math.floor(value);
  const minutes = value % 1 === 0 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

/**
 * Mock data for stability information
 * - a timestamp
 * - a window ID
 * - a change percentage
 * 
 * This is a placeholder logic
 */
const stabilityMeta = (name, stability) => {
  const seed = name ? name.length : 0;
  const windowId = 5 * ((seed % 4) + 1);
  const day = String((seed % 9) + 10).padStart(2, '0');
  const month = String(((seed % 6) + 5)).padStart(2, '0');
  const timestamp = `${day}.${month}.2024`;
  if (stability === null || stability === undefined) {
    return { timestamp, windowId, changePct: '--' };
  }
  const changePct = 5 * Math.max(1, Math.round((100 - stability) / 20));
  return { timestamp, windowId, changePct };
};


// Table Header that can be clicked to sort the table
const SortableHeader = ({ header, activeKey, activeDir, onClick }) => {
  const isActive = activeKey === header.key;
  return (
    <Th
      key={header.key}
      textAlign="left"
      bg="gray.50"
      borderColor="gray.100"
      py={3.5}
      px={3.5}
      cursor="pointer"
      onClick={onClick}
    >
      <HStack
        justify="flex-start"
        spacing={2}
        color={isActive ? 'blue.600' : 'gray.700'}
      >
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase">
          {header.label}
        </Text>
        <Icon
          as={activeDir === 'asc' ? FiChevronUp : FiChevronDown}
          boxSize={4}
        />
      </HStack>
    </Th>
  );
};

const QualityInformedPage = ({ projectName }) => {

  //Log list of available files in the project + the user selected log
  const [availableLogs, setAvailableLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState('');

  //Status of the assessment (idle/queued/running/done/failed)
  const [assessmentStatus, setAssessmentStatus] = useState('idle');
  const [assessmentNotes, setAssessmentNotes] = useState('Awaiting log selection.');
  
  // Result of the assessment: list of parameters with scores
  const [parameters, setParameters] = useState([]);
  
  // UI toggles - overview vs table view
  const [showOverview, setShowOverview] = useState(true);
  const [showTable, setShowTable] = useState(false);
  
  // Activities for the selected log, and which activities user selected
  const [availableActivities, setAvailableActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  
  // User input for minimum and maximum activity time
  const [minActivityMinutes, setMinActivityMinutes] = useState('');
  const [maxActivityMinutes, setMaxActivityMinutes] = useState('');
  
  //Working hour slider
  const [workingHours, setWorkingHours] = useState([9, 17]);

  // Group filter for the parameter table
  const [groupFilter, setGroupFilter] = useState('All');

  //Sorting settings for table view
  const [sortState, setSortState] = useState({ key: 'quality', dir: 'desc' });

  /**
   * Table metric:
   * - "quality" shows quality column
   * - "stability" shows stability column
   */
  const [tableMetric, setTableMetric] = useState('quality');
  const [expandedQualityGroup, setExpandedQualityGroup] = useState(null);
  const [expandedStabilityGroup, setExpandedStabilityGroup] = useState(null);
  const [expandedParamId, setExpandedParamId] = useState(null);

  const timeoutsRef = useRef([]);
 
  /**
   * This is "ready to analyze" check
   * User can not start assessment until he has:
   * - selected a log
   * - selected at least one activity to assess
   * - entered minimum and maximum time limit
   * - chose working hours range
   */
  const isReadyToAnalyze =
    selectedLog &&
    selectedActivities.length > 0 &&
    minActivityMinutes !== '' &&
    maxActivityMinutes !== '' &&
    workingHours?.length === 2;

  // Load list of log files when project changes
  useEffect(() => {
    let mounted = true;
    if (!projectName) return;
    listProjectLogs(projectName)
      .then(nextLogs => {
        if (!mounted) return;
        setAvailableLogs(nextLogs);
        // If nothing is selected yet, it auto selects the first available log
        if (!selectedLog) {
          setSelectedLog(nextLogs[0] || '');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setAvailableLogs([]);
      });
    return () => {
      mounted = false;
    };
  }, [projectName]);

  // Reload the activities when user changes the selected log
  useEffect(() => {
    let mounted = true;
    // If no log is selected, clear activities
    if (!selectedLog || !projectName) {
      setAvailableActivities([]);
      setSelectedActivities([]);
      return () => {
        mounted = false;
      };
    }

    const loadActivities = async () => {
      // getLogActivities reads the log and returns the list with activity names
      const activities = await getLogActivities(projectName, selectedLog);
      if (!mounted) return;
      // show list of activities and auto-select all of them at start
      setAvailableActivities(activities);
      setSelectedActivities(activities);
    };

    loadActivities();
    return () => {
      mounted = false;
    };
  }, [selectedLog, projectName]);

  // Update status notes when status changes
  useEffect(() => {
    // Only change notes if status is "idle"
    if (assessmentStatus === 'idle') {
      setAssessmentNotes(
        selectedLog
          ? 'Ready to assess the selected log.'
          : 'Awaiting log selection.'
      );
    }
  }, [assessmentStatus, selectedLog]);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
    },
    []
  );

  // Parameters returned from the assessment
  const parametersWithStatus = useMemo(() => parameters, [parameters]);

  /**
   * Table view filtering:
   * - "Arrival distribution" is excluded from the table
   * - apply groupFilter selection if not "All"
   */
  const filteredParams = useMemo(() => {
    return parametersWithStatus.filter(param => {
      if (param.group === 'Arrival distribution') {
        return false;
      }
      if (groupFilter !== 'All' && param.group !== groupFilter) {
        return false;
      }
      return true;
    });
  }, [
    groupFilter,
    parametersWithStatus,
  ]);

  // Sort filtered parameters by current sort column and direction: ascending or descending
  const sortedParams = useMemo(() => {
    const next = [...filteredParams];
    next.sort((a, b) => {
      const dir = sortState.dir === 'asc' ? 1 : -1;
      const aVal = a[sortState.key];
      const bVal = b[sortState.key];
      // If number, then numeric sort
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * dir;
      }
      return `${aVal}`.localeCompare(`${bVal}`) * dir;
    });
    return next;
  }, [filteredParams, sortState]);

  // Compute overall average score for quality and stability across all parameters
  // Return null if no parameters available
  const overallScores = useMemo(() => {
    if (!parametersWithStatus.length) {
      return { quality: null, stability: null };
    }
    const totals = parametersWithStatus.reduce(
      (acc, param) => ({
        quality: acc.quality + param.quality,
        stability: acc.stability + param.stability,
      }),
      { quality: 0, stability: 0 }
    );
    const count = parametersWithStatus.length;
    return {
      quality: Math.round(totals.quality / count),
      stability: Math.round(totals.stability / count),
    };
  }, [parametersWithStatus]);

  // Compute average score per group for the summary cards
  const groupSummaries = useMemo(() => {
    return GROUPS.map(group => {
      const groupItems = parametersWithStatus.filter(param => param.group === group);
      if (!groupItems.length) {
        return { group, quality: null, stability: null, count: 0 };
      }
      const totals = groupItems.reduce(
        (acc, param) => ({
          quality: acc.quality + param.quality,
          stability: acc.stability + param.stability,
        }),
        { quality: 0, stability: 0 }
      );
      const count = groupItems.length;
      return {
        group,
        count,
        quality: Math.round(totals.quality / count),
        stability: Math.round(totals.stability / count),
      };
    });
  }, [parametersWithStatus]);

  /**
   * This is handling of "Assess log quality & stability" button
   * 
   * What it does:
   * - Clears previous timeouts
   * - Sets status to queued -> running -> done
   * - Finally sets parameter to get Mock parameters via getMockQualityParameters()
   * 
   * So this assessment is simualted
   * Replace this with real service call when backend is available
   */
  const handleAssess = () => {
    if (!selectedLog) return;
    // Clear any old timers if user has run multiple times
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
    // Show queued status
    setAssessmentStatus('queued');
    setAssessmentNotes('Queued for assessment. Preparing log slices...');
    // Show running after 700ms
    const queuedTimeout = setTimeout(() => {
      setAssessmentStatus('running');
      setAssessmentNotes('Analyzing quality checks and drift windows.');
    }, 700);
    // Show done after 1700ms and set mock data
    const doneTimeout = setTimeout(() => {
      setAssessmentStatus('done');
      setAssessmentNotes('Assessment complete. Review scores and evidence.');
      // Mock demo data
      setParameters(getMockQualityParameters());
    }, 1700);
    timeoutsRef.current.push(queuedTimeout, doneTimeout);
  };

  // Go to the table view for a group and a metric
  // Triggered by pressing small arrow button next to parameter in overivew 
  const handleGroupJump = (group, metric) => {
    setGroupFilter(group);
    setTableMetric(metric);
    setShowTable(true);
  };

  // UI toggles for expanding/collapsing explanation sections
  const handleQualityExpand = group => {
    setExpandedQualityGroup(prev => (prev === group ? null : group));
  };

  const handleStabilityExpand = group => {
    setExpandedStabilityGroup(prev => (prev === group ? null : group));
  };

  // Table headers -> which depends on the Metric
  const headers = [
    { key: 'name', label: 'Parameter name' },
    { key: 'group', label: 'Group' },
    ...(tableMetric === 'quality'
      ? [{ key: 'quality', label: 'Quality score' }]
      : []),
    ...(tableMetric === 'stability'
      ? [{ key: 'stability', label: 'Stability score' }]
      : []),
  ];

  // Status badge + progres bar configuration
  const statusMeta = STATUS_STYLES[assessmentStatus] || STATUS_STYLES.idle;

  // 3 Overview boxes at the summary header: selected log, overall quality score, overall stability level
  const overviewTokens = [
    {
      key: 'log',
      label: 'Selected log',
      value: selectedLog || '—',
      icon: FiFileText,
      isLog: true,
    },
    {
      key: 'quality',
      label: 'Log quality',
      value: overallScores.quality ?? '--',
      icon: FiActivity,
    },
    {
      key: 'stability',
      label: 'Stability',
      value: scoreLabel(overallScores.stability),
      colorScheme: stabilityBadgeColor(overallScores.stability),
      isStatus: true,
      icon: FiClock,
    },
  ];

  // Only allow clicking on group cards when the assessment is done
  const canInteract = assessmentStatus === 'done';

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
                  Quality-Informed Layer
                </Heading>
                <Text color="whiteAlpha.800" maxW="3xl">
                  Assess log quality and stability before trusting simulation parameters.
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

                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                  {overviewTokens.map(item => (
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
                      {item.isStatus ? (
                        <Badge
                          colorScheme={item.colorScheme}
                          borderRadius="full"
                          px={3}
                          fontSize="sm"
                        >
                          {item.value}
                        </Badge>
                      ) : (
                        <Text
                          fontSize={
                            item.isLog && item.value && `${item.value}`.length > 26
                              ? 'sm'
                              : 'xl'
                          }
                          fontWeight="800"
                          color="white"
                          noOfLines={1}
                        >
                          {item.value}
                        </Text>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Collapse>
          </CardBody>
        </Card>

        {/* Overview mode */}
        {!showTable && (
          <Box px={0} pt={0}>
            {/* Log selection + assessment configuration */}
              <Card
                borderRadius="2xl"
                border="1px solid rgba(15, 23, 42, 0.08)"
                bg="white"
                mb={6}
              >
                  <CardHeader borderBottom="1px" borderColor="gray.100">
                    <Flex justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Icon as={FiFileText} color="blue.600" />
                        <Heading size="md" color="#0F172A">
                          Log selection & assessment
                        </Heading>
                      </HStack>
                      <Badge colorScheme={statusMeta.color} variant="subtle">
                        {statusMeta.label}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={4}>
                      {/* Log Dropdown + upload */}
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                          Event Log (.xes or .csv)
                        </Text>
                        <Select
                          size="md"
                          borderRadius="lg"
                          bg="gray.50"
                          border="1px"
                          borderColor="gray.200"
                          value={selectedLog}
                          onChange={event => setSelectedLog(event.target.value)}
                          _hover={{ borderColor: 'gray.300', bg: 'white' }}
                          _focus={{
                            borderColor: '#2F80ED',
                            boxShadow: '0 0 0 1px #2F80ED',
                            bg: 'white',
                          }}
                        >
                          {availableLogs.map(log => (
                            <option key={log} value={log}>
                              {log}
                            </option>
                          ))}
                        </Select>
                        {/* Upload: stores file in the project, refreshes log list, selects uploaded file */}
                        <Button
                          leftIcon={<FiUpload />}
                          size="sm"
                          variant="ghost"
                          mt={2}
                          colorScheme="blue"
                          onClick={() => {
                            if (!projectName) return;
                          uploadFileToProject(projectName).then(file => {
                            listProjectLogs(projectName).then(logs => {
                              setAvailableLogs(logs);
                            });
                            setSelectedLog(file);
                          });
                        }}
                      >
                        Upload Event Log
                      </Button>
                      </Box>
                    <Box>
                      <Flex justify="space-between" align="center" mb={2} gap={2}>
                        <Text fontSize="md" fontWeight="600" color="gray.700">
                          Activities to assess
                          </Text>
                          <HStack spacing={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setSelectedActivities(availableActivities)}
                              isDisabled={availableActivities.length === 0}
                            >
                              Select all
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setSelectedActivities([])}
                              isDisabled={selectedActivities.length === 0}
                            >
                              Clear
                            </Button>
                          </HStack>
                        </Flex>
                        <CheckboxGroup
                          value={selectedActivities}
                          onChange={setSelectedActivities}
                        >
                          <SimpleGrid
                            columns={{ base: 1, sm: 2, lg: 3 }}
                            spacing={2}
                            maxH="180px"
                            overflowY="auto"
                            pr={1}
                          >
                          {availableActivities.map(activity => (
                            <Checkbox
                              key={activity}
                              value={activity}
                              colorScheme="blue"
                              pl={1}
                            >
                              {activity}
                            </Checkbox>
                          ))}
                            {availableActivities.length === 0 && (
                              <Text fontSize="sm" color="gray.500">
                                No activities detected for this log.
                              </Text>
                            )}
                          </SimpleGrid>
                        </CheckboxGroup>
                      </Box>
                      {/* Min/Max duration inputs */}
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={2}>
                        <Box>
                          <Text fontSize="md" color="gray.700" fontWeight="600" mb={1}>
                            Shortest Activity Time (minutes)
                          </Text>
                          <Input
                            size="sm"
                            type="number"
                            min={0}
                            placeholder="e.g. 2"
                            value={minActivityMinutes}
                            onChange={event => setMinActivityMinutes(event.target.value)}
                          />
                        </Box>
                        <Box>
                          <Text fontSize="md" color="gray.700" fontWeight="600" mb={1}>
                            Longest Activity Time (minutes)
                          </Text>
                          <Input
                            size="sm"
                            type="number"
                            min={0}
                            placeholder="e.g. 120"
                            value={maxActivityMinutes}
                            onChange={event => setMaxActivityMinutes(event.target.value)}
                          />
                        </Box>
                      </SimpleGrid>
                      {/* Working hours slider */}
                      <Box mt={0}>
                        <Text fontSize="md" color="gray.700" fontWeight="600" mb={2}>
                          Working hour range
                        </Text>
                        <RangeSlider
                          min={0}
                          max={24}
                          step={0.5}
                          value={workingHours}
                          onChange={setWorkingHours}
                          colorScheme="blue"
                          size="lg"
                          mt={5}
                        >
                          <RangeSliderTrack bg="gray.100" borderRadius="full" h="18px">
                            <RangeSliderFilledTrack bg="blue.200" />
                          </RangeSliderTrack>
                          <RangeSliderThumb
                            index={0}
                            borderWidth="2px"
                            borderColor="blue.400"
                            boxSize={5}
                            bg="white"
                          >
                            <Box
                              position="absolute"
                              top="-28px"
                              bg="blue.600"
                              color="white"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              fontSize="xs"
                              fontWeight="600"
                            >
                              {formatTime(workingHours[0])}
                            </Box>
                          </RangeSliderThumb>
                          <RangeSliderThumb
                            index={1}
                            borderWidth="2px"
                            borderColor="blue.400"
                            boxSize={5}
                            bg="white"
                          >
                            <Box
                              position="absolute"
                              top="-28px"
                              bg="blue.600"
                              color="white"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              fontSize="xs"
                              fontWeight="600"
                            >
                              {formatTime(workingHours[1])}
                            </Box>
                          </RangeSliderThumb>
                        </RangeSlider>
                      </Box>
                      {/* Run Assessment */}
                      <Button
                        colorScheme="blue"
                        leftIcon={<FiPlay />}
                        onClick={handleAssess}
                        isDisabled={!isReadyToAnalyze}
                      >
                        Assess log quality & stability
                      </Button>
                      {/* Status progress + notes */}
                      <Stack spacing={2}>
                        <Progress
                          value={statusMeta.progress}
                          size="sm"
                          colorScheme={statusMeta.color}
                          borderRadius="full"
                        />
                        <Text fontSize="xs" color="gray.600">
                          {assessmentNotes}
                        </Text>
                      </Stack>
                    </Stack>
                  </CardBody>
              </Card>
              
              {/* Group summary cards*/}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
                {/* Quality by group */}
                <Card borderRadius="xl" border="1px solid" borderColor="gray.100">
                  <CardHeader pb={3}>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Quality by group</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={2}>
                    <Stack spacing={3}>
                      {groupSummaries.map(group => (
                        <Box
                          key={`${group.group}-quality`}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="lg"
                          px={4}
                          py={3}
                          bg="white"
                          _hover={
                            canInteract
                              ? { bg: 'blue.50', borderColor: 'blue.200', boxShadow: 'sm' }
                              : undefined
                          }
                          opacity={canInteract ? 1 : 0.5}
                        >
                          <Flex
                            justify="space-between"
                            align="center"
                            cursor={canInteract ? 'pointer' : 'not-allowed'}
                            onClick={() => {
                              if (!canInteract) return;
                              handleQualityExpand(group.group);
                            }}
                          >
                            <Text fontWeight="600" color="gray.700">
                              {group.group}
                            </Text>
                            <HStack spacing={2} minW="120px" justify="flex-end">
                              <Badge
                                colorScheme="blue"
                                borderRadius="full"
                                px={3}
                                fontSize="sm"
                              >
                                {formatQuality(group.quality)}
                              </Badge>
                              {[
                                'Processing time',
                                'Branching probability',
                                'Resources',
                              ].includes(group.group) && (
                                <IconButton
                                  aria-label={`Open ${group.group} parameters`}
                                  icon={<FiChevronRight />}
                                  size="xs"
                                  boxSize="28px"
                                  variant="outline"
                                  borderRadius="full"
                                  borderColor="gray.200"
                                  bg="white"
                                  isDisabled={!canInteract}
                                  _hover={{ bg: 'blue.100', borderColor: 'blue.300' }}
                                  onClick={event => {
                                    if (!canInteract) return;
                                    event.stopPropagation();
                                    handleGroupJump(group.group, 'quality');
                                  }}
                                />
                              )}
                              {![
                                'Processing time',
                                'Branching probability',
                                'Resources',
                              ].includes(group.group) && <Box w="28px" />}
                            </HStack>
                          </Flex>
                          {/* Expandable explanation text */}
                          <Collapse in={expandedQualityGroup === group.group} animateOpacity>
                            <Text fontSize="sm" color="gray.600" mt={3}>
                              The quality of discovering the simulation parameter{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {group.group}
                              </Text>{' '}
                              from the event log is{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {group.quality == null
                                  ? '--'
                                  : group.quality < 40
                                  ? 'low'
                                  : group.quality < 70
                                  ? 'moderate'
                                  : 'high'}
                              </Text>
                              . This assessment is based on observed data quality signals, including{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {qualityIssueStats(group.quality).incomplete}%
                              </Text>{' '}
                              complete events,{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {qualityIssueStats(group.quality).inconsistent}%
                              </Text>{' '}
                              consistent values, and{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {qualityIssueStats(group.quality).inaccurate}%
                              </Text>{' '}
                              accurate records.
                            </Text>
                          </Collapse>
                        </Box>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>
                
                {/* Stability by group */}
                <Card borderRadius="xl" border="1px solid" borderColor="gray.100">
                  <CardHeader pb={3}>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Stability by group</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={2}>
                    <Stack spacing={3}>
                      {groupSummaries.map(group => (
                        <Box
                          key={`${group.group}-stability`}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="lg"
                          px={4}
                          py={3}
                          bg="white"
                          _hover={
                            canInteract
                              ? { bg: 'purple.50', borderColor: 'purple.200', boxShadow: 'sm' }
                              : undefined
                          }
                          opacity={canInteract ? 1 : 0.5}
                        >
                          <Flex
                            justify="space-between"
                            align="center"
                            cursor={canInteract ? 'pointer' : 'not-allowed'}
                            onClick={() => {
                              if (!canInteract) return;
                              handleStabilityExpand(group.group);
                            }}
                          >
                            <Text fontWeight="600" color="gray.700">
                              {group.group}
                            </Text>
                            <HStack spacing={2} minW="120px" justify="flex-end">
                              <Badge
                                colorScheme={stabilityBadgeColor(group.stability)}
                                borderRadius="full"
                                px={3}
                                fontSize="sm"
                                minW="80px"
                                textAlign="center"
                              >
                                {scoreLabel(group.stability)}
                              </Badge>
                              {[
                                'Processing time',
                                'Branching probability',
                                'Resources',
                              ].includes(group.group) && (
                                <IconButton
                                  aria-label={`Open ${group.group} parameters`}
                                  icon={<FiChevronRight />}
                                  size="xs"
                                  boxSize="28px"
                                  variant="outline"
                                  borderRadius="full"
                                  borderColor="gray.200"
                                  bg="white"
                                  isDisabled={!canInteract}
                                  _hover={{ bg: 'purple.100', borderColor: 'purple.300' }}
                                  onClick={event => {
                                    if (!canInteract) return;
                                    event.stopPropagation();
                                    handleGroupJump(group.group, 'stability');
                                  }}
                                />
                              )}
                              {![
                                'Processing time',
                                'Branching probability',
                                'Resources',
                              ].includes(group.group) && <Box w="28px" />}
                            </HStack>
                          </Flex>
                          {/* Expandible explanation text */}
                          <Collapse in={expandedStabilityGroup === group.group} animateOpacity>
                            <Text fontSize="sm" color="gray.600" mt={3}>
                              Concept drift was detected in the simulation parameter{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {group.group}
                              </Text>
                              . A change point occurred at{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {stabilityMeta(group.group, group.stability).timestamp}
                              </Text>{' '}
                              (window ID{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {stabilityMeta(group.group, group.stability).windowId}
                              </Text>
                              ). After this point, the parameter value changed by approximately{' '}
                              <Text as="span" fontWeight="600" color="gray.700">
                                {stabilityMeta(group.group, group.stability).changePct}%
                              </Text>
                              . 
                            </Text>
                          </Collapse>
                        </Box>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>
              </SimpleGrid>
          </Box>
        )}
        {/* Table Mode */}
        {showTable && (
          <Card borderRadius="xl" border="1px solid" borderColor="gray.100" mt={0}>
            <CardHeader pb={0} pt={4}>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FiArrowLeft />}
                onClick={() => setShowTable(false)}
                bg="blue.50"
                color="blue.700"
                borderRadius="full"
                px={4}
                py={2.5}
                _hover={{ bg: 'blue.100' }}
              >
                Back to overview
              </Button>
            </CardHeader>
            <CardBody>
                  {/* Group filter */}
                  <Box maxW="260px" mb={6}>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Group
                    </Text>
                    <Select
                      size="sm"
                      borderRadius="lg"
                      value={groupFilter}
                      onChange={event => setGroupFilter(event.target.value)}
                      w="full"
                    >
                      {TABLE_GROUP_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  {/* Parameter table */}
                  <Box overflowX="auto" mt={4}>
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
                                    ? {
                                        key: header.key,
                                        dir: prev.dir === 'asc' ? 'desc' : 'asc',
                                      }
                                    : { key: header.key, dir: 'desc' }
                                )
                              }
                            />
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedParams.length === 0 && (
                          <Tr>
                          <Td colSpan={headers.length} py={4}>
                            <Text fontSize="sm" color="gray.600">
                              Run an assessment to populate parameter scores.
                            </Text>
                          </Td>
                        </Tr>
                        )}
                        {sortedParams.map(param => {
                          const isExpanded = expandedParamId === param.id;
                          return (
                            <Fragment key={param.id}>
                              <Tr
                                _hover={{ bg: 'gray.50' }}
                                cursor="pointer"
                                onClick={() =>
                                  setExpandedParamId(prev =>
                                    prev === param.id ? null : param.id
                                  )
                                }
                              >
                              <Td fontWeight="600" color="gray.800" fontSize="sm" py={4} px={3.5}>
                                {param.name}
                              </Td>
                              <Td color="gray.600" fontSize="sm" py={4} px={3.5}>
                                {param.group}
                              </Td>
                              {tableMetric === 'quality' && (
                                <Td fontSize="sm" py={4} px={3.5}>
                                  <Badge
                                    colorScheme="blue"
                                    borderRadius="full"
                                    px={3}
                                    minW="72px"
                                    py={1}
                                    textAlign="center"
                                  >
                                    {param.quality ?? '--'}
                                  </Badge>
                                </Td>
                              )}
                              {tableMetric === 'stability' && (
                                <Td fontSize="sm" py={4} px={3.5}>
                                  <Badge
                                    colorScheme={stabilityBadgeColor(param.stability)}
                                    borderRadius="full"
                                    px={3}
                                    minW="72px"
                                    py={1}
                                    textAlign="center"
                                  >
                                    {scoreLabel(param.stability)}
                                  </Badge>
                                </Td>
                              )}
                            </Tr>
                              {/* Expanded explanation row */}
                              {isExpanded && (
                                <Tr>
                                  <Td colSpan={headers.length} bg="gray.50">
                                    <Stack spacing={3} py={2}>
                                      {tableMetric === 'quality' && (
                                        <Text fontSize="sm" color="gray.600">
                                          The quality of discovering the simulation parameter{' '}
                                          <Text as="span" fontWeight="600" color="gray.700">
                                            {param.name}
                                          </Text>{' '}
                                        from the event log is{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {param.quality == null
                                            ? '--'
                                            : param.quality < 40
                                            ? 'low'
                                            : param.quality < 70
                                            ? 'moderate'
                                            : 'high'}
                                        </Text>
                                        . This assessment is based on observed data quality
                                        signals, including{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {qualityIssueStats(param.quality).incomplete}%
                                        </Text>{' '}
                                        complete events,{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {qualityIssueStats(param.quality).inconsistent}%
                                        </Text>{' '}
                                        consistent values, and{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {qualityIssueStats(param.quality).inaccurate}%
                                        </Text>{' '}
                                        accurate records.
                                      </Text>
                                    )}
                                      {tableMetric === 'stability' && (
                                        <Text fontSize="sm" color="gray.600">
                                          Concept drift was detected in the simulation parameter{' '}
                                          <Text as="span" fontWeight="600" color="gray.700">
                                            {param.name}
                                        </Text>
                                        . A change point occurred at{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {stabilityMeta(param.name, param.stability).timestamp}
                                        </Text>{' '}
                                        (window ID{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {stabilityMeta(param.name, param.stability).windowId}
                                        </Text>
                                        ). After this point, the parameter value changed by
                                        approximately{' '}
                                        <Text as="span" fontWeight="600" color="gray.700">
                                          {stabilityMeta(param.name, param.stability).changePct}%
                                        </Text>
                                        . 
                                      </Text>
                                    )}
                                    </Stack>
                                  </Td>
                                </Tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
              </CardBody>
          </Card>
        )}
      </Stack>

    </Box>
  );
};

export default QualityInformedPage;

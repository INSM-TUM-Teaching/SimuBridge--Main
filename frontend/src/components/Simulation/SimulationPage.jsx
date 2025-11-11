import { useState, useRef, useEffect } from 'react';
import {
  Flex,
  Heading,
  Card,
  CardHeader,
  CardBody,
  Text,
  Select,
  Stack,
  Button,
  Box,
  SimpleGrid,
  Icon,
  HStack,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiStopCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiLayers,
  FiFileText,
} from 'react-icons/fi';
import axios from 'axios';

import { setFile } from '../../util/Storage';
import { convertScenario } from 'simulation-bridge-converter-scylla/ConvertScenario';
import RunProgressIndicationBar from '../RunProgressIndicationBar';
import ToolRunOutputCard from '../ToolRunOutputCard';

const SimulationPage = ({ projectName, getData, toasting }) => {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errored, setErrored] = useState(false);
  const [response, setResponse] = useState(
    JSON.parse(
      sessionStorage.getItem(projectName + '/lastSimulatorResponse')
    ) || {}
  );

  const [scenarioName, setScenarioName] = useState();
  const [simulator, setSimulator] = useState(
    () =>
      sessionStorage.getItem(projectName + '/selectedSimulator') || undefined
  );

  const source = useRef(null);

  const availableScenarios = getData().getAllScenarios();
  const scenarioCount = availableScenarios.length;
  const filesReady = response?.files?.length || 0;
  const selectionReady = Boolean(scenarioName) && Boolean(simulator);
  const statusLabel = started
    ? 'Running'
    : finished
    ? errored
      ? 'Attention needed'
      : 'Completed'
    : selectionReady
    ? 'Ready'
    : 'Setup required';
  const StatusIcon = started
    ? FiPlay
    : finished
    ? errored
      ? FiAlertCircle
      : FiCheckCircle
    : FiClock;
  const statusHelperText = started
    ? 'Simulation in progress'
    : finished
    ? errored
      ? 'Review output for details'
      : 'Available for inspection'
    : selectionReady
    ? 'Selections prepared'
    : 'Choose a scenario and simulator';

  const selectionFields = [
    {
      key: 'scenario',
      label: 'Scenario',
      value: scenarioName,
      placeholder: scenarioCount
        ? 'Select scenario'
        : 'No scenarios available',
      helperText: 'Select the scenario you want to simulate',
      onChange: setScenarioName,
      options: availableScenarios.map(scenario => ({
        value: scenario.scenarioName,
        label: scenario.scenarioName,
      })),
    },
    {
      key: 'simulator',
      label: 'Simulator',
      value: simulator,
      placeholder: 'Select simulator',
      helperText: 'Select an available simulator',
      onChange: setSimulator,
      options: [{ value: 'Scylla', label: 'Scylla' }],
    },
  ];

  const selectionMeta = selectionFields.map(field => ({
    ...field,
    complete: Boolean(field.value),
  }));

  const allSelectionsMade = selectionMeta.every(field => field.complete);

  const disablePrimaryAction = started ? false : !allSelectionsMade;
  const handlePrimaryAction = () => {
    if (started) {
      abort();
    } else {
      start();
    }
  };

  const ActionButtonIcon = started ? FiStopCircle : FiPlay;
  const actionButtonLabel = started ? 'Abort simulation' : 'Start simulation';

  const start = async () => {
    setResponse({ message: '', files: [] });
    setFinished(false);
    setErrored(false);
    setStarted(true);

    source.current = axios.CancelToken.source();

    try {
      const requestId = 'request' + Math.random();
      const formData = new FormData();
      const scenarioData = getData().getScenario(scenarioName);

      const { globalConfig, simConfigs } = await convertScenario(scenarioData);
      const simConfig = simConfigs[0];
      const processModel = scenarioData.models[0];

      const bpmnFile = new File(
        [processModel.BPMN],
        processModel.name + '.bpmn'
      );
      formData.append('bpmn', bpmnFile, bpmnFile.name);
      const globalConfigFile = new File(
        [globalConfig],
        scenarioData.scenarioName + '_Global.xml'
      );
      formData.append('globalConfig', globalConfigFile, globalConfigFile.name);
      const simConfigFile = new File(
        [simConfig],
        scenarioData.scenarioName + '_' + bpmnFile.name + '_Sim.xml'
      );
      formData.append('simConfig', simConfigFile, simConfigFile.name);

      const r = await axios.post('http://127.0.0.1:8080/scyllaapi', formData, {
        headers: {
          requestId: requestId,
          'Content-Type': 'multipart/form-data',
        },
        cancelToken: source.current.token,
      });
      r.data.files.forEach(file => {
        setFile(projectName, requestId + '/' + file.name, file.data);
      });

      const responseObject = {
        message: r.data.message,
        files: r.data.files.map(file => file.name),
        finished: new Date(),
        requestId,
      };
      setResponse(responseObject);
      sessionStorage.setItem(
        projectName + '/lastSimulatorResponse',
        JSON.stringify(responseObject)
      );
      setFinished(true);
      setStarted(false);
      toasting('success', 'Success', 'Simulation was successful');
    } catch (err) {
      if (axios.isCancel(err)) {
        toasting('success', 'Success', 'Simulation was canceled');
      } else {
        setFinished(true);
        setStarted(false);
        setErrored(true);
        console.log(err);
        toasting('error', 'error', 'Simulation was not successful');
      }
    }
  };

  const abort = () => {
    console.log('abort');
    source.current.cancel('Simulation was canceled');
    setStarted(false);
    setResponse({ message: 'canceled' });
  };

  useEffect(() => {
    if (simulator) {
      sessionStorage.setItem(projectName + '/selectedSimulator', simulator);
    }
  }, [simulator, projectName]);

  useEffect(() => {
    const handler = e => {
      const val = e.detail;
      setSimulator(val);
    };
    window.addEventListener('simulatorChanged', handler);
    return () => window.removeEventListener('simulatorChanged', handler);
  }, []);

  const headerStats = [
    {
      key: 'status',
      label: 'Status',
      value: statusLabel,
      icon: StatusIcon,
      helper: statusHelperText,
    },
    {
      key: 'scenarios',
      label: 'Scenarios',
      value: scenarioCount,
      icon: FiLayers,
      helper:
        scenarioCount === 1
          ? 'Scenario available'
          : 'Scenarios available',
    },
    {
      key: 'latest-output',
      label: 'Latest output',
      value: response?.message || 'No run yet',
      icon: FiFileText,
      helper: filesReady
        ? `${filesReady} file${filesReady > 1 ? 's' : ''} generated`
        : 'Awaiting execution',
    },
  ];

  const wideContainer = {
    base: '100%',
    xl: 'clamp(1200px, calc(100vw - var(--sb-width, 80px) - 64px), 1440px)',
  };

  return (
    <Box
      minH="93vh"
      overflowY="auto"
      bgGradient="linear(to-br, #F6FAFF, #EEF2FF)"
      px={{ base: 4, md: 8 }}
      py={{ base: 4, md: 8 }}
    >
      <Stack spacing={6} maxW={wideContainer} mx="auto">
        <Card
          borderRadius="3xl"
          bgGradient="linear(to-r, #0F172A, #1D4ED8)"
          color="white"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.25)"
          border="none"
        >
          <CardBody>
            <Flex
              direction={{ base: 'column', lg: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', lg: 'center' }}
              gap={6}
            >
              <Box>
                <Heading size="lg" mb={2}>
                  Simulation Control Center
                </Heading>
                <Text color="whiteAlpha.800" maxW="3xl">
                  Configure like the overview page, execute with process miner
                  clarity, and keep every run in view.
                </Text>
              </Box>
              <Box />
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4} mt={8}>
              {headerStats.map(stat => (
                <Box
                  key={stat.key}
                  bg="whiteAlpha.100"
                  borderRadius="xl"
                  p={4}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="xs" letterSpacing="0.18em" color="whiteAlpha.700">
                      {stat.label}
                    </Text>
                    <Icon as={stat.icon} boxSize={5} color="whiteAlpha.900" />
                  </HStack>
                  <>
                    <Text fontSize="2xl" fontWeight="700">
                      {stat.value}
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {stat.helper}
                    </Text>
                  </>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card
          bg="white"
          borderRadius="2xl"
          border="1px solid rgba(15, 23, 42, 0.08)"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Configure next run
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Set the essentials, then run when ready.
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
              {selectionMeta.map(field => (
                <Box key={field.key}>
                  <Text fontSize="sm" fontWeight="600" color="#0F172A" mb={2}>
                    {field.label}
                  </Text>
                  <Select
                    value={field.value}
                    placeholder={field.placeholder}
                    size="md"
                    variant="filled"
                    bg="gray.50"
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    _hover={{ borderColor: 'gray.300', bg: 'white' }}
                    _focus={{
                      borderColor: '#2563EB',
                      boxShadow: '0 0 0 1px #2563EB',
                      bg: 'white',
                    }}
                    onChange={evt => field.onChange(evt.target.value)}
                    isDisabled={!field.options.length}
                  >
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              ))}
            </SimpleGrid>

            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'stretch', md: 'center' }}
              justify="space-between"
              gap={3}
            >
              <Box />
              <Button
                leftIcon={<ActionButtonIcon />}
                onClick={handlePrimaryAction}
                isDisabled={disablePrimaryAction}
                borderRadius="full"
                px={8}
                py={6}
                fontWeight="600"
                colorScheme={started ? 'red' : 'blue'}
                bg={started ? 'white' : '#2563EB'}
                color={started ? '#C53030' : 'white'}
                border={started ? '1px solid #C53030' : 'none'}
                _hover={started ? { bg: '#FFF5F5' } : { bg: '#1D4ED8' }}
              >
                {actionButtonLabel}
              </Button>
            </Flex>

            <Box mt={4}>
              <RunProgressIndicationBar {...{ started, finished, errored }} />
            </Box>
          </CardBody>
        </Card>

        <ToolRunOutputCard
          {...{
            projectName,
            response,
            toolName: 'Simulator',
            processName: 'simulation',
            filePrefix: response.requestId,
          }}
        />
      </Stack>
    </Box>
  );
};

export default SimulationPage;

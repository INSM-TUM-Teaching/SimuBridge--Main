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
  Badge,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiStopCircle,
  FiCheckCircle,
  FiAlertCircle,
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

  return (
    <Box h="93vh" overflowY="auto" p={{ base: 4, md: 6 }} bg="#EAF4FF">
      {/* Page Header */}
      <Box mb={6}>
        <Heading size="lg" color="#0F172A" mb={2}>
          Run Simulation
        </Heading>
        <Text color="gray.600" fontSize="sm">
          Configure and execute simulation runs
        </Text>
      </Box>

      <Stack spacing={6}>
        {/* Status Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card
            bg="white"
            borderRadius="xl"
            boxShadow="sm"
            border="1px"
            borderColor="gray.100"
          >
            <CardBody>
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1} fontWeight="500">
                    Status
                  </Text>
                  <Badge
                    colorScheme={started ? 'blue' : finished ? 'green' : 'gray'}
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {started ? 'Running' : finished ? 'Completed' : 'Ready'}
                  </Badge>
                </Box>
                <Icon
                  as={
                    started ? FiPlay : finished ? FiCheckCircle : FiAlertCircle
                  }
                  boxSize={6}
                  color={
                    started ? '#2F80ED' : finished ? '#10B981' : 'gray.400'
                  }
                />
              </Flex>
            </CardBody>
          </Card>

          <Card
            bg="white"
            borderRadius="xl"
            boxShadow="sm"
            border="1px"
            borderColor="gray.100"
          >
            <CardBody>
              <Text fontSize="xs" color="gray.600" mb={1} fontWeight="500">
                Selected Scenario
              </Text>
              <Text
                fontSize="sm"
                fontWeight="600"
                color="gray.900"
                noOfLines={1}
              >
                {scenarioName || 'Not selected'}
              </Text>
            </CardBody>
          </Card>

          <Card
            bg="white"
            borderRadius="xl"
            boxShadow="sm"
            border="1px"
            borderColor="gray.100"
          >
            <CardBody>
              <Text fontSize="xs" color="gray.600" mb={1} fontWeight="500">
                Simulator
              </Text>
              <Text fontSize="sm" fontWeight="600" color="gray.900">
                {simulator || 'Not selected'}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Progress Bar */}
        <RunProgressIndicationBar {...{ started, finished, errored }} />

        {/* Configuration Card */}
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
            <Heading size="md" color="#0F172A">
              Simulation Configuration
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <Box>
                <Text fontSize="sm" fontWeight="500" color="gray.700" mb={2}>
                  Scenario
                </Text>
                <Select
                  value={scenarioName}
                  placeholder="Select scenario"
                  bg="white"
                  borderColor="gray.300"
                  borderRadius="md"
                  _hover={{ borderColor: 'gray.400' }}
                  _focus={{
                    borderColor: '#2F80ED',
                    boxShadow: '0 0 0 1px #2F80ED',
                  }}
                  onChange={evt => setScenarioName(evt.target.value)}
                >
                  {getData()
                    .getAllScenarios()
                    .map(scenario => (
                      <option
                        key={scenario.scenarioName}
                        value={scenario.scenarioName}
                      >
                        {scenario.scenarioName}
                      </option>
                    ))}
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="500" color="gray.700" mb={2}>
                  Simulator
                </Text>
                <Select
                  value={simulator}
                  placeholder="Select simulator"
                  bg="white"
                  borderColor="gray.300"
                  borderRadius="md"
                  _hover={{ borderColor: 'gray.400' }}
                  _focus={{
                    borderColor: '#2F80ED',
                    boxShadow: '0 0 0 1px #2F80ED',
                  }}
                  onChange={evt => setSimulator(evt.target.value)}
                >
                  <option value="Scylla">Scylla</option>
                </Select>
              </Box>
            </SimpleGrid>

            <Flex gap={3} justify="flex-end">
              {!started ? (
                <Button
                  leftIcon={<FiPlay />}
                  colorScheme="blue"
                  bg="#2F80ED"
                  color="white"
                  onClick={start}
                  isDisabled={!scenarioName || !simulator}
                  _hover={{ bg: '#1E6FD9' }}
                  boxShadow="sm"
                >
                  Start Simulation
                </Button>
              ) : (
                <Button
                  leftIcon={<FiStopCircle />}
                  colorScheme="red"
                  onClick={abort}
                >
                  Abort Simulation
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>

        {/* Output Card */}
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

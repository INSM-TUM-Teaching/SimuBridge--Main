import { useState, useRef } from 'react';
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
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import axios from 'axios';
import untar from 'js-untar';
import Gzip from 'pako';
import simodConfiguration from './simod_config.yml';
import {
  getFile,
  getFiles,
  setFile,
  uploadFileToProject,
} from '../../util/Storage';
import { convertSimodOutput } from 'simulation-bridge-converter-simod/simod_converter';
import RunProgressIndicationBar from '../RunProgressIndicationBar';
import ToolRunOutputCard from '../ToolRunOutputCard';

function getNumberOfInstances(eventLog) {
  return eventLog.match(/<trace>/g)?.length || 100;
}

const ProcessMinerPage = ({ projectName, getData, toasting }) => {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errored, setErrored] = useState(false);
  const [response, setResponse] = useState(
    JSON.parse(sessionStorage.getItem(projectName + '/lastMinerResponse')) || {}
  );
  const [logFile, setLogFile] = useState();
  const [miner, setMiner] = useState();

  const [configFile, setConfigFile] = useState();
  const [bpmnFile, setBpmnFile] = useState();

  const source = useRef(null);

  const start = async () => {
    setResponse({ message: '', files: [] });
    setFinished(false);
    window.canceled = false;
    setErrored(false);
    setStarted(true);

    source.current = axios.CancelToken.source();

    try {
      const apiAddress = 'http://127.0.0.1:8880';
      const formData = new FormData();
      const eventlogFile = new File(
        [(await getFile(projectName, logFile)).data],
        logFile
      );
      const configurationFile = new File(
        [await (await fetch(simodConfiguration)).text()],
        'sample.yml'
      );
      formData.append(
        'configuration',
        new Blob([configurationFile], { type: 'application/yaml' }),
        configurationFile.name
      );
      formData.append(
        'event_log',
        new Blob([eventlogFile], { type: 'application/xml' }),
        eventlogFile.name
      );

      const DEBUG = JSON.parse(sessionStorage.getItem('DEBUG'));

      let status;
      const requestStartTime = new Date().getTime();
      if (!DEBUG) {
        const r = await axios.post(apiAddress + '/discoveries', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const { request_id, request_status } = r.data;
        console.log({ request_id, request_status });

        if (request_status !== 'accepted') {
          throw new Error('Process mining request rejected');
        }

        if (window.canceled) {
          throw new Error('Canceled');
        }

        toasting('success', 'Success', 'Process Mining successfully started');

        const msPerMinute = 60 * 1000;
        const maxWaitTimeMs = 60 * msPerMinute;
        const waitStartTime = new Date().getTime();
        function sleep(milliseconds) {
          return new Promise(resolve => setTimeout(resolve, milliseconds));
        }

        while (true) {
          const status_request = await axios.get(
            'http://127.0.0.1:8880/discoveries/' + request_id
          );
          status = status_request.data;
          console.log(status_request);
          if (status.request_status !== 'running') {
            break;
          } else if (new Date().getTime() - waitStartTime > maxWaitTimeMs) {
            throw new Error('Process Mining timed out');
          }
          await sleep(10000);
          if (window.canceled) {
            throw new Error('Canceled');
          }
        }
      } else {
        console.log('Using cached result for debugging purposes');
        status = {
          request_status: 'success',
          archive_url: sessionStorage.getItem('lastSimodUrl'),
        };
      }

      if (status.request_status === 'success') {
        console.log(
          `Request took ${(new Date().getTime() - requestStartTime) / 1000.0} s`
        );
        sessionStorage.setItem('lastSimodUrl', status.archive_url);
        const result = await fetch(
          status.archive_url.replace('http://0.0.0.0', apiAddress)
        );
        const raw = await result.arrayBuffer();
        const raw_tar = Gzip.inflate(raw).buffer;
        console.log('Files:');
        console.log(raw_tar);
        const files = await untar(raw_tar);
        console.log('Untar finished');

        const relevant_files = files.filter(
          file => file.name.endsWith('.json') || file.name.endsWith('.bpmn')
        );

        function readAsString_safeForLargeFiles(encoding) {
          var buffer = this.buffer;
          var charCount = buffer.byteLength;
          var charSize = 1;
          var bufferView = new DataView(buffer);

          var charCodes = [];

          encoding = encoding || 'utf-8';
          if (global.TextDecoder) {
            var decoder = new TextDecoder(encoding);
            return (this._string = decoder.decode(this.buffer));
          } else {
            for (var i = 0; i < charCount; ++i) {
              var charCode = bufferView.getUint8(i * charSize, true);
              charCodes.push(charCode);
            }

            return (this._string = convertLongCharCodeArrayToString(
              charCodes,
              32000
            ));
          }
        }

        function convertLongCharCodeArrayToString(charCodes, chunkSize) {
          var result = '';
          var index = 0;

          while (index < charCodes.length) {
            var chunk = charCodes.slice(index, index + chunkSize);
            result += String.fromCharCode.apply(null, chunk);
            index += chunkSize;
          }

          return result;
        }

        relevant_files.forEach(file => {
          file.name = file.name.replace(/\/.*\/(.*trial).*\//, '/$1/');
          console.log('Reading file ' + file.name);
          file.readAsString_safeForLargeFiles = readAsString_safeForLargeFiles;
          file.data = file.readAsString_safeForLargeFiles();
        });

        console.log(relevant_files);

        relevant_files.forEach(file => {
          setFile(projectName, 'simod_results/' + file.name, file.data);
        });

        const responseObject = {
          message: 'Miner output currently not captured',
          files: relevant_files.map(file => file.name),
          finished: new Date(),
        };
        setResponse(responseObject);
        sessionStorage.setItem(
          projectName + '/lastMinerResponse',
          JSON.stringify(responseObject)
        );
        console.log(
          'simod_results/' +
            relevant_files.find(file =>
              /.*best_result.*simulation_parameters\.json/.test(file.name)
            )?.name
        );
        setConfigFile(
          'simod_results/' +
            relevant_files.find(file =>
              /.*best_result.*simulation_parameters\.json/.test(file.name)
            )?.name
        );
        setBpmnFile(
          'simod_results/' +
            relevant_files.find(file =>
              /.*structure_trial.*\.bpmn/.test(file.name)
            )?.name
        );
        setFinished(true);
        setStarted(false);
        toasting('success', 'Success', 'Process Mining was successful');
      } else {
        throw new Error('Process mining terminated unsuccessfully');
      }
    } catch (err) {
      setStarted(false);
      setFinished(true);
      if (window.canceled || axios.isCancel(err)) {
        toasting('info', 'Canceled', 'Process Mining was canceled');
      } else {
        console.log(err);
        toasting('error', 'error', 'Process Mining was not successful');
        setErrored(true);
      }
    }
  };

  const abort = () => {
    console.log('abort');
    window.canceled = true;
    source.current.cancel('Process Mining was canceled');
    setStarted(false);
    setResponse({ message: 'canceled' });
  };

  function fileSelect(title, state, setState, filter) {
    return (
      <Box>
        <Text fontSize="sm" fontWeight="500" color="gray.700" mb={2}>
          {title}
        </Text>
        <Select
          value={state}
          placeholder={title}
          bg="white"
          borderColor="gray.300"
          borderRadius="md"
          _hover={{ borderColor: 'gray.400' }}
          _focus={{
            borderColor: '#2F80ED',
            boxShadow: '0 0 0 1px #2F80ED',
          }}
          onChange={evt => {
            setState(evt.target.value);
          }}
        >
          {fileList.filter(filter).map((file, index) => {
            return (
              <option key={index} value={file}>
                {file}
              </option>
            );
          })}
        </Select>
      </Box>
    );
  }

  const [fileList, setFileList] = useState([]);

  function updateFileList() {
    getFiles(projectName).then(newFileList => {
      if (fileList.join(',') !== newFileList.join(',')) {
        setFileList(newFileList);
      }
    });
  }

  updateFileList();

  return (
    <Box h="93vh" overflowY="auto" p={{ base: 4, md: 6 }} bg="#EAF4FF">
      {/* Page Header */}
      <Box mb={6}>
        <Heading size="lg" color="#0F172A" mb={2}>
          Process Mining
        </Heading>
        <Text color="gray.600" fontSize="sm">
          Discover process models from event logs
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
                Event Log
              </Text>
              <Text
                fontSize="sm"
                fontWeight="600"
                color="gray.900"
                noOfLines={1}
              >
                {logFile || 'Not selected'}
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
                Miner
              </Text>
              <Text fontSize="sm" fontWeight="600" color="gray.900">
                {miner || 'Not selected'}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Progress Bar */}
        <RunProgressIndicationBar {...{ started, finished, errored }} />

        {/* Start Mining Card */}
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
            <Heading size="md" color="#0F172A">
              Start Process Mining
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <Box>
                {fileSelect('Event Log', logFile, setLogFile, file =>
                  file.endsWith('.xes')
                )}
                <Button
                  leftIcon={<FiUpload />}
                  size="sm"
                  variant="outline"
                  mt={2}
                  onClick={() => {
                    uploadFileToProject(projectName).then(file => {
                      updateFileList();
                      setLogFile(file);
                    });
                  }}
                >
                  Upload Event Log
                </Button>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="500" color="gray.700" mb={2}>
                  Process Miner
                </Text>
                <Select
                  value={miner}
                  placeholder="Select miner"
                  bg="white"
                  borderColor="gray.300"
                  borderRadius="md"
                  _hover={{ borderColor: 'gray.400' }}
                  _focus={{
                    borderColor: '#2F80ED',
                    boxShadow: '0 0 0 1px #2F80ED',
                  }}
                  onChange={evt => setMiner(evt.target.value)}
                >
                  <option value="Simod">Simod</option>
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
                  isDisabled={!logFile || !miner}
                  _hover={{ bg: '#1E6FD9' }}
                  boxShadow="sm"
                >
                  Start Mining
                  {JSON.parse(sessionStorage.getItem('DEBUG')) && '*'}
                </Button>
              ) : (
                <Button
                  leftIcon={<FiStopCircle />}
                  colorScheme="red"
                  onClick={abort}
                >
                  Abort Mining
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>

        {/* Convert to Scenario Card */}
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
            <Heading size="md" color="#0F172A">
              Convert to Scenario
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              {fileSelect(
                'Config File (.json)',
                configFile,
                setConfigFile,
                file =>
                  file.endsWith('.json') &&
                  file.includes('simulation_parameters') &&
                  !file.includes('converted')
              )}
              {fileSelect('BPMN File', bpmnFile, setBpmnFile, file =>
                file.endsWith('.bpmn')
              )}
            </SimpleGrid>

            <Flex gap={3} justify="flex-end">
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="blue"
                bg="#2F80ED"
                color="white"
                isDisabled={!configFile || !bpmnFile}
                onClick={async () => {
                  console.log(
                    'Converting files ' + configFile + ' ' + bpmnFile
                  );
                  const converted = convertSimodOutput(
                    (await getFile(projectName, configFile)).data,
                    (await getFile(projectName, bpmnFile)).data
                  );
                  const eventLog = (
                    await getFile(
                      projectName,
                      logFile ||
                        fileList.filter(file => file.endsWith('.xes'))[0]
                    )
                  ).data;
                  converted.numberOfInstances = getNumberOfInstances(eventLog);

                  const scenarioName = window.prompt(
                    'Please enter scenario name'
                  );
                  if (scenarioName) {
                    converted.scenarioName = scenarioName;
                    getData().addScenario(converted);
                  }
                }}
                _hover={{ bg: '#1E6FD9' }}
                boxShadow="sm"
              >
                Convert to Scenario
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Output Card */}
        <ToolRunOutputCard
          {...{
            projectName,
            response,
            toolName: 'Miner',
            processName: 'process mining',
            filePrefix: 'simod_results',
          }}
        />
      </Stack>
    </Box>
  );
};

export default ProcessMinerPage;

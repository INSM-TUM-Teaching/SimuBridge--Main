import { useState, useRef, useMemo } from 'react';
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
  Tooltip,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiStopCircle,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiClock,
  FiFileText,
  FiActivity,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';
import axios from 'axios';
import untar from 'js-untar';
import Gzip from 'pako';
import JSZip from 'jszip';
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

function getNumberOfInstances(eventLog, filename) {
  // Check if it's XES format
  if (filename?.endsWith('.xes') || eventLog.includes('<trace>')) {
    return eventLog.match(/<trace>/g)?.length || 100;
  }
  // For CSV, count unique case IDs (assuming first column or 'case:concept:name')
  if (filename?.endsWith('.csv') || eventLog.includes(',')) {
    const lines = eventLog.split('\n').filter(line => line.trim());
    if (lines.length <= 1) return 100; // No data rows
    
    // Try to find case ID column (common names)
    const header = lines[0].toLowerCase();
    const caseIdIndex = header.split(',').findIndex(col => 
      col.includes('case') || col.includes('case_id') || col.includes('caseid')
    );
    
    if (caseIdIndex >= 0) {
      const caseIds = new Set();
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values[caseIdIndex]) {
          caseIds.add(values[caseIdIndex].trim());
        }
      }
      return caseIds.size || 100;
    }
  }
  return 100; // Default fallback
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
  const [downloadingFiles, setDownloadingFiles] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [converting, setConverting] = useState(false);

  const source = useRef(null);
  const outputCardRef = useRef(null);
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
      
      // Load and modify the configuration to use the actual log file name
      let configText = await (await fetch(simodConfiguration)).text();
      configText = configText.replace(
        /log_path:\s*.+/,
        `log_path: ${logFile}`
      );
      
      const configurationFile = new File(
        [configText],
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
        
        // Build full URL if archive_url is just a path
        const archiveUrl = status.archive_url.startsWith('http') 
          ? status.archive_url.replace('http://0.0.0.0', apiAddress)
          : apiAddress + status.archive_url;
        
        const result = await fetch(archiveUrl);
        const raw = await result.arrayBuffer();
        const raw_tar = Gzip.inflate(raw).buffer;
        console.log('Files:');
        console.log(raw_tar);
        const files = await untar(raw_tar);
        console.log('Untar finished');

        const relevant_files = files.filter(
          file => {
            if (file.name.endsWith('.bpmn')) return true;
            // For JSON files, exclude canonical_model and runtimes
            if (file.name.endsWith('.json')) {
              const filename = file.name.toLowerCase();
              return !filename.includes('canonical_model') && !filename.includes('runtimes');
            }
            return false;
          }
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
          // Clean up file paths - remove leading ./ or / and any double slashes
          file.name = file.name.replace(/^\.\//,  '').replace(/^\//,  '').replace(/\/\//g, '/');
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
        // Find config file - any .json file
        const configFileMatch = relevant_files.find(file =>
          file.name.endsWith('.json')
        );
        console.log('Config file found:', configFileMatch?.name);
        
        if (configFileMatch) {
          setConfigFile('simod_results/' + configFileMatch.name);
        }
        
        // Find BPMN file - any .bpmn file
        const bpmnFileMatch = relevant_files.find(file =>
          file.name.endsWith('.bpmn')
        );
        console.log('BPMN file found:', bpmnFileMatch?.name);
        
        if (bpmnFileMatch) {
          setBpmnFile('simod_results/' + bpmnFileMatch.name);
        }
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
    <Box w="full">
      <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
        {title}
      </Text>
      <Select
        value={state}
        placeholder={title}
        size="md"
        variant="filled"
        bg="gray.50"
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
        w="full"
        minW={{ base: '100%', md: '260px' }}
        _hover={{ borderColor: 'gray.300', bg: 'white' }}
        _focus={{
          borderColor: '#2F80ED',
          boxShadow: '0 0 0 1px #2F80ED',
          bg: 'white',
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

  const statusMeta = useMemo(() => {
    if (started) {
      return {
        label: 'Running',
        colorScheme: 'blue',
        icon: FiPlay,
        accent: '#2563EB',
      };
    }
    if (errored) {
      return {
        label: 'Needs attention',
        colorScheme: 'red',
        icon: FiAlertCircle,
        accent: '#DC2626',
      };
    }
    if (finished) {
      return {
        label: 'Completed',
        colorScheme: 'green',
        icon: FiCheckCircle,
        accent: '#059669',
      };
    }
    if (!logFile || !miner) {
      return {
        label: 'Setup required',
        colorScheme: 'red',
        icon: FiActivity,
        accent: '#DC2626',
      };
    }
    return {
      label: 'Ready',
      colorScheme: 'blue',
      icon: FiActivity,
      accent: '#1e459cff',
    };
  }, [started, finished, errored, logFile, miner]);

  const lastRunTimestamp = useMemo(() => {
    if (!response?.finished) {
      return null;
    }
    const date = new Date(response.finished);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  }, [response]);

  const eventLogCount = useMemo(
    () => fileList.filter(file => file.endsWith('.xes') || file.endsWith('.csv')).length,
    [fileList]
  );

  const readyToConvert = Boolean(configFile && bpmnFile);

  const convertToScenario = async () => {
    const name = scenarioName.trim();
    if (!name) return;
    try {
      setConverting(true);
      console.log('Converting files ' + configFile + ' ' + bpmnFile);
      const converted = convertSimodOutput(
        (await getFile(projectName, configFile)).data,
        (await getFile(projectName, bpmnFile)).data
      );

      const logFileName =
        logFile ||
        fileList.filter(file => file.endsWith('.xes') || file.endsWith('.csv'))[0];

      const eventLog = (await getFile(projectName, logFileName)).data;
      converted.numberOfInstances = getNumberOfInstances(eventLog, logFileName);

      converted.scenarioName = name;
      getData().addScenario(converted);
      toasting('success', 'Success', 'Scenario created successfully');
      setScenarioModalOpen(false);
      setScenarioName('');
    } catch (error) {
      console.error('Error converting to scenario:', error);
      toasting('error', 'Error', 'Failed to convert to scenario: ' + error.message);
    } finally {
      setConverting(false);
    }
  };

  const statusHelper = useMemo(() => {
    if (started) return 'Mining in progress';
    if (errored) return 'Needs attention';
    if (finished) {
      return lastRunTimestamp
        ? `Completed ${lastRunTimestamp}`
        : 'Completed successfully';
    }
    if (!logFile || !miner) return 'Select log and miner to begin';
    return 'Ready to start';
  }, [started, errored, finished, lastRunTimestamp, logFile, miner]);
  const hasLatestOutput =
    typeof response?.message === 'string' && response.message.trim().length > 0;
  const latestOutputStatus = hasLatestOutput ? 'Available' : 'No run yet';
  const hasGeneratedFiles =
    Array.isArray(response?.files) && response.files.length > 0;

  const scrollToOutputCard = () => {
    if (outputCardRef.current) {
      outputCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const downloadAllFiles = async () => {
    if (!hasGeneratedFiles || downloadingFiles) return;
    try {
      setDownloadingFiles(true);
      const zip = new JSZip();
      await Promise.all(
        response.files.map(async fileName => {
          const stored = await getFile(projectName, `simod_results/${fileName}`);
          if (stored?.data !== undefined) {
            zip.file(fileName, stored.data);
          }
        })
      );
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName}-process-miner-output.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toasting('error', 'Download failed', 'Unable to bundle miner files.');
    } finally {
      setDownloadingFiles(false);
    }
  };
  const headerStats = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        value: statusMeta.label,
        helper: statusHelper,
        icon: statusMeta.icon,
      },
      {
        key: 'logs',
        label: 'Logs',
        value: eventLogCount,
        helper: eventLogCount === 1 ? 'Log ready' : 'Logs ready',
        icon: FiFileText,
      },
      {
        key: 'latest-output',
        label: 'Latest output',
        value: latestOutputStatus,
        helper: response?.requestId
          ? `Request ${response.requestId}`
          : 'Start a run to produce output',
        icon: FiFileText,
      },
      {
        key: 'last-run',
        label: 'Last run',
        value: lastRunTimestamp || 'No run yet',
        helper: lastRunTimestamp
          ? 'Finished successfully'
          : 'Run the miner to capture results',
        icon: FiClock,
      },
    ],
    [
      statusMeta.label,
      statusMeta.icon,
      statusHelper,
      eventLogCount,
      latestOutputStatus,
      response?.message,
      response?.requestId,
      lastRunTimestamp,
    ]
  );

  const wideContainer = {
    base: '100%',
    xl: 'clamp(1200px, calc(100vw - var(--sb-width, 80px) - 64px), 1440px)',
  };

  const cardSurfaceProps = {
    borderRadius: '2xl',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow: 'md',
    bg: 'white',
  };

  return (
    <Box
      minH="93vh"
      overflowY="auto"
      bgGradient="linear(to-br, #F6FAFF, #EEF2FF)"
      px={{ base: 4, md: 8 }}
      py={{ base: 2, md: 3 }}
    >
      <Stack spacing={3} maxW={wideContainer} mx="auto">
        <Card
          borderRadius="3xl"
          bgGradient="linear(to-r, #0F172A, #1D4ED8)"
          color="white"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.25)"
          border="none"
        >
          <CardBody>
            <Flex justify="space-between" align="flex-start" gap={4}>
              <Box>
                <Heading size="lg" mb={2}>
                  Process Mining
                </Heading>
                <Text
                  color="whiteAlpha.800"
                  maxW="100%"
                  whiteSpace={{ base: 'normal', md: 'nowrap' }}
                >
                  Discover data-backed process models, monitor status, and turn discoveries into ready-to-run
                  scenarios from one calm surface.
                </Text>
              </Box>
              <IconButton
                aria-label={detailsCollapsed ? 'Expand details' : 'Collapse details'}
                icon={detailsCollapsed ? <FiChevronDown /> : <FiChevronUp />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setDetailsCollapsed(prev => !prev)}
              />
            </Flex>
            {!detailsCollapsed && (
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
                  {stat.key === 'latest-output' ? (
                  <>
                    <Text fontSize="xl" fontWeight="700">
                        {stat.value}
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.800" mt={1}>
                        {stat.helper}
                      </Text>
                      {hasGeneratedFiles && (
                        <Button
                          mt={3}
                          width="100%"
                          size="sm"
                          variant="outline"
                          colorScheme="whiteAlpha"
                          color="white"
                          borderColor="whiteAlpha.400"
                          _hover={{ bg: 'whiteAlpha.200' }}
                          onClick={downloadAllFiles}
                          isLoading={downloadingFiles}
                          isDisabled={!hasGeneratedFiles || downloadingFiles}
                        >
                          Download files
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Text fontSize="xl" fontWeight="700">                      {stat.value}
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {stat.helper}
                    </Text>
                  </>
                  )}
                </Box>
              ))}
            </SimpleGrid>
            )}
          </CardBody>
        </Card>

        <Card {...cardSurfaceProps}>
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Start Process Mining
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Connect an event log, choose your miner, and launch the run when ready.
            </Text>
          </CardHeader>
          <CardBody>

            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              columnGap={6}
              rowGap={3}
              mb={4}
              alignItems="start"
            >
              <Box>
                {fileSelect('Event Log (.xes or .csv)', logFile, setLogFile, file =>
                  file.endsWith('.xes') || file.endsWith('.csv')
                )}
                <Button
                  leftIcon={<FiUpload />}
                  size="sm"
                  variant="ghost"
                  mt={2}
                  colorScheme="blue"
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
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Process Miner
                </Text>
                <Select
                  value={miner}
                  placeholder="Select miner"
                  size="md"
                  variant="filled"
                  bg="gray.50"
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  w="full"
                  minW={{ base: '100%', md: '260px' }}
                  _hover={{ borderColor: 'gray.300', bg: 'white' }}
                  _focus={{
                    borderColor: '#2F80ED',
                    boxShadow: '0 0 0 1px #2F80ED',
                    bg: 'white',
                  }}
                  onChange={evt => setMiner(evt.target.value)}
                >
                  <option value="Simod">Simod</option>
                </Select>
              </Box>
            </SimpleGrid>

            <Flex gap={3} justify="flex-end" flexWrap="wrap" mt={-1}>
              {!started ? (
                <Button
                  leftIcon={<FiPlay />}
                  colorScheme="blue"
                  bg="#2563EB"
                  color="white"
                  px={8}
                  py={6}
                  fontWeight="600"
                  onClick={start}
                  isDisabled={!logFile || !miner}
                  _hover={{ bg: '#1D4ED8' }}
                  borderRadius="full"
                >
                  Start Mining
                  {JSON.parse(sessionStorage.getItem('DEBUG')) && '*'}
                </Button>
              ) : (
                <Button
                  leftIcon={<FiStopCircle />}
                  colorScheme="red"
                  variant="outline"
                  borderRadius="full"
                  onClick={abort}
                >
                  Abort Mining
                </Button>
              )}
            </Flex>
            <Box mt={4}>
              <RunProgressIndicationBar {...{ started, finished, errored }} />
            </Box>
          </CardBody>
        </Card>
        <Box ref={outputCardRef}>
        <ToolRunOutputCard
          {...{
            projectName,
            response,
            toolName: 'Miner',
            processName: 'process mining',
            filePrefix: 'simod_results',
              downloadAllLabel: 'Download files',
              onDownloadAll: downloadAllFiles,
              downloadAllDisabled: !hasGeneratedFiles,
              downloadAllLoading: downloadingFiles,
          }}
        />
        </Box>

        <Card {...cardSurfaceProps}>
          <CardHeader borderBottom="1px" borderColor="gray.100">
            <Heading size="md" color="#0F172A">
              Convert to Scenario
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Pair the simulation parameters with the mined BPMN to generate a scenario ready for SimuBridge.
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
              {fileSelect(
                'Config File (.json)',
                configFile,
                setConfigFile,
                file =>
                  file.endsWith('.json') &&
                  file.startsWith('simod_results/') &&
                  !file.includes('converted')
              )}
              {fileSelect('BPMN File', bpmnFile, setBpmnFile, file =>
                file.endsWith('.bpmn') &&
                file.startsWith('simod_results/')
              )}
            </SimpleGrid>

            <Tooltip
              label="Select both a configuration JSON and a BPMN to enable conversion."
              hasArrow
              isDisabled={readyToConvert}
            >
              <Flex justify="flex-end">
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="blue"
                  bg={readyToConvert ? '#2563EB' : '#93C5FD'}
                  color="white"
                  isDisabled={!readyToConvert}
                  onClick={() => {
                    setScenarioName('');
                    setScenarioModalOpen(true);
                  }}
                  _hover={readyToConvert ? { bg: '#1D4ED8' } : { bg: '#80B8FF' }}
                  boxShadow={readyToConvert ? 'md' : 'none'}
                  borderRadius="full"
                >
                  Convert to Scenario
                </Button>
              </Flex>
            </Tooltip>
          </CardBody>
        </Card>
      </Stack>

      <Modal
        isOpen={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="blue.50">
          <ModalHeader>Convert to scenario</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.700" mb={2}>
              Name the scenario to add it to SimuBridge.
            </Text>
            <Input
              placeholder="e.g., Mined scenario – Base log"
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              bg="white"
            />
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={() => setScenarioModalOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={convertToScenario}
              isDisabled={!scenarioName.trim()}
              isLoading={converting}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProcessMinerPage;

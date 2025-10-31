import React, { useState, useEffect, useRef } from 'react';
import {
  Flex,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react';
import {
  getProjects,
  getScenarioFileName,
  setFile,
  updateProject,
  uploadFile,
} from '../../util/Storage';

function StartView({ selectProject }) {
  const [newProjectName, setNewProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectScenarios, setSelectedProjectScenarios] = useState([]);
  const fileInputRef = useRef();
  const toast = useToast();

  useEffect(() => {
    getProjects().then(loadedProjects => setProjects(loadedProjects || []));
  }, []);

  function dateConverter(d) {
    if (!d) return '';
    const x = new Date(d);
    return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()} ${x
      .getHours()
      .toString()
      .padStart(2, '0')}:${x.getMinutes().toString().padStart(2, '0')}`;
  }

  async function handleCreateProject() {
    if (!newProjectName) return;
    await updateProject(newProjectName);
    selectProject(newProjectName);
  }

  async function handleImportFromFileObj(file) {
    try {
      const text = await file.text();
      const scenarios = JSON.parse(text);
      const projectName = file.name
        ? file.name.split('.')[0]
        : scenarios.projectName || 'imported';
      await Promise.all(
        scenarios.map(scenario => {
          const scenarioFileName = getScenarioFileName(scenario.scenarioName);
          return setFile(
            projectName,
            scenarioFileName,
            JSON.stringify(scenario)
          );
        })
      );
      await updateProject(projectName);
      selectProject(projectName);
    } catch (err) {
      console.error('Import failed', err);
      toast({
        title: 'Import failed',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }

  async function handleFileInputChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) await handleImportFromFileObj(file);
  }

  async function handleUploadViaUtil() {
    const picked = await uploadFile();
    if (!picked) return;
    const { data, name } = picked;
    const scenarios = JSON.parse(data);
    const projectName = name.split('.')[0];
    await Promise.all(
      scenarios.map(scenario => {
        const scenarioFileName = getScenarioFileName(scenario.scenarioName);
        return setFile(projectName, scenarioFileName, JSON.stringify(scenario));
      })
    );
    await updateProject(projectName);
    selectProject(projectName);
  }

  // Load project scenarios (best-effort via localStorage scan)
  function loadProjectScenarios(projectName) {
    const scenarios = [];
    try {
      if (typeof window === 'undefined') return [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(projectName + '/')) {
          const raw = window.localStorage.getItem(key);
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.scenarioName) scenarios.push(parsed);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      console.warn('Could not read scenarios for project', projectName, e);
    }
    return scenarios;
  }

  function handleSelectProject(project) {
    const name = project.projectName;
    setSelectedProject(name);
    const scenarios = loadProjectScenarios(name);
    setSelectedProjectScenarios(scenarios);

    // if no scenarios, go straight into new scenario mode
    if (!scenarios || scenarios.length === 0) {
      selectProject(name);
    } else {
      // still notify parent which project is active
      selectProject(name);
    }
  }

  const filteredProjects = projects.filter(p =>
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Flex
      w="100vw"
      h="100vh"
      bg="#DDEBFA"
      align="center"
      justify="center"
      p={{ base: 4, md: 8 }}
    >
      <Box
        bg="white"
        w="100%"
        maxW="1100px"
        minH="520px"
        borderRadius="2xl"
        boxShadow="0 20px 40px rgba(13, 39, 80, 0.08)"
        p={{ base: 6, md: 10 }}
      >
        <VStack spacing={8} align="stretch">
          <Heading
            textAlign="center"
            fontSize="5xl"
            letterSpacing="-0.04em"
            color="#0F172A"
          >
            SimuBridge
          </Heading>

          <HStack align="stretch" spacing={6}>
            {/* LEFT COLUMN */}
            <VStack flex={1} spacing={4} align="stretch">
              <Text fontWeight="semibold" fontSize="sm" color="#0F172A">
                Start new project
              </Text>

              <Input
                placeholder="Enter new project name"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                bg="white"
                borderColor="#E2E8F0"
                _focus={{
                  borderColor: '#94C1F6',
                  boxShadow: '0 0 0 1px #94C1F6',
                }}
                borderRadius="lg"
                h="46px"
              />

              <Button
                onClick={handleCreateProject}
                isDisabled={!newProjectName}
                bg="#EAF4FF"
                _hover={{ bg: '#dfeeff' }}
                color="#0F172A"
                borderRadius="full"
                h="46px"
              >
                Create project
              </Button>

              <Button
                onClick={handleUploadViaUtil}
                bg="#121212"
                _hover={{ bg: '#000' }}
                color="white"
                borderRadius="full"
                h="46px"
              >
                Import Project from file
              </Button>

              {/* Dropzone */}
              <Box
                mt={2}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="#E2E8F0"
                bg="#FBFDFF"
                borderRadius="xl"
                h="150px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                color="#94A3B8"
                fontSize="sm"
                cursor="pointer"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                onDragOver={e => e.preventDefault()}
                onDrop={async e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files && e.dataTransfer.files[0];
                  if (file) await handleImportFromFileObj(file);
                }}
              >
                Click or drag file to this area to upload
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </VStack>

            {/* DIVIDER */}
            <Box
              position="relative"
              w="48px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                position="absolute"
                top="0"
                bottom="0"
                left="50%"
                transform="translateX(-50%)"
                w="1px"
                bg="#E2E8F0"
              />
              <Box
                bg="white"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="semibold"
                color="#94A3B8"
                boxShadow="sm"
                zIndex="1"
              >
                OR
              </Box>
            </Box>

            {/* RIGHT COLUMN */}
            <VStack flex={1} spacing={4} align="stretch">
              <Text fontWeight="semibold" fontSize="sm" color="#0F172A">
                Select existing project
              </Text>

              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                bg="white"
                borderColor="#E2E8F0"
                borderRadius="lg"
                h="46px"
              />

              <Box
                borderWidth="1px"
                borderColor="#E2E8F0"
                borderRadius="lg"
                bg="white"
                p={3}
                minH="190px"
                maxH="210px"
                overflowY="auto"
              >
                {filteredProjects.length === 0 ? (
                  <Box
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="#CBD5F5" fontSize="sm">
                      No projects yet
                    </Text>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {filteredProjects
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(project => (
                        <Button
                          key={project.projectName}
                          onClick={() => handleSelectProject(project)}
                          justifyContent="flex-start"
                          variant="outline"
                          borderColor="transparent"
                          _hover={{ bg: '#F5F7FA' }}
                          borderRadius="lg"
                          py={3}
                        >
                          <Box textAlign="left">
                            <Text fontWeight="medium" color="#0F172A">
                              {project.projectName}
                            </Text>
                            <Text fontSize="xs" color="#94A3B8">
                              Last change: {dateConverter(project.date)}
                            </Text>
                          </Box>
                        </Button>
                      ))}
                  </VStack>
                )}
              </Box>

              <Text fontWeight="semibold" fontSize="sm" color="#0F172A" mt={2}>
                Preview
              </Text>
              <Box
                borderWidth="1px"
                borderColor="#E2E8F0"
                borderRadius="lg"
                bg="white"
                p={3}
                minH="110px"
              >
                {!selectedProject ? (
                  <Text color="#94A3B8" fontSize="sm">
                    Select a project to preview its scenarios
                  </Text>
                ) : selectedProjectScenarios.length === 0 ? (
                  <Text color="#94A3B8" fontSize="sm">
                    No scenarios yet — opening project to create a new one...
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {selectedProjectScenarios.slice(0, 4).map(sc => (
                      <Box key={sc.scenarioName}>
                        <Text fontWeight="medium" color="#0F172A">
                          {sc.scenarioName}
                        </Text>
                        {sc.description ? (
                          <Text fontSize="xs" color="#94A3B8">
                            {sc.description}
                          </Text>
                        ) : null}
                      </Box>
                    ))}
                    {selectedProjectScenarios.length > 4 && (
                      <Text fontSize="xs" color="#94A3B8">
                        + {selectedProjectScenarios.length - 4} more...
                      </Text>
                    )}
                  </VStack>
                )}
              </Box>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}

export default StartView;

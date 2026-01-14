import React, { useState, useEffect, useRef } from "react";
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
} from "@chakra-ui/react";
import {
  getProjects,
  getScenarioFileName,
  setFile,
  updateProject,
  uploadFile,
  getScenarios,
} from "../../util/Storage";

/**
 * StartView
 * ---------
 * Landing screen of the application where the user can:
 * - Create a new project
 * - Import a project from a JSON file
 * - Search and open an existing project
 * - Preview scenarios inside a selected project before opening it
 *
 * This view interacts with the storage layer (IndexedDB / file utilities)
 * through helper functions located in ../../util/Storage.
 *
 * Props:
 * - selectProject(projectName): callback used to enter/open a project in the app
 */
function StartView({ selectProject }) {
  /**
   * Controlled input for creating a new project.
   */
  const [newProjectName, setNewProjectName] = useState("");

  /**
   * List of all projects loaded from storage.
   * Each project typically contains projectName and a last-modified date.
   */
  const [projects, setProjects] = useState([]);

  /**
   * Search term for filtering the project list.
   */
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Currently selected project name for the preview panel.
   */
  const [selectedProject, setSelectedProject] = useState(null);

  /**
   * Scenarios belonging to the selected project (shown in the Preview section).
   */
  const [selectedProjectScenarios, setSelectedProjectScenarios] = useState([]);

  /**
   * Reference to the hidden <input type="file"> so we can open it programmatically.
   */
  const fileInputRef = useRef();

  /**
   * Chakra toast for non-blocking success/error notifications.
   */
  const toast = useToast();

  /**
   * Load available projects once on component mount.
   * If storage returns null/undefined, fall back to an empty list.
   */
  useEffect(() => {
    getProjects().then((loadedProjects) => setProjects(loadedProjects || []));
  }, []);

  /**
   * dateConverter
   * -------------
   * Converts a date value into a readable string for UI display.
   * Format: DD/MM/YYYY HH:MM
   */
  function dateConverter(d) {
    if (!d) return "";
    const x = new Date(d);
    return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()} ${x
      .getHours()
      .toString()
      .padStart(2, "0")}:${x.getMinutes().toString().padStart(2, "0")}`;
  }

  /**
   * handleCreateProject
   * -------------------
   * Creates a new project and immediately opens it.
   *
   * Steps:
   * 1) Validate the project name
   * 2) updateProject creates or refreshes the project metadata in storage
   * 3) selectProject navigates into the project view
   */
  async function handleCreateProject() {
    if (!newProjectName) return;
    await updateProject(newProjectName);
    selectProject(newProjectName);
  }

  /**
   * handleImportFromFileObj
   * -----------------------
   * Imports a project from a JSON file object.
   *
   * Expected file content:
   * - JSON array of scenarios (each scenario has scenarioName, etc.)
   *
   * Project name decision:
   * - If file has a name, use the filename (without extension)
   * - Otherwise fall back to scenarios.projectName or "imported"
   *
   * Steps:
   * 1) Read file text and parse JSON
   * 2) Derive project name
   * 3) Store each scenario as a separate file using setFile()
   * 4) Update project metadata and open it
   * 5) Show toast on failure
   */
  async function handleImportFromFileObj(file) {
    try {
      const text = await file.text();
      const scenarios = JSON.parse(text);

      const projectName = file.name
        ? file.name.split(".")[0]
        : scenarios.projectName || "imported";

      await Promise.all(
        scenarios.map((scenario) => {
          const scenarioFileName = getScenarioFileName(scenario.scenarioName);
          return setFile(projectName, scenarioFileName, JSON.stringify(scenario));
        })
      );

      await updateProject(projectName);
      selectProject(projectName);
    } catch (err) {
      console.error("Import failed", err);
      toast({
        title: "Import failed",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  /**
   * handleFileInputChange
   * ---------------------
   * Triggered when the hidden file input changes (user picks a file).
   * It imports the first selected file.
   */
  async function handleFileInputChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) await handleImportFromFileObj(file);
  }

  /**
   * handleUploadViaUtil
   * -------------------
   * Alternative import flow using a helper (uploadFile) that returns:
   * - data: string content of the file
   * - name: filename
   *
   * This is useful if the storage utilities abstract file picking differently
   * than the standard <input type="file">.
   */
  async function handleUploadViaUtil() {
    const picked = await uploadFile();
    if (!picked) return;

    const { data, name } = picked;
    const scenarios = JSON.parse(data);
    const projectName = name.split(".")[0];

    await Promise.all(
      scenarios.map((scenario) => {
        const scenarioFileName = getScenarioFileName(scenario.scenarioName);
        return setFile(projectName, scenarioFileName, JSON.stringify(scenario));
      })
    );

    await updateProject(projectName);
    selectProject(projectName);
  }

  /**
   * loadProjectScenarios
   * --------------------
   * Loads all scenarios for a given project from storage.
   * This is used only for the preview panel (without opening the project).
   *
   * Steps:
   * 1) Read scenario files via getScenarios(projectName)
   * 2) Parse each file's data into an object
   * 3) Filter out invalid entries or entries without scenarioName
   */
  async function loadProjectScenarios(projectName) {
    try {
      const files = await getScenarios(projectName);
      if (!files || files.length === 0) return [];

      const scenarios = files
        .map((f) => {
          try {
            if (f && typeof f.data === "string") return JSON.parse(f.data);
            if (f && typeof f.data === "object") return f.data;
            return null;
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean)
        .filter((s) => s.scenarioName);

      return scenarios;
    } catch (e) {
      console.warn("Could not read scenarios for project", projectName, e);
      return [];
    }
  }

  /**
   * handleSelectProject
   * -------------------
   * Selects a project from the right-hand list.
   * It loads scenarios to show a preview. If there are no scenarios,
   * the project is opened immediately.
   */
  async function handleSelectProject(project) {
    const name = project.projectName;
    setSelectedProject(name);

    const scenarios = await loadProjectScenarios(name);
    setSelectedProjectScenarios(scenarios);

    if (!scenarios || scenarios.length === 0) {
      selectProject(name);
    }
  }

  /**
   * Filter the project list based on the search term.
   * The filtering is case-insensitive.
   */
  const filteredProjects = projects.filter((p) =>
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      w="100vw"
      h="100vh"
      bg="linear-gradient(135deg, #EBF5FF 0%, #F9FAFC 100%)"
      align="center"
      justify="center"
      p={{ base: 4, md: 8 }}
    >
      <Box
        bg="white"
        w="100%"
        maxW="1150px"
        borderRadius="2xl"
        boxShadow="0 20px 60px rgba(47, 128, 237, 0.12)"
        border="1px"
        borderColor="gray.100"
        p={{ base: 6, md: 10 }}
      >
        <VStack spacing={8} align="stretch" h="100%">
          <Heading
            textAlign="center"
            fontSize="3xl"
            letterSpacing="-0.04em"
            color="#0F172A"
          >
            SimuBridge
          </Heading>

          <HStack align="stretch" spacing={6} h="100%">
            <VStack flex={1} spacing={4} align="stretch">
              <Text fontWeight="semibold" fontSize="sm" color="#0F172A">
                Start new project
              </Text>

              <Input
                placeholder="Enter new project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                bg="white"
                borderColor="#E2E8F0"
                _focus={{
                  borderColor: "#94C1F6",
                  boxShadow: "0 0 0 1px #94C1F6",
                }}
                borderRadius="lg"
                h="46px"
              />

              <Button
                onClick={handleCreateProject}
                isDisabled={!newProjectName}
                bg="#EAF4FF"
                _hover={{ bg: "#dfeeff" }}
                color="#0F172A"
                borderRadius="full"
                h="46px"
              >
                Create project
              </Button>

              <Button
                onClick={handleUploadViaUtil}
                bg="#121212"
                _hover={{ bg: "#000" }}
                color="white"
                borderRadius="full"
                h="46px"
              >
                Import project from file
              </Button>

              <Box
                mt={2}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="#E2E8F0"
                bg="#FBFDFF"
                borderRadius="xl"
                h="240px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                color="#94A3B8"
                fontSize="sm"
                cursor="pointer"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
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
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />

              <Box flex="1" />
            </VStack>

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

            <VStack flex={1} spacing={4} align="stretch">
              <Text fontWeight="semibold" fontSize="sm" color="#0F172A">
                Select existing project
              </Text>

              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                minH="180px"
                maxH="200px"
                overflowY="auto"
              >
                {filteredProjects.length === 0 ? (
                  <Box h="100%" display="flex" alignItems="center" justifyContent="center">
                    <Text color="#CBD5F5" fontSize="sm">
                      No projects yet
                    </Text>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {filteredProjects
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((project) => (
                        <Button
                          key={project.projectName}
                          onClick={() => handleSelectProject(project)}
                          justifyContent="flex-start"
                          variant="outline"
                          borderColor="transparent"
                          _hover={{ bg: "#F5F7FA" }}
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

              <Text fontWeight="semibold" fontSize="sm" color="#0F172A">
                Preview
              </Text>

              <Box
                borderWidth="1px"
                borderColor="#E2E8F0"
                borderRadius="lg"
                bg="white"
                p={3}
                minH="120px"
                position="relative"
              >
                <Box>
                  {!selectedProject ? (
                    <Text color="#94A3B8" fontSize="sm">
                      Select a project to preview its scenarios
                    </Text>
                  ) : selectedProjectScenarios.length === 0 ? (
                    <Text color="#94A3B8" fontSize="sm">
                      No scenarios yet — opening project to create one...
                    </Text>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {selectedProjectScenarios.slice(0, 4).map((sc) => (
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

                {selectedProject && selectedProjectScenarios.length > 0 && (
                  <Button
                    position="absolute"
                    top={3}
                    right={3}
                    size="sm"
                    borderRadius="full"
                    bg="#EAF4FF"
                    _hover={{ bg: "#dfeeff" }}
                    color="#0F172A"
                    onClick={() => selectProject(selectedProject)}
                  >
                    Open project
                  </Button>
                )}
              </Box>

              <Box flex="1" />
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}

export default StartView;

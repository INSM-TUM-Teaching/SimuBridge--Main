import { useState, useEffect } from "react";
import {
  Button,
  Stack,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Box,
  SimpleGrid,
  Text,
  Icon,
  Badge,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  useDisclosure,
  Switch,
} from "@chakra-ui/react";
import OverviewTable from "./ScenarioOverviewTable";
import { Link, useNavigate } from "react-router-dom";
import CreateEmptyScenarioButton from "../CreateEmptyScenarioButton";
import {
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiPlus,
  FiGitBranch,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

const ITEMS_PER_PAGE = 5;

function OverviewPage({ getData, toast, setScenariosCompare }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [switchList, setSwitchList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const navigate = useNavigate();

  const scenarios = getData().getAllScenarios() || [];

  useEffect(() => {
    setScenariosCompare(switchList);
  }, [switchList, setScenariosCompare]);

  const handleCompareToggle = (id) => {
    setSwitchList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.scenarioName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalScenarios = scenarios.length;
  const filteredTotal = filteredScenarios.length;

  const totalPages =
    filteredTotal > 0 ? Math.ceil(filteredTotal / ITEMS_PER_PAGE) : 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentScenarios = filteredScenarios.slice(startIndex, endIndex);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  const handleEditScenario = (scenario) => {
    getData().setCurrentScenario(scenario);
    navigate("/scenario");
  };

  const handleDuplicateScenario = async (scenario) => {
    if (typeof scenario.duplicate === "function") {
      await scenario.duplicate();
      navigate(0);
    }
  };

  const handleDeleteScenario = async (scenario) => {
    if (typeof scenario.delete === "function") {
      await scenario.delete();
      navigate(0);
    }
  };

  const handleCompareNavigation = () => {
    onClose();
    navigate("/overview/compare");
  };

  return (
    <Box h="100vh" overflowY="auto" bg="#EAF4FF">
      <Box
        bg="linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%)"
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 7 }}
        borderBottom="1px"
        borderColor="gray.200"
      >
        <Flex align="center" justify="space-between" mb={6}>
          <Box>
            <Heading size="xl" fontWeight="800" mb={2} color="gray.800">
              Project Overview
            </Heading>
            <Text fontSize="md" color="gray.600">
              {getData().getProjectName()}
            </Text>
          </Box>

          <IconButton
            aria-label={statsCollapsed ? "Show overview stats" : "Hide overview stats"}
            onClick={() => setStatsCollapsed((prev) => !prev)}
            icon={
              <Icon
                as={statsCollapsed ? FiChevronDown : FiChevronUp}
                boxSize={6}
                color="blue.500"
                transition="transform 0.2s ease"
              />
            }
            bg="blue.50"
            borderRadius="xl"
            border="1px"
            borderColor="blue.100"
            _hover={{ bg: "blue.100" }}
            size="lg"
            variant="ghost"
          />
        </Flex>

        <Collapse in={!statsCollapsed} animateOpacity>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Box
              bg="white"
              borderRadius="xl"
              p={5}
              border="1px"
              borderColor="gray.200"
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            >
              <Flex align="center" justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  TOTAL SCENARIOS
                </Text>
                <Box bg="blue.50" p={2} borderRadius="lg">
                  <Icon as={FiLayers} boxSize={5} color="blue.500" />
                </Box>
              </Flex>
              <Text fontSize="4xl" fontWeight="800" mb={1} color="gray.800">
                {totalScenarios}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Active scenarios
              </Text>
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={5}
              border="1px"
              borderColor="gray.200"
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            >
              <Flex align="center" justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  CURRENT SCENARIO
                </Text>
                <Box bg="green.50" p={2} borderRadius="lg">
                  <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
                </Box>
              </Flex>
              <Text
                fontSize="xl"
                fontWeight="700"
                mb={1}
                noOfLines={1}
                color="gray.800"
              >
                {getData().getCurrentScenario()?.scenarioName || "None"}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Selected scenario
              </Text>
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={5}
              border="1px"
              borderColor="gray.200"
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            >
              <Flex align="center" justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  LAST UPDATED
                </Text>
                <Box bg="orange.50" p={2} borderRadius="lg">
                  <Icon as={FiClock} boxSize={5} color="orange.500" />
                </Box>
              </Flex>
              <Text fontSize="lg" fontWeight="700" mb={1} color="gray.800">
                Today
              </Text>
              <Text fontSize="sm" color="gray.500">
                Recent activity
              </Text>
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={5}
              border="1px"
              borderColor="gray.200"
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            >
              <Flex align="center" justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  STATUS
                </Text>
                <Box bg="purple.50" p={2} borderRadius="lg">
                  <Icon as={FiActivity} boxSize={5} color="purple.500" />
                </Box>
              </Flex>
              <Badge
                colorScheme="green"
                fontSize="md"
                px={3}
                py={1.5}
                borderRadius="lg"
                fontWeight="700"
                mb={1}
              >
                Ready
              </Badge>
              <Text fontSize="sm" color="gray.500">
                All systems operational
              </Text>
            </Box>
          </SimpleGrid>
        </Collapse>
      </Box>

      <Box px={{ base: 4, md: 8 }} py={6}>
        <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={6}>
          <Button
            leftIcon={<FiGitBranch />}
            size="lg"
            colorScheme="blue"
            bg="#2F80ED"
            color="white"
            onClick={onOpen}
            _hover={{ bg: "#1E6FD9", transform: "translateY(-2px)" }}
            boxShadow="0 4px 12px rgba(47, 128, 237, 0.3)"
            transition="all 0.3s"
            borderRadius="xl"
            fontWeight="600"
            px={8}
          >
            Compare Scenarios
          </Button>

          <CreateEmptyScenarioButton
            {...{ getData, toast }}
            leftIcon={<FiPlus />}
            size="lg"
            colorScheme="gray"
            variant="outline"
            borderColor="gray.300"
            borderWidth="2px"
            _hover={{ bg: "white", borderColor: "gray.400" }}
            borderRadius="xl"
            fontWeight="600"
            px={8}
          >
            Add Empty Scenario
          </CreateEmptyScenarioButton>

          <Button
            as={Link}
            to="/processminer"
            leftIcon={<FiPlus />}
            size="lg"
            colorScheme="gray"
            variant="outline"
            borderColor="gray.300"
            borderWidth="2px"
            _hover={{ bg: "white", borderColor: "gray.400" }}
            borderRadius="xl"
            fontWeight="600"
            px={8}
          >
            Add from Process Mining
          </Button>
        </Stack>

        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
          <ModalContent borderRadius="2xl" boxShadow="2xl">
            <ModalHeader
              borderBottom="1px"
              borderColor="gray.100"
              fontSize="xl"
              fontWeight="700"
            >
              Select Scenarios to Compare
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <Stack spacing={3}>
                {scenarios.map((s) => (
                  <Flex
                    key={s.scenarioName}
                    align="center"
                    justify="space-between"
                    p={4}
                    bg={switchList.includes(s.scenarioName) ? "blue.50" : "gray.50"}
                    borderRadius="xl"
                    border="2px"
                    borderColor={
                      switchList.includes(s.scenarioName) ? "blue.300" : "gray.200"
                    }
                    transition="all 0.2s"
                    _hover={{
                      borderColor: switchList.includes(s.scenarioName)
                        ? "blue.400"
                        : "gray.300",
                    }}
                  >
                    <Text fontSize="sm" fontWeight="600" color="gray.700">
                      {s.scenarioName}
                    </Text>
                    <Switch
                      isChecked={switchList.includes(s.scenarioName)}
                      onChange={() => handleCompareToggle(s.scenarioName)}
                      colorScheme="blue"
                      size="lg"
                    />
                  </Flex>
                ))}
              </Stack>
            </ModalBody>
            <ModalFooter borderTop="1px" borderColor="gray.100">
              <Button
                colorScheme="blue"
                bg="#2F80ED"
                mr={3}
                onClick={handleCompareNavigation}
                isDisabled={switchList.length < 2}
                size="lg"
                borderRadius="xl"
                fontWeight="600"
              >
                Compare Selected
              </Button>
              <Button variant="ghost" onClick={onClose} size="lg" borderRadius="xl">
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Card
          bg="white"
          borderRadius="2xl"
          boxShadow="lg"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={5}>
            <Flex align="center" justify="space-between" mb={4}>
              <Box>
                <Heading size="lg" color="#0F172A" mb={2} fontWeight="700">
                  All Scenarios
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  View and manage your simulation scenarios
                </Text>
              </Box>
            </Flex>

            <InputGroup size="md" maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={handleSearchChange}
                borderRadius="lg"
                bg="gray.50"
                border="1px"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300", bg: "white" }}
                _focus={{
                  borderColor: "blue.400",
                  bg: "white",
                  boxShadow: "0 0 0 1px #3182CE",
                }}
              />
            </InputGroup>
          </CardHeader>

          <CardBody>
            {filteredTotal > 0 ? (
              <>
                <OverviewTable
                  scenarios={currentScenarios}
                  onEdit={handleEditScenario}
                  onDuplicate={handleDuplicateScenario}
                  onDelete={handleDeleteScenario}
                />

                {totalPages > 1 && (
                  <Flex
                    justify="space-between"
                    align="center"
                    mt={6}
                    pt={4}
                    borderTop="1px"
                    borderColor="gray.100"
                    flexWrap="wrap"
                    gap={4}
                  >
                    <Text fontSize="sm" color="gray.600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredTotal)} of{" "}
                      {filteredTotal} {searchQuery ? "filtered" : ""} scenarios
                    </Text>

                    <Flex gap={2} align="center">
                      <IconButton
                        icon={<FiChevronLeft />}
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        isDisabled={currentPage === 1}
                        aria-label="Previous page"
                        borderRadius="lg"
                      />

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? "solid" : "outline"}
                          colorScheme={currentPage === page ? "blue" : "gray"}
                          onClick={() => setCurrentPage(page)}
                          borderRadius="lg"
                          minW="40px"
                        >
                          {page}
                        </Button>
                      ))}

                      <IconButton
                        icon={<FiChevronRight />}
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        isDisabled={currentPage === totalPages}
                        aria-label="Next page"
                        borderRadius="lg"
                      />
                    </Flex>
                  </Flex>
                )}
              </>
            ) : (
              <Box textAlign="center" py={16}>
                <Box
                  bg="gray.50"
                  w={20}
                  h={20}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={6}
                >
                  <Icon as={FiLayers} boxSize={10} color="gray.400" />
                </Box>

                <Heading size="md" color="gray.600" mb={3} fontWeight="600">
                  No scenarios yet
                </Heading>

                <Text color="gray.500" fontSize="md" mb={6}>
                  Get started by creating your first scenario
                </Text>

                <Stack
                  direction={{ base: "column", sm: "row" }}
                  spacing={4}
                  justify="center"
                >
                  <Button
                    as={Link}
                    to="/processminer"
                    colorScheme="blue"
                    bg="#2F80ED"
                    size="lg"
                    leftIcon={<FiPlus />}
                    borderRadius="xl"
                    fontWeight="600"
                  >
                    Create from Process Mining
                  </Button>

                  <CreateEmptyScenarioButton
                    variant="outline"
                    size="lg"
                    leftIcon={<FiPlus />}
                    borderRadius="xl"
                    fontWeight="600"
                    {...{ getData, toast, label: "Create Empty Scenario" }}
                  />
                </Stack>
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}

export default OverviewPage;

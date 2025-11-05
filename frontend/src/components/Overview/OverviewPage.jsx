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
} from '@chakra-ui/react';

import { useState } from 'react';
import { Switch } from '@chakra-ui/react';

import OverviewTable from '../TablesOverviewComparison/ScenarioOverviewTable';

import { useDisclosure } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

import CreateEmptyScenarioButton from '../CreateEmptyScenarioButton';
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
} from 'react-icons/fi';

function OverviewPage({ getData, toast, setScenariosCompare }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  let [switches, setSwitches] = useState([]);
  const [switches_temp] = useState([]);
  const [switchList, setSwitchList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 5;

  const handleChange = id => {
    setSwitches(
      switches.map(item => {
        if (item.id === id) {
          item.value = !item.value;
          if (switchList.includes(id)) {
            setSwitchList(switchList.filter(switchId => item.id !== switchId));
          } else {
            setSwitchList([...switchList, id]);
          }
        }
        return item;
      })
    );
  };

  switches_temp.length = 0;
  getData()
    .getAllScenarios()
    .map(element => {
      switches_temp.push({ id: element.scenarioName, value: true });
    });

  switches = switches_temp;
  setScenariosCompare(switchList);

  const scenarios = getData().getAllScenarios() || [];

  // Filter scenarios based on search query
  const filteredScenarios = scenarios.filter(scenario =>
    scenario.scenarioName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalScenarios = filteredScenarios.length;
  const totalPages = Math.ceil(totalScenarios / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentScenarios = filteredScenarios.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = e => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Box h="100vh" overflowY="auto" bg="#EAF4FF">
      {/* Top Header Bar with Subtle Gradient */}
      <Box
        bg="linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%)"
        px={{ base: 4, md: 8 }}
        py={8}
        borderBottom="1px"
        borderColor="gray.200"
      >
        <Flex align="center" justify="space-between" mb={6}>
          <Box>
            <Heading size="xl" fontWeight="800" mb={2} color="gray.800">
              Project Overview
            </Heading>
            <Text fontSize="md" color="gray.600">
              {getData().projectName}
            </Text>
          </Box>
          <Box
            bg="blue.50"
            p={4}
            borderRadius="xl"
            border="1px"
            borderColor="blue.100"
          >
            <Icon as={FiLayers} boxSize={8} color="blue.500" />
          </Box>
        </Flex>

        {/* Stats Cards in Header */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          {/* Total Scenarios */}
          <Box
            bg="white"
            borderRadius="xl"
            p={5}
            border="1px"
            borderColor="gray.200"
            boxShadow="sm"
            transition="all 0.3s"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-2px)',
            }}
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

          {/* Current Scenario */}
          <Box
            bg="white"
            borderRadius="xl"
            p={5}
            border="1px"
            borderColor="gray.200"
            boxShadow="sm"
            transition="all 0.3s"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-2px)',
            }}
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
              {getData().getCurrentScenario()?.scenarioName || 'None'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Selected scenario
            </Text>
          </Box>

          {/* Last Updated */}
          <Box
            bg="white"
            borderRadius="xl"
            p={5}
            border="1px"
            borderColor="gray.200"
            boxShadow="sm"
            transition="all 0.3s"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-2px)',
            }}
          >
            <Flex align="center" justify="space-between" mb={3}>
              <Text fontSize="sm" fontWeight="600" color="gray.600">
                LAST UPDATED
              </Text>
              <Box bg="orange.50" p={2} borderRadius="lg">
                <Icon as={FiClock} boxSize={5} color="orange.500" />
              </Box>
            </Flex>
            <Text fontSize="2xl" fontWeight="700" mb={1} color="gray.800">
              Today
            </Text>
            <Text fontSize="sm" color="gray.500">
              Recent activity
            </Text>
          </Box>

          {/* Status */}
          <Box
            bg="white"
            borderRadius="xl"
            p={5}
            border="1px"
            borderColor="gray.200"
            boxShadow="sm"
            transition="all 0.3s"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-2px)',
            }}
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
      </Box>

      {/* Main Content Area */}
      <Box px={{ base: 4, md: 8 }} py={6}>
        {/* Action Buttons */}
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={6}>
          <Button
            leftIcon={<FiGitBranch />}
            size="lg"
            colorScheme="blue"
            bg="#2F80ED"
            color="white"
            onClick={onOpen}
            _hover={{ bg: '#1E6FD9', transform: 'translateY(-2px)' }}
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
            _hover={{ bg: 'white', borderColor: 'gray.400' }}
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
            _hover={{ bg: 'white', borderColor: 'gray.400' }}
            borderRadius="xl"
            fontWeight="600"
            px={8}
          >
            Add from Process Mining
          </Button>
        </Stack>

        {/* Modal for scenario comparison */}
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
                {switches.map(switch1 => (
                  <Flex
                    key={switch1.id}
                    align="center"
                    justify="space-between"
                    p={4}
                    bg={switchList.includes(switch1.id) ? 'blue.50' : 'gray.50'}
                    borderRadius="xl"
                    border="2px"
                    borderColor={
                      switchList.includes(switch1.id) ? 'blue.300' : 'gray.200'
                    }
                    transition="all 0.2s"
                    _hover={{
                      borderColor: switchList.includes(switch1.id)
                        ? 'blue.400'
                        : 'gray.300',
                    }}
                  >
                    <Text fontSize="sm" fontWeight="600" color="gray.700">
                      {switch1.id}
                    </Text>
                    <Switch
                      checked={switch1.value}
                      onChange={() => handleChange(switch1.id)}
                      isChecked={switchList.includes(switch1.id)}
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
                onClick={onClose}
                as={Link}
                to="/overview/compare"
                isDisabled={switchList.length < 2}
                size="lg"
                borderRadius="xl"
                fontWeight="600"
              >
                Compare Selected
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                size="lg"
                borderRadius="xl"
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Scenarios Table */}
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

            {/* Search Bar */}
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
                _hover={{ borderColor: 'gray.300', bg: 'white' }}
                _focus={{
                  borderColor: 'blue.400',
                  bg: 'white',
                  boxShadow: '0 0 0 1px #3182CE',
                }}
              />
            </InputGroup>
          </CardHeader>
          <CardBody>
            {totalScenarios > 0 ? (
              <>
                <OverviewTable getData={getData} scenarios={currentScenarios} />

                {/* Pagination */}
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
                      Showing {startIndex + 1} to{' '}
                      {Math.min(endIndex, totalScenarios)} of {totalScenarios}{' '}
                      {searchQuery ? 'filtered' : ''} scenarios
                    </Text>
                    <Flex gap={2} align="center">
                      <IconButton
                        icon={<FiChevronLeft />}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCurrentPage(prev => Math.max(1, prev - 1))
                        }
                        isDisabled={currentPage === 1}
                        aria-label="Previous page"
                        borderRadius="lg"
                      />

                      {/* Show page numbers with ellipsis for many pages */}
                      {totalPages <= 7 ? (
                        // Show all pages if 7 or fewer
                        Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          page => (
                            <Button
                              key={page}
                              size="sm"
                              variant={
                                currentPage === page ? 'solid' : 'outline'
                              }
                              colorScheme={
                                currentPage === page ? 'blue' : 'gray'
                              }
                              onClick={() => setCurrentPage(page)}
                              borderRadius="lg"
                              minW="40px"
                            >
                              {page}
                            </Button>
                          )
                        )
                      ) : (
                        // Show ellipsis for many pages
                        <>
                          <Button
                            size="sm"
                            variant={currentPage === 1 ? 'solid' : 'outline'}
                            colorScheme={currentPage === 1 ? 'blue' : 'gray'}
                            onClick={() => setCurrentPage(1)}
                            borderRadius="lg"
                            minW="40px"
                          >
                            1
                          </Button>

                          {currentPage > 3 && (
                            <Text color="gray.400" px={2}>
                              ...
                            </Text>
                          )}

                          {Array.from({ length: 3 }, (_, i) => {
                            const page = currentPage - 1 + i;
                            if (page > 1 && page < totalPages) {
                              return (
                                <Button
                                  key={page}
                                  size="sm"
                                  variant={
                                    currentPage === page ? 'solid' : 'outline'
                                  }
                                  colorScheme={
                                    currentPage === page ? 'blue' : 'gray'
                                  }
                                  onClick={() => setCurrentPage(page)}
                                  borderRadius="lg"
                                  minW="40px"
                                >
                                  {page}
                                </Button>
                              );
                            }
                            return null;
                          })}

                          {currentPage < totalPages - 2 && (
                            <Text color="gray.400" px={2}>
                              ...
                            </Text>
                          )}

                          <Button
                            size="sm"
                            variant={
                              currentPage === totalPages ? 'solid' : 'outline'
                            }
                            colorScheme={
                              currentPage === totalPages ? 'blue' : 'gray'
                            }
                            onClick={() => setCurrentPage(totalPages)}
                            borderRadius="lg"
                            minW="40px"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}

                      <IconButton
                        icon={<FiChevronRight />}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCurrentPage(prev => Math.min(totalPages, prev + 1))
                        }
                        isDisabled={currentPage === totalPages}
                        aria-label="Next page"
                        borderRadius="lg"
                      />
                    </Flex>
                  </Flex>
                )}

                {/* No results message */}
                {searchQuery && totalScenarios === 0 && (
                  <Box textAlign="center" py={8}>
                    <Icon as={FiSearch} boxSize={12} color="gray.300" mb={4} />
                    <Text
                      color="gray.600"
                      fontSize="md"
                      fontWeight="600"
                      mb={2}
                    >
                      No scenarios found
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                      Try adjusting your search query
                    </Text>
                  </Box>
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
                  direction={{ base: 'column', sm: 'row' }}
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
                    {...{ getData, toast, label: 'Create Empty Scenario' }}
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

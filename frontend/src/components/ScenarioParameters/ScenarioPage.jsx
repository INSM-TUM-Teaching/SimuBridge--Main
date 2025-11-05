import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stack,
  Button,
  CardHeader,
  TableContainer,
  IconButton,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { FiEdit2 } from 'react-icons/fi';
import { EditorSidebarAlternate } from '../EditorSidebar/EditorSidebar';
import EditScenario from '../EditorSidebar/Scenario/EditScenario';
import ScenarioOverview from '../Overview/ScenarioOverview';

const ScenarioPage = ({ getData, setCurrentRightSideBar }) => {
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (showSidebar) {
      setCurrentRightSideBar(
        <EditorSidebarAlternate
          title="Edit Scenario"
          content={<EditScenario {...{ getData, setShowSidebar }} />}
        />
      );
    } else {
      setCurrentRightSideBar(undefined);
    }
  }, [showSidebar, getData().getCurrentScenario()]);

  const scenario = getData().getCurrentScenario();

  return (
    <Box h="93vh" p={{ base: 4, md: 6 }} overflowY="auto" bg="#EAF4FF">
      <Stack spacing={6}>
        {/* Page Header */}
        <Box>
          <Flex align="center" gap={3} mb={2}>
            <Heading size="lg" color="#0F172A">
              Scenario Configuration
            </Heading>
            <Badge
              colorScheme="blue"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {scenario?.scenarioName}
            </Badge>
          </Flex>
          <Text color="gray.600" fontSize="sm">
            Configure general parameters for your scenario
          </Text>
        </Box>

        {/* General Parameters Card */}
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
            <Flex align="center" justify="space-between">
              <Box>
                <Heading size="md" color="#0F172A" mb={1}>
                  General Parameters
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Basic configuration settings
                </Text>
              </Box>
              <Button
                leftIcon={<FiEdit2 />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => setShowSidebar(true)}
              >
                Edit
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr bg="gray.50">
                    <Th
                      color="gray.700"
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Name
                    </Th>
                    <Th
                      color="gray.700"
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Starting Date
                    </Th>
                    <Th
                      color="gray.700"
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Starting Time
                    </Th>
                    <Th
                      color="gray.700"
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Instances
                    </Th>
                    <Th
                      color="gray.700"
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Currency
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {scenario && (
                    <Tr _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                      <Td fontWeight="500" color="gray.900">
                        {scenario.scenarioName}
                      </Td>
                      <Td color="gray.600">{scenario.startingDate || '—'}</Td>
                      <Td color="gray.600">{scenario.startingTime || '—'}</Td>
                      <Td color="gray.600">
                        {scenario.numberOfInstances || '—'}
                      </Td>
                      <Td color="gray.600">{scenario.currency || '—'}</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Scenario Overview */}
        <ScenarioOverview {...{ getData }} />
      </Stack>
    </Box>
  );
};

export default ScenarioPage;

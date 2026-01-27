/**
 * This page is a dashboard for Resources in the currently selected scenario
 * 
 * It answers 2 questions:
 * - Which resources are assigned to the role?
 * - Which resources are not assigned to the role?
 * 
 * This page shows:
 * - A top summary:
 *  -> How many Roles are available?
 *  -> How many Resources are available in total?
 *  -> How many Resources are assigned to roles?
 *  -> How many Resources are not assigned to roles?
 * - A table listing each role and reosurces assigned to that role
 * - A list of all unassigned resources
 * 
 * It does not create or edit resources directly
 * It displays them and uses SideBar Buttons where you can edit them directly
 */
import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Stack,
  Heading,
  Text,
  CardHeader,
  Badge,
  SimpleGrid,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { RiTeamLine, RiGroupLine, RiUserAddLine, RiAlertLine } from 'react-icons/ri';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import ResourceNavigation from '../ResourceNavigation';

/**
 * SideBarContentSetterButton component that renders a button
 * When clicked it shows the sidebar content to edit that item
 * Used for roles and resources
 */
function ResourceOverview({ SideBarContentSetterButton, setCurrent, getData }) {
  useEffect(() => {
    setCurrent('Resource Parameters');
  }, [setCurrent]);

  // detailsCollapsed is responsible for showing the top overview bar whether visible or collapsed
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  const scenario = getData().getCurrentScenario();
  const { resourceParameters } = scenario;
  const { roles, resources } = resourceParameters;
  const assignedResourceIds = [
    ...new Set(
      roles
        .map(x => x.resources)
        .flat()
        .map(y => y.id)
    ),
  ];
  const allResources = resources.map(x => x.id);
  const unassignedResources = allResources.filter(
    resource => !assignedResourceIds.includes(resource)
  );

  /**
   * headerStats is an array describing what to show in a top header summary box
   * - label: name of the box
   * - value: number shown
   * - helper: small explanation under
   * - icon: special icon for the box
   */
  const headerStats = [
    {
      key: 'roles',
      label: 'Roles',
      value: roles.length,
      helper: roles.length === 1 ? 'Role configured' : 'Roles configured',
      icon: RiTeamLine,
    },
    {
      key: 'resources',
      label: 'Resources',
      value: resources.length,
      helper:
        resources.length === 1
          ? 'Resource available'
          : 'Resources available',
      icon: RiGroupLine,
    },
    {
      key: 'assigned',
      label: 'Assigned',
      value: assignedResourceIds.length,
      helper:
        assignedResourceIds.length === 1
          ? 'Resource mapped to a role'
          : 'Resources mapped to roles',
      icon: RiUserAddLine,
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      value: unassignedResources.length,
      helper:
        unassignedResources.length > 0
          ? 'Awaiting allocation'
          : 'All resources assigned',
      icon: RiAlertLine,
    },
  ];

  // wideContainer is responsible for responsive width settings 
  // It limits max width on large screens so that layout stay nice
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
      py={{ base: 2, md: 3 }}
    >
      <Stack spacing={3} maxW={wideContainer} mx="auto">
        {/* Top Header which includes title, description and summary boxes*/}
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
                  Resource Control Center
                </Heading>
                <Text color="whiteAlpha.800" maxW="3xl">
                  Track scenario roles and allocations to keep every resource mapped and
                  ready.
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
            {/* If the button to collaps summary is not pressed, then show the summary boxes*/}
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
                    <Flex justify="space-between" mb={3} align="center">
                      <Text
                        fontSize="xs"
                        letterSpacing="0.18em"
                        textTransform="uppercase"
                        color="whiteAlpha.700"
                      >
                        {stat.label}
                      </Text>
                      <Icon as={stat.icon} boxSize={5} color="whiteAlpha.900" />
                    </Flex>
                    <Text fontSize="2xl" fontWeight="700">
                      {stat.value}
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {stat.helper}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </CardBody>
        </Card>

        <Card
          bg="white"
          borderRadius="2xl"
          border="1px solid rgba(15, 23, 42, 0.08)"
          boxShadow="lg"
        >
          <CardBody>
            <ResourceNavigation currentTab="overview" />
          </CardBody>
        </Card>

        {/* Main content: assigned table + unassigned list */}
        <Stack spacing={4}>
          {/* Assigned resources table */}
          <Card
            bg="white"
            borderRadius="2xl"
            boxShadow="sm"
            border="1px"
            borderColor="gray.100"
          >
            <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
              <Flex align="center" justify="space-between">
                <Box>
                  <Heading size="md" color="#0F172A" mb={1}>
                    Assigned Resources
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    Resources assigned to roles
                  </Text>
                </Box>
                {/* Badge showing how many resources are assigned to the roles */}
                <Badge
                  colorScheme="blue"
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {assignedResourceIds.length} assigned
                </Badge>
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
                        Role
                      </Th>
                      <Th
                        color="gray.700"
                        fontWeight="600"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Assigned Resources
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {roles.map(element => {
                      return (
                        <Tr
                          key={element.id}
                          _hover={{ bg: 'gray.50' }}
                          transition="background 0.2s"
                        >
                          <Td fontWeight="500" color="gray.900">
                            <SideBarContentSetterButton
                              type="role"
                              id={element.id}
                              variant="outline"
                              size="sm"
                            />
                          </Td>
                          <Td>
                            <Flex gap={2} flexWrap="wrap">
                              {element.resources.map(resource => (
                                <SideBarContentSetterButton
                                  key={resource.id}
                                  type="resource"
                                  id={resource.id}
                                  size="sm"
                                />
                              ))}
                            </Flex>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          {/* Unassigned Resources table */}
          <Card
            bg="white"
            borderRadius="2xl"
            boxShadow="sm"
            border="1px"
            borderColor="gray.100"
          >
            <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
              <Flex align="center" justify="space-between">
                <Box>
                  <Heading size="md" color="#0F172A" mb={1}>
                    Unassigned Resources
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    Resources not yet assigned to any role
                  </Text>
                </Box>
                {/* Badge changes color if there are unassigned resources from gray to orange */}
                <Badge
                  colorScheme={unassignedResources.length > 0 ? 'orange' : 'gray'}
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {unassignedResources.length} unassigned
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              {unassignedResources.length > 0 ? (
                <Flex alignItems="center" gap={2} flexWrap="wrap">
                  {unassignedResources.map(id => {
                    return (
                      <SideBarContentSetterButton
                        key={id}
                        type="resource"
                        id={id}
                        size="sm"
                      />
                    );
                  })}
                </Flex>
              ) : (
                // If all resources are assigned to roles show a message informing user about that
                <Text color="gray.500" fontSize="sm">
                  All resources are assigned to roles
                </Text>
              )}
            </CardBody>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}

export default ResourceOverview;

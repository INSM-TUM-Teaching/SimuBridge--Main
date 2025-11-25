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

function ResourceOverview({ SideBarContentSetterButton, setCurrent, getData }) {
  useEffect(() => {
    setCurrent('Resource Parameters');
  }, [setCurrent]);
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

        <Stack spacing={4}>
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


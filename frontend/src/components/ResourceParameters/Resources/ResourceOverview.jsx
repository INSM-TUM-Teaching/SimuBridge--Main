import { useEffect } from 'react';
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
} from '@chakra-ui/react';
import ResourceNavigation from '../ResourceNavigation';

function ResourceOverview({ SideBarContentSetterButton, setCurrent, getData }) {
  useEffect(() => {
    setCurrent('Resource Parameters');
  }, [setCurrent]);

  const assignedResources = getData()
    .getCurrentScenario()
    .resourceParameters.roles.map(x => x.resources)
    .flat()
    .map(y => y.id);
  const allResources = getData()
    .getCurrentScenario()
    .resourceParameters.resources.map(x => x.id);
  let unassignedResources = allResources.filter(
    resource => !assignedResources.includes(resource)
  );

  return (
    <Box h="93vh" overflowY="auto" p={{ base: 4, md: 6 }} bg="#EAF4FF">
      <Stack spacing={6}>
        {/* Page Header */}
        <Box>
          <Heading size="lg" color="#0F172A" mb={2}>
            Resource Management
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage roles and resource assignments
          </Text>
        </Box>

        {/* Navigation */}
        <ResourceNavigation currentTab="overview" />

        {/* Assigned Resources Card */}
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
                {assignedResources.length} assigned
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
                  {getData()
                    .getCurrentScenario()
                    .resourceParameters.roles.map(element => {
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

        {/* Unassigned Resources Card */}
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
    </Box>
  );
}

export default ResourceOverview;

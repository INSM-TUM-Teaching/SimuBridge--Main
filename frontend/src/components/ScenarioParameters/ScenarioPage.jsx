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

const ScenarioPage = ({
  getData,
  setCurrentRightSideBar,
  sidebarsCollapsed,
  toggleSidebars,
}) => {
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (showSidebar && !sidebarsCollapsed) {
      setCurrentRightSideBar(
        <EditorSidebarAlternate
          title="Edit Scenario"
          content={<EditScenario {...{ getData, setShowSidebar }} />}
          collapsed={sidebarsCollapsed}
          onToggle={toggleSidebars}
          onClose={() => setShowSidebar(false)}
        />
      );
    } else {
      setCurrentRightSideBar(undefined);
    }
  }, [showSidebar, sidebarsCollapsed, getData]);

  const scenario = getData().getCurrentScenario();

  return (
    <Box h="93vh" p={{ base: 4, md: 6 }} overflowY="auto" bg="#EAF4FF">
      <Stack spacing={6}>
        {/* Header ... */}

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

              {sidebarsCollapsed ? (
                <IconButton
                  aria-label="Edit scenario"
                  icon={<FiEdit2 />}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => setShowSidebar(prev => !prev)}
                />
              ) : (
                <Button
                  leftIcon={<FiEdit2 />}
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => setShowSidebar(true)}
                >
                  Edit
                </Button>
              )}
            </Flex>
          </CardHeader>

          <CardBody>
            <TableContainer>{/* your table unchanged */}</TableContainer>

            {sidebarsCollapsed && showSidebar && (
              <Box
                mt={4}
                p={4}
                borderRadius="lg"
                bg="blue.50"
                border="1px solid"
                borderColor="blue.100"
              >
                <Heading size="sm" mb={2} color="blue.900">
                  Edit Scenario
                </Heading>
                <EditScenario {...{ getData, setShowSidebar }} />
              </Box>
            )}
          </CardBody>
        </Card>

        <ScenarioOverview {...{ getData }} />
      </Stack>
    </Box>
  );
};

export default ScenarioPage;

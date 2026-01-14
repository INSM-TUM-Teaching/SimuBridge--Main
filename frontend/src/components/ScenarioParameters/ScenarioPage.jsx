import { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { FiEdit2 } from "react-icons/fi";
import { EditorSidebarAlternate } from "../EditorSidebar/EditorSidebar";
import EditScenario from "../EditorSidebar/Scenario/EditScenario";
import ScenarioOverview from "../Overview/ScenarioOverview";

/**
 * ScenarioPage
 * ------------
 * Center-page view for inspecting one selected scenario (general parameters)
 * and optionally editing it through the right sidebar (or inline in collapsed mode).
 *
 * Key UI behavior:
 * - When the right sidebar is available (not collapsed), editing opens an alternate sidebar.
 * - When the sidebar is collapsed (compact layout), editing appears inside the page as an inline panel.
 *
 * Props:
 * - getData: project data accessor (provides getCurrentScenario, etc.)
 * - setCurrentRightSideBar: function from App to render the current right sidebar content
 * - sidebarsCollapsed: indicates whether the global sidebar layout is collapsed
 * - toggleSidebars: toggles global sidebar collapsed/expanded state
 */
const ScenarioPage = ({
  getData,
  setCurrentRightSideBar,
  sidebarsCollapsed,
  toggleSidebars,
}) => {
  /**
   * showSidebar controls whether the "Edit Scenario" UI is visible.
   * In expanded layout it becomes a right sidebar.
   * In collapsed layout it becomes an inline editing panel.
   */
  const [showSidebar, setShowSidebar] = useState(false);

  /**
   * Synchronize right sidebar content with local "showSidebar" state.
   *
   * If editing is requested AND the sidebar layout is not collapsed:
   * - inject EditorSidebarAlternate into the right sidebar region
   *
   * Otherwise:
   * - clear the right sidebar so the main page gets full width
   *
   * Note: getData is included to ensure the editor uses the latest scenario data accessor.
   */
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

  /**
   * scenario holds the currently selected scenario from the global project data.
   * This data is used to render the general parameters table and any summary info.
   */
  const scenario = getData().getCurrentScenario();

  return (
    <Box h="93vh" p={{ base: 4, md: 6 }} overflowY="auto" bg="#EAF4FF">
      <Stack spacing={6}>
        {/*
          Header area can be added here (title, breadcrumbs, scenario name, badges, etc.)
          The comment in the original file indicates that section is intentionally omitted.
        */}

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

              {/*
                Edit button behavior depends on sidebar layout:
                - If collapsed: show a compact icon button and toggle inline edit panel
                - If not collapsed: show a labeled button and open the right sidebar editor
              */}
              {sidebarsCollapsed ? (
                <IconButton
                  aria-label="Edit scenario"
                  icon={<FiEdit2 />}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => setShowSidebar((prev) => !prev)}
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
            {/*
              TableContainer would hold the scenario parameters table.
              The original snippet keeps the table "unchanged", meaning it exists elsewhere
              or is intentionally omitted here for brevity.
            */}
            <TableContainer>{/* your table unchanged */}</TableContainer>

            {/*
              Inline edit panel:
              Only shown when sidebars are collapsed AND the user toggled editing on.
              This avoids requiring a full right sidebar when screen space is limited.
            */}
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

        {/*
          ScenarioOverview is a secondary section that likely shows scenario details,
          model summaries, or other high-level information (read-only overview).
        */}
        <ScenarioOverview {...{ getData }} />
      </Stack>
    </Box>
  );
};

export default ScenarioPage;

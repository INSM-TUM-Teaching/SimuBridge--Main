import React, { useState } from "react";
import {
  Input,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Stack,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Heading,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Icon,
} from "@chakra-ui/react";

import SimulationModelModdle from "simulation-bridge-datamodel/DataModel";
import { FiArrowLeft, FiUserPlus, FiUser, FiCalendar } from "react-icons/fi";
import EditorSidebarButton from "../EditorSidebarButton";

/**
 * AddRole
 * -------
 * Sidebar form component for creating a new Role in the current scenario.
 *
 * Responsibilities:
 * - Maintain local form state for role fields (id, schedule)
 * - Create a new "simulationmodel:Role" object via the model factory (Moddle)
 * - Add the new role to scenario.resourceParameters.roles
 * - Persist changes via getData().saveCurrentScenario()
 * - Support two UI modes:
 *   (1) Expanded sidebar: full form shown inline
 *   (2) Collapsed sidebar: button opens a Popover containing the form
 *
 * Props:
 * - getData: data-layer accessor that provides getCurrentScenario() and saveCurrentScenario()
 * - setCurrent: used to navigate back to another editor view (e.g., "Resource Parameters")
 * - collapsed: when true, render the compact Popover-based UI
 */
const AddRole = ({ getData, setCurrent, collapsed = false }) => {
  /**
   * Local form state for controlled inputs.
   * - id: role identifier/name
   * - schedule: timetable ID to set as the default schedule for this role
   */
  const [state, setState] = useState({
    id: "",
    schedule: "",
  });

  /**
   * handleInputChange
   * -----------------
   * Generic handler for Input and Select controls.
   * Uses the "name" attribute to decide which state field to update.
   */
  const handleInputChange = (evt) => {
    const { name, value } = evt.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * clear
   * -----
   * Reset the form after a successful role creation.
   */
  const clear = () => {
    setState({ id: "", schedule: "" });
  };

  /**
   * onSubmit
   * --------
   * Create a new Role model object and attach it to the current scenario.
   *
   * Steps:
   * 1) Prevent default browser form submission
   * 2) Create a "simulationmodel:Role" object using Moddle
   * 3) Push it into scenario.resourceParameters.roles
   * 4) Save scenario changes
   * 5) Clear the form for the next entry
   */
  const onSubmit = (evt) => {
    evt.preventDefault();

    const role = SimulationModelModdle.getInstance().create("simulationmodel:Role", {
      id: state.id,
      schedule: state.schedule,
      resources: [],
    });

    const scenario = getData().getCurrentScenario();
    scenario.resourceParameters.roles.push(role);

    getData().saveCurrentScenario();
    clear();
  };

  /**
   * formFields
   * ----------
   * Renders the actual form UI. It is reused in:
   * - Expanded sidebar view (compact=false)
   * - Popover body in collapsed mode (compact=true)
   *
   * compact=false:
   * - Shows FormLabel labels and normal padding
   *
   * compact=true:
   * - Uses icons + tooltips instead of labels to save space
   * - Uses smaller input sizes
   */
  const formFields = (compact) => (
    <Stack gap="2" mt={compact ? 0 : 4}>
      <FormControl>
        {!compact && <FormLabel>Name:</FormLabel>}

        <InputGroup>
          {compact && (
            <Tooltip label="Name" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiUser} />
              </InputLeftElement>
            </Tooltip>
          )}

          <Input
            name="id"
            bg="white"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 4}
            value={state.id}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Select default timetable:</FormLabel>}

        <InputGroup>
          {compact && (
            <Tooltip label="Timetable" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} />
              </InputLeftElement>
            </Tooltip>
          )}

          <Select
            name="schedule"
            placeholder={compact ? "Timetable" : "Select timetable"}
            bg="white"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            py={compact ? 2 : 0}
            value={state.schedule}
            onChange={handleInputChange}
          >
            {getData()
              .getCurrentScenario()
              .resourceParameters.timeTables.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                </option>
              ))}
          </Select>
        </InputGroup>
      </FormControl>

      <EditorSidebarButton
        type="submit"
        icon={FiUserPlus}
        variant="primary"
        collapsed={compact}
        mt={3}
      >
        Add role
      </EditorSidebarButton>
    </Stack>
  );

  /**
   * Expanded sidebar mode:
   * - Show a "Back" button to return to the previous editor view
   * - Render the form inline under a divider
   */
  if (!collapsed) {
    return (
      <Box w="100%">
        <Box mt={3} mb={6}>
          <EditorSidebarButton
            onClick={() => setCurrent("Resource Parameters")}
            icon={FiArrowLeft}
            variant="outline"
          >
            Back
          </EditorSidebarButton>
        </Box>

        <Divider />

        <form onSubmit={onSubmit}>{formFields(false)}</form>
      </Box>
    );
  }

  /**
   * Collapsed sidebar mode:
   * - Render a compact "Add role" button
   * - Show the full form in a Popover on click
   */
  return (
    <Box w="100%">
      <Popover placement="right-start" closeOnBlur={true}>
        <PopoverTrigger>
          <Box mt={3}>
            <EditorSidebarButton icon={FiUserPlus} variant="primary" collapsed={true}>
              Add role
            </EditorSidebarButton>
          </Box>
        </PopoverTrigger>

        <PopoverContent ml={2} maxW="320px">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            <Heading size="sm">Add Role</Heading>
          </PopoverHeader>
          <PopoverBody>
            <form onSubmit={onSubmit}>{formFields(true)}</form>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

export default AddRole;

import React, { useState } from "react";
import {
  Input,
  FormControl,
  FormLabel,
  Stack,
  Box,
  Divider,
  CheckboxGroup,
  Checkbox,
  Heading,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from "@chakra-ui/react";
import SimulationModelModdle from "simulation-bridge-datamodel/DataModel";
import {
  FiArrowLeft,
  FiPlus,
  FiUser,
  FiDollarSign,
  FiUsers,
} from "react-icons/fi";
import EditorSidebarButton from "../EditorSidebarButton";

/**
 * AddResource
 * -----------
 * Sidebar form component for creating a new Resource in the current scenario.
 *
 * Responsibilities:
 * - Maintain local form state for resource fields (id, cost per hour, assigned roles)
 * - Create a new "simulationmodel:Resource" object using the model factory (Moddle)
 * - Add the new resource into scenario.resourceParameters.resources
 * - Optionally attach this resource to one or more roles (role.resources)
 * - Persist changes via getData().saveCurrentScenario()
 * - Support two UI modes:
 *   (1) Expanded sidebar: show the full form inline
 *   (2) Collapsed sidebar: show a compact button and open a Popover for the form
 *
 * Props:
 * - getData: data-layer accessor that provides getCurrentScenario() and saveCurrentScenario()
 * - setCurrent: function to switch the current editor view (used by the "Back" button)
 * - collapsed: toggles collapsed sidebar rendering
 */
const AddResource = ({ getData, setCurrent, collapsed = false }) => {
  /**
   * Local form state for controlled inputs.
   * selectedRoles stores a list of role IDs that should receive the new resource.
   */
  const [state, setState] = useState({
    id: "",
    costHour: "",
    selectedRoles: [],
  });

  /**
   * handleInputChange
   * -----------------
   * Generic change handler for text inputs (id, costHour).
   * Uses the input's "name" attribute as the key.
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * handleRolesChange
   * -----------------
   * Receives an array of selected role IDs from Chakra's CheckboxGroup.
   * Updates the local state accordingly.
   */
  const handleRolesChange = (values) => {
    setState((prev) => ({
      ...prev,
      selectedRoles: values,
    }));
  };

  /**
   * clear
   * -----
   * Resets the form fields after a successful add operation.
   */
  const clear = () => {
    setState({
      id: "",
      costHour: "",
      selectedRoles: [],
    });
  };

  /**
   * onSubmit
   * --------
   * Create and attach the new Resource to the current scenario and selected roles.
   *
   * Steps:
   * 1) Prevent default form submission
   * 2) Create a new model object via SimulationModelModdle factory
   * 3) Push the resource into scenario.resourceParameters.resources
   * 4) For every selected role, find the role and attach { id: resourceId } to role.resources
   * 5) Save the scenario and clear the form
   */
  const onSubmit = (event) => {
    event.preventDefault();

    const obj = SimulationModelModdle.getInstance().create(
      "simulationmodel:Resource",
      {
        id: state.id,
        costHour: state.costHour || null,
      }
    );

    const scenario = getData().getCurrentScenario();
    scenario.resourceParameters.resources.push(obj);

    state.selectedRoles
      .filter((x) => x !== undefined)
      .forEach((roleId) => {
        scenario.resourceParameters.roles
          .find((x) => x.id === roleId)
          .resources.push({ id: state.id });
      });

    getData().saveCurrentScenario();
    clear();
  };

  /**
   * formFields
   * ----------
   * Reusable renderer for the form UI.
   *
   * compact=false:
   * - Full labels and more spacing, designed for the expanded sidebar
   *
   * compact=true:
   * - Compact layout for a Popover in collapsed sidebar mode
   * - Labels are replaced by icons + tooltips to save space
   */
  const formFields = (compact = false) => (
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
            value={state.id}
            bg="white"
            name="id"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Cost per hour:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Cost per hour" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiDollarSign} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Input
            value={state.costHour}
            bg="white"
            name="costHour"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Select roles:</FormLabel>}

        {compact && (
          <Box display="flex" alignItems="center" mb={1} gap={1}>
            <Icon as={FiUsers} />
            <Heading size="xs" color="gray.600">
              Roles
            </Heading>
          </Box>
        )}

        <CheckboxGroup
          colorScheme="green"
          value={state.selectedRoles}
          name="selectedRoles"
          onChange={handleRolesChange}
        >
          <Stack spacing={[1, 2]} direction="column">
            {getData()
              .getCurrentScenario()
              .resourceParameters.roles.map((item) => (
                <Checkbox
                  key={item.id}
                  value={item.id}
                  size={compact ? "sm" : "md"}
                >
                  {item.id}
                </Checkbox>
              ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>

      <EditorSidebarButton
        type="submit"
        icon={FiPlus}
        variant="primary"
        collapsed={compact}
        mt={3}
      >
        Add resource
      </EditorSidebarButton>
    </Stack>
  );

  /**
   * Expanded sidebar mode:
   * - Show a back button and divider
   * - Render the form directly
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
   * - Show a single icon button in the sidebar
   * - Open a Popover with the full form on click
   */
  return (
    <Box w="100%">
      <Popover placement="right-start" closeOnBlur={true}>
        <PopoverTrigger>
          <Box mt={3}>
            <EditorSidebarButton
              onClick={() => {}}
              icon={FiPlus}
              variant="primary"
              collapsed={true}
            >
              Add resource
            </EditorSidebarButton>
          </Box>
        </PopoverTrigger>

        <PopoverContent ml={2} maxW="320px" _focus={{ boxShadow: "lg" }}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            <Heading size="sm">Add Resource</Heading>
          </PopoverHeader>
          <PopoverBody>
            <form onSubmit={onSubmit}>{formFields(true)}</form>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

export default AddResource;

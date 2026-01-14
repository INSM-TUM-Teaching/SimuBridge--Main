import { useState, useEffect } from "react";
import {
  Input,
  FormControl,
  FormLabel,
  Divider,
  Select,
  Stack,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Heading,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiUserPlus,
  FiSave,
  FiTrash2,
  FiUsers,
  FiCalendar,
  FiDollarSign,
} from "react-icons/fi";
import EditorSidebarButton from "../EditorSidebarButton";

/**
 * EditRole
 * --------
 * Sidebar editor component for modifying an existing Role in the current scenario.
 *
 * Responsibilities:
 * - Load the selected role data (by role ID)
 * - Allow editing of:
 *   - Role name (id)
 *   - Default timetable assignment (schedule)
 *   - Default cost per hour (costHour)
 * - Persist changes back into the scenario via getData().saveCurrentScenario()
 * - Allow deleting the role from the scenario
 * - Support two UI modes:
 *   (1) Expanded sidebar: inline form
 *   (2) Collapsed sidebar: compact buttons + Popover that contains the form
 *
 * Props:
 * - getData: data-layer accessor providing getCurrentScenario() and saveCurrentScenario()
 * - currentRole: identifier (role id) of the selected role being edited
 * - setCurrent: switches sidebar view (e.g., "Add Resource", "Add Role")
 * - collapsed: toggles compact UI rendering
 */
const EditRole = ({ getData, currentRole, setCurrent, collapsed = false }) => {
  /**
   * Local controlled form fields for editing the role.
   */
  const [id, setId] = useState("");
  const [costHour, setCostHour] = useState("");
  const [schedule, setSchedule] = useState("");

  /**
   * List of timetable IDs available in the current scenario.
   * Used to populate the timetable dropdown.
   */
  const timeTables = getData()
    .getCurrentScenario()
    .resourceParameters.timeTables.map((item) => item.id);

  /**
   * On mount, load current role data into local state.
   * This pre-fills the form with existing values.
   */
  useEffect(() => {
    const currentRoleData = getData()
      .getCurrentScenario()
      .resourceParameters.roles.find((value) => value.id === currentRole);

    if (currentRoleData) {
      setId(currentRoleData.id);
      setSchedule(currentRoleData.schedule);
      setCostHour(currentRoleData.costHour);
    }
  }, []);

  /**
   * handleInputChange
   * -----------------
   * Unified change handler for all form controls.
   * Updates the appropriate state field based on the "name" attribute.
   */
  const handleInputChange = ({ target: { value, name } }) => {
    if (name === "id") {
      setId(value);
    }

    if (name === "schedule") {
      setSchedule(value);
    }

    if (name === "costHour") {
      setCostHour(value);
    }
  };

  /**
   * onSubmit
   * --------
   * Apply local state changes to the role object and persist them.
   *
   * Steps:
   * 1) Prevent default form submit
   * 2) Find the role in the scenario by original role ID (currentRole)
   * 3) Update schedule, id, and costHour fields
   * 4) Save the scenario
   */
  const onSubmit = (event) => {
    event.preventDefault();

    const currentRoleData = getData()
      .getCurrentScenario()
      .resourceParameters.roles.find((value) => value.id === currentRole);

    currentRoleData.schedule = schedule;
    currentRoleData.id = id;
    currentRoleData.costHour = costHour;

    getData().saveCurrentScenario();
  };

  /**
   * deleteRole
   * ----------
   * Removes the role from the scenario's roles array and persists the change.
   */
  const deleteRole = () => {
    getData().getCurrentScenario().resourceParameters.roles = getData()
      .getCurrentScenario()
      .resourceParameters.roles.filter((role) => role.id !== id);

    getData().saveCurrentScenario();
  };

  /**
   * formFields
   * ----------
   * Shared form renderer used for both expanded and collapsed modes.
   *
   * compact=false:
   * - Full labels and normal spacing (sidebar expanded)
   *
   * compact=true:
   * - Icons + tooltips instead of labels (popover / collapsed sidebar)
   */
  const formFields = (compact = false) => (
    <Stack gap="2" mt={compact ? 0 : 4}>
      <FormControl>
        {!compact && <FormLabel>Role Name:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Role Name" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiUsers} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Input
            value={id}
            bg="white"
            name="id"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Default Timetable:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Default Timetable" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Select
            value={schedule}
            {...(!schedule && {
              placeholder: compact ? "Timetable" : "Select Timetable",
              color: "red",
            })}
            bg="white"
            name="schedule"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            onChange={handleInputChange}
          >
            {timeTables.map((id, index) => (
              <option style={{ color: "black" }} value={id} key={index}>
                {id}
              </option>
            ))}
          </Select>
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Default Cost per Hour:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Default Cost per Hour" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiDollarSign} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Input
            value={costHour}
            bg="white"
            name="costHour"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <Stack direction="column" spacing={2} mt={3}>
        <EditorSidebarButton type="submit" icon={FiSave} variant="primary" collapsed={compact}>
          Save changes
        </EditorSidebarButton>

        <EditorSidebarButton
          icon={FiTrash2}
          variant="danger"
          collapsed={compact}
          onClick={deleteRole}
        >
          Delete role
        </EditorSidebarButton>
      </Stack>
    </Stack>
  );

  /**
   * Expanded sidebar mode:
   * - Provides quick navigation to add new resources/roles
   * - Renders the edit form directly below a divider
   */
  if (!collapsed) {
    return (
      <>
        <Stack spacing={3} mt={3} mb={6}>
          <EditorSidebarButton
            onClick={() => setCurrent("Add Resource")}
            icon={FiPlus}
            variant="secondary"
            collapsed={collapsed}
          >
            Add resource
          </EditorSidebarButton>

          <EditorSidebarButton
            onClick={() => setCurrent("Add Role")}
            icon={FiUserPlus}
            variant="secondary"
            collapsed={collapsed}
          >
            Add role
          </EditorSidebarButton>
        </Stack>

        <Divider />

        <Box w="100%">
          <form onSubmit={onSubmit}>{formFields(false)}</form>
        </Box>
      </>
    );
  }

  /**
   * Collapsed sidebar mode:
   * - Shows compact action buttons
   * - Displays the edit form inside a Popover for space efficiency
   */
  return (
    <Box w="100%">
      <Stack spacing={3} mt={3} mb={6}>
        <EditorSidebarButton
          onClick={() => setCurrent("Add Resource")}
          icon={FiPlus}
          variant="secondary"
          collapsed={true}
        >
          Add resource
        </EditorSidebarButton>

        <EditorSidebarButton
          onClick={() => setCurrent("Add Role")}
          icon={FiUserPlus}
          variant="secondary"
          collapsed={true}
        >
          Add role
        </EditorSidebarButton>
      </Stack>

      <Divider />

      {id !== "" && (
        <Popover placement="right-start" closeOnBlur={true}>
          <PopoverTrigger>
            <Box mt={3}>
              <EditorSidebarButton icon={FiUsers} variant="outline" collapsed={true}>
                Edit {id}
              </EditorSidebarButton>
            </Box>
          </PopoverTrigger>

          <PopoverContent ml={2} maxW="350px" _focus={{ boxShadow: "lg" }}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>
              <Heading size="sm">Edit Role: {id}</Heading>
            </PopoverHeader>
            <PopoverBody>
              <form onSubmit={onSubmit}>{formFields(true)}</form>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </Box>
  );
};

export default EditRole;

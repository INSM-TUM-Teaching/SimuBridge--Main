import { useState, useEffect } from "react";
import {
  Input,
  FormControl,
  FormLabel,
  Divider,
  CheckboxGroup,
  Checkbox,
  Stack,
  Box,
  Select,
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
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import EditorSidebarButton from "../EditorSidebarButton";

/**
 * EditResource
 * ------------
 * Sidebar editor component for modifying an existing Resource in the current scenario.
 *
 * Responsibilities:
 * - Load the selected resource data from the scenario (by resource ID)
 * - Allow editing of:
 *   - Resource name (id)
 *   - Cost per hour (costHour)
 *   - Optional timetable assignment (schedule)
 *   - Role associations (which roles include this resource)
 * - Persist all changes back into the scenario via getData().saveCurrentScenario()
 * - Allow deleting the resource (remove from resources list and from all roles)
 * - Support two UI modes:
 *   (1) Expanded sidebar: inline form
 *   (2) Collapsed sidebar: compact buttons + Popover with the form
 *
 * Props:
 * - getData: data-layer accessor providing getCurrentScenario() and saveCurrentScenario()
 * - currentResource: identifier (resource id) of the selected resource
 * - setCurrent: switches sidebar view (e.g., "Add Resource", "Add Role")
 * - collapsed: toggles compact UI rendering
 */
const EditResource = ({ getData, currentResource, setCurrent, collapsed = false }) => {
  /**
   * Local editable fields for the selected resource.
   * These are used as controlled inputs.
   */
  const [id, setId] = useState("");
  const [costHour, setCostHour] = useState("");
  const [schedule, setSchedule] = useState("");

  /**
   * Snapshot arrays used for dropdown/checkbox options.
   * - timeTables: available timetable IDs
   * - roles: available role IDs
   *
   * These are initialized from the current scenario.
   */
  const [timeTables, setTimeTables] = useState(
    getData().getCurrentScenario().resourceParameters.timeTables.map((item) => item.id)
  );
  const [roles, setRoles] = useState(
    getData().getCurrentScenario().resourceParameters.roles.map((item) => item.id)
  );

  /**
   * selectedRoles contains role IDs where this resource should be associated.
   * The checkbox group binds to this list.
   */
  const [selectedRoles, setSelectedRoles] = useState([]);

  /**
   * On mount, load the selected resource data into local state.
   * Also compute which roles currently reference this resource.
   */
  useEffect(() => {
    const currResource = getData()
      .getCurrentScenario()
      .resourceParameters.resources.find((value) => value.id === currentResource);

    if (currResource) {
      setId(currResource.id);
      setCostHour(currResource.costHour);
      setSchedule(currResource.schedule);

      setSelectedRoles(
        getData()
          .getCurrentScenario()
          .resourceParameters.roles.filter((item) =>
            item.resources.some((x) => x.id === currentResource)
          )
          .map((x) => x.id)
      );
    }
  }, []);

  /**
   * handleRolesChange
   * -----------------
   * Chakra's CheckboxGroup onChange provides a list of values.
   * This handler updates selectedRoles by toggling the last changed value.
   *
   * The logic aims to support "toggle" behavior (add/remove a role ID).
   */
  const handleRolesChange = (event) => {
    let value = event.pop();

    if (selectedRoles.includes(value)) {
      setSelectedRoles([...selectedRoles.filter((item) => item === value)]);
    } else {
      setSelectedRoles([...selectedRoles, value]);
    }
  };

  /**
   * handleInputChange
   * -----------------
   * Single handler for multiple fields.
   * It updates the correct piece of local state based on the input's "name".
   */
  const handleInputChange = (resource) => {
    const target = resource.target;
    const value = target.value;
    const name = target.name;

    if (name === "id") {
      setId(value);
    } else if (name === "costHour") {
      setCostHour(value);
    } else if (name === "schedule") {
      setSchedule(value);
    }
  };

  /**
   * onSubmit
   * --------
   * Save edits into the scenario model and persist them.
   *
   * Steps:
   * 1) Prevent default form submit
   * 2) Find the resource object by currentResource ID
   * 3) Update its properties (id, costHour, schedule)
   *    - costHour and schedule become undefined if user leaves them empty
   * 4) Remove this resource from all roles (reset associations)
   * 5) Re-add it only to the roles in selectedRoles
   * 6) Save the current scenario
   */
  const onSubmit = (event) => {
    event.preventDefault();

    const resource = getData()
      .getCurrentScenario()
      .resourceParameters.resources.find((value) => value.id === currentResource);

    resource.id = id;
    resource.costHour = costHour || undefined;
    resource.schedule = schedule || undefined;

    getData()
      .getCurrentScenario()
      .resourceParameters.roles.forEach((obj) => {
        obj.resources = obj.resources.filter((resource) => resource.id !== currentResource);
      });

    selectedRoles
      .filter((x) => x !== undefined)
      .forEach((item) => {
        getData()
          .getCurrentScenario()
          .resourceParameters.roles.find((x) => x.id === item)
          .resources.push({ id });
      });

    getData().saveCurrentScenario();
  };

  /**
   * deleteResource
   * --------------
   * Removes the resource completely:
   * - Remove it from all roles
   * - Remove it from the resources list
   * - Persist the scenario
   */
  const deleteResource = () => {
    getData()
      .getCurrentScenario()
      .resourceParameters.roles.forEach((obj) => {
        obj.resources = obj.resources.filter((resource) => resource.id !== id);
      });

    getData().getCurrentScenario().resourceParameters.resources = getData()
      .getCurrentScenario()
      .resourceParameters.resources.filter((resource) => resource.id !== id);

    console.log(getData().getCurrentScenario().resourceParameters);
    getData().saveCurrentScenario();
  };

  /**
   * formFields
   * ----------
   * Reusable form renderer for expanded and collapsed modes.
   *
   * compact=false:
   * - Full labels and regular spacing
   *
   * compact=true:
   * - Icon + tooltip approach instead of labels
   * - Smaller input sizes for Popover usage
   */
  const formFields = (compact = false) => (
    <Stack gap="2" mt={compact ? 0 : 4}>
      <FormControl>
        {!compact && <FormLabel>Resource Name:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Resource Name" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiUser} />
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
        {!compact && <FormLabel>Cost per Hour:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Cost per Hour" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiDollarSign} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Input
            placeholder={compact ? "Cost/hour" : `default for ${selectedRoles[0]}`}
            value={costHour}
            bg="white"
            name="costHour"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Timetable:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Timetable" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Select
            value={schedule}
            bg="white"
            {...(!schedule && { color: "darkgray" })}
            name="schedule"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            onChange={handleInputChange}
          >
            <option value={""} key="default">
              {compact ? "Default" : `default for ${selectedRoles[0]}`}
            </option>

            {timeTables.map((id, index) => (
              <option style={{ color: "black" }} value={id} key={index}>
                {id}
              </option>
            ))}
          </Select>
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
          value={selectedRoles}
          name="selectedRoles"
          onChange={handleRolesChange}
        >
          <Stack spacing={[1, compact ? 2 : 5]} direction="column">
            {roles.map((id, index) => (
              <Checkbox value={id} key={index} size={compact ? "sm" : "md"}>
                {id}
              </Checkbox>
            ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>

      <Stack direction="column" spacing={2} mt={3}>
        <EditorSidebarButton type="submit" icon={FiSave} variant="primary" collapsed={compact}>
          Save changes
        </EditorSidebarButton>

        <EditorSidebarButton
          icon={FiTrash2}
          variant="danger"
          collapsed={compact}
          onClick={deleteResource}
        >
          Delete resource
        </EditorSidebarButton>
      </Stack>
    </Stack>
  );

  /**
   * Expanded sidebar mode:
   * - Show quick actions to add a new resource or a new role
   * - Show the edit form below (only if a resource is selected)
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

        <Box w="100%">{id !== "" && <form onSubmit={onSubmit}>{formFields(false)}</form>}</Box>
      </>
    );
  }

  /**
   * Collapsed sidebar mode:
   * - Show compact action buttons
   * - Provide a Popover that contains the edit form for the current resource
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
              <EditorSidebarButton icon={FiUser} variant="outline" collapsed={true}>
                Edit {id}
              </EditorSidebarButton>
            </Box>
          </PopoverTrigger>

          <PopoverContent ml={2} maxW="350px" _focus={{ boxShadow: "lg" }}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>
              <Heading size="sm">Edit Resource: {id}</Heading>
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

export default EditResource;

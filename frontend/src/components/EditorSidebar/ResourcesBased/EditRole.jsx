import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import {
  FiPlus,
  FiUserPlus,
  FiSave,
  FiTrash2,
  FiUsers,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const EditRole = ({ getData, currentRole, setCurrent, collapsed = false }) => {
  const [id, setId] = useState('');
  const [costHour, setCostHour] = useState('');
  const [schedule, setSchedule] = useState('');

  const timeTables = getData()
    .getCurrentScenario()
    .resourceParameters.timeTables.map(item => item.id);

  useEffect(() => {
    let currentRoleData = getData()
      .getCurrentScenario()
      .resourceParameters.roles.find(value => value.id === currentRole);
    if (currentRoleData) {
      setId(currentRoleData.id);
      setSchedule(currentRoleData.schedule);
      setCostHour(currentRoleData.costHour);
    }
  }, []);

  const handleInputChange = ({ target: { value, name } }) => {
    if (name === 'id') {
      setId(value);
    }

    if (name === 'schedule') {
      setSchedule(value);
    }

    if (name === 'costHour') {
      setCostHour(value);
    }
  };

  const onSubmit = event => {
    event.preventDefault();

    let currentRoleData = getData()
      .getCurrentScenario()
      .resourceParameters.roles.find(value => value.id === currentRole);

    currentRoleData.schedule = schedule;
    currentRoleData.id = id;
    currentRoleData.costHour = costHour;

    getData().saveCurrentScenario();
  };

  const deleteRole = () => {
    getData().getCurrentScenario().resourceParameters.roles = getData()
      .getCurrentScenario()
      .resourceParameters.roles.filter(role => role.id !== id);
    getData().saveCurrentScenario();
  };

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
            size={compact ? 'sm' : 'md'}
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
              placeholder: compact ? 'Timetable' : 'Select Timetable',
              color: 'red',
            })}
            bg="white"
            name="schedule"
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 0}
            onChange={handleInputChange}
          >
            {timeTables.map((id, index) => (
              <option style={{ color: 'black' }} value={id} key={index}>
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
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <Stack direction="column" spacing={2} mt={3}>
        <EditorSidebarButton
          type="submit"
          icon={FiSave}
          variant="primary"
          collapsed={compact}
        >
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

  if (!collapsed) {
    return (
      <>
        <Stack spacing={3} mt={3} mb={6}>
          <EditorSidebarButton
            onClick={() => setCurrent('Add Resource')}
            icon={FiPlus}
            variant="secondary"
            collapsed={collapsed}
          >
            Add resource
          </EditorSidebarButton>

          <EditorSidebarButton
            onClick={() => setCurrent('Add Role')}
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

  // Collapsed mode - show popover for editing
  return (
    <Box w="100%">
      <Stack spacing={3} mt={3} mb={6}>
        <EditorSidebarButton
          onClick={() => setCurrent('Add Resource')}
          icon={FiPlus}
          variant="secondary"
          collapsed={true}
        >
          Add resource
        </EditorSidebarButton>

        <EditorSidebarButton
          onClick={() => setCurrent('Add Role')}
          icon={FiUserPlus}
          variant="secondary"
          collapsed={true}
        >
          Add role
        </EditorSidebarButton>
      </Stack>

      <Divider />

      {id !== '' && (
        <Popover placement="right-start" closeOnBlur={true}>
          <PopoverTrigger>
            <Box mt={3}>
              <EditorSidebarButton
                icon={FiUsers}
                variant="outline"
                collapsed={true}
              >
                Edit {id}
              </EditorSidebarButton>
            </Box>
          </PopoverTrigger>

          <PopoverContent ml={2} maxW="350px" _focus={{ boxShadow: 'lg' }}>
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

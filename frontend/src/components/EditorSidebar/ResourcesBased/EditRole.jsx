import { React, useState, useEffect } from 'react';
import {
  Input,
  FormControl,
  FormLabel,
  Divider,
  Select,
  Stack,
  Box,
} from '@chakra-ui/react';
import { FiPlus, FiUserPlus, FiSave, FiTrash2 } from 'react-icons/fi';
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
        <form onSubmit={onSubmit}>
          <Stack gap="2" mt="4">
            <FormControl>
              <FormLabel>Role Name:</FormLabel>
              <Input
                value={id}
                bg="white"
                name="id"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel> Default Timetable:</FormLabel>
              <Select
                value={schedule}
                {...(!schedule && {
                  placeholder: 'Select Timetable',
                  color: 'red',
                })}
                bg="white"
                name="schedule"
                onChange={event => handleInputChange(event)}
              >
                {timeTables.map((id, index) => {
                  return (
                    <option style={{ color: 'black' }} value={id} key={index}>
                      {id}
                    </option>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel> Default Cost per Hour:</FormLabel>
              <Input
                value={costHour}
                bg="white"
                name="costHour"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <EditorSidebarButton
              type="submit"
              icon={FiSave}
              variant="primary"
              collapsed={collapsed}
              mt={3}
            >
              Save changes
            </EditorSidebarButton>

            <EditorSidebarButton
              icon={FiTrash2}
              variant="danger"
              collapsed={collapsed}
              onClick={deleteRole}
            >
              Delete role
            </EditorSidebarButton>
          </Stack>
        </form>
      </Box>
    </>
  );
};

export default EditRole;

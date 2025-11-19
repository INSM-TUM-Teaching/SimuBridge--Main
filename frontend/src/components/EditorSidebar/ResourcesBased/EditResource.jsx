import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FiPlus, FiUserPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const EditResource = ({
  getData,
  currentResource,
  setCurrent,
  collapsed = false,
}) => {
  const [id, setId] = useState('');
  const [costHour, setCostHour] = useState('');
  const [schedule, setSchedule] = useState('');
  const [timeTables, setTimeTables] = useState(
    getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.map(item => item.id)
  );
  const [roles, setRoles] = useState(
    getData()
      .getCurrentScenario()
      .resourceParameters.roles.map(item => item.id)
  );
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    const currResource = getData()
      .getCurrentScenario()
      .resourceParameters.resources.find(value => value.id === currentResource);
    if (currResource) {
      setId(currResource.id);
      setCostHour(currResource.costHour);
      setSchedule(currResource.schedule);
      setSelectedRoles(
        getData()
          .getCurrentScenario()
          .resourceParameters.roles.filter(item =>
            item.resources.some(x => x.id === currentResource)
          )
          .map(x => x.id)
      );
    }
  }, []);

  const handleRolesChange = event => {
    let value = event.pop();

    if (selectedRoles.includes(value)) {
      setSelectedRoles([...selectedRoles.filter(item => item === value)]);
    } else {
      setSelectedRoles([...selectedRoles, value]);
    }
  };

  const handleInputChange = resource => {
    const target = resource.target;
    const value = target.value;
    const name = target.name;

    if (name === 'id') {
      setId(value);
    } else if (name === 'costHour') {
      setCostHour(value);
    } else if (name === 'schedule') {
      setSchedule(value);
    }
  };

  const onSubmit = event => {
    event.preventDefault();

    const resource = getData()
      .getCurrentScenario()
      .resourceParameters.resources.find(value => value.id === currentResource);
    resource.id = id;
    resource.costHour = costHour || undefined; // Is nullable by putting in empty string
    resource.schedule = schedule || undefined; // Is nullable by putting in empty string

    getData()
      .getCurrentScenario()
      .resourceParameters.roles.forEach(obj => {
        obj.resources = obj.resources.filter(
          resource => resource.id !== currentResource
        );
      });

    selectedRoles
      .filter(x => x !== undefined)
      .forEach(item => {
        getData()
          .getCurrentScenario()
          .resourceParameters.roles.find(x => x.id === item)
          .resources.push({ id });
      });

    getData().saveCurrentScenario();
  };

  const deleteResource = () => {
    getData()
      .getCurrentScenario()
      .resourceParameters.roles.forEach(obj => {
        obj.resources = obj.resources.filter(resource => resource.id !== id);
      });

    getData().getCurrentScenario().resourceParameters.resources = getData()
      .getCurrentScenario()
      .resourceParameters.resources.filter(resource => resource.id !== id);

    console.log(getData().getCurrentScenario().resourceParameters);
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
        {id !== '' ? (
          <>
            <form onSubmit={onSubmit}>
              <Stack gap="2" mt="4">
                <FormControl>
                  <FormLabel>Resource Name:</FormLabel>
                  <Input
                    value={id}
                    bg="white"
                    name="id"
                    onChange={event => handleInputChange(event)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cost per Hour:</FormLabel>
                  <Input
                    placeholder={`default for ${selectedRoles[0]}`}
                    value={costHour}
                    bg="white"
                    name="costHour"
                    onChange={event => handleInputChange(event)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Timetable:</FormLabel>
                  <Select
                    value={schedule}
                    bg="white"
                    {...(!schedule && { color: 'darkgray' })}
                    name="schedule"
                    onChange={event => handleInputChange(event)}
                  >
                    <option value={''} key="default">
                      default for {selectedRoles[0]}
                    </option>
                    {timeTables.map((id, index) => {
                      return (
                        <option
                          style={{ color: 'black' }}
                          value={id}
                          key={index}
                        >
                          {id}
                        </option>
                      );
                    })}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Select roles:</FormLabel>
                  <CheckboxGroup
                    colorScheme="green"
                    value={selectedRoles}
                    name="selectedRoles"
                    onChange={event => handleRolesChange(event)}
                  >
                    <Stack spacing={[1, 5]} direction="column">
                      {roles.map((id, index) => {
                        return (
                          <Checkbox value={id} key={index}>
                            {id}
                          </Checkbox>
                        );
                      })}
                    </Stack>
                  </CheckboxGroup>
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
                  onClick={deleteResource}
                >
                  Delete resource
                </EditorSidebarButton>
              </Stack>
            </form>
          </>
        ) : (
          ''
        )}
      </Box>
    </>
  );
};

export default EditResource;

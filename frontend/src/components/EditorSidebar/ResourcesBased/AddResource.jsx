import React, { useState } from 'react';
import {
  Input,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Stack,
  Box,
  Divider,
  CheckboxGroup,
  Checkbox,
} from '@chakra-ui/react';
import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

// TODO delete this class and integrate into EditResource
const AddResource = ({ getData, setCurrent, collapsed = false }) => {
  const [state, setState] = useState({
    id: '',
    costHour: '',
    selectedRoles: [],
  });

  const handleInputChange = resource => {
    const target = resource.target;
    const value = target.value;
    const name = target.name;

    setState({
      ...state,
      [name]: value,
    });
  };

  const handleRolesChange = event => {
    let value = event.pop();

    if (state.selectedRoles.includes(value)) {
      setState({
        ...state,
        selectedRoles: [...state.selectedRoles.filter(item => item === value)],
      });
    } else {
      setState({
        ...state,
        selectedRoles: [...state.selectedRoles, value],
      });
    }
  };

  const clear = () => {
    setState({
      id: '',
      costHour: '',
      selectedRoles: [],
    });
  };

  const onSubmit = event => {
    event.preventDefault();

    let obj = SimulationModelModdle.getInstance().create(
      'simulationmodel:Resource',
      {
        id: state.id,
        costHour: state.costHour || null,
      }
    );

    getData().getCurrentScenario().resourceParameters.resources.push(obj);

    state.selectedRoles
      .filter(x => x !== undefined)
      .forEach(item => {
        getData()
          .getCurrentScenario()
          .resourceParameters.roles.find(x => x.id === item)
          .resources.push({ id: state.id });
      });

    getData().saveCurrentScenario();

    clear();
  };

  return (
    <>
      <Box w="100%">
        <Box mt={3} mb={6}>
          <EditorSidebarButton
            onClick={() => setCurrent('Resource Parameters')}
            icon={FiArrowLeft}
            variant="outline"
            collapsed={collapsed}
          >
            Back
          </EditorSidebarButton>
        </Box>

        <Divider />

        <form onSubmit={onSubmit}>
          <Stack gap="2" mt="4">
            <FormControl>
              <FormLabel>Name:</FormLabel>
              <Input
                value={state.id}
                bg="white"
                name="id"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Cost per hour:</FormLabel>
              <Input
                value={state.costHour}
                bg="white"
                name="costHour"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Select roles:</FormLabel>
              <CheckboxGroup
                colorScheme="green"
                value={state.selectedRoles}
                name="selectedRoles"
                onChange={event => handleRolesChange(event)}
              >
                <Stack spacing={[1, 5]} direction="column">
                  {getData()
                    .getCurrentScenario()
                    .resourceParameters.roles.map(item => {
                      return (
                        <Checkbox key={item.id} value={item.id}>
                          {item.id}
                        </Checkbox>
                      );
                    })}
                </Stack>
              </CheckboxGroup>
            </FormControl>

            <EditorSidebarButton
              type="submit"
              icon={FiPlus}
              variant="primary"
              collapsed={collapsed}
              mt={3}
            >
              Add resource
            </EditorSidebarButton>
          </Stack>
        </form>
      </Box>
    </>
  );
};

export default AddResource;

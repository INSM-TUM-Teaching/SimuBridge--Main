import React from 'react';
import {
  Input,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Switch,
  Stack,
  Box,
} from '@chakra-ui/react';
import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';
import { FiArrowLeft, FiUserPlus } from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const AddRole = ({ getData, setCurrent, collapsed = false }) => {
  const [state, setState] = React.useState({
    id: '',
    schedule: '',
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

  const clear = () => {
    setState({
      id: '',
      schedule: '',
    });
  };

  const onSubmit = event => {
    event.preventDefault();

    let obj = SimulationModelModdle.getInstance().create(
      'simulationmodel:Role',
      {
        id: state.id,
        schedule: state.schedule,
        resources: [],
      }
    );

    getData().getCurrentScenario().resourceParameters.roles.push(obj);

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
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Select default timetable:</FormLabel>
              <Select
                value={state.schedule}
                placeholder="Select timetable"
                bg="white"
                name="schedule"
                onChange={handleInputChange}
              >
                {getData()
                  .getCurrentScenario()
                  .resourceParameters.timeTables.map(item => {
                    return (
                      <option value={item.id} key={item.id}>
                        {item.id}
                      </option>
                    );
                  })}
              </Select>
            </FormControl>

            <EditorSidebarButton
              type="submit"
              icon={FiUserPlus}
              variant="primary"
              collapsed={collapsed}
              mt={3}
            >
              Add role
            </EditorSidebarButton>
          </Stack>
        </form>
      </Box>
    </>
  );
};
export default AddRole;

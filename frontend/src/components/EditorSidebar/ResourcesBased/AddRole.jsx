import React, { useState } from 'react';
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
} from '@chakra-ui/react';

import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';
import { FiArrowLeft, FiUserPlus, FiUser, FiCalendar } from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const AddRole = ({ getData, setCurrent, collapsed = false }) => {
  const [state, setState] = useState({
    id: '',
    schedule: '',
  });

  const handleInputChange = evt => {
    const { name, value } = evt.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const clear = () => {
    setState({ id: '', schedule: '' });
  };

  const onSubmit = evt => {
    evt.preventDefault();

    const role = SimulationModelModdle.getInstance().create(
      'simulationmodel:Role',
      {
        id: state.id,
        schedule: state.schedule,
        resources: [],
      }
    );

    const scenario = getData().getCurrentScenario();
    scenario.resourceParameters.roles.push(role);
    getData().saveCurrentScenario();
    clear();
  };

  const formFields = compact => (
    <Stack gap="2" mt={compact ? 0 : 4}>
      {/* Name field */}
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
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 4}
            value={state.id}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      {/* Timetable field */}
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
            placeholder={compact ? 'Timetable' : 'Select timetable'}
            bg="white"
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 0}
            py={compact ? 2 : 0}
            value={state.schedule}
            onChange={handleInputChange}
          >
            {getData()
              .getCurrentScenario()
              .resourceParameters.timeTables.map(item => (
                <option key={item.id} value={item.id}>
                  {item.id}
                </option>
              ))}
          </Select>
        </InputGroup>
      </FormControl>

      {/* Add role button */}
      <EditorSidebarButton
        type="submit"
        icon={FiUserPlus}
        variant="primary"
        collapsed={compact} // icon-only in compact mode
        mt={3}
      >
        Add role
      </EditorSidebarButton>
    </Stack>
  );

  if (!collapsed) {
    return (
      <Box w="100%">
        <Box mt={3} mb={6}>
          <EditorSidebarButton
            onClick={() => setCurrent('Resource Parameters')}
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

  return (
    <Box w="100%">
      <Popover placement="right-start" closeOnBlur={true}>
        <PopoverTrigger>
          <Box mt={3}>
            <EditorSidebarButton
              icon={FiUserPlus}
              variant="primary"
              collapsed={true} // round icon-only button
            >
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

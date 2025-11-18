import React, { useEffect, useState } from 'react';
import {
  Input,
  FormControl,
  FormLabel,
  Stack,
  Select,
  Box,
} from '@chakra-ui/react';
import { Currencies } from 'simulation-bridge-datamodel/SimulationModelDescriptor';
import { FiCopy, FiSave, FiX } from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const EditScenario = ({ getData, setShowSidebar }) => {
  const [state, setState] = useState({
    scenarioName: '',
    startingDate: '',
    startingTime: '',
    currency: '',
    numberOfInstances: '',
  });

  useEffect(() => {
    const selectedScenarioData = getData().getCurrentScenario();
    if (!selectedScenarioData) return;
    setState({
      scenarioName: selectedScenarioData.scenarioName,
      startingDate: selectedScenarioData.startingDate,
      startingTime: selectedScenarioData.startingTime,
      currency: selectedScenarioData.currency,
      numberOfInstances: selectedScenarioData.numberOfInstances,
    });
    console.log(state);
    console.log(state.distributionValues);
  }, [getData().getCurrentScenario()]);

  function handleInputChange(resource) {
    const target = resource.target;
    const value = target.value;
    const name = target.name;

    setState({
      ...state,
      [name]: value,
    });
  }

  function onSubmit(event) {
    event.preventDefault();

    let obj = getData().getCurrentScenario();

    if (obj.scenarioName !== state.scenarioName) {
      getData().renameScenario(obj, state.scenarioName);
    }

    obj.scenarioName = state.scenarioName;
    obj.startingDate = state.startingDate;
    obj.startingTime = state.startingTime;
    obj.currency = state.currency;
    obj.numberOfInstances = state.numberOfInstances;

    getData().saveCurrentScenario();
    setShowSidebar(false);
  }

  return (
    <>
      <Box w="100%">
        <Stack gap="3">
          <EditorSidebarButton
            onClick={() => {
              getData().getCurrentScenario().duplicate();
            }}
            icon={FiCopy}
            variant="secondary"
          >
            Duplicate Scenario
          </EditorSidebarButton>

          <form onSubmit={onSubmit}>
            <FormControl>
              <FormLabel>Scenario Name:</FormLabel>
              <Input
                value={state.scenarioName}
                bg="white"
                name="scenarioName"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Starting Date:</FormLabel>
              <Input
                value={state.startingDate}
                bg="white"
                name="startingDate"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Starting time:</FormLabel>
              <Input
                value={state.startingTime}
                bg="white"
                name="startingTime"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Number of Process Instances:</FormLabel>
              <Input
                value={state.numberOfInstances}
                bg="white"
                name="numberOfInstances"
                onChange={event => handleInputChange(event)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Currency:</FormLabel>
              <Select
                name="currency"
                value={state.currency}
                bg="white"
                onChange={event => handleInputChange(event)}
              >
                {Object.values(Currencies).map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </FormControl>

            <EditorSidebarButton
              type="submit"
              icon={FiSave}
              variant="primary"
              mt="5"
            >
              Save changes
            </EditorSidebarButton>

            <EditorSidebarButton
              icon={FiX}
              variant="outline"
              mt="5"
              onClick={() => setShowSidebar(false)}
            >
              Cancel
            </EditorSidebarButton>
          </form>
        </Stack>
      </Box>
    </>
  );
};

export default EditScenario;

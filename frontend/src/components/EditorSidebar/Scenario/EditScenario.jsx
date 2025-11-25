import { useEffect, useState } from 'react';
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

const EditScenario = ({ getData, setShowSidebar, compact = false }) => {
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
      scenarioName: selectedScenarioData.scenarioName || '',
      startingDate: selectedScenarioData.startingDate || '',
      startingTime: selectedScenarioData.startingTime || '',
      currency: selectedScenarioData.currency || '',
      numberOfInstances: selectedScenarioData.numberOfInstances || '',
    });
  }, [getData().getCurrentScenario()]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setState(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  function onSubmit(event) {
    event.preventDefault();

    const obj = getData().getCurrentScenario();

    if (obj.scenarioName !== state.scenarioName) {
      getData().renameScenario(obj, state.scenarioName);
    }

    obj.scenarioName = state.scenarioName;
    obj.startingDate = state.startingDate;
    obj.startingTime = state.startingTime;
    obj.currency = state.currency;
    obj.numberOfInstances = state.numberOfInstances;

    getData().saveCurrentScenario();

    // Only close sidebar when used inside a sidebar
    if (!compact && setShowSidebar) {
      setShowSidebar(false);
    }
  }
  const fieldProps = {
    bg: 'white',
    size: compact ? 'sm' : 'md',
    borderRadius: '12px',
    px: 4,
    height: compact ? '38px' : '44px',
    w: '100%',
  };

  return (
    <Box w="100%">
      <Stack gap="3">
        {!compact && (
          <EditorSidebarButton
            onClick={() => {
              getData().getCurrentScenario().duplicate();
            }}
            icon={FiCopy}
            variant="secondary"
          >
            Duplicate Scenario
          </EditorSidebarButton>
        )}

        <form onSubmit={onSubmit}>
          <FormControl mb={3}>
            <FormLabel>Scenario Name:</FormLabel>
            <Input
              name="scenarioName"
              value={state.scenarioName}
              onChange={handleInputChange}
              {...fieldProps}
            />
          </FormControl>

          <FormControl mb={3}>
            <FormLabel>Starting Date:</FormLabel>
            <Input
              name="startingDate"
              value={state.startingDate}
              onChange={handleInputChange}
              {...fieldProps}
            />
          </FormControl>

          <FormControl mb={3}>
            <FormLabel>Starting time:</FormLabel>
            <Input
              name="startingTime"
              value={state.startingTime}
              onChange={handleInputChange}
              {...fieldProps}
            />
          </FormControl>

          <FormControl mb={3}>
            <FormLabel>Number of Process Instances:</FormLabel>
            <Input
              name="numberOfInstances"
              value={state.numberOfInstances}
              onChange={handleInputChange}
              {...fieldProps}
            />
          </FormControl>

          <FormControl mb={3}>
            <FormLabel>Currency:</FormLabel>
            <Select
              name="currency"
              value={state.currency}
              onChange={handleInputChange}
              {...fieldProps}
              pl={0}
              pr={0}
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
            mt={compact ? 3 : 5}
          >
            Save changes
          </EditorSidebarButton>
          {!compact && setShowSidebar && (
            <EditorSidebarButton
              icon={FiX}
              variant="outline"
              mt="5"
              onClick={() => setShowSidebar(false)}
            >
              Cancel
            </EditorSidebarButton>
          )}
        </form>
      </Stack>
    </Box>
  );
};

export default EditScenario;

import { useEffect, useState } from "react";
import {
  Input,
  FormControl,
  FormLabel,
  Stack,
  Select,
  Box,
} from "@chakra-ui/react";
import { Currencies } from "simulation-bridge-datamodel/SimulationModelDescriptor";
import { FiCopy, FiSave, FiX } from "react-icons/fi";
import EditorSidebarButton from "../EditorSidebarButton";

/**
 * EditScenario
 * ------------
 * Form component for editing the currently selected simulation scenario.
 *
 * Responsibilities:
 * - Read the currently selected scenario from the data layer (getData())
 * - Populate a local React state object for controlled form inputs
 * - Allow the user to update scenario fields (name, start date/time, currency, instances)
 * - Save changes back into the scenario object and persist via saveCurrentScenario()
 * - Optionally close the sidebar after saving (when used inside a sidebar layout)
 *
 * Props:
 * - getData: data-layer accessor that exposes methods like getCurrentScenario(), saveCurrentScenario(), renameScenario()
 * - setShowSidebar: optional setter to hide/close the sidebar after save/cancel
 * - compact: when true, renders a smaller version (for collapsed UI / popovers)
 */
const EditScenario = ({ getData, setShowSidebar, compact = false }) => {
  /**
   * Local UI state for controlled form inputs.
   * Keeping local state prevents directly mutating the scenario object on every keystroke.
   * Changes are applied to the scenario only when the form is submitted.
   */
  const [state, setState] = useState({
    scenarioName: "",
    startingDate: "",
    startingTime: "",
    currency: "",
    numberOfInstances: "",
  });

  /**
   * Load the current scenario into local form state when the selected scenario changes.
   *
   * The form uses fallback empty strings to avoid uncontrolled-to-controlled warnings.
   */
  useEffect(() => {
    const selectedScenarioData = getData().getCurrentScenario();
    if (!selectedScenarioData) return;

    setState({
      scenarioName: selectedScenarioData.scenarioName || "",
      startingDate: selectedScenarioData.startingDate || "",
      startingTime: selectedScenarioData.startingTime || "",
      currency: selectedScenarioData.currency || "",
      numberOfInstances: selectedScenarioData.numberOfInstances || "",
    });
  }, [getData().getCurrentScenario()]);

  /**
   * handleInputChange
   * -----------------
   * Generic change handler for all controlled inputs.
   * Updates the matching field using the input's "name" attribute.
   */
  function handleInputChange(event) {
    const { name, value } = event.target;
    setState((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /**
   * onSubmit
   * --------
   * Applies the local state to the current scenario object and persists changes.
   *
   * Steps:
   * 1) Prevent default form submission behavior
   * 2) Fetch current scenario from data layer
   * 3) If name changed, call renameScenario (keeps internal references consistent)
   * 4) Copy all edited fields into the scenario object
   * 5) Save scenario using the data layer
   * 6) Optionally close the sidebar (only when not in compact mode)
   */
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

    if (!compact && setShowSidebar) {
      setShowSidebar(false);
    }
  }

  /**
   * Shared Chakra UI props for consistent styling across inputs/selects.
   * This reduces repetition and keeps the form uniform.
   */
  const fieldProps = {
    bg: "white",
    size: compact ? "sm" : "md",
    borderRadius: "12px",
    px: 4,
    height: compact ? "38px" : "44px",
    w: "100%",
  };

  return (
    <Box w="100%">
      <Stack gap="3">
        {/**
         * Duplicate action is only shown in non-compact mode
         * (typically the full sidebar view).
         */}
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
              {Object.values(Currencies).map((currency) => (
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

          {/**
           * Cancel button is only shown in non-compact mode,
           * and only if a sidebar close handler is provided.
           */}
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

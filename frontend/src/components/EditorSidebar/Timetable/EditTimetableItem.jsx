import {
  Button,
  FormControl,
  FormLabel,
  Select,
  Box,
  Stack,
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
  Divider,
} from "@chakra-ui/react";
import {
  FiClock,
  FiCalendar,
  FiTrash2,
  FiEdit3,
  FiArrowLeft,
} from "react-icons/fi";
import EditorSidebarButton from "../EditorSidebarButton";

/**
 * Static weekday options for timetable entries.
 * The UI uses these values in two dropdown fields (start weekday / end weekday).
 */
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Available hour values for the start/end time dropdowns.
 * Produces [0, 1, 2, ... , 23].
 */
const hours = Array.from({ length: 24 }, (_, i) => i);

/**
 * EditTimetableItem
 * -----------------
 * Sidebar editor component for a single timetable item.
 *
 * Responsibilities:
 * - Allow the user to edit weekday and hour ranges of a selected timetable entry
 * - Persist changes by calling getData().saveCurrentScenario()
 * - Allow the user to delete the selected timetable item from the timetable list
 * - Provide two UI modes:
 *   (1) Expanded sidebar: show full form inline
 *   (2) Collapsed sidebar: show a compact button and open a Popover for the form
 *
 * Props (high level):
 * - currentTimetable: parent timetable object that owns timeTableItems
 * - currentTimetableItem: the specific entry currently selected/edited
 * - setCurrentTimetableItem: setter used to clear the selection after deletion
 * - getData: provides persistence utilities (e.g., saveCurrentScenario)
 * - collapsed: when true, render the compact popover-based UI
 * - onBack: optional callback to return to the previous sidebar view
 */
const EditTimetableItem = ({
  currentTimetable,
  getData,
  currentTimetableItem,
  setCurrentTimetableItem,
  collapsed = false,
  onBack,
}) => {
  /**
   * handleInputChange
   * -----------------
   * Generic change handler for Select inputs.
   *
   * How it works:
   * - Reads { name, value } from the HTML select element
   * - Updates the currentTimetableItem object by key (name)
   * - Immediately persists the change by saving the current scenario
   *
   * Note:
   * This component mutates currentTimetableItem directly. The persistence layer
   * (saveCurrentScenario) is responsible for capturing and storing the updated state.
   */
  function handleInputChange(resource) {
    const target = resource.target;
    const value = target.value;
    const name = target.name;
    currentTimetableItem[name] = value;
    getData().saveCurrentScenario();
  }

  /**
   * deleteItem
   * ----------
   * Removes the current timetable item from the parent timetable.
   *
   * Steps:
   * 1) Save a reference to the current item
   * 2) Clear selection in UI (setCurrentTimetableItem(undefined))
   * 3) Remove the item from currentTimetable.timeTableItems by filtering it out
   * 4) Persist the updated scenario
   */
  function deleteItem() {
    const itemToDelete = currentTimetableItem;
    setCurrentTimetableItem(undefined);

    currentTimetable.timeTableItems = currentTimetable.timeTableItems.filter(
      (timetableItem) => timetableItem !== itemToDelete
    );

    getData().saveCurrentScenario();
  }

  /**
   * formFields
   * ----------
   * Renders the editable form UI.
   *
   * The "compact" flag is used for collapsed mode:
   * - compact=false: show full labels (FormLabel) and normal spacing
   * - compact=true: hide labels and show icon hints via tooltip + left icon
   *
   * This function is reused in both expanded mode and inside the Popover.
   */
  const formFields = (compact = false) => (
    <Stack gap={compact ? "1" : "2"} mt={compact ? 0 : 0}>
      <FormControl>
        {!compact && <FormLabel>Start weekday:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Start weekday" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Select
            value={currentTimetableItem.startWeekday}
            bg="white"
            name="startWeekday"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            onChange={(event) => handleInputChange(event)}
          >
            {days.map((day, index) => (
              <option key={index} value={day}>
                {day}
              </option>
            ))}
          </Select>
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>End weekday:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="End weekday" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Select
            value={currentTimetableItem.endWeekday}
            bg="white"
            name="endWeekday"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            onChange={(event) => handleInputChange(event)}
          >
            {days.map((day, index) => (
              <option key={index} value={day}>
                {day}
              </option>
            ))}
          </Select>
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Start time:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Start time" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiClock} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Select
            value={currentTimetableItem.startTime}
            bg="white"
            name="startTime"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            onChange={(event) => handleInputChange(event)}
          >
            {hours.map((hour, index) => (
              <option key={index} value={hour}>
                {hour}:00
              </option>
            ))}
          </Select>
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>End time:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="End time" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiClock} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Select
            value={currentTimetableItem.endTime}
            bg="white"
            name="endTime"
            size={compact ? "sm" : "md"}
            pl={compact ? 9 : 0}
            onChange={(event) => handleInputChange(event)}
          >
            {hours.map((hour, index) => (
              <option key={index} value={hour}>
                {hour}:00
              </option>
            ))}
          </Select>
        </InputGroup>
      </FormControl>

      <EditorSidebarButton
        icon={FiTrash2}
        variant="danger"
        collapsed={compact}
        onClick={deleteItem}
        mt={2}
      >
        Delete
      </EditorSidebarButton>
    </Stack>
  );

  /**
   * Expanded sidebar mode:
   * - If onBack is provided, show a "Back" button plus divider
   * - Render the full form directly inside the sidebar
   */
  if (!collapsed) {
    return (
      <Box w="100%">
        {onBack && (
          <>
            <Box mt={3} mb={6}>
              <EditorSidebarButton onClick={onBack} icon={FiArrowLeft} variant="outline">
                Back
              </EditorSidebarButton>
            </Box>
            <Divider />
          </>
        )}
        {formFields(false)}
      </Box>
    );
  }

  /**
   * Collapsed sidebar mode:
   * - Optional "Back" button shown as icon-only style
   * - Main editing form is placed in a Popover to save sidebar space
   */
  return (
    <Box w="100%">
      {onBack && (
        <Box mt={3} mb={3}>
          <EditorSidebarButton
            onClick={onBack}
            icon={FiArrowLeft}
            variant="outline"
            collapsed={true}
          >
            Back
          </EditorSidebarButton>
        </Box>
      )}

      <Popover placement="right-start" closeOnBlur={true}>
        <PopoverTrigger>
          <Box mt={3}>
            <EditorSidebarButton icon={FiEdit3} variant="primary" collapsed={true}>
              Edit Schedule
            </EditorSidebarButton>
          </Box>
        </PopoverTrigger>

        <PopoverContent ml={2} maxW="300px" _focus={{ boxShadow: "lg" }}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            <Heading size="sm">Edit Timetable Item</Heading>
          </PopoverHeader>
          <PopoverBody>{formFields(true)}</PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

export default EditTimetableItem;

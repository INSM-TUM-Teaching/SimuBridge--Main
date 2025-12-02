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
} from '@chakra-ui/react';
import {
  FiClock,
  FiCalendar,
  FiTrash2,
  FiEdit3,
  FiArrowLeft,
} from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]; //TODO duplicate
const hours = Array.from({ length: 24 }, (_, i) => i);

const EditTimetableItem = ({
  currentTimetable,
  getData,
  currentTimetableItem,
  setCurrentTimetableItem,
  collapsed = false,
  onBack,
}) => {
  function handleInputChange(resource) {
    const target = resource.target;
    const value = target.value;
    const name = target.name;
    currentTimetableItem[name] = value;
    getData().saveCurrentScenario();
  }

  function deleteItem() {
    const itemToDelete = currentTimetableItem;
    setCurrentTimetableItem(undefined);
    currentTimetable.timeTableItems = currentTimetable.timeTableItems.filter(
      timetableItem => timetableItem !== itemToDelete
    );
    getData().saveCurrentScenario();
  }

  const formFields = (compact = false) => (
    <Stack gap={compact ? '1' : '2'} mt={compact ? 0 : 0}>
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
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 0}
            onChange={event => handleInputChange(event)}
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
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 0}
            onChange={event => handleInputChange(event)}
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
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 0}
            onChange={event => handleInputChange(event)}
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
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 0}
            onChange={event => handleInputChange(event)}
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

  if (!collapsed) {
    return (
      <Box w="100%">
        {onBack && (
          <>
            <Box mt={3} mb={6}>
              <EditorSidebarButton
                onClick={onBack}
                icon={FiArrowLeft}
                variant="outline"
              >
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

  // Collapsed mode - show popover for editing
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
            <EditorSidebarButton
              icon={FiEdit3}
              variant="primary"
              collapsed={true}
            >
              Edit Schedule
            </EditorSidebarButton>
          </Box>
        </PopoverTrigger>

        <PopoverContent ml={2} maxW="300px" _focus={{ boxShadow: 'lg' }}>
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

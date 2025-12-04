import React, { useEffect, useState } from 'react';

import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { EditorSidebarAlternate } from '../../EditorSidebar/EditorSidebar';
import EditTimetableItem from '../../EditorSidebar/Timetable/EditTimetableItem';
import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';

const { compare } = require('js-deep-equals');

// Create an array of days of the week and an array of hours in a day
const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const hours = Array.from({ length: 24 }, (_, i) => i);

function TimeTable({
  currentTimetable,
  setCurrentRightSideBar,
  getData,
  sidebarsCollapsed,
  toggleSidebars,
}) {
  const [currentTimetableItem, setCurrentTimetableItem] = useState(undefined);

  const formatHourLabel = hour => `${String(Number(hour)).padStart(2, '0')}:00`;

  useEffect(() => {
    // Stay stable on reloads
    const successor = currentTimetable.timeTableItems.find(otherItem =>
      compare(currentTimetableItem, otherItem)
    );
    setCurrentTimetableItem(successor);
  }, [currentTimetable]);

  useEffect(() => {
    if (currentTimetableItem) {
      setCurrentRightSideBar(
        <EditorSidebarAlternate
          title="Edit Timetable Item"
          content={
            <EditTimetableItem
              {...{
                getData,
                currentTimetable,
                currentTimetableItem,
                setCurrentTimetableItem,
                collapsed: sidebarsCollapsed,
                onBack: () => setCurrentTimetableItem(undefined),
              }}
            />
          }
          collapsed={sidebarsCollapsed}
          onToggle={toggleSidebars}
          onClose={() => setCurrentTimetableItem(undefined)}
        />
      );
    } else {
      setCurrentRightSideBar(undefined);
    }
  }, [
    currentTimetableItem,
    currentTimetable,
    getData().getCurrentScenario(),
    sidebarsCollapsed,
  ]);

  function isInsideTimetableItem(day, hour, timetableItem) {
    const { startWeekday, startTime, endWeekday, endTime } = timetableItem;

    function dayTimeToHourOfWeek(day, hour) {
      const dayIndex = days.indexOf(day);
      return dayIndex * hours.length + hour;
    }

    const startHourOfWeek = dayTimeToHourOfWeek(
      startWeekday,
      Number(startTime)
    );
    const endHourOfWeek = dayTimeToHourOfWeek(endWeekday, Number(endTime));
    const currentHourOfWeek = dayTimeToHourOfWeek(day, hour);
    const itemIsOverflow =
      days.indexOf(endWeekday) < days.indexOf(startWeekday); // The item start is before Sunday 12pm and the end is after, then the check must be flipped

    return (
      (itemIsOverflow && currentHourOfWeek >= startHourOfWeek) ||
      (itemIsOverflow && currentHourOfWeek < endHourOfWeek) ||
      (currentHourOfWeek >= startHourOfWeek &&
        currentHourOfWeek < endHourOfWeek)
    );
  }

  function addTimeTableItem(startDay, startHour) {
    const newItem = SimulationModelModdle.getInstance().create(
      'simulationmodel:TimetableItem',
      {
        startWeekday: startDay,
        startTime: startHour,
        endWeekday: startDay,
        endTime: startHour + 1,
      }
    );
    currentTimetable.timeTableItems.push(newItem);
    setCurrentTimetableItem(newItem);
    getData().saveCurrentScenario();
  }

  return (
    <Stack spacing={4}>
      <Flex
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        gap={3}
        wrap="wrap"
      >
        <Box>
          <Heading size="md" color="#0F172A">
            Weekly timetable
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Click an empty slot to add a 1 hour block. Select a block to edit its
            details in the sidebar.
          </Text>
        </Box>
        <HStack spacing={4} color="gray.600" fontSize="sm">
          <Flex align="center" gap={2}>
            <Box boxSize={3} borderRadius="full" bg="blue.500" />
            <Text>Selected</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box
              boxSize={3}
              borderRadius="full"
              bg="blue.100"
              border="1px solid"
              borderColor="blue.200"
            />
            <Text>Booked</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box
              boxSize={3}
              borderRadius="full"
              bg="gray.100"
              border="1px solid"
              borderColor="gray.200"
            />
            <Text>Available</Text>
          </Flex>
        </HStack>
      </Flex>

      <Box
        border="1px"
        borderColor="gray.200"
        borderRadius="2xl"
        overflow="hidden"
        bg="white"
        boxShadow="sm"
      >
        <Grid
          templateColumns={`100px repeat(${days.length}, 1fr)`}
          rowGap={0}
          columnGap={0}
        >
          <Box
            bg="gray.50"
            px={3}
            py={3}
            borderRight="1px solid"
            borderColor="gray.200"
          >
            <Text
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.12em"
              color="gray.700"
              textTransform="uppercase"
            >
              Time
            </Text>
          </Box>
          {days.map(day => (
            <Box
              key={day}
              px={3}
              py={3}
              textAlign="center"
              bgGradient="linear(to-b, white, gray.50)"
              borderRight="1px solid"
              borderColor="gray.200"
            >
              <Text fontWeight="700" color="#0F172A">
                {day}
              </Text>
            </Box>
          ))}

          {hours.map(hour => {
            return (
              <React.Fragment key={hour}>
                <Box
                  bg="gray.50"
                  px={3}
                  py={3}
                  borderTop="1px solid"
                  borderRight="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontWeight="600" color="gray.700">
                    {formatHourLabel(hour)}
                  </Text>
                </Box>
                {days.map((day, i) => {
                  const existingItem = currentTimetable.timeTableItems.find(
                    timetableItem => isInsideTimetableItem(day, hour, timetableItem)
                  );
                  const isSelected = existingItem === currentTimetableItem;
                  const tooltipLabel = existingItem
                    ? `${existingItem.startWeekday} ${formatHourLabel(
                        existingItem.startTime
                      )} \u2192 ${existingItem.endWeekday} ${formatHourLabel(
                        existingItem.endTime
                      )}`
                    : `Add block starting ${day} ${formatHourLabel(hour)}`;
                  return (
                    <Tooltip
                      key={`${day}-${i}`}
                      hasArrow
                      label={tooltipLabel}
                      openDelay={150}
                    >
                      <Box
                        role="button"
                        aria-label={tooltipLabel}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minH="52px"
                        px={2}
                        borderTop="1px solid"
                        borderRight="1px solid"
                        borderColor="gray.100"
                        transition="all 0.15s ease"
                        {...(existingItem
                          ? {
                              background: isSelected ? 'blue.500' : 'blue.100',
                              color: isSelected ? 'white' : 'blue.900',
                              onClick: () => setCurrentTimetableItem(existingItem),
                              _hover: {
                                background: isSelected ? 'blue.600' : 'blue.200',
                                boxShadow: 'md',
                                transform: 'translateY(-1px)',
                              },
                            }
                          : {
                              background: 'white',
                              color: 'gray.500',
                              onClick: () => addTimeTableItem(day, hour),
                              _hover: {
                                background: 'gray.50',
                                color: 'gray.700',
                                boxShadow: 'inset 0 0 0 1px #CBD5E0',
                              },
                            })}
                      >
                        {existingItem ? (
                          <Box />
                        ) : (
                          <Text fontSize="xs" fontWeight="600">
                            + Add
                          </Text>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            );
          })}
        </Grid>
      </Box>
    </Stack>
  );
}

export default TimeTable;

import React, { useEffect, useState } from 'react';

import { Box, Heading, Text, Grid, Card, CardBody } from '@chakra-ui/react';
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

function TimeTable({ currentTimetable, setCurrentRightSideBar, getData }) {
  const [currentTimetableItem, setCurrentTimetableItem] = useState(undefined);

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
              }}
            />
          }
          onClose={() => setCurrentTimetableItem(undefined)}
        />
      );
    } else {
      setCurrentRightSideBar(undefined);
    }
  }, [currentTimetableItem, currentTimetable, getData().getCurrentScenario()]);

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
    <Grid templateColumns="repeat(8, 1fr)" gap={2}>
      <Box>
        <Heading size="sm" textAlign="center">
          Time
        </Heading>
      </Box>
      {/* Map over the array of days to render a Box for each day containing a Heading to display the day */}

      {days.map(day => (
        <Box key={day}>
          <Heading size="sm" textAlign="center">
            {day}
          </Heading>
        </Box>
      ))}

      {/* Map over the array of hours to render a Box for each hour, and for each hour, map over the array of days to highlight time slots if there are events during that time. */}
      {hours.map(hour => {
        return (
          <React.Fragment key={hour}>
            <Box>
              <Text textAlign="center">{hour + ':00'}</Text>
            </Box>
            {days.map((day, i) => {
              const existingItem = currentTimetable.timeTableItems.find(
                timetableItem => isInsideTimetableItem(day, hour, timetableItem)
              );
              return (
                <Box
                  key={i}
                  color="transparent"
                  {...(existingItem
                    ? {
                        background:
                          existingItem === currentTimetableItem
                            ? 'blue.500'
                            : 'green.200',
                        cursor: 'pointer',
                        onClick: () => setCurrentTimetableItem(existingItem),
                      }
                    : {
                        background: 'blackAlpha.100',
                        _hover: {
                          background: 'blackAlpha.400',
                          color: 'white',
                          textAlign: 'center',
                        },
                        onClick: () => addTimeTableItem(day, hour),
                      })}
                  borderRadius="4"
                >
                  <b>+</b>
                </Box>
              );
            })}
          </React.Fragment>
        );
      })}
    </Grid>
  );
}

export default TimeTable;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Stack,
  Tabs,
  TabList,
  Tab,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, PlusSquareIcon } from '@chakra-ui/icons';
import TimeTable from './TimeTable';
import ResourceNavigation from '../ResourceNavigation';
import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';

const TimetableOverview = ({
  getData,
  setCurrentRightSideBar,
  sidebarsCollapsed,
  toggleSidebars,
}) => {
  // State to hold selected timetable index in the list
  const [selectedTimeTable, setSelectedTimeTableInternal] = useState(0);
  function setSelectedTimeTable(index) {
    let indexToSet = index;
    const timeTables =
      getData().getCurrentScenario().resourceParameters.timeTables;
    const currentCount = timeTables.length;
    if (index >= currentCount) {
      indexToSet = currentCount - 1;
    } else if (index < 0) {
      indexToSet = 0;
    }
    setSelectedTimeTableInternal(indexToSet);
  }

  // On mount or whenever the currentScenario changes, set the default selected timetable and call the setCurrent and setTimetable
  // setCurrent is important for displaying the right editorsidebar on the right side
  // setTimetable is important for displaying the right timetable in the editorsidebar on the right side
  useEffect(() => {
    setSelectedTimeTable(0);
  }, []);

  function addTimetable() {
    getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.push(
        SimulationModelModdle.getInstance().create(
          'simulationmodel:Timetable',
          {
            id: 'NewTimetable',
            timeTableItems: [],
          }
        )
      );
    getData().saveCurrentScenario();
    setSelectedTimeTable(
      getData().getCurrentScenario().resourceParameters.timeTables.length - 1
    );
  }

  // Remove a timetable from the list of timetables in the current scenario
  const deleteTimetable = item => {
    const selectedTimeTableData =
      getData().getCurrentScenario().resourceParameters.timeTables[
        selectedTimeTable
      ];
    getData().getCurrentScenario().resourceParameters.timeTables = getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.filter(timeTable => timeTable.id !== item);
    getData().saveCurrentScenario();
    const newSelectedIndex = getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.indexOf(selectedTimeTableData);
    if (selectedTimeTable != newSelectedIndex) {
      setSelectedTimeTable(
        newSelectedIndex > 0
          ? newSelectedIndex
          : Math.max(selectedTimeTable - 1, 0)
      );
    }
  };

  const currentTimetable =
    getData().getCurrentScenario().resourceParameters.timeTables[
      selectedTimeTable
    ];

  return (
    <>
      <Box h="93vh" overflowY="auto" p="5">
        <Stack spacing={5}>
          {/* Display the Navigation for ressources and set curent Tab to timetable to highlight the current tab */}
          <ResourceNavigation currentTab="timetable" />
          {/* If a timetable is selected, render a TimeTable component */}

          <Card bg="white" w="100%" overflowX="auto">
            <Tabs
              index={selectedTimeTable}
              onChange={index => setSelectedTimeTable(index)}
            >
              <TabList alignItems="center">
                {getData()
                  .getCurrentScenario()
                  .resourceParameters.timeTables.map((timetable, index) => {
                    return (
                      <Tab aria-selected={selectedTimeTable === index}>
                        {timetable.id}
                        <IconButton
                          aria-label={'Edit timetable name'}
                          variant="ghost"
                          onClick={() => {
                            const newName = window.prompt(
                              'New timetable name?',
                              timetable.id
                            );
                            if (newName) {
                              timetable.id = newName;
                              getData().saveCurrentScenario();
                            }
                          }}
                          icon={<EditIcon />}
                        />
                        <IconButton
                          aria-label={'Delete timetable'}
                          variant="ghost"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete timetable ${timetable.id} ?`
                              )
                            ) {
                              deleteTimetable(timetable.id);
                            }
                          }}
                          icon={<DeleteIcon />}
                        />
                      </Tab>
                    );
                  })}
                <IconButton
                  aria-label={'Add new timetable'}
                  variant="ghost"
                  onClick={addTimetable}
                  icon={<PlusSquareIcon />}
                />
              </TabList>
            </Tabs>
            <CardBody>
              {currentTimetable ? (
                <TimeTable
                  {...{
                    currentTimetable,
                    setCurrentRightSideBar,
                    getData,
                    sidebarsCollapsed,
                    toggleSidebars,
                  }}
                />
              ) : (
                ''
              )}
            </CardBody>
          </Card>
        </Stack>
      </Box>
    </>
  );
};

export default TimetableOverview;

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardBody,
  Stack,
  Tabs,
  TabList,
  Tab,
  IconButton,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, PlusSquareIcon } from "@chakra-ui/icons";
import TimeTable from "./TimeTable";
import ResourceNavigation from "../ResourceNavigation";
import SimulationModelModdle from "simulation-bridge-datamodel/DataModel";

/**
 * TimetableOverview
 * -----------------
 * Page that lists all timetables of the current scenario and lets the user:
 * - switch between timetables via tabs
 * - rename a timetable
 * - delete a timetable
 * - add a new timetable
 *
 * The selected timetable is rendered in the center using the <TimeTable /> component.
 *
 * Props:
 * - getData: project data accessor (current scenario + saveCurrentScenario)
 * - setCurrentRightSideBar: allows child components to render editor content into the right sidebar
 * - sidebarsCollapsed: global UI state for compact layout
 * - toggleSidebars: toggles sidebar collapsed/expanded
 */
const TimetableOverview = ({
  getData,
  setCurrentRightSideBar,
  sidebarsCollapsed,
  toggleSidebars,
}) => {
  /**
   * selectedTimeTable stores the index of the currently active timetable tab.
   * The state is stored as an index (not an id) because Chakra Tabs use an index.
   */
  const [selectedTimeTable, setSelectedTimeTableInternal] = useState(0);

  /**
   * setSelectedTimeTable clamps the given index so it always stays in range.
   * This prevents out-of-bounds errors after deletions or when lists change.
   */
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

  /**
   * Initialize selected timetable on component mount.
   * The default behavior is to always start at the first timetable (index 0).
   */
  useEffect(() => {
    setSelectedTimeTable(0);
  }, []);

  /**
   * addTimetable creates a new Timetable object via the Moddle factory,
   * pushes it into the current scenario, persists it, and selects the new tab.
   */
  function addTimetable() {
    getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.push(
        SimulationModelModdle.getInstance().create("simulationmodel:Timetable", {
          id: "NewTimetable",
          timeTableItems: [],
        })
      );

    getData().saveCurrentScenario();

    setSelectedTimeTable(
      getData().getCurrentScenario().resourceParameters.timeTables.length - 1
    );
  }

  /**
   * deleteTimetable removes a timetable by id and then updates the selected index.
   *
   * The selection handling tries to keep the user on a nearby timetable:
   * - If the previously selected timetable still exists, keep it selected
   * - Otherwise, fallback to the previous index (or 0 if we deleted the first)
   */
  const deleteTimetable = (item) => {
    const selectedTimeTableData =
      getData().getCurrentScenario().resourceParameters.timeTables[
        selectedTimeTable
      ];

    getData().getCurrentScenario().resourceParameters.timeTables = getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.filter((timeTable) => timeTable.id !== item);

    getData().saveCurrentScenario();

    const newSelectedIndex = getData()
      .getCurrentScenario()
      .resourceParameters.timeTables.indexOf(selectedTimeTableData);

    if (selectedTimeTable !== newSelectedIndex) {
      setSelectedTimeTable(
        newSelectedIndex > 0 ? newSelectedIndex : Math.max(selectedTimeTable - 1, 0)
      );
    }
  };

  /**
   * currentTimetable is the currently selected timetable object.
   * It is passed into <TimeTable /> so the table editor renders the right data.
   */
  const currentTimetable =
    getData().getCurrentScenario().resourceParameters.timeTables[
      selectedTimeTable
    ];

  return (
    <>
      <Box h="93vh" overflowY="auto" p="5">
        <Stack spacing={5}>
          {/*
            ResourceNavigation provides the top navigation inside the Resource section.
            currentTab="timetable" highlights that the user is on the Timetable page.
          */}
          <ResourceNavigation currentTab="timetable" />

          <Card bg="white" w="100%" overflowX="auto">
            {/*
              Tabs:
              - One tab per timetable in the current scenario
              - The active tab index is controlled via selectedTimeTable
              - Changing tabs updates selectedTimeTable
            */}
            <Tabs
              index={selectedTimeTable}
              onChange={(index) => setSelectedTimeTable(index)}
            >
              <TabList alignItems="center">
                {getData()
                  .getCurrentScenario()
                  .resourceParameters.timeTables.map((timetable, index) => {
                    return (
                      <Tab aria-selected={selectedTimeTable === index}>
                        {timetable.id}

                        {/*
                          Edit timetable name:
                          Uses a simple browser prompt to rename the timetable.
                          The data is then persisted by saveCurrentScenario.
                        */}
                        <IconButton
                          aria-label={"Edit timetable name"}
                          variant="ghost"
                          onClick={() => {
                            const newName = window.prompt(
                              "New timetable name?",
                              timetable.id
                            );
                            if (newName) {
                              timetable.id = newName;
                              getData().saveCurrentScenario();
                            }
                          }}
                          icon={<EditIcon />}
                        />

                        {/*
                          Delete timetable:
                          Asks for confirmation, then removes the timetable by id.
                          Afterwards, the selected tab index is adjusted safely.
                        */}
                        <IconButton
                          aria-label={"Delete timetable"}
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(`Delete timetable ${timetable.id} ?`)) {
                              deleteTimetable(timetable.id);
                            }
                          }}
                          icon={<DeleteIcon />}
                        />
                      </Tab>
                    );
                  })}

                {/*
                  Add new timetable:
                  Creates a fresh timetable and selects it immediately.
                */}
                <IconButton
                  aria-label={"Add new timetable"}
                  variant="ghost"
                  onClick={addTimetable}
                  icon={<PlusSquareIcon />}
                />
              </TabList>
            </Tabs>

            <CardBody>
              {/*
                Render the selected timetable editor.
                If no timetable exists (empty list), render nothing.
              */}
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
                ""
              )}
            </CardBody>
          </Card>
        </Stack>
      </Box>
    </>
  );
};

export default TimetableOverview;

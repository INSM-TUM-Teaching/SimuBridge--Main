import React from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Tooltip,
} from "@chakra-ui/react";
import CreateEmptyScenarioButton from "../CreateEmptyScenarioButton";
import { CopyIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import { FiEye } from "react-icons/fi";

/**
 * OverviewTable
 * -------------
 * Displays an overview of all scenarios in the current project as a table.
 *
 * The table shows general simulation parameters for each scenario:
 * - Scenario name
 * - Starting date
 * - Starting time
 * - Number of process instances
 * - Currency
 *
 * For each scenario, the user can perform actions:
 * - Inspect (open scenario view and set it as current)
 * - Duplicate (create a copy of the scenario)
 * - Delete (remove scenario)
 *
 * Props:
 * - getData: data-layer accessor that provides scenario data and actions
 * - toast: optional toast handler (passed in, but not used in this component currently)
 */
function OverviewTable({ getData, toast }) {
  return (
    <>
      <Table variant="simple">
        <Thead w="100%">
          <Tr>
            <Th>Scenario</Th>
            <Th>Starting date</Th>
            <Th>Starting time</Th>
            <Th>No. instances</Th>
            <Th>Currency</Th>
            <Th></Th>
          </Tr>
        </Thead>

        <Tbody>
          {/**
           * Render one table row per scenario.
           * getAllScenarios() returns an array of scenario objects.
           * index is used to set the current scenario when inspecting.
           */}
          {getData()
            .getAllScenarios()
            .map((scenario, index) => {
              return (
                <Tr>
                  <Td align="left">{scenario.scenarioName}</Td>
                  <Td align="left">{scenario.startingDate}</Td>
                  <Td align="left">{scenario.startingTime}</Td>
                  <Td align="left">{scenario.numberOfInstances}</Td>
                  <Td align="left">{scenario.currency}</Td>

                  <Td>
                    <Tooltip label="Inspect Scenario" fontSize="md">
                      <Button
                        as={Link}
                        to="/scenario"
                        colorScheme="gray"
                        variant="ghost"
                        onClick={() => {
                          /**
                           * Make this scenario the active scenario before navigating.
                           * The scenario page can then read and display the current scenario.
                           */
                          getData().setCurrentScenarioByIndex(index);
                        }}
                      >
                        <FiEye color="gray" />
                      </Button>
                    </Tooltip>

                    <Tooltip label="Duplicate Scenario" fontSize="md">
                      <Button
                        colorScheme="gray"
                        variant="ghost"
                        onClick={() => scenario.duplicate()}
                      >
                        <CopyIcon color="gray" />
                      </Button>
                    </Tooltip>

                    <Tooltip label="Delete Scenario" fontSize="md">
                      <Button
                        colorScheme="gray"
                        variant="ghost"
                        onClick={() => scenario.delete()}
                      >
                        <DeleteIcon color="gray" />
                      </Button>
                    </Tooltip>
                  </Td>
                </Tr>
              );
            })}
        </Tbody>
      </Table>
    </>
  );
}

export default OverviewTable;

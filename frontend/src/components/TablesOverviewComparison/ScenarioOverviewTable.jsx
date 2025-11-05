import React from 'react';
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
} from '@chakra-ui/react';
import CreateEmptyScenarioButton from '../CreateEmptyScenarioButton';
import { CopyIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';

function OverviewTable({ getData, toast }) {
  return (
    <>
      {/* Displaying of general simulation parameters for all scenarios */}
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
          {/*Filling in the table*/}
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

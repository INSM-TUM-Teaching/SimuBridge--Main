import {
  Button,
  Stack,
  Box,
  Heading,
  Text,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import OverviewTableCompare from '../TablesOverviewComparison/OverviewTableCompare';
import ResourceTableCompare from '../TablesOverviewComparison/ResourceTableCompare';
import BPMNTableCompare from '../TablesOverviewComparison/BPMNTableCompare';

function ComparePage({
  getData,
  scenariosCompare,
  setNotSameScenario,
  resourceCompared,
  setResourceCompared,
}) {
  let current_role,
    role = [];
  let i,
    notsameRes = [],
    valueRes = [];
  const [scenDiff] = useState([]);
  let newItem;
  const equalsCheck = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  // Compare resource parameters
  for (i = 0; i < getData().getAllScenarios().length; i++) {
    let scenarioToCompare = getData().getAllScenarios()[i];
    if (scenariosCompare.includes(scenarioToCompare.scenarioName)) {
      if (
        scenarioToCompare.resourceParameters.resources !==
        getData().getCurrentScenario().resourceParameters.resources
      ) {
        getData()
          .getCurrentScenario()
          .resourceParameters.resources.map(current_element => {
            for (let role of getData().getCurrentScenario().resourceParameters
              .roles) {
              for (let resource of role.resources) {
                if (resource.id === current_element.id) {
                  current_role = role.id;
                  break;
                } else
                  current_role = 'The resource does not exist for this role';
              }
            }
            for (let roleToCompare of scenarioToCompare.resourceParameters
              .roles) {
              for (let resource of roleToCompare.resources) {
                if (resource.id === current_element.id) {
                  role = roleToCompare.id;
                  break;
                } else role = 'The Role does not exist in role';
              }
            }
            if (current_role !== role) {
              newItem = {
                field: 'role',
                id: current_element.id,
                value: current_role,
              };
              resourceCompared.push(newItem);
            }
            let resource = scenarioToCompare.resourceParameters.resources.find(
              item => item.id === current_element.id
            );
            if (resource !== undefined) {
              if (current_element.costHour !== resource.costHour) {
                newItem = {
                  field: 'costHour',
                  id: current_element.id,
                  value: current_element.costHour,
                };
                resourceCompared.push(newItem);
              }
              if (current_element.schedule !== resource.schedule) {
                newItem = {
                  field: 'schedule',
                  id: current_element.id,
                  value: current_element.schedule,
                };
                resourceCompared.push(newItem);
              }
            } else {
              notsameRes.push(current_element.id);
              valueRes.push(current_element.id);
              newItem = {
                field: 'id',
                id: current_element.id,
                value: current_element.id,
              };
              resourceCompared.push(newItem);
            }
          });
      }
    }
  }

  // Compare scenario parameters
  for (i = 0; i < getData().getAllScenarios().length; i++) {
    let scenarioToCompare = getData().getAllScenarios()[i];

    if (scenariosCompare.includes(scenarioToCompare.scenarioName)) {
      if (
        scenarioToCompare.scenarioName !==
        getData().getCurrentScenario().scenarioName
      ) {
        scenDiff[scenDiff.length] = 'scenarioName';
      }
      if (
        scenarioToCompare.startingDate !==
        getData().getCurrentScenario().startingDate
      ) {
        scenDiff[scenDiff.length] = 'startingDate';
      }
      if (
        scenarioToCompare.startingTime !==
        getData().getCurrentScenario().startingTime
      ) {
        scenDiff[scenDiff.length] = 'startingTime';
      }
      if (
        scenarioToCompare.numberOfInstances !==
        getData().getCurrentScenario().numberOfInstances
      ) {
        scenDiff[scenDiff.length] = 'numberOfInstances';
      }
      if (
        scenarioToCompare.timeUnit !== getData().getCurrentScenario().timeUnit
      ) {
        scenDiff[scenDiff.length] = 'timeUnit';
      }
      if (
        scenarioToCompare.currency !== getData().getCurrentScenario().currency
      ) {
        scenDiff[scenDiff.length] = 'currency';
      }
    }
  }

  setNotSameScenario(scenDiff);
  setResourceCompared(resourceCompared);

  return (
    <Box h="93vh" overflowY="auto" p={{ base: 4, md: 6 }} bg="#EAF4FF">
      <Stack spacing={6}>
        {/* Page Header */}
        <Flex align="center" justify="space-between">
          <Box>
            <Heading size="lg" color="#0F172A" mb={2}>
              Scenario Comparison
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Compare parameters across selected scenarios
            </Text>
          </Box>
          <Button
            as={Link}
            to="/overview"
            leftIcon={<Icon as={FiArrowLeft} />}
            variant="outline"
            borderColor="gray.300"
            _hover={{ bg: 'gray.50' }}
          >
            Back to Overview
          </Button>
        </Flex>

        {/* Simulation Scenario Comparison */}
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
            <Heading size="md" color="#0F172A">
              Simulation Scenario Parameters
            </Heading>
          </CardHeader>
          <CardBody>
            <OverviewTableCompare
              getData={getData}
              scenDiff={scenDiff}
              scenariosCompare={scenariosCompare}
            />
          </CardBody>
        </Card>

        {/* Resource Comparison */}
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <CardHeader borderBottom="1px" borderColor="gray.100" pb={4}>
            <Heading size="md" color="#0F172A">
              Resource Parameters
            </Heading>
          </CardHeader>
          <CardBody>
            <ResourceTableCompare
              getData={getData}
              scenDiff={scenDiff}
              scenariosCompare={scenariosCompare}
              notsameRes={notsameRes}
              valueRes={valueRes}
              ResourceCompared={resourceCompared}
            />
          </CardBody>
        </Card>

        {/* BPMN Comparison */}
        <BPMNTableCompare {...{ getData, scenariosCompare }} />
      </Stack>
    </Box>
  );
}

export default ComparePage;

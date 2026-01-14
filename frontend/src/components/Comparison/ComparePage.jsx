import React, { useEffect, useMemo } from "react";
import { Button, Stack, Box, Heading, Text, Flex, Icon } from "@chakra-ui/react";
import { Card, CardHeader, CardBody } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import OverviewTableCompare from "../TablesOverviewComparison/OverviewTableCompare";
import ResourceTableCompare from "../TablesOverviewComparison/ResourceTableCompare";
import BPMNTableCompare from "../TablesOverviewComparison/BPMNTableCompare";

function ComparePage({
  getData,
  scenariosCompare,
  setNotSameScenario,
  resourceCompared,
  setResourceCompared,
}) {
  const currentScenario = getData().getCurrentScenario();
  const allScenarios = getData().getAllScenarios() || [];

  // Helper: find role id for a resource in a given scenario
  const getRoleForResource = (scenario, resourceId) => {
    const roles = scenario?.resourceParameters?.roles || [];
    for (const role of roles) {
      const hasResource = (role?.resources || []).some(r => r?.id === resourceId);
      if (hasResource) return role.id;
    }
    return "The resource does not exist for this role";
  };

  const comparison = useMemo(() => {
    const selected = allScenarios.filter(s =>
      scenariosCompare?.includes(s?.scenarioName)
    );

    // If no current scenario, keep everything empty
    if (!currentScenario) {
      return {
        scenDiff: [],
        resourceComparedComputed: [],
        notsameRes: [],
        valueRes: [],
      };
    }

    // ---------- Scenario parameter diffs (collect fields that differ in ANY selected scenario) ----------
    const scenDiffSet = new Set();

    for (const s of selected) {
      if (!s) continue;

      if (s.scenarioName !== currentScenario.scenarioName) scenDiffSet.add("scenarioName");
      if (s.startingDate !== currentScenario.startingDate) scenDiffSet.add("startingDate");
      if (s.startingTime !== currentScenario.startingTime) scenDiffSet.add("startingTime");
      if (s.numberOfInstances !== currentScenario.numberOfInstances) scenDiffSet.add("numberOfInstances");
      if (s.timeUnit !== currentScenario.timeUnit) scenDiffSet.add("timeUnit");
      if (s.currency !== currentScenario.currency) scenDiffSet.add("currency");
    }

    const scenDiff = Array.from(scenDiffSet);

    // ---------- Resource diffs ----------
    const currentResources = currentScenario?.resourceParameters?.resources || [];
    const currentRoles = currentScenario?.resourceParameters?.roles || [];

    // Dedup so we don’t push the same diff 50x and also don’t mutate props/state while rendering
    const diffKeySet = new Set();
    const resourceDiffs = [];

    const notsameResSet = new Set();
    const valueResSet = new Set();

    // Compare current scenario resources against each selected scenario
    for (const s of selected) {
      if (!s || s === currentScenario) continue;

      const compareResources = s?.resourceParameters?.resources || [];

      for (const currentRes of currentResources) {
        if (!currentRes?.id) continue;

        const resourceId = currentRes.id;

        // role compare (role assignments)
        const currentRole = getRoleForResource(currentScenario, resourceId);
        const otherRole = getRoleForResource(s, resourceId);

        if (currentRole !== otherRole) {
          const key = `role:${resourceId}`;
          if (!diffKeySet.has(key)) {
            diffKeySet.add(key);
            resourceDiffs.push({ field: "role", id: resourceId, value: currentRole });
          }
        }

        // find matching resource object in scenarioToCompare
        const otherRes = compareResources.find(r => r?.id === resourceId);

        if (!otherRes) {
          notsameResSet.add(resourceId);
          valueResSet.add(resourceId);

          const key = `id:${resourceId}`;
          if (!diffKeySet.has(key)) {
            diffKeySet.add(key);
            resourceDiffs.push({ field: "id", id: resourceId, value: resourceId });
          }
          continue;
        }

        // costHour
        if (currentRes.costHour !== otherRes.costHour) {
          const key = `costHour:${resourceId}`;
          if (!diffKeySet.has(key)) {
            diffKeySet.add(key);
            resourceDiffs.push({
              field: "costHour",
              id: resourceId,
              value: currentRes.costHour,
            });
          }
        }

        // schedule
        if (currentRes.schedule !== otherRes.schedule) {
          const key = `schedule:${resourceId}`;
          if (!diffKeySet.has(key)) {
            diffKeySet.add(key);
            resourceDiffs.push({
              field: "schedule",
              id: resourceId,
              value: currentRes.schedule,
            });
          }
        }
      }
    }

    return {
      scenDiff,
      resourceComparedComputed: resourceDiffs,
      notsameRes: Array.from(notsameResSet),
      valueRes: Array.from(valueResSet),
    };
  }, [allScenarios, scenariosCompare, currentScenario, getData]);

  // Push computed results to parent state (ONLY as side-effect, not during render)
  useEffect(() => {
    setNotSameScenario(comparison.scenDiff);
  }, [comparison.scenDiff, setNotSameScenario]);

  useEffect(() => {
    setResourceCompared(comparison.resourceComparedComputed);
  }, [comparison.resourceComparedComputed, setResourceCompared]);

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
            _hover={{ bg: "gray.50" }}
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
              scenDiff={comparison.scenDiff}
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
              scenDiff={comparison.scenDiff}
              scenariosCompare={scenariosCompare}
              notsameRes={comparison.notsameRes}
              valueRes={comparison.valueRes}
              ResourceCompared={comparison.resourceComparedComputed}
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

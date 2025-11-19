import { useState } from 'react';
import Sidebar from '../Sidebar';
import { Text, Select, Box } from '@chakra-ui/react';
import NavigationItem from './NavigationItem';
import {
  FiHome,
  FiLayers,
  FiUsers,
  FiGitBranch,
  FiPlay,
  FiSettings,
  FiDownload,
  FiLogOut,
} from 'react-icons/fi';
import { downloadData } from '../../util/Storage';

function Navigation({
  setCurrent,
  getData,
  selectProject,
  collapsed,
  onToggle,
}) {
  // All navigation items in one flat list
  const navItems = [
    {
      name: 'Overview',
      icon: FiHome,
      path: '/overview',
      event: () => setCurrent('Overview'),
    },
  ];

  // Add scenario-specific items if scenario exists
  if (getData().getCurrentScenario()) {
    navItems.push(
      {
        name: 'Scenario',
        icon: FiLayers,
        path: '/scenario',
        event: () => setCurrent('Scenario Parameters'),
      },
      {
        name: 'Resources',
        icon: FiUsers,
        path: '/resource',
        event: () => setCurrent('Resource Parameters'),
      }
    );

    // Add model item if model exists
    if (getData().getCurrentModel()) {
      navItems.push({
        name: 'Model',
        icon: FiGitBranch,
        path: '/modelbased',
        event: () => setCurrent('Modelbased Parameters'),
      });
    }
  }

  // Add execution items
  navItems.push(
    {
      name: 'Simulation',
      icon: FiPlay,
      path: '/simulation',
      event: () => setCurrent('Run Simulation'),
    },
    {
      name: 'Process Mining',
      icon: FiSettings,
      path: '/processminer',
      event: () => setCurrent('Run Process Miner'),
    }
  );

  // Bottom items
  const bottomItems = [
    {
      name: 'Export',
      icon: FiDownload,
      path: null,
      event: e => {
        e.preventDefault();
        const jsonData = JSON.stringify(getData().getAllScenarios());
        downloadData(jsonData, `${getData().projectName}.json`);
      },
    },
    {
      name: 'Close',
      icon: FiLogOut,
      path: null,
      event: e => {
        e.preventDefault();
        selectProject(null);
      },
    },
  ];

  const Nav = () => {
    return (
      <Text fontSize="sm" textAlign="center" color="#0F172A" fontWeight="bold">
        SimuBridge
      </Text>
    );
  };

  return (
    <Sidebar
      title={<Nav />}
      collapsed={collapsed}
      // onToggle={() => setCollapsed(!collapsed)}
      onToggle={onToggle}
      content={
        <>
          {/* Project Name - hide when collapsed */}
          {!collapsed && (
            <Box display={{ base: 'none', md: 'block' }} mb={5} px={2}>
              <Box
                bg="linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%)"
                borderRadius="xl"
                p={3.5}
                border="1px"
                borderColor="blue.200"
                boxShadow="0 2px 8px rgba(47, 128, 237, 0.08)"
              >
                <Text
                  fontSize="xs"
                  color="blue.600"
                  mb={1.5}
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Project
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color="gray.900"
                  noOfLines={1}
                >
                  {getData().projectName}
                </Text>
              </Box>
            </Box>
          )}

          {/* Scenario Selector - hide when collapsed */}
          {!collapsed && getData().getCurrentScenario() && (
            <Box display={{ base: 'none', md: 'block' }} mb={5} px={2}>
              <Text
                fontSize="xs"
                color="gray.600"
                mb={2}
                px={1}
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Active Scenario
              </Text>
              <Select
                value={getData().getCurrentScenario()?.scenarioName}
                bg="white"
                size="sm"
                borderRadius="lg"
                borderColor="gray.300"
                fontSize="sm"
                fontWeight="500"
                _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                _focus={{
                  borderColor: '#2F80ED',
                  boxShadow: '0 0 0 3px rgba(47, 128, 237, 0.1)',
                  bg: 'white',
                }}
                transition="all 0.2s"
                onChange={evt =>
                  getData().setCurrentScenarioByName(evt.target.value)
                }
              >
                {getData()
                  .getAllScenarios()
                  .map(scenario => (
                    <option
                      value={scenario.scenarioName}
                      key={scenario.scenarioName}
                    >
                      {scenario.scenarioName}
                    </option>
                  ))}
              </Select>
            </Box>
          )}

          {/* Navigation Items */}
          <NavigationItem items={navItems} collapsed={collapsed} />
        </>
      }
      bottomContent={
        <NavigationItem items={bottomItems} collapsed={collapsed} />
      }
    />
  );
}

export default Navigation;

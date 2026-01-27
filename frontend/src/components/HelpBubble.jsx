/** 
 * HelpBubble
 * 
 * This component shows fixed info button in the top right corner of the screen that shows "How does this app works?" guide
 * 
 * It shows:
 * - Current page the user is on
 * - Detailed step by step guide how to use SimuBridge 
 * - Marks key steps with a badge
 */
import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  List,
  ListItem,
  ListIcon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
  Badge,
} from '@chakra-ui/react';
// List of icons used 
import {
  FiCheckCircle,
  FiDatabase,
  FiGitBranch,
  FiInfo,
  FiPlay,
  FiSliders,
  FiUploadCloud,
  FiActivity,
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

function HelpBubble() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Get the current route to determine current step
  const location = useLocation();
  
  /*
  * Define the list of steps shown in the guide
  * Each step includes: 
  *   -> title, detail, icon
  *   -> function match() which checks if this is current page user is on
  */
  const steps = useMemo(
    () => [
      {
        title: 'Create or import',
        detail:
          'Start with a new project or import scenarios from JSON on the welcome screen.',
        icon: FiUploadCloud,
        match: path => path === '/' || path === '',
      },
      {
        title: 'Run process mining',
        detail:
          'Jump straight into Process Miner to review available logs or prior runs.',
        icon: FiCheckCircle,
        match: path => path.startsWith('/processminer'),
        highlight: true,
      },
      {
        title: 'Run simulation',
        detail:
          'Open Simulation to execute the model and generate fresh logs and performance metrics.',
        icon: FiPlay,
        match: path => path.startsWith('/simulation'),
        highlight: true,
      },
      {
        title: 'Run sensitivity analysis',
        detail:
          'Explore how parameters influence KPIs. Pick a saved run or launch a new analysis from the Sensitivity tab.',
        icon: FiActivity,
        match: path => path.startsWith('/sensitivity'),
        highlight: true,
      },
      {
        title: 'Run quality-informed layer',
        detail:
          'Review quality signals and guidance to refine decisions before finalizing results.',
        icon: FiActivity,
        match: path => path.startsWith('/quality'),
        highlight: true,
      },
      {
        title: 'Pick scenario',
        detail:
          'Use Overview to select, duplicate, or compare the scenario you want to refine.',
        icon: FiDatabase,
        match: path => path.startsWith('/overview'),
      },
      {
        title: 'Edit model',
        detail:
          'Adjust scenario parameters and BPMN logic in Scenario and Model pages.',
        icon: FiGitBranch,
        match: path =>
          path.startsWith('/modelbased') || path.startsWith('/scenario'),
      },
      {
        title: 'Set resources',
        detail:
          'Define roles/resources and availability via Resources and the Timetable.',
        icon: FiSliders,
        match: path => path.startsWith('/resource'),
      },
      {
        title: 'Export results',
        detail:
          'Use Export from the sidebar to save your scenarios for sharing or backup.',
        icon: FiCheckCircle,
        match: () => false,
      },
    ],
    []
  );
  /**
  * Determine which step should be marked as "current"
  * Finds the first step whose match(path) returns true for the current pathname
  */
  const currentStepIndex = steps.findIndex(step =>
    step.match(location.pathname || '')
  );
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // List of the most important steps, which will be marked in green as "key step"
  const keySteps = ['Run simulation', 'Run process mining', 'Run sensitivity analysis', 'Run quality-informed layer'];

  return (
    // Fixed info "i" button that opens the guide
    <>
      <Tooltip label="How does this app work?" placement="left">
        <IconButton
          aria-label="Open quick start guide"
          icon={<Icon as={FiInfo} boxSize={5} />}
          onClick={onOpen}
          position="fixed"
          top={{ base: '14px', md: '22px' }}
          right={{ base: '14px', md: '22px' }}
          zIndex={20}
          borderRadius="full"
          size="lg"
          bgGradient="linear(to-br, #2F80ED, #6CA8FF)"
          color="white"
          boxShadow="0 10px 30px rgba(47, 128, 237, 0.35)"
          _hover={{ boxShadow: '0 12px 34px rgba(47, 128, 237, 0.45)' }}
        />
      </Tooltip>

      {/* Modal containing step by step guide */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="24px" overflow="hidden">
          {/* Modal header bar and gradient */}
          <ModalHeader
            bg="linear-gradient(135deg, #1E3A8A 0%, #2F6BCE 100%)"
            color="white"
            pb={4}
          >
            <Flex align="center" gap={3}>
              <Icon
                as={FiInfo}
                boxSize={10}
                color="white"
                bg="rgba(255,255,255,0.1)"
                p={2}
                borderRadius="full"
              />
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  How SimuBridge works
                </Text>
                <Text fontSize="sm" opacity={0.85}>
                  Follow these steps to move from data to insights.
                </Text>
              </Box>
            </Flex>
          </ModalHeader>

          {/* Close button in top-right of modal */}
          <ModalCloseButton color="white" />

          {/* Main content: list of steps */}
          <ModalBody bg="#F8FAFF" px={6} py={5}>
            <VStack align="stretch" spacing={3}>
              {steps.map(step => {
                const isCurrent = step === currentStep;
                return (
                  <Flex
                    key={step.title}
                    bg={isCurrent ? 'blue.50' : 'white'}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={isCurrent ? 'blue.200' : 'gray.200'}
                    px={3}
                    py={3}
                    align="flex-start"
                    gap={3}
                    boxShadow={isCurrent ? 'md' : 'sm'}
                  >
                    {/* Icon bubble */}
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg={isCurrent ? 'white' : 'blue.50'}
                      display="grid"
                      placeItems="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={step.icon}
                        boxSize={5}
                        color={isCurrent ? 'blue.700' : 'blue.500'}
                      />
                    </Box>
                    {/* Title + badge + description */}
                    <Box>
                      <Flex align="center" gap={2} mb={1}>
                        <Text fontWeight="bold" color="gray.800">
                          {step.title}
                        </Text>
                        {/* Mark "key steps*/}
                        {keySteps.includes(step.title) && (
                          <Badge colorScheme="green" borderRadius="md">
                            key step
                          </Badge>
                        )}
                        {/* Mark the "current page" if this matches current page route*/}
                        {isCurrent && (
                          <Badge colorScheme="blue" borderRadius="md">
                            current page
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="sm" color="gray.600">
                        {step.detail}
                      </Text>
                    </Box>
                  </Flex>
                );
              })}
            </VStack>
          </ModalBody>

          {/* Footer with text and close "Got it" button*/}
          <ModalFooter bg="white" borderTop="1px solid #EDF2F7">
            <Flex justify="space-between" w="100%" align="center">
              <List spacing={1}>
                <ListItem fontSize="sm" color="gray.600">
                  <ListIcon as={FiCheckCircle} color="green.400" />
                  Autosave keeps edits inside your browser; use Export to back
                  up.
                </ListItem>
              </List>
              <Button colorScheme="blue" onClick={onClose}>
                Got it
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default HelpBubble;

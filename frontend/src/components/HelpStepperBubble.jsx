import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  Tooltip,
  VStack,
  Badge,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiDatabase,
  FiGitBranch,
  FiInfo,
  FiPlay,
  FiSliders,
  FiUploadCloud,
} from 'react-icons/fi';

function HelpStepperBubble() {
  const steps = useMemo(
    () => [
      {
        title: 'Create or import',
        body: 'Start with a new project or import existing scenarios from JSON.',
        icon: FiUploadCloud,
      },
      {
        title: 'Run process mining',
        body: 'Jump straight into Process Miner to review available logs or prior runs.',
        icon: FiCheckCircle,
        highlight: true,
      },
      {
        title: 'Run simulation',
        body: 'Execute the active scenario to generate fresh logs and performance metrics.',
        icon: FiPlay,
        highlight: true,
      },
      {
        title: 'Pick scenario',
        body: 'Use Overview to select, duplicate, or compare the scenario you want to refine.',
        icon: FiDatabase,
      },
      {
        title: 'Edit model',
        body: 'Adjust scenario parameters and BPMN logic in Scenario and Model pages.',
        icon: FiGitBranch,
      },
      {
        title: 'Set resources',
        body: 'Define roles/resources and availability via Resources and the Timetable.',
        icon: FiSliders,
      },
      {
        title: 'Export results',
        body: 'Use Export from the sidebar to save your scenarios for sharing or backup.',
        icon: FiCheckCircle,
      },
    ],
    []
  );

  const [isOpen, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const total = steps.length;
  const current = steps[stepIndex];

  const handleClose = () => {
    setOpen(false);
    setStepIndex(0);
  };

  return (
    <>
      <Tooltip label="Alternate step-by-step guide" placement="left">
        <IconButton
          aria-label="Open stepper guide"
          icon={<Icon as={FiInfo} boxSize={5} />}
          onClick={() => setOpen(true)}
          position="fixed"
          top={{ base: '72px', md: '90px' }}
          right={{ base: '14px', md: '22px' }}
          zIndex={20}
          borderRadius="full"
          size="lg"
          bg="white"
          color="#2F80ED"
          border="1px solid #C5D9F6"
          boxShadow="0 8px 24px rgba(31, 81, 160, 0.18)"
          _hover={{ bg: '#F3F8FF' }}
        />
      </Tooltip>

      <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="20px" overflow="hidden">
          <ModalHeader
            bg="linear-gradient(135deg, #1E3A8A 0%, #2F6BCE 100%)"
            color="white"
            pb={4}
          >
            <Text fontSize="lg" fontWeight="bold">
              Guided walkthrough
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              Move through each step with Next/Previous controls.
            </Text>
          </ModalHeader>
          <ModalCloseButton color="white" />

          <ModalBody bg="#F8FAFF" px={6} py={5}>
            <VStack align="stretch" spacing={4}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={3}>
                  <Box
                    w="46px"
                    h="46px"
                    borderRadius="full"
                    bg="blue.50"
                    display="grid"
                    placeItems="center"
                    border="1px solid #D7E7FF"
                  >
                    <Icon as={current.icon} boxSize={6} color="blue.500" />
                  </Box>
                  <Box>
                    <Flex align="center" gap={2}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {current.title}
                      </Text>
                      {current.highlight && (
                        <Badge colorScheme="green" borderRadius="md">
                          key step
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="sm" color="gray.600">
                      Step {stepIndex + 1} of {total}
                    </Text>
                  </Box>
                </Flex>
              </Flex>

              <Box
                bg="white"
                borderRadius="lg"
                border="1px solid #E2E8F0"
                p={4}
                boxShadow="sm"
              >
                <Text fontSize="md" color="gray.700">
                  {current.body}
                </Text>
              </Box>

              <Progress
                value={((stepIndex + 1) / total) * 100}
                size="sm"
                colorScheme="blue"
                borderRadius="full"
              />
            </VStack>
          </ModalBody>

          <ModalFooter
            bg="white"
            borderTop="1px solid"
            borderColor="#EDF2F7"
            gap={3}
          >
            <Button
              leftIcon={<FiArrowLeft />}
              onClick={() => setStepIndex(i => Math.max(i - 1, 0))}
              isDisabled={stepIndex === 0}
              variant="ghost"
            >
              Previous
            </Button>
            <Button
              rightIcon={
                stepIndex === total - 1 ? <FiCheckCircle /> : <FiArrowRight />
              }
              colorScheme="blue"
              onClick={() =>
                setStepIndex(i => (i < total - 1 ? i + 1 : i))
              }
              mr={3}
            >
              {stepIndex === total - 1 ? 'Close' : 'Next step'}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Exit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default HelpStepperBubble;

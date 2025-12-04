import React from 'react';
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
import {
  FiCheckCircle,
  FiDatabase,
  FiGitBranch,
  FiInfo,
  FiPlay,
  FiSliders,
  FiUploadCloud,
} from 'react-icons/fi';

function HelpBubble() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const steps = [
    {
      title: 'Start or import',
      detail:
        'Create a new project or import scenarios from JSON on the welcome screen.',
      icon: FiUploadCloud,
    },
    {
      title: 'Review scenarios',
      detail:
        'Use Overview to pick the active scenario, duplicate it, or line up comparisons.',
      icon: FiDatabase,
    },
    {
      title: 'Tune scenario settings',
      detail:
        'Adjust scenario parameters and BPMN details in Scenario and Model pages.',
      icon: FiGitBranch,
    },
    {
      title: 'Configure resources',
      detail:
        'Add roles/resources and set their availability in Resources and Timetable.',
      icon: FiSliders,
    },
    {
      title: 'Run a simulation',
      detail:
        'Open Simulation to execute the model and generate logs for the active scenario.',
      icon: FiPlay,
    },
    {
      title: 'Run process mining',
      detail:
        'Jump to Process Miner to transform simulation outputs into process insights.',
      icon: FiCheckCircle,
    },
    {
      title: 'Export & share',
      detail:
        'Use the sidebar Export to save your scenarios, or revisit steps anytime with this guide.',
      icon: FiCheckCircle,
    },
  ];

  const keySteps = ['Run a simulation', 'Run process mining'];

  return (
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

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="24px" overflow="hidden">
          <ModalHeader bg="#0F172A" color="white" pb={4}>
            <Flex align="center" gap={3}>
              <Icon
                as={FiInfo}
                boxSize={6}
                color="white"
                bg="rgba(255,255,255,0.1)"
                p={2}
                borderRadius="full"
              />
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  How SimuBridge works
                </Text>
                <Text fontSize="sm" opacity={0.8}>
                  Follow these steps to move from data to insights.
                </Text>
              </Box>
            </Flex>
          </ModalHeader>

          <ModalCloseButton color="white" />

          <ModalBody bg="#F8FAFF" px={6} py={5}>
            <VStack align="stretch" spacing={3}>
              {steps.map(step => (
                <Flex
                  key={step.title}
                  bg="white"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  px={3}
                  py={3}
                  align="flex-start"
                  gap={3}
                  boxShadow="sm"
                >
                  <Box
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    bg="blue.50"
                    display="grid"
                    placeItems="center"
                  >
                    <Icon as={step.icon} boxSize={5} color="blue.500" />
                  </Box>
                  <Box>
                    <Flex align="center" gap={2} mb={1}>
                      <Text fontWeight="bold" color="gray.800">
                        {step.title}
                      </Text>
                      {keySteps.includes(step.title) && (
                        <Badge colorScheme="green" borderRadius="md">
                          key step
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="sm" color="gray.600">
                      {step.detail}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </ModalBody>

          <ModalFooter bg="white" borderTop="1px solid #EDF2F7">
            <Flex justify="space-between" w="100%" align="center">
              <List spacing={1}>
                <ListItem fontSize="sm" color="gray.600">
                  <ListIcon as={FiCheckCircle} color="green.400" />
                  Autosave keeps edits inside your browser; use Export to back
                  up.
                </ListItem>
                <ListItem fontSize="sm" color="gray.600">
                  <ListIcon as={FiCheckCircle} color="green.400" />
                  Need a quick refresh? Open this guide anytime via the info
                  bubble.
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

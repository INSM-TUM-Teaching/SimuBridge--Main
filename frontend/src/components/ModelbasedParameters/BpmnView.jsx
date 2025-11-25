import React, { useEffect, useState } from 'react';
import Modeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import axios from 'axios';
import { ButtonGroup, IconButton, Flex, Box, Heading } from '@chakra-ui/react';
import { MinusIcon, AddIcon, CloseIcon } from '@chakra-ui/icons';
import TypeSelector from '../EditorSidebar/Modelbased/TypeSelector';
import { EditorSidebarAlternate } from '../EditorSidebar/EditorSidebar';

function BpmnView({
  getData,
  setCurrentRightSideBar,
  sidebarsCollapsed,
  toggleSidebars,
}) {
  // State storing the current model
  const [currentModel, setCurrentModel] = useState('');
  // state to store the reference of the container that contains the modeler
  const [containerRef, setContainerRef] = useState(null);
  // state storing the reference of the bpmn modeler
  const [modeler, setModeler] = useState(null);

  const [currentElement, setCurrentElement] = useState(null);

  // set the container reference when component is mounted
  useEffect(() => {
    setContainerRef(document.getElementById('container'));
  }, []);

  // Right side editor logic: only use when sidebar is NOT collapsed
  useEffect(() => {
    if (currentElement && !sidebarsCollapsed) {
      setCurrentRightSideBar(
        <EditorSidebarAlternate
          title={`Edit ${currentElement?.$type.split(':').pop()} Configuration`}
          content={
            <TypeSelector {...{ currentElement, getData, currentModel }} />
          }
          collapsed={sidebarsCollapsed}
          onToggle={toggleSidebars}
        />
      );
    } else {
      setCurrentRightSideBar(undefined);
    }
  }, [
    currentElement,
    sidebarsCollapsed,
    getData,
    currentModel,
    toggleSidebars,
    setCurrentRightSideBar,
  ]);

  useEffect(() => {
    setCurrentModel(getData().getCurrentModel());
  }, [getData]);

  useEffect(() => {
    if (!containerRef || !currentModel) return;

    containerRef.innerHTML = '';
    setModeler(
      new Modeler({
        container: containerRef,
        keyboard: {
          bindTo: document,
        },

        // remove sidebar from bpmn.io which is used to add elements to bpmn diagram
        additionalModules: [
          {
            contextPad: ['value', {}],
            contextPadProvider: ['value', {}],
            palette: ['value', {}],
            paletteProvider: ['value', {}],
            dragging: ['value', {}],
            move: ['value', {}],
            create: ['value', {}],
          },
        ],
      })
    );
  }, [containerRef, currentModel]);

  // Initialize the BPMN modeler when the container reference and diagram are available
  useEffect(() => {
    if (!modeler || !currentModel) return;
    if (modeler.getDefinitions() !== currentModel.rootElement) {
      modeler
        .importDefinitions(currentModel.rootElement)
        .then(({ warnings }) => {
          if (warnings.length) {
            console.log('BPMN Import Warnings', warnings);
          }
          modeler.get('canvas').zoom('fit-viewport', 'auto');
          modeler.get('zoomScroll').stepZoom(-2);
        })
        .catch(console.error);
    }
  }, [modeler, currentModel]);

  // zoom into diagram after it is initialized & handle element clicks
  useEffect(() => {
    if (!modeler) return;

    modeler.get('zoomScroll').stepZoom(-1);
    const eventBus = modeler.get('eventBus');
    eventBus.on('element.click', ({ element }) => {
      if (element?.businessObject.$type !== 'bpmn:Process') {
        setCurrentElement(element.businessObject);
      } else {
        setCurrentElement(null);
      }
    });
  }, [modeler]);

  // ensures that diagram is centered if window is resized
  useEffect(() => {
    if (!modeler) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const resizeListener = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(
        () => modeler.get('canvas').zoom('fit-viewport', 'auto'),
        500
      );
    };
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentModel, modeler]);

  function zoomIn() {
    modeler.get('zoomScroll').stepZoom(1);
  }

  function zoomOut() {
    modeler.get('zoomScroll').stepZoom(-1);
  }

  return (
    <Flex position="relative">
      <Box id="container" w="100%" maxWidth="100%" h="90vh" />

      {/* 🔹 When sidebar is collapsed, show a floating config panel instead of right sidebar */}
      {sidebarsCollapsed && currentElement && (
        <Box
          position="absolute"
          right="24px"
          top="24px"
          w="360px"
          maxH="80vh"
          bg="white"
          borderRadius="xl"
          boxShadow="xl"
          borderWidth="1px"
          borderColor="gray.100"
          p={4}
          overflowY="auto"
          zIndex={10}
        >
          <Flex align="center" justify="space-between" mb={2}>
            <Heading size="sm">
              Edit {currentElement?.$type.split(':').pop()} Configuration
            </Heading>
            <IconButton
              size="sm"
              aria-label="Close configuration"
              icon={<CloseIcon boxSize={3} />}
              variant="ghost"
              onClick={() => setCurrentElement(null)}
            />
          </Flex>

          <TypeSelector {...{ currentElement, getData, currentModel }} />
        </Box>
      )}

      <ButtonGroup
        size="md"
        spacing="6"
        variant="unstyled"
        position="absolute"
        justifyContent="center"
        bottom="10"
        left="0px"
        right="0px"
        zIndex={5}
      >
        <IconButton
          onClick={zoomIn}
          icon={<AddIcon color="RGBA(0, 0, 0, 0.64)" />}
          bg="white"
          _hover={{ bg: 'blackAlpha.100' }}
          rounded="20"
          shadow="md"
        />
        <IconButton
          onClick={zoomOut}
          icon={<MinusIcon color="RGBA(0, 0, 0, 0.64)" />}
          bg="white"
          _hover={{ bg: 'blackAlpha.100', color: 'RGBA(0, 0, 0, 0.94)' }}
          rounded="20"
          shadow="md"
        />
      </ButtonGroup>
    </Flex>
  );
}

export default BpmnView;

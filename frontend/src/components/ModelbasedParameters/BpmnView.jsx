import React, { useEffect, useState } from 'react';
import Modeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import ViewButtons from './ViewButtons';
import axios from 'axios';
import { ButtonGroup, IconButton, Flex, Box } from '@chakra-ui/react';
import { MinusIcon, AddIcon } from '@chakra-ui/icons';
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
  //state to sore the refrence of the container that caintins the modeler
  const [containerRef, setContainerRef] = useState(null);
  //state storing the reference of the bpmn modeler
  const [modeler, setModeler] = useState(null);

  const [currentElement, setCurrentElement] = useState(null);

  // set the container reference wehen component is mounted
  useEffect(() => {
    setContainerRef(document.getElementById('container'));
  }, []);

  useEffect(() => {
    if (currentElement) {
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
  }, [currentElement, getData().getCurrentScenario(), sidebarsCollapsed]);

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
  }, [containerRef]);

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

  // zoom into diagram after it is initialized
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
    let timeoutId = null;
    const resizeListener = () => {
      clearTimeout(timeoutId);

      console.log('Resize');
      timeoutId = setTimeout(
        () => modeler.get('canvas').zoom('fit-viewport', 'auto'),
        500
      );
    };
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, [currentModel, modeler]);

  function zoomIn() {
    modeler.get('zoomScroll').stepZoom(1);
  }

  function zoomOut() {
    modeler.get('zoomScroll').stepZoom(-1);
  }

  return (
    <Flex>
      <Box id="container" w="100%" maxWidth="100%" h="90vh"></Box>

      <ButtonGroup
        size="md"
        spacing="6"
        variant="unstyled"
        position="absolute"
        justifyContent="center"
        bottom="10"
        left="0px"
        right="0px"
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

        {/* <ViewButtons/> */}
      </ButtonGroup>
    </Flex>
  );
}

export default BpmnView;


import React, { useEffect, useRef, useState } from "react";
import Modeler from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

import {
  ButtonGroup,
  IconButton,
  Flex,
  Box,
  Heading,
  HStack,
  Text,
  Divider,
} from "@chakra-ui/react";
import { MinusIcon, AddIcon, CloseIcon } from "@chakra-ui/icons";

import TypeSelector from "../EditorSidebar/Modelbased/TypeSelector";
import { EditorSidebarAlternate } from "../EditorSidebar/EditorSidebar";

function BpmnView({
  getData,
  setCurrentRightSideBar,
  sidebarsCollapsed,
  toggleSidebars,
}) {
  const containerRef = useRef(null);

  // Store the current model (from your data layer)
  const [currentModel, setCurrentModel] = useState(null);

  // Store modeler instance
  const [modeler, setModeler] = useState(null);

  // Currently selected BPMN element (businessObject)
  const [currentElement, setCurrentElement] = useState(null);

  // Keep currentElement ref for event callbacks
  const currentElementRef = useRef(null);
  useEffect(() => {
    currentElementRef.current = currentElement;
  }, [currentElement]);

  // Update currentModel when "getData" changes / current model changes
  useEffect(() => {
    const m = getData()?.getCurrentModel?.();
    setCurrentModel(m || null);
  }, [getData]);

  // Create / recreate Modeler when container + model exists
  useEffect(() => {
    if (!containerRef.current || !currentModel) return;

    // Clear container (important if recreating)
    containerRef.current.innerHTML = "";

    const instance = new Modeler({
      container: containerRef.current,
      keyboard: { bindTo: document },
      // remove bpmn.io palette/context pad
      additionalModules: [
        {
          contextPad: ["value", {}],
          contextPadProvider: ["value", {}],
          palette: ["value", {}],
          paletteProvider: ["value", {}],
          dragging: ["value", {}],
          move: ["value", {}],
          create: ["value", {}],
        },
      ],
    });

    setModeler(instance);

    return () => {
      try {
        instance.destroy();
      } catch (e) {
        // ignore
      }
      setModeler(null);
    };
  }, [currentModel]);

  // Import definitions when modeler is ready
  useEffect(() => {
    if (!modeler || !currentModel) return;

    const defs = modeler.getDefinitions?.();
    const targetRoot = currentModel?.rootElement;

    if (!targetRoot) return;

    // Only import if different
    if (defs !== targetRoot) {
      modeler
        .importDefinitions(targetRoot)
        .then(({ warnings }) => {
          if (warnings?.length) console.log("BPMN Import Warnings", warnings);
          const canvas = modeler.get("canvas");
          canvas.zoom("fit-viewport", "auto");

          // Slight zoom-out so it feels less cramped
          modeler.get("zoomScroll").stepZoom(-1);
        })
        .catch(console.error);
    }
  }, [modeler, currentModel]);

  // Wire click handler + cleanup
  useEffect(() => {
    if (!modeler) return;

    const eventBus = modeler.get("eventBus");

    const onElementClick = ({ element }) => {
      const bo = element?.businessObject;
      if (!bo) return;

      // Ignore process root
      if (bo.$type === "bpmn:Process") {
        setCurrentElement(null);
        return;
      }
      setCurrentElement(bo);
    };

    eventBus.on("element.click", onElementClick);

    return () => {
      try {
        eventBus.off("element.click", onElementClick);
      } catch (e) {
        // ignore
      }
    };
  }, [modeler]);

  // Keep diagram centered on resize (debounced)
  useEffect(() => {
    if (!modeler) return;

    let timeoutId = null;

    const resizeListener = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          modeler.get("canvas").zoom("fit-viewport", "auto");
        } catch (e) {
          // ignore
        }
      }, 250);
    };

    window.addEventListener("resize", resizeListener);
    return () => {
      window.removeEventListener("resize", resizeListener);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [modeler]);

  // Right sidebar logic (only when NOT collapsed)
  useEffect(() => {
    if (currentElement && !sidebarsCollapsed) {
      setCurrentRightSideBar(
        <EditorSidebarAlternate
          title={`Edit ${String(currentElement?.$type || "")
            .split(":")
            .pop()} Configuration`}
          content={<TypeSelector {...{ currentElement, getData, currentModel }} />}
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

  const zoomIn = () => {
    if (!modeler) return;
    modeler.get("zoomScroll").stepZoom(1);
  };

  const zoomOut = () => {
    if (!modeler) return;
    modeler.get("zoomScroll").stepZoom(-1);
  };

  const elementLabel = String(currentElement?.$type || "")
    .split(":")
    .pop();

  return (
    <Flex position="relative" w="100%">
      {/* BPMN canvas */}
      <Box ref={containerRef} w="100%" maxW="100%" h="90vh" />

      {/* Collapsed mode: bigger “tile/panel” editor overlay */}
      {sidebarsCollapsed && currentElement && (
        <Box
          position="absolute"
          right={{ base: "12px", md: "24px" }}
          top={{ base: "12px", md: "24px" }}
          w={{ base: "calc(100% - 24px)", sm: "420px", md: "460px" }}
          maxW="92vw"
          maxH={{ base: "78vh", md: "82vh" }}
          bg="white"
          borderRadius="2xl"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.18)"
          borderWidth="1px"
          borderColor="gray.100"
          p={{ base: 4, md: 5 }}
          overflowY="auto"
          zIndex={10}
        >
          <HStack justify="space-between" align="flex-start" spacing={3} mb={3}>
            <Box>
              <Heading size="sm" color="#0F172A">
                Edit {elementLabel} Configuration
              </Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Adjust parameters for the selected BPMN element.
              </Text>
            </Box>

            <IconButton
              size="md"
              aria-label="Close configuration"
              icon={<CloseIcon boxSize={3} />}
              variant="ghost"
              borderRadius="xl"
              _hover={{ bg: "gray.100" }}
              onClick={() => setCurrentElement(null)}
            />
          </HStack>

          <Divider mb={4} />

          <TypeSelector {...{ currentElement, getData, currentModel }} />
        </Box>
      )}

      {/* Bigger zoom controls (bigger “tiles”) */}
      <ButtonGroup
        size="lg"
        spacing="4"
        variant="unstyled"
        position="absolute"
        bottom={{ base: 6, md: 10 }}
        left="0"
        right="0"
        display="flex"
        justifyContent="center"
        zIndex={5}
      >
        <IconButton
          onClick={zoomIn}
          aria-label="Zoom in"
          icon={<AddIcon />}
          bg="white"
          _hover={{ bg: "blackAlpha.100" }}
          borderRadius="2xl"
          boxShadow="0 14px 30px rgba(15, 23, 42, 0.12)"
          border="1px solid"
          borderColor="gray.100"
          w={{ base: 12, md: 14 }}
          h={{ base: 12, md: 14 }}
          fontSize={{ base: "18px", md: "20px" }}
        />
        <IconButton
          onClick={zoomOut}
          aria-label="Zoom out"
          icon={<MinusIcon />}
          bg="white"
          _hover={{ bg: "blackAlpha.100" }}
          borderRadius="2xl"
          boxShadow="0 14px 30px rgba(15, 23, 42, 0.12)"
          border="1px solid"
          borderColor="gray.100"
          w={{ base: 12, md: 14 }}
          h={{ base: 12, md: 14 }}
          fontSize={{ base: "18px", md: "20px" }}
        />
      </ButtonGroup>
    </Flex>
  );
}

export default BpmnView;

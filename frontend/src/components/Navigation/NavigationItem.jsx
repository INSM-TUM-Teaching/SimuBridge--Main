import { Flex, Text, Icon, Box, VStack, Tooltip } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

/**
 * NavigationItem
 * - Larger tiles/cells (both collapsed + expanded)
 * - Bigger icon container + icon
 * - Slightly more padding + spacing
 */
function NavigationItem({ items = [], collapsed = false }) {
  // tweak these to taste
  const itemPy = collapsed ? 3.5 : 3.5; // was 2.5/3
  const itemPx = collapsed ? 0 : 4; // was 0/3
  const iconBox = collapsed ? 10 : 10; // was 8/9
  const iconSize = collapsed ? "18px" : "20px"; // was 16/18

  return (
    <VStack spacing={collapsed ? 3 : 2} align="stretch">
      {items.map((link, index) => (
        <Box key={index} w="100%">
          {link.path ? (
            <NavLink to={link.path} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Tooltip
                  label={link.name}
                  placement="right"
                  isDisabled={!collapsed}
                  hasArrow
                >
                  <Flex
                    alignItems="center"
                    justifyContent={collapsed ? "center" : "flex-start"}
                    w="100%"
                    px={itemPx}
                    py={itemPy}
                    cursor="pointer"
                    bg={
                      isActive
                        ? "linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%)"
                        : "transparent"
                    }
                    borderRadius="2xl" // was xl
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      bg: isActive
                        ? "linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%)"
                        : "gray.50",
                      transform: collapsed ? "scale(1.06)" : "translateX(4px)",
                      boxShadow: isActive
                        ? "0 2px 10px rgba(47, 128, 237, 0.18)"
                        : "none",
                    }}
                    position="relative"
                    border="1px"
                    borderColor={isActive ? "blue.200" : "transparent"}
                    boxShadow={
                      isActive ? "0 2px 10px rgba(47, 128, 237, 0.10)" : "none"
                    }
                    minH={collapsed ? "52px" : "56px"} // NEW: bigger tile height
                  >
                    {/* Icon container */}
                    <Flex
                      alignItems="center"
                      justifyContent="center"
                      w={iconBox}
                      h={iconBox}
                      borderRadius="xl" // slightly rounder
                      mr={collapsed ? 0 : 4}
                      bg={isActive ? "#2F80ED" : "gray.100"}
                      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                      boxShadow={
                        isActive
                          ? "0 4px 14px rgba(47, 128, 237, 0.32)"
                          : "none"
                      }
                      flexShrink={0}
                    >
                      <Icon
                        as={link.icon}
                        fontSize={iconSize}
                        color={isActive ? "white" : "gray.600"}
                      />
                    </Flex>

                    {/* Label - only show when not collapsed */}
                    {!collapsed && (
                      <Text
                        fontSize="sm"
                        color={isActive ? "#2F80ED" : "gray.700"}
                        fontWeight={isActive ? 700 : 500}
                      >
                        {link.name}
                      </Text>
                    )}
                  </Flex>
                </Tooltip>
              )}
            </NavLink>
          ) : (
            <Tooltip
              label={link.name}
              placement="right"
              isDisabled={!collapsed}
              hasArrow
            >
              <Flex
                onClick={link.event}
                alignItems="center"
                justifyContent={collapsed ? "center" : "flex-start"}
                w="100%"
                px={itemPx}
                py={itemPy}
                cursor="pointer"
                borderRadius="2xl"
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: "gray.50",
                  transform: collapsed ? "scale(1.06)" : "translateX(4px)",
                }}
                border="1px"
                borderColor="transparent"
                minH={collapsed ? "52px" : "56px"} // NEW: bigger tile height
              >
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  w={iconBox}
                  h={iconBox}
                  borderRadius="xl"
                  mr={collapsed ? 0 : 4}
                  bg="gray.100"
                  transition="all 0.25s"
                  flexShrink={0}
                >
                  <Icon
                    as={link.icon}
                    fontSize={iconSize}
                    color="gray.600"
                  />
                </Flex>

                {!collapsed && (
                  <Text fontSize="sm" color="gray.700" fontWeight={500}>
                    {link.name}
                  </Text>
                )}
              </Flex>
            </Tooltip>
          )}
        </Box>
      ))}
    </VStack>
  );
}

export default NavigationItem;

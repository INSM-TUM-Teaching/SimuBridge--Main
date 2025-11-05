import { Flex, Text, Icon, Box, VStack, Tooltip } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

function NavigationItem({ items = [], collapsed = false }) {
  return (
    <VStack spacing={collapsed ? 2 : 1.5} align="stretch">
      {items.map((link, index) => (
        <Box key={index} w="100%">
          {link.path ? (
            <NavLink to={link.path} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <Tooltip
                  label={link.name}
                  placement="right"
                  isDisabled={!collapsed}
                  hasArrow
                >
                  <Flex
                    alignItems="center"
                    justifyContent={collapsed ? 'center' : 'flex-start'}
                    w="100%"
                    px={collapsed ? 0 : 3}
                    py={collapsed ? 2.5 : 3}
                    cursor="pointer"
                    bg={
                      isActive
                        ? 'linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%)'
                        : 'transparent'
                    }
                    borderRadius="xl"
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      bg: isActive
                        ? 'linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%)'
                        : 'gray.50',
                      transform: collapsed ? 'scale(1.05)' : 'translateX(4px)',
                      boxShadow: isActive
                        ? '0 2px 8px rgba(47, 128, 237, 0.15)'
                        : 'none',
                    }}
                    position="relative"
                    border="1px"
                    borderColor={isActive ? 'blue.200' : 'transparent'}
                    boxShadow={
                      isActive ? '0 2px 8px rgba(47, 128, 237, 0.1)' : 'none'
                    }
                  >
                    {/* Icon container */}
                    <Flex
                      alignItems="center"
                      justifyContent="center"
                      w={collapsed ? 8 : 9}
                      h={collapsed ? 8 : 9}
                      borderRadius="lg"
                      mr={collapsed ? 0 : 3}
                      bg={isActive ? '#2F80ED' : 'gray.100'}
                      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                      boxShadow={
                        isActive ? '0 2px 8px rgba(47, 128, 237, 0.3)' : 'none'
                      }
                    >
                      <Icon
                        as={link.icon}
                        fontSize={collapsed ? '16px' : '18px'}
                        color={isActive ? 'white' : 'gray.600'}
                      />
                    </Flex>

                    {/* Label - only show when not collapsed */}
                    {!collapsed && (
                      <Text
                        fontSize="sm"
                        color={isActive ? '#2F80ED' : 'gray.700'}
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
                justifyContent={collapsed ? 'center' : 'flex-start'}
                w="100%"
                px={collapsed ? 0 : 3}
                py={collapsed ? 2.5 : 3}
                cursor="pointer"
                borderRadius="xl"
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: 'gray.50',
                  transform: collapsed ? 'scale(1.05)' : 'translateX(4px)',
                }}
                border="1px"
                borderColor="transparent"
              >
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  w={collapsed ? 8 : 9}
                  h={collapsed ? 8 : 9}
                  borderRadius="lg"
                  mr={collapsed ? 0 : 3}
                  bg="gray.100"
                  transition="all 0.25s"
                >
                  <Icon
                    as={link.icon}
                    fontSize={collapsed ? '16px' : '18px'}
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

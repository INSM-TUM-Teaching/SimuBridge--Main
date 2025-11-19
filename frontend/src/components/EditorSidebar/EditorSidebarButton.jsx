import React from 'react';
import { Button, Icon, Flex, Text } from '@chakra-ui/react';

/**
 * Styled button component for EditorSidebar with icon support
 * Matches the NavigationItem styling for consistency
 */
function EditorSidebarButton({
  children,
  icon,
  onClick,
  variant = 'primary',
  type = 'button',
  isDisabled = false,
  isLoading = false,
  w = '100%',
  collapsed = false,
  ...props
}) {
  const variants = {
    primary: {
      bg: 'linear-gradient(135deg, #2F80ED 0%, #1E6FD9 100%)',
      color: 'white',
      borderColor: 'transparent',
      hoverBg: 'linear-gradient(135deg, #1E6FD9 0%, #1557B0 100%)',
      hoverShadow: '0 4px 12px rgba(47, 128, 237, 0.4)',
      iconBg: 'rgba(255, 255, 255, 0.2)',
      iconColor: 'white',
    },
    secondary: {
      bg: 'white',
      color: '#2F80ED',
      borderColor: '#2F80ED',
      hoverBg: 'linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%)',
      hoverShadow: '0 2px 8px rgba(47, 128, 237, 0.15)',
      iconBg: '#EBF5FF',
      iconColor: '#2F80ED',
    },
    outline: {
      bg: 'transparent',
      color: '#6E6E6F',
      borderColor: '#B4C7C9',
      hoverBg: '#F7FAFC',
      hoverShadow: 'none',
      iconBg: '#ECF4F4',
      iconColor: '#6E6E6F',
    },
    danger: {
      bg: 'white',
      color: '#E53E3E',
      borderColor: '#E53E3E',
      hoverBg: '#FFF5F5',
      hoverShadow: '0 2px 8px rgba(229, 62, 62, 0.15)',
      iconBg: '#FFF5F5',
      iconColor: '#E53E3E',
    },
  };

  const style = variants[variant] || variants.outline;

  return (
    <Button
      type={type}
      onClick={onClick}
      isDisabled={isDisabled}
      isLoading={isLoading}
      w={w}
      bg={style.bg}
      color={style.color}
      border="1px"
      borderColor={style.borderColor}
      borderRadius="xl"
      py={6}
      px={collapsed ? 2 : 4}
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      _hover={{
        bg: style.hoverBg,
        transform: 'translateY(-2px)',
        boxShadow: style.hoverShadow,
      }}
      _active={{
        transform: 'translateY(0)',
      }}
      _disabled={{
        opacity: 0.5,
        cursor: 'not-allowed',
        transform: 'none',
      }}
      {...props}
    >
      {collapsed ? (
        icon && <Icon as={icon} fontSize="20px" color={style.iconColor} />
      ) : (
        <Flex alignItems="center" justifyContent="flex-start" gap={3} w="100%">
          <Flex
            alignItems="center"
            justifyContent="center"
            minW={8}
            w={8}
            h={8}
            borderRadius="lg"
            bg={icon ? style.iconBg : 'transparent'}
            transition="all 0.25s"
            flexShrink={0}
          >
            {icon && <Icon as={icon} fontSize="18px" color={style.iconColor} />}
          </Flex>
          <Text fontSize="sm" fontWeight={600} flex={1} textAlign="left">
            {children}
          </Text>
        </Flex>
      )}
    </Button>
  );
}

export default EditorSidebarButton;

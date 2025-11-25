import { useEffect } from 'react';
import { Flex, Divider, Box, Text, IconButton } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Sidebar({
  backgroundColor = '#FAFBFC',
  title,
  content,
  bottomContent,
  collapsed = false,
  onToggle = () => {},
  side = 'left',
}) {
  useEffect(() => {
    const width = collapsed ? '80px' : '280px';
    try {
      document.documentElement.style.setProperty('--sb-width', width);
    } catch (e) {
      // ignore in non-DOM environments
    }
  }, [collapsed]);

  const isLeft = side === 'left';

  return (
    <Flex
      as="aside"
      position="fixed"
      left={isLeft ? 0 : 'auto'}
      right={isLeft ? 'auto' : 0}
      top={0}
      bottom={0}
      zIndex={20}
      direction="column"
      bg={backgroundColor}
      width={{ base: '72px', md: collapsed ? '80px' : '280px' }}
      p={{ base: 3, md: collapsed ? 3 : 5 }}
      borderRight={isLeft ? '1px' : '0'}
      borderLeft={isLeft ? '0' : '1px'}
      borderColor="gray.200"
      boxShadow="lg"
      transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      {/* Header with Logo and Toggle */}
      <Flex
        align="center"
        justify={collapsed ? 'center' : 'space-between'}
        mb={5}
        px={collapsed ? 0 : 1}
        flexDirection={collapsed ? 'column' : 'row'}
        gap={collapsed ? 3 : 0}
        w="100%"
      >
        {!collapsed ? (
          <>
            <Box
              w={10}
              h={10}
              borderRadius="xl"
              bg="linear-gradient(135deg, #2F80ED 0%, #1E6FD9 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="700"
              fontSize="lg"
              boxShadow="0 4px 12px rgba(47, 128, 237, 0.3)"
              transition="all 0.3s"
              flexShrink={0}
            >
              SB
            </Box>
            <Box flex="1" textAlign="center">
              {title}
              <Text fontSize="xs" color="gray.500" mt={0.5}>
                Simulation Platform
              </Text>
            </Box>
            <Box flexShrink={0}>
              <IconButton
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                icon={isLeft ? <FiChevronLeft /> : <FiChevronRight />}
                size="sm"
                variant="ghost"
                onClick={onToggle}
                display={{ base: 'none', md: 'inline-flex' }}
                _hover={{ bg: 'gray.100' }}
                borderRadius="lg"
              />
            </Box>
          </>
        ) : (
          <>
            <Box
              w={10}
              h={10}
              borderRadius="xl"
              bg="linear-gradient(135deg, #2F80ED 0%, #1E6FD9 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="700"
              fontSize="md"
              boxShadow="0 4px 12px rgba(47, 128, 237, 0.3)"
              transition="all 0.3s"
            >
              SB
            </Box>
            <IconButton
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              icon={isLeft ? <FiChevronRight /> : <FiChevronLeft />}
              size="sm"
              variant="ghost"
              onClick={onToggle}
              display={{ base: 'none', md: 'inline-flex' }}
              _hover={{ bg: 'gray.100' }}
              borderRadius="lg"
            />
          </>
        )}
      </Flex>

      <Divider borderColor="gray.200" />

      {/* Main Navigation Content */}
      <Box
        flex={1}
        overflowY="auto"
        mt={5}
        px={collapsed ? 0 : 1}
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#A0AEC0',
          },
        }}
      >
        {content}
      </Box>

      {/* Bottom Content */}
      <Box>
        <Divider borderColor="gray.200" mb={4} />
        <Box px={collapsed ? 0 : 1}>{bottomContent}</Box>
      </Box>
    </Flex>
  );
}

export default Sidebar;

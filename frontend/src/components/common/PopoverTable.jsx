import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Heading,
  Stack,
  Badge,
  Box,
  Icon,
  Button,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';

/**
 * Reusable PopoverTable component for consistent popover behavior across tables
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - The element that triggers the popover
 * @param {string} props.title - Title for the popover header
 * @param {React.ComponentType|any} props.icon - Icon component for the header (e.g. FiInfo)
 * @param {React.ReactNode} props.children - Content for the popover body
 * @param {string} props.placement - Popover placement (default: "right-start")
 * @param {string} props.maxWidth - Maximum width of popover (default: "320px")
 * @param {Function} props.onAction - Optional action button callback
 * @param {string} props.actionLabel - Label for action button
 * @param {React.ComponentType|any} props.actionIcon - Icon component for action button
 * @param {boolean} props.closeOnAction - Close popover after action click (default: true)
 */
export const PopoverTable = ({
  trigger,
  title,
  icon,
  children,
  placement = 'right-start',
  maxWidth = '320px',
  onAction,
  actionLabel,
  actionIcon,
  closeOnAction = true,
}) => {
  // nicer on mobile / small widths
  const responsivePlacement = useBreakpointValue({
    base: 'auto',
    md: placement,
  });

  return (
    <Popover placement={responsivePlacement} closeOnBlur={true}>
      {({ onClose }) => (
        <>
          <PopoverTrigger>{trigger}</PopoverTrigger>

          <PopoverContent
            maxW={maxWidth}
            borderRadius="xl"
            boxShadow="lg"
            _focus={{ boxShadow: 'lg' }}
          >
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader borderBottom="1px solid" borderColor="gray.100">
              <Heading size="sm" display="flex" alignItems="center" gap={2}>
                {icon ? <Icon as={icon} /> : null}
                {title}
              </Heading>
            </PopoverHeader>

            <PopoverBody>
              <Stack spacing={3}>
                {children}

                {onAction && actionLabel ? (
                  <Button
                    size="sm"
                    leftIcon={actionIcon ? <Icon as={actionIcon} /> : undefined}
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => {
                      onAction();
                      if (closeOnAction) onClose();
                    }}
                    w="100%"
                    borderRadius="lg"
                  >
                    {actionLabel}
                  </Button>
                ) : null}
              </Stack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

/**
 * Helper component for displaying labeled information in popovers
 */
export const PopoverInfoItem = ({
  label,
  value,
  icon,
  badge = false,
  badgeColor = 'blue',
}) => (
  <Box>
    <Text
      fontSize="xs"
      color="gray.600"
      mb={1}
      display="flex"
      alignItems="center"
      gap={1}
    >
      {icon ? <Icon as={icon} /> : null}
      {label}
    </Text>

    {badge && typeof value === 'string' ? (
      <Badge colorScheme={badgeColor} variant="subtle">
        {value}
      </Badge>
    ) : typeof value === 'string' || typeof value === 'number' ? (
      <Text fontWeight="medium">{value}</Text>
    ) : (
      <Box>{value}</Box>
    )}
  </Box>
);

/**
 * Helper component for clickable table text that triggers popovers
 *
 * NOTE:
 * - `triggerAs` lets you render as <span> to avoid invalid HTML inside <td>/<th>
 * - Always wrap this with <PopoverTrigger> via PopoverTable trigger prop.
 */
export const PopoverTriggerText = ({
  children,
  onClick,
  color = 'blue.600',
  hoverColor = 'blue.800',
  triggerAs = 'span',
}) => (
  <Text
    as={triggerAs}
    cursor="pointer"
    color={color}
    _hover={{ color: hoverColor, textDecoration: 'underline' }}
    fontWeight="medium"
    onClick={onClick}
    display="inline-flex"
    alignItems="center"
  >
    {children}
  </Text>
);

export default PopoverTable;

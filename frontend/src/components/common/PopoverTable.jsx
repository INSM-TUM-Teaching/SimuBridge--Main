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
} from '@chakra-ui/react';

/**
 * Reusable PopoverTable component for consistent popover behavior across tables
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - The element that triggers the popover
 * @param {string} props.title - Title for the popover header
 * @param {React.ReactNode} props.icon - Icon for the header
 * @param {React.ReactNode} props.children - Content for the popover body
 * @param {string} props.placement - Popover placement (default: "right-start")
 * @param {string} props.maxWidth - Maximum width of popover (default: "300px")
 * @param {Function} props.onAction - Optional action button callback
 * @param {string} props.actionLabel - Label for action button
 * @param {React.ReactNode} props.actionIcon - Icon for action button
 */
export const PopoverTable = ({
  trigger,
  title,
  icon,
  children,
  placement = 'right-start',
  maxWidth = '300px',
  onAction,
  actionLabel,
  actionIcon,
}) => {
  return (
    <Popover placement={placement} closeOnBlur={true}>
      <PopoverTrigger>{trigger}</PopoverTrigger>

      <PopoverContent maxW={maxWidth} _focus={{ boxShadow: 'lg' }}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>
          <Heading size="sm" display="flex" alignItems="center" gap={2}>
            {icon && <Icon as={icon} />}
            {title}
          </Heading>
        </PopoverHeader>
        <PopoverBody>
          <Stack spacing={3}>
            {children}

            {onAction && actionLabel && (
              <Button
                size="sm"
                leftIcon={actionIcon && <Icon as={actionIcon} />}
                colorScheme="blue"
                variant="outline"
                onClick={onAction}
                w="100%"
              >
                {actionLabel}
              </Button>
            )}
          </Stack>
        </PopoverBody>
      </PopoverContent>
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
      {icon && <Icon as={icon} />}
      {label}
    </Text>
    {badge && typeof value === 'string' ? (
      <Badge colorScheme={badgeColor} variant="subtle">
        {value}
      </Badge>
    ) : typeof value === 'string' ? (
      <Text fontWeight="medium">{value}</Text>
    ) : (
      <Box>{value}</Box>
    )}
  </Box>
);

/**
 * Helper component for clickable table text that triggers popovers
 */
export const PopoverTriggerText = ({
  children,
  onClick,
  color = 'blue.600',
  hoverColor = 'blue.800',
}) => (
  <Text
    cursor="pointer"
    color={color}
    _hover={{ color: hoverColor, textDecoration: 'underline' }}
    fontWeight="medium"
    onClick={onClick}
  >
    {children}
  </Text>
);

export default PopoverTable;

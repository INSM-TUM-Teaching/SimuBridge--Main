import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiEdit2, FiCopy, FiTrash2 } from 'react-icons/fi';

function OverviewTable({ scenarios, onEdit, onDuplicate, onDelete }) {
  const rows = scenarios || [];

  return (
    <Table variant="simple" size="md">
      <Thead>
        <Tr bg="gray.50">
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Name
          </Th>
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Starting Date
          </Th>
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Starting Time
          </Th>
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Instances
          </Th>
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Currency
          </Th>
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Status
          </Th>
          <Th
            color="gray.700"
            fontWeight="600"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
            textAlign="right"
          >
            Actions
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map(scenario => (
          <Tr
            key={scenario.scenarioName}
            _hover={{ bg: 'gray.50' }}
            transition="background 0.2s"
          >
            <Td fontWeight="500" color="gray.900">
              {scenario.scenarioName}
            </Td>
            <Td color="gray.600">{scenario.startingDate || '—'}</Td>
            <Td color="gray.600">{scenario.startingTime || '—'}</Td>
            <Td color="gray.600">{scenario.numberOfInstances || '—'}</Td>
            <Td color="gray.600">{scenario.currency || '—'}</Td>
            <Td>
              <Badge colorScheme="green" variant="subtle">
                Active
              </Badge>
            </Td>
            <Td textAlign="right">
              <HStack spacing={2} justify="flex-end">
                <Tooltip label="Edit scenario" hasArrow>
                  <IconButton
                    aria-label="Edit scenario"
                    size="sm"
                    variant="ghost"
                    icon={<FiEdit2 />}
                    onClick={() => onEdit && onEdit(scenario)}
                  />
                </Tooltip>
                <Tooltip label="Duplicate scenario" hasArrow>
                  <IconButton
                    aria-label="Duplicate scenario"
                    size="sm"
                    variant="ghost"
                    icon={<FiCopy />}
                    onClick={() => onDuplicate && onDuplicate(scenario)}
                  />
                </Tooltip>
                <Tooltip label="Delete scenario" hasArrow>
                  <IconButton
                    aria-label="Delete scenario"
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    icon={<FiTrash2 />}
                    onClick={() => onDelete && onDelete(scenario)}
                  />
                </Tooltip>
              </HStack>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

export default OverviewTable;

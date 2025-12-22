import React, { useMemo } from 'react';
import { Box, Flex, Text, HStack, Badge } from '@chakra-ui/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const pct = v => `${Math.round((v || 0) * 100)}%`;

const TooltipBox = ({ active, payload, label, method }) => {
  if (!active || !payload?.length) return null;

  const score = payload.find(p => p.dataKey === 'score')?.value ?? 0;
  const unc = payload.find(p => p.dataKey === 'unc')?.value ?? 0;

  const scoreLabel = method === 'morris' ? 'μ*' : 'Score';
  const uncLabel = method === 'morris' ? 'σ (interaction)' : 'Uncertainty';

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      p={3}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Text fontWeight="700" color="gray.800" mb={2}>
        {label}
      </Text>

      <Flex justify="space-between" gap={6}>
        <Text color="gray.600" fontSize="sm">
          {scoreLabel}
        </Text>
        <Text fontWeight="700" fontSize="sm">
          {pct(score)}
        </Text>
      </Flex>

      <Flex justify="space-between" gap={6}>
        <Text color="gray.600" fontSize="sm">
          {uncLabel}
        </Text>
        <Text fontWeight="700" fontSize="sm">
          ±{pct(unc)}
        </Text>
      </Flex>
    </Box>
  );
};

export default function SensitivityStackedChart({
  data = [],
  method,
  loading,
  inactive,
  topN = 12,
}) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topN)
      .map(d => ({
        name: d.name,
        score: d.score ?? 0,
        unc: d.uncertainty ?? 0,
      }));
  }, [data, topN]);

  if (loading) {
    return (
      <Flex minH="340px" align="center" justify="center">
        <Text color="gray.600" fontWeight="600">
          Running analysis…
        </Text>
      </Flex>
    );
  }

  if (inactive || !chartData.length) {
    return (
      <Flex minH="340px" align="center" justify="center">
        <Text color="gray.600" fontWeight="600">
          Run analysis to see results
        </Text>
      </Flex>
    );
  }

  const isCritical = unc => unc >= 0.12;

  const title =
    method === 'morris' ? 'Parameter importance (Morris)' : 'Parameter importance (Sobol)';
  const badgeMain =
    method === 'morris' ? 'MORRIS (μ* + σ)' : 'SOBOL (SCORE + UNCERTAINTY)';

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontWeight="800" color="gray.800">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {method === 'morris'
              ? 'Bars show μ* (mean effect) with σ (interaction/nonlinearity).'
              : 'Bars show global total-effect and first-order indices.'}
          </Text>
        </Box>

        <HStack spacing={2}>
          <Badge colorScheme="blue" variant="subtle">
            {badgeMain}
          </Badge>
          <Badge colorScheme="gray" variant="subtle">
            TOP {Math.min(topN, chartData.length)}
          </Badge>
        </HStack>
      </Flex>

      <Box
        h={{ base: '320px', md: '380px' }}
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        p={3}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-18}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis tickFormatter={pct} />
            <Tooltip content={(props) => <TooltipBox {...props} method={method} />} />

            <Bar dataKey="score" stackId="a" fill="#2563EB" radius={[6, 6, 0, 0]} />
            <Bar dataKey="unc" stackId="a" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={isCritical(entry.unc) ? '#EF4444' : '#22C55E'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <HStack
        spacing={6}
        mt={3}
        justify="flex-end"
        color="gray.600"
        fontSize="sm"
      >
        <HStack>
          <Box w="12px" h="12px" bg="#2563EB" borderRadius="sm" />
          <Text>{method === 'morris' ? 'μ*' : 'Score'}</Text>
        </HStack>
        <HStack>
          <Box w="12px" h="12px" bg="#22C55E" borderRadius="sm" />
          <Text>{method === 'morris' ? 'σ (interaction)' : 'Uncertainty'}</Text>
        </HStack>
        <HStack>
          <Box w="12px" h="12px" bg="#EF4444" borderRadius="sm" />
          <Text>High uncertainty</Text>
        </HStack>
      </HStack>
    </Box>
  );
}

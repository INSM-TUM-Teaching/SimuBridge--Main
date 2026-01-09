import React, { useMemo } from "react";
import { Box, Flex, Text, HStack, Badge } from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const clamp0 = (x) => Math.max(0, Number.isFinite(x) ? x : 0);
const pct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;

const num = (v) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    Number.isFinite(v) ? v : 0
  );

const splitTwoLines = (label) => {
  const parts = String(label ?? "")
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean);

  const line1 = parts[0] ?? "";
  const line2 = parts.slice(1).join(" ");
  return { line1, line2: line2 || "" };
};

const TwoLineTick = ({ x, y, payload }) => {
  const { line1, line2 } = splitTwoLines(payload?.value);

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fontSize={12} fill="#475569">
        <tspan x="0" dy="0">
          {line1}
        </tspan>
        {line2 ? (
          <tspan x="0" dy="12">
            {line2}
          </tspan>
        ) : null}
      </text>
    </g>
  );
};

const TooltipBox = ({ active, payload, label, methodKey }) => {
  if (!active || !payload?.length) return null;

  const isMorris = methodKey === "morris";

  const score = clamp0(payload.find((p) => p.dataKey === "score")?.value ?? 0);
  const unc = clamp0(payload.find((p) => p.dataKey === "unc")?.value ?? 0);

  const scoreLabel = isMorris ? "μ*" : "Score";
  const uncLabel = isMorris ? "σ (interaction)" : "Uncertainty";

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
          {isMorris ? num(score) : pct(score)}
        </Text>
      </Flex>

      <Flex justify="space-between" gap={6}>
        <Text color="gray.600" fontSize="sm">
          {uncLabel}
        </Text>
        <Text fontWeight="700" fontSize="sm">
          {isMorris ? num(unc) : `±${pct(unc)}`}
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
  const methodKey = String(method || "sobol").toLowerCase();
  const isMorris = methodKey === "morris";

  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => clamp0(b.score ?? 0) - clamp0(a.score ?? 0))
      .slice(0, topN)
      .map((d) => ({
        name: d.name,
        score: clamp0(d.score ?? 0),
        unc: clamp0(d.uncertainty ?? 0),
      }));
  }, [data, topN]);

  const yMax = useMemo(() => {
    if (!chartData.length) return 1;

    if (!isMorris) {
      const maxStack = Math.max(...chartData.map((d) => (d.score || 0) + (d.unc || 0)));
      return Math.max(0.05, maxStack * 1.08);
    }

    const maxVal = Math.max(...chartData.map((d) => Math.max(d.score || 0, d.unc || 0)));
    return Math.max(0.05, maxVal * 1.08);
  }, [chartData, isMorris]);

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

  const isCritical = (unc) => unc >= 0.12;

  const title = isMorris
    ? "Parameter importance (Morris)"
    : "Parameter importance (Sobol)";

  const badgeMain = isMorris ? "MORRIS (μ* + σ)" : "SOBOL (SCORE + UNCERTAINTY)";

  const chartMargin = { top: 16, right: 24, left: 55, bottom: 16 };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontWeight="800" color="gray.800">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {isMorris
              ? "Bars show μ* (mean effect) with σ (interaction/nonlinearity)."
              : "Bars show global total-effect and first-order indices."}
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
        h={{ base: "420px", md: "520px" }}
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        p={3}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              interval={0}
              height={60}
             tickMargin={18} 
              tickLine={false}
              axisLine={false}
              tick={<TwoLineTick />}
            />

            <YAxis
              width={80}
              domain={[0, yMax]}
              tickFormatter={(v) => (isMorris ? num(v) : pct(v))}
            />

            <Tooltip content={(props) => <TooltipBox {...props} methodKey={methodKey} />} />

            <Bar dataKey="score" stackId="a" fill="#2563EB" radius={[6, 6, 0, 0]} />
            <Bar dataKey="unc" stackId="a" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={isCritical(entry.unc) ? "#EF4444" : "#94A3B8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <HStack spacing={6} mt={3} justify="center" color="gray.600" fontSize="sm">
        <HStack>
          <Box w="12px" h="12px" bg="#2563EB" borderRadius="sm" />
          <Text>{isMorris ? "μ*" : "Score"}</Text>
        </HStack>
        <HStack>
          <Box w="12px" h="12px" bg="#94A3B8" borderRadius="sm" />
          <Text>{isMorris ? "σ (interaction)" : "Uncertainty"}</Text>
        </HStack>
        <HStack>
          <Box w="12px" h="12px" bg="#EF4444" borderRadius="sm" />
          <Text>High uncertainty</Text>
        </HStack>
      </HStack>
    </Box>
  );
}

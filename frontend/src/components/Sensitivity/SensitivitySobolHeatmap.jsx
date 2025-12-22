import React, { useMemo } from 'react';
import { Box, Flex, Text, HStack, Badge, Tooltip } from '@chakra-ui/react';

const pct = (v) => `${Math.round((v || 0) * 100)}%`;

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export default function SensitivitySobolHeatmap({
  interactions = [],
  topN = 8,
  valueKey = 's2',
  confKey = 's2Conf',
}) {
  const { groups, lookup, maxAbs } = useMemo(() => {
    const safe = Array.isArray(interactions) ? interactions : [];

    const pairs = safe
      .filter(x => x && (x.groupI || x.groupJ))
      .map((x, idx) => ({
        key: x.key ?? `${x.groupI}-${x.groupJ}-${idx}`,
        groupI: String(x.groupI ?? ''),
        groupJ: String(x.groupJ ?? ''),
        v: Number(x[valueKey] ?? 0),
        conf: Number(x[confKey] ?? 0),
        cases: Number(x.cases ?? 0),
      }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));

    // choose groups based on strongest pairs
    const chosen = [];
    for (const p of pairs) {
      if (p.groupI && !chosen.includes(p.groupI) && chosen.length < topN) chosen.push(p.groupI);
      if (p.groupJ && !chosen.includes(p.groupJ) && chosen.length < topN) chosen.push(p.groupJ);
      if (chosen.length >= topN) break;
    }

    const groups = chosen.slice(0, topN);

    const map = new Map();
    let maxAbs = 0;

    for (const p of pairs) {
      if (!groups.includes(p.groupI) || !groups.includes(p.groupJ)) continue;
      map.set(`${p.groupI}|${p.groupJ}`, p);
      map.set(`${p.groupJ}|${p.groupI}`, p);
      maxAbs = Math.max(maxAbs, Math.abs(p.v || 0));
    }

    return { groups, lookup: map, maxAbs: maxAbs || 1e-9 };
  }, [interactions, topN, valueKey, confKey]);

  // Responsive tiles that grow on big screens
  const tileSize = 'clamp(28px, 4.2vw, 62px)';
  const labelCol = 'clamp(110px, 18vw, 240px)';

  const alphaFromValue = (v) => {
    // strong contrast but still readable
    const t = clamp01(Math.abs(v) / maxAbs);
    return 0.08 + t * 0.92;
  };

  const blue = (a) => `rgba(37, 99, 235, ${a})`;

  if (!groups.length) {
    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        p={4}
      >
        <Text color="gray.600" fontWeight="600">
          No interaction results to display.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
        <Box>
          <Text fontWeight="800" color="gray.800">
            Sobol interaction heatmap (S2)
          </Text>
          <Text fontSize="sm" color="gray.500">
            Rounded tiles show S2 (%) and intensity.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Badge colorScheme="blue" variant="subtle">
            S2 INTENSITY
          </Badge>
          <Badge colorScheme="gray" variant="subtle">
            TOP {groups.length}
          </Badge>
        </HStack>
      </Flex>

      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        p={{ base: 3, md: 4 }}
      >
        {/* Expand to screen. Only scroll if too many columns */}
        <Box w="100%" overflowX="auto" pb={2}>
          <Box
            minW={`calc(${labelCol} + ${groups.length} * ${tileSize} + 24px)`}
          >
            {/* Column labels */}
            <Box
              display="grid"
              gridTemplateColumns={`${labelCol} repeat(${groups.length}, ${tileSize})`}
              gap={2}
              mb={3}
              alignItems="end"
            >
              <Box />
              {groups.map(g => (
                <Box
                  key={`col-${g}`}
                  transform="rotate(-35deg)"
                  transformOrigin="left bottom"
                >
                  <Text fontSize="sm" fontWeight="700" color="gray.600" whiteSpace="nowrap">
                    {g}
                  </Text>
                </Box>
              ))}
            </Box>

            {/* Upper-triangle grid */}
            <Box display="grid" gap={2}>
              {groups.map((rowG, r) => (
                <Box
                  key={`row-${rowG}`}
                  display="grid"
                  gridTemplateColumns={`${labelCol} repeat(${groups.length}, ${tileSize})`}
                  gap={2}
                  alignItems="center"
                >
                  <Text fontSize="sm" fontWeight="800" color="gray.700" pr={2} whiteSpace="nowrap">
                    {rowG}
                  </Text>

                  {groups.map((colG, c) => {
                    const isUpper = c >= r;
                    if (!isUpper) return <Box key={`${rowG}|${colG}`} />;

                    const entry = lookup.get(`${rowG}|${colG}`);
                    const v = entry?.v ?? 0;
                    const conf = entry?.conf ?? 0;
                    const cases = entry?.cases ?? 0;

                    const a = entry ? alphaFromValue(v) : 0.04;
                    const bg = entry ? blue(a) : 'rgba(15, 23, 42, 0.03)';

                    const textColor = a > 0.55 ? 'white' : 'gray.800';

                    const tip = (
                      <Box>
                        <Text fontWeight="800" mb={1}>
                          {rowG} × {colG}
                        </Text>
                        <HStack justify="space-between">
                          <Text color="gray.600">S2</Text>
                          <Text fontWeight="800">
                            {Number(v).toFixed(6)} ({pct(v)})
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="gray.600">S2 conf</Text>
                          <Text fontWeight="800">{Number(conf).toFixed(6)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color="gray.600">Cases</Text>
                          <Text fontWeight="800">{cases ? cases.toLocaleString() : '—'}</Text>
                        </HStack>
                      </Box>
                    );

                    return (
                      <Tooltip
                        key={`${rowG}|${colG}`}
                        label={tip}
                        bg="white"
                        color="gray.800"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={3}
                        boxShadow="lg"
                        hasArrow
                        isDisabled={!entry}
                      >
                        <Box
                          w={tileSize}
                          h={tileSize}
                          borderRadius="lg"
                          bg={bg}
                          border="1px solid"
                          borderColor="rgba(15, 23, 42, 0.06)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          cursor={entry ? 'pointer' : 'default'}
                          userSelect="none"
                        >
                          <Text fontSize="xs" fontWeight="900" color={textColor}>
                            {pct(v)}
                          </Text>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Flex justify="flex-end" mt={3}>
          <Text fontSize="sm" color="gray.500">
            Light → weak interaction &nbsp;&nbsp; Dark blue → strong interaction
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

import React, { useMemo } from "react";
import { Box, Flex, Text, HStack, Badge, Tooltip } from "@chakra-ui/react";

const pct = (v) => `${Math.round((v || 0) * 100)}%`;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export default function SensitivitySobolHeatmap({
  interactions = [],
  topN = 8,
  valueKey = "s2",
  confKey = "s2Conf",
  showNumbers = false,
}) {
  const { groups, lookup, maxAbs } = useMemo(() => {
    const safe = Array.isArray(interactions) ? interactions : [];

    const pairs = safe
      .filter((x) => x && (x.groupI || x.groupJ))
      .map((x, idx) => ({
        key: x.key ?? `${x.groupI}-${x.groupJ}-${idx}`,
        groupI: String(x.groupI ?? ""),
        groupJ: String(x.groupJ ?? ""),
        v: Number(x[valueKey] ?? 0),
        conf: Number(x[confKey] ?? 0),
        cases: Number(x.cases ?? 0),
      }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));

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

  if (!groups.length) {
    return (
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" p={4}>
        <Text color="gray.600" fontWeight="600">
          No interaction results to display.
        </Text>
      </Box>
    );
  }

  // ✅ Fit-to-screen grid settings
  const gap = "8px";
  const labelCol = { base: "170px", md: "240px" }; // left labels
  const maxTile = { base: "24px", md: "28px", lg: "32px" }; // prevent tiles getting huge

  // green palette like your screenshot
  const green = (a) => `rgba(34, 197, 94, ${a})`;
  const emptyBg = "rgba(15, 23, 42, 0.06)";

  const alphaFromValue = (v) => {
    const t = clamp01(Math.abs(v) / maxAbs);
    return 0.10 + t * 0.90;
  };

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
        <Box>
          <Text fontWeight="800" color="gray.800">
            Sobol interaction heatmap (S2)
          </Text>
          <Text fontSize="sm" color="gray.500">
            Fits screen width. Hover tiles for details.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Badge colorScheme="green" variant="subtle">
            S2 INTENSITY
          </Badge>
          <Badge colorScheme="gray" variant="subtle">
            TOP {groups.length}
          </Badge>
        </HStack>
      </Flex>

      <Box
        w="100%"
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="xl"
        p={{ base: 3, md: 4 }}
      >
        {/* ✅ No minW hack. Fill width and let columns flex. */}
        <Box w="100%">
          {/* column labels */}
          <Box
            display="grid"
            gridTemplateColumns={`${labelCol.base} repeat(${groups.length}, minmax(0, 1fr))`}
            gap={gap}
            alignItems="end"
            mb={3}
            sx={{
              "@media (min-width: 48em)": {
                gridTemplateColumns: `${labelCol.md} repeat(${groups.length}, minmax(0, 1fr))`,
              },
            }}
          >
            <Box />
            {groups.map((g) => (
              <Box key={`col-${g}`} transform="rotate(-35deg)" transformOrigin="left bottom">
                <Text fontSize="10px" fontWeight="700" color="gray.600" whiteSpace="nowrap">
                  {g}
                </Text>
              </Box>
            ))}
          </Box>

          {/* rows */}
          <Box display="grid" gap={gap}>
            {groups.map((rowG, r) => (
              <Box
                key={`row-${rowG}`}
                display="grid"
                gridTemplateColumns={`${labelCol.base} repeat(${groups.length}, minmax(0, 1fr))`}
                gap={gap}
                alignItems="center"
                sx={{
                  "@media (min-width: 48em)": {
                    gridTemplateColumns: `${labelCol.md} repeat(${groups.length}, minmax(0, 1fr))`,
                  },
                }}
              >
                <Text fontSize="11px" fontWeight="800" color="gray.700" noOfLines={1}>
                  {rowG}
                </Text>

                {groups.map((colG, c) => {
                  if (c < r) return <Box key={`${rowG}|${colG}`} />;

                  const entry = lookup.get(`${rowG}|${colG}`);
                  const v = entry?.v ?? 0;
                  const conf = entry?.conf ?? 0;
                  const cases = entry?.cases ?? 0;

                  const a = entry ? alphaFromValue(v) : 0;
                  const bg = entry ? green(a) : emptyBg;

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
                        <Text fontWeight="800">{cases ? cases.toLocaleString() : "—"}</Text>
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
                      borderRadius="md"
                      p={3}
                      boxShadow="lg"
                      hasArrow
                      isDisabled={!entry}
                    >
                      {/* ✅ square tile that flexes with screen width */}
                      <Box
                        w="100%"
                        maxW={maxTile}
                        aspectRatio="1 / 1"
                        borderRadius="md"
                        bg={bg}
                        border="1px solid"
                        borderColor="rgba(15, 23, 42, 0.10)"
                        cursor={entry ? "pointer" : "default"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {showNumbers && entry ? (
                          <Text fontSize="9px" fontWeight="800" color="gray.900">
                            {pct(v)}
                          </Text>
                        ) : null}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>

        <Flex justify="flex-end" mt={3}>
          <Text fontSize="sm" color="gray.500">
            Light → weak interaction &nbsp;&nbsp; Dark → strong interaction
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

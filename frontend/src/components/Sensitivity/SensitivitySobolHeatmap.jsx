import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  Badge,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";

/**
 * Format a numeric Sobol value as a percentage string.
 * Example: 0.123 -> "12%"
 */
const pct = (v) => `${Math.round((v || 0) * 100)}%`;

/**
 * Clamp a number into the [0, 1] range.
 * Used when normalizing intensities and computing opacity.
 */
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/**
 * Convert input into a safe non-negative number.
 * - Non-finite values become 0
 * - Negative values become 0
 */
const clamp0 = (x) => Math.max(0, Number.isFinite(x) ? x : 0);

/**
 * Split a label into two lines for better rendering in compact cells.
 * - Splits by underscores or whitespace
 * - First token becomes line1
 * - Remaining tokens become line2
 *
 * Example: "learning_rate_decay" -> "learning" / "rate decay"
 */
const splitTwoLines = (label) => {
  const parts = String(label ?? "")
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean);

  const line1 = parts[0] ?? "";
  const line2 = parts.slice(1).join(" ");
  return { line1, line2: line2 || "" };
};

/**
 * TwoLineLabel
 * Reusable UI helper that renders a label in up to two lines.
 * This improves readability for long variable/group names inside the heatmap.
 */
const TwoLineLabel = ({
  text,
  align = "center",
  fontSize = "11px",
  fontWeight = "700",
  color = "gray.600",
}) => {
  const { line1, line2 } = splitTwoLines(text);

  return (
    <Box textAlign={align} lineHeight="1.15">
      <Text
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        whiteSpace="normal"
        wordBreak="break-word"
      >
        {line1}
      </Text>

      {line2 ? (
        <Text
          fontSize={fontSize}
          fontWeight={fontWeight}
          color={color}
          whiteSpace="normal"
          wordBreak="break-word"
        >
          {line2}
        </Text>
      ) : null}
    </Box>
  );
};

/**
 * SensitivitySobolHeatmap
 * Renders a Sobol interaction (S2) heatmap for a selected set of variable groups.
 *
 * High-level behavior:
 * 1) Parse and normalize interaction data
 * 2) Choose the top N groups based on strongest interaction magnitudes
 * 3) Render an upper-triangular heatmap (to avoid duplicate symmetric cells)
 * 4) Use tile opacity to encode interaction strength (darker = stronger)
 * 5) Show details in a tooltip on hover (S2 value, confidence, case count)
 */
export default function SensitivitySobolHeatmap({
  interactions = [],
  topN = 8,
  valueKey = "s2",
  confKey = "s2Conf",
  showNumbers = false,
}) {
  /**
   * Responsive sizing values.
   * These keep the heatmap readable across devices and screen sizes.
   */
  const tileMin = useBreakpointValue({ base: 32, md: 38, lg: 44 }) ?? 38;
  const tileMax = useBreakpointValue({ base: 52, md: 62, lg: 74 }) ?? 62;

  const gap = useBreakpointValue({ base: "8px", md: "10px" }) ?? "10px";
  const labelCol = useBreakpointValue({ base: "150px", md: "190px" }) ?? "170px";
  const cellCol = `minmax(${tileMin}px, ${tileMax}px)`;

  /**
   * Memoized preprocessing step:
   * - Convert input into a consistent internal structure
   * - Sort by absolute interaction strength
   * - Select topN unique groups
   * - Build a lookup map for O(1) access during rendering
   * - Track max absolute value for opacity normalization
   *
   * This prevents expensive recomputation on every render.
   */
  const { groups, lookup, maxAbs } = useMemo(() => {
    const safe = Array.isArray(interactions) ? interactions : [];

    const pairs = safe
      .filter((x) => x && (x.groupI || x.groupJ))
      .map((x, idx) => ({
        key: x.key ?? `${x.groupI}-${x.groupJ}-${idx}`,
        groupI: String(x.groupI ?? ""),
        groupJ: String(x.groupJ ?? ""),
        v: clamp0(Number(x[valueKey] ?? 0)),
        conf: clamp0(Number(x[confKey] ?? 0)),
        cases: clamp0(Number(x.cases ?? 0)),
      }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));

    /**
     * Select up to topN distinct group names by scanning strongest pairs first.
     * This ensures the axes focus on the most influential interactions.
     */
    const chosen = [];
    for (const p of pairs) {
      if (p.groupI && !chosen.includes(p.groupI) && chosen.length < topN) {
        chosen.push(p.groupI);
      }
      if (p.groupJ && !chosen.includes(p.groupJ) && chosen.length < topN) {
        chosen.push(p.groupJ);
      }
      if (chosen.length >= topN) break;
    }

    const groups = chosen.slice(0, topN);

    /**
     * lookup maps "A|B" -> entry for fast retrieval in the grid.
     * Storing both "A|B" and "B|A" supports symmetric access.
     */
    const map = new Map();
    let maxAbs = 0;

    for (const p of pairs) {
      if (!groups.includes(p.groupI) || !groups.includes(p.groupJ)) continue;

      map.set(`${p.groupI}|${p.groupJ}`, p);
      map.set(`${p.groupJ}|${p.groupI}`, p);

      maxAbs = Math.max(maxAbs, Math.abs(p.v || 0));
    }

    /**
     * maxAbs is forced > 0 to prevent division by zero during normalization.
     */
    return { groups, lookup: map, maxAbs: maxAbs || 1e-9 };
  }, [interactions, topN, valueKey, confKey]);

  /**
   * Color utilities:
   * - emptyBg is used when there is no data for a tile
   * - blue(alpha) creates a consistent blue tint with variable opacity
   */
  const emptyBg = "rgba(15, 23, 42, 0.05)";
  const blue = (a) => `rgba(37, 99, 235, ${a})`;

  /**
   * Convert a tile's value into an alpha range [0.12, 1.0].
   * Stronger interactions become darker by increasing opacity.
   */
  const alphaFromValue = (v) => {
    const t = clamp01(Math.abs(v) / maxAbs);
    return 0.12 + t * 0.88;
  };

  /**
   * Empty-state rendering when there is not enough data to display.
   */
  if (!groups.length) {
    return (
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" p={4}>
        <Text color="gray.600" fontWeight="600">
          No interaction results to display.
        </Text>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
        <Box>
          <Text fontWeight="800" color="gray.800">
            Sobol interaction heatmap (S2)
          </Text>
          <Text fontSize="sm" color="gray.500">
            Hover tiles for details.
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
        w="100%"
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="2xl"
        p={{ base: 4, md: 5 }}
        overflowX="auto"
      >
        <Box w="fit-content" mx="auto">
          <Box
            display="grid"
            gridTemplateColumns={`${labelCol} repeat(${groups.length}, ${cellCol})`}
            gap={gap}
            alignItems="center"
            justifyContent="start"
          >
            <Box />

            {groups.map((g) => (
              <Tooltip
                key={`col-${g}`}
                label={g}
                bg="white"
                color="gray.800"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={2}
                boxShadow="lg"
                hasArrow
              >
                <Box
                  cursor="help"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minH="56px"
                >
                  <TwoLineLabel text={g} fontSize="11px" />
                </Box>
              </Tooltip>
            ))}

            {groups.map((rowG, r) => (
              <React.Fragment key={`row-${rowG}`}>
                <Tooltip label={rowG} hasArrow>
                  <Box cursor="help" pr={2} py={2}>
                    <TwoLineLabel
                      text={rowG}
                      align="left"
                      fontWeight="800"
                      color="gray.700"
                      fontSize="11px"
                    />
                  </Box>
                </Tooltip>

                {groups.map((colG, c) => {
                  /**
                   * Only render the upper triangle (including diagonal).
                   * This prevents duplicate symmetric tiles (A,B) and (B,A).
                   */
                  if (c < r) return <Box key={`${rowG}|${colG}`} />;

                  const entry = lookup.get(`${rowG}|${colG}`);
                  const v = clamp0(entry?.v ?? 0);
                  const conf = clamp0(entry?.conf ?? 0);
                  const cases = clamp0(entry?.cases ?? 0);

                  const bg = entry ? blue(alphaFromValue(v)) : emptyBg;

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
                        <Text fontWeight="800">
                          {cases ? cases.toLocaleString() : "—"}
                        </Text>
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
                      <Box
                        w="100%"
                        aspectRatio="1 / 1"
                        borderRadius="lg"
                        bg={bg}
                        border="1px solid"
                        borderColor="rgba(15, 23, 42, 0.10)"
                        boxShadow="0 2px 10px rgba(15, 23, 42, 0.06)"
                        cursor={entry ? "pointer" : "default"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {showNumbers && entry ? (
                          <Text fontSize="10px" fontWeight="800" color="gray.900">
                            {pct(v)}
                          </Text>
                        ) : null}
                      </Box>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            ))}
          </Box>
        </Box>

        <Flex justify="space-between" mt={5} wrap="wrap" gap={3} align="center">
          <HStack spacing={6} color="gray.600" fontSize="sm">
            <HStack>
              <Box
                w="14px"
                h="14px"
                bg={emptyBg}
                borderRadius="sm"
                border="1px solid rgba(15,23,42,0.10)"
              />
              <Text>No data</Text>
            </HStack>

            <HStack>
              <Box w="14px" h="14px" bg={blue(0.22)} borderRadius="sm" />
              <Text>Weak S2</Text>
            </HStack>

            <HStack>
              <Box w="14px" h="14px" bg={blue(0.95)} borderRadius="sm" />
              <Text>Strong S2</Text>
            </HStack>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            Darker = stronger interaction
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

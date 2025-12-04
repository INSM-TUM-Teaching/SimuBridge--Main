import { useEffect, useState } from 'react';
import { Card, Flex, Progress, Text } from '@chakra-ui/react';

export default function RunProgressIndicationBar({ started, finished, errored }) {
  const [progress, setProgress] = useState(0);
  const wasCanceled = typeof window !== 'undefined' && window.canceled;
  const isRunning = started && !finished;

  useEffect(() => {
    let intervalId;

    if (isRunning) {
      setProgress(10);
      intervalId = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 6 + 4;
          return next >= 95 ? 95 : next;
        });
      }, 750);
    } else {
      setProgress(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  if (!isRunning) {
    return null;
  }

  const barValue = Math.max(5, Math.round(progress));
  const colorScheme = errored ? 'red' : wasCanceled ? 'gray' : 'green';
  const statusLabel = `Running • ${barValue}%`;

  return (
    <Card bg="white" p="5">
      <Flex justify="space-between" align="center" mb="2">
        <Text fontWeight="600" color="gray.700">
          Progress
        </Text>
        <Text fontSize="sm" color="gray.500">
          {statusLabel}
        </Text>
      </Flex>
      <Progress
        hasStripe
        isAnimated
        value={barValue}
        colorScheme={colorScheme}
        borderRadius="md"
        transition="width 0.25s ease"
      />
    </Card>
  );
}

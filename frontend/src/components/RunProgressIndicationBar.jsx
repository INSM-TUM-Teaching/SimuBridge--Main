/**
 * This component is responsible for showing progress bar while a tool is executed
 * 
 * Important:
 * - This is simulation of progress
 * - We do not know real progress from the backend
 * - The progress bar slowly increases until it reaches 95% 
 *  -> and then waits till actualy progress is complete to show 100
 */

import { useEffect, useState } from 'react';
import { Card, Flex, Progress, Text } from '@chakra-ui/react';

export default function RunProgressIndicationBar({ started, finished, errored }) {
  // progress to store the "current" progress number from "0 to 95"
  const [progress, setProgress] = useState(0);
  const wasCanceled = typeof window !== 'undefined' && window.canceled;
  // constant isRunning to know when the execution started but has not completed yet
  const isRunning = started && !finished;

  /**
   * Runs whenever isRunning changes:
   * 
   * When it becomes true:
   *  - initial progress is set to 10%
   *  - timer is start that increases progress every 750ms
   * 
   * If isRunning becomes false:
   *  - progress is reset back to 0
   */
  useEffect(() => {
    // Store timerID to stop it after the execution endet
    let intervalId;

    if (isRunning) {
      // Set initial progress to 10 so it shows that execution started
      setProgress(10);
      // Every 750 ms increase a progress by a random number
      intervalId = setInterval(() => {
        setProgress(prev => {
          /**
           * Here the random amount of "progress" is added with increase 4-10 points
           * And is stopped at 95%
           * 
           * To not reach the 100% before backend finishes its job
           * So we stop at 95% and wait for real signal of end of execution
           */
          const next = prev + Math.random() * 6 + 4;
          return next >= 95 ? 95 : next;
        });
      }, 750);
    } else {
      // If not running hide the bar, and reset progress to 0
      setProgress(0);
    }
    // Clear the interval to prevent multiple times adding up
    // Is called when isRunning changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  if (!isRunning) {
    return null;
  }

  /**
   * barValue
   * 
   * As progress bar expects a number
   * -> The progress is rounded to an integer
   * -> Start from 5 to ensure that bar is visible always
   */
  const barValue = Math.max(5, Math.round(progress));
  /**
   * Color Scheme
   * 
   * Controll the color of progress bar:
   * - Error -> red
   * - Canceled -> gray
   * - Else/Succeed -> green
   */
  const colorScheme = errored ? 'red' : wasCanceled ? 'gray' : 'green';
  // Text shown on the right from the bar
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
      {/* Animated progress bar */}
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

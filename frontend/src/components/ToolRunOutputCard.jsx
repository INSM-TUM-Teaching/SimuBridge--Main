import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  ListItem,
  Stack,
  Tag,
  Text,
  Textarea,
  UnorderedList,
} from '@chakra-ui/react';
import { downloadFile } from "../util/Storage";

export default function ToolRunOutputCard({projectName, response, toolName, processName, filePrefix}) {


    const finishedDate = response.finished ? new Date(response.finished) : null;
    const hasRun = Boolean(finishedDate);

    return (
      <Card
        borderRadius="2xl"
        border="1px"
        borderColor="gray.100"
        boxShadow="lg"
        bg="white"
      >
        <CardHeader borderBottom="1px" borderColor="gray.100">
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Heading size="md" color="#0F172A">
                Last {toolName} Run Output
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {hasRun
                  ? `Completed on ${finishedDate.toLocaleString()}`
                  : `No ${processName} runs have completed in this session.`}
              </Text>
            </Box>
            <Tag
              size="sm"
              borderRadius="full"
              colorScheme={hasRun ? 'green' : 'gray'}
              px={4}
            >
              {hasRun ? 'Completed' : 'Not run'}
            </Tag>
          </Flex>
        </CardHeader>
        <CardBody>
          <Stack spacing={5}>
            {!hasRun && (
              <Text fontSize="sm" color="gray.500">
                Launch a process mining run to capture console output and
                generated files here.
              </Text>
            )}

            {response.message && (
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Console Output
                </Text>
                <Textarea
                  isDisabled
                  value={response.message}
                  fontSize="sm"
                  bg="gray.50"
                  borderColor="gray.200"
                  minH="120px"
                />
              </Box>
            )}

            {Array.isArray(response.files) && response.files.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Returned Files
                </Text>
                <UnorderedList spacing={2} ml={4}>
                  {response.files.map(fileName => (
                    <ListItem key={fileName}>
                      <Button
                        onClick={() =>
                          downloadFile(
                            projectName,
                            (filePrefix ? filePrefix + '/' : '') + fileName
                          )
                        }
                        variant="link"
                        colorScheme="blue"
                        fontWeight="600"
                      >
                        {fileName}
                      </Button>
                    </ListItem>
                  ))}
                </UnorderedList>
              </Box>
            )}
          </Stack>
        </CardBody>
      </Card>
    );
} 

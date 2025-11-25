import Sidebar from '../Sidebar';

import { Text, Button, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

import AddResource from './ResourcesBased/AddResource';
import AddRole from './ResourcesBased/AddRole';
import EditResource from './ResourcesBased/EditResource';
import EditRole from './ResourcesBased/EditRole';

const Title = ({ text }) => (
  <Text
    fontSize={{ base: 'xs', md: 'sm' }}
    textAlign="center"
    color="RGBA(0, 0, 0, 0.80)"
    fontWeight="bold"
    textTransform="uppercase"
  >
    {text}
  </Text>
);

// MAIN editor sidebar
function EditorSidebar(props) {
  const navigate = useNavigate();
  const isCollapsed = props.collapsed;

  const backToTimetable = () => {
    try {
      navigate('/resource/timetable');
    } catch (e) {
      // ignore
    }
  };

  const SelectEditor = () => {
    switch (props.current) {
      case 'Resource Parameters':
        return (
          <EditResource
            currentResource={props.currentResource}
            setResource={props.setResource}
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );
      case 'Resource Parameters for Roles':
        return (
          <EditRole
            currentRole={props.currentRole}
            setRole={props.setRole}
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );
      case 'Add Resource':
        return (
          <AddResource
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );
      case 'Add Role':
        return (
          <AddRole
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sidebar
      side="left"
      backgroundColor="#FAFBFC"
      collapsed={isCollapsed}
      onToggle={props.onToggle}
      title={<Title text={props.current} />}
      content={
        <>
          <Button
            onClick={backToTimetable}
            leftIcon={!isCollapsed ? <Icon as={FiHome} boxSize={5} /> : null}
            colorScheme="blue"
            variant="solid"
            w="100%"
            py={6}
            mt={4}
            mb={6}
            size="md"
            fontWeight="semibold"
            boxShadow="sm"
            justifyContent="center"
            px={isCollapsed ? 0 : 4}
            minW={isCollapsed ? '48px' : 'auto'}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'md',
            }}
            transition="all 0.2s"
            aria-label="Back to Main Menu"
          >
            {isCollapsed ? (
              <Icon as={FiHome} boxSize={6} />
            ) : (
              'Back to Main Menu'
            )}
          </Button>
          <SelectEditor />
        </>
      }
    />
  );
}

// Alternate variant if you use it
export function EditorSidebarAlternate({
  content,
  title,
  collapsed,
  onToggle,
}) {
  return (
    <Sidebar
      side="left"
      backgroundColor="#FAFBFC"
      collapsed={collapsed}
      onToggle={onToggle}
      title={<Title text={title} />}
      content={content}
    />
  );
}

export default EditorSidebar;

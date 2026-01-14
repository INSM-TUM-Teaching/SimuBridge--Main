import Sidebar from "../Sidebar";

import { Text, Button, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";

import AddResource from "./ResourcesBased/AddResource";
import AddRole from "./ResourcesBased/AddRole";
import EditResource from "./ResourcesBased/EditResource";
import EditRole from "./ResourcesBased/EditRole";

/**
 * Title
 * -----
 * Small header component used inside the Sidebar.
 * It renders the current editor section name in a consistent visual style.
 */
const Title = ({ text }) => (
  <Text
    fontSize={{ base: "xs", md: "sm" }}
    textAlign="center"
    color="RGBA(0, 0, 0, 0.80)"
    fontWeight="bold"
    textTransform="uppercase"
  >
    {text}
  </Text>
);

/**
 * EditorSidebar
 * -------------
 * Main left sidebar used in the "Editor" area of the application.
 *
 * Responsibilities:
 * - Show a sidebar wrapper (using the shared <Sidebar> component)
 * - Provide a "Back to Main Menu" button that navigates to the timetable view
 * - Render the correct editor panel (Add/Edit Resource/Role) based on props.current
 * - Support a collapsed mode to save space (icon-only button, tighter padding)
 */
function EditorSidebar(props) {
  const navigate = useNavigate();
  const isCollapsed = props.collapsed;

  /**
   * Navigate back to the timetable page.
   * A try/catch is used to prevent UI crashes if routing is not available
   * or if navigation fails for any unexpected reason.
   */
  const backToTimetable = () => {
    try {
      navigate("/resource/timetable");
    } catch (e) {
      /**
       * Intentionally ignored.
       * Navigation failure should not break the sidebar UI.
       */
    }
  };

  /**
   * SelectEditor
   * ------------
   * Determines which editor component should be rendered.
   * This acts as a simple router-like switch based on props.current.
   *
   * The selected editor receives:
   * - current object being edited (resource or role)
   * - setter functions (setResource / setRole)
   * - getData for refreshing data after save/update
   * - setCurrent to switch editor modes
   * - collapsed to ensure consistent UI in minimized sidebar mode
   */
  const SelectEditor = () => {
    switch (props.current) {
      case "Resource Parameters":
        return (
          <EditResource
            currentResource={props.currentResource}
            setResource={props.setResource}
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );

      case "Resource Parameters for Roles":
        return (
          <EditRole
            currentRole={props.currentRole}
            setRole={props.setRole}
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );

      case "Add Resource":
        return (
          <AddResource
            getData={props.getData}
            setCurrent={props.setCurrent}
            collapsed={isCollapsed}
          />
        );

      case "Add Role":
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
          {/**
           * "Back to Main Menu" button
           * - In expanded mode: icon + text
           * - In collapsed mode: icon only (more compact)
           */}
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
            minW={isCollapsed ? "48px" : "auto"}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "md",
            }}
            transition="all 0.2s"
            aria-label="Back to Main Menu"
          >
            {isCollapsed ? <Icon as={FiHome} boxSize={6} /> : "Back to Main Menu"}
          </Button>

          {/**
           * Render the chosen editor view (edit/add resource/role) based on props.current.
           */}
          <SelectEditor />
        </>
      }
    />
  );
}

/**
 * EditorSidebarAlternate
 * ----------------------
 * Alternate sidebar variant that accepts content and title directly.
 * This is useful if another screen wants to reuse the same Sidebar styling,
 * but provide different body content without the editor-selection logic.
 */
export function EditorSidebarAlternate({ content, title, collapsed, onToggle }) {
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

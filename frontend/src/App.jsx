import { React, useState, useEffect } from "react";
import "./styles/globals.css";
import {
  ChakraProvider,
  Box,
  theme,
  Flex,
  Container,
  useToast,
  Button,
} from '@chakra-ui/react';
import Navigation from './components/Navigation/Navigation';
import EditorSidebar from './components/EditorSidebar/EditorSidebar';
import StartView from './components/StartView/StartView';
import ScenarioPage from './components/ScenarioParameters/ScenarioPage';
import OverviewPage from './components/Overview/OverviewPage';
import OnlyDifferencesPage from './components/Comparison/OnlyDifferencesPage';
import ModelbasedParametersTable from './components/ModelbasedParameters/ModelbasedParametersTable';
import SimulationPage from './components/Simulation/SimulationPage';
import ProcessMinerPage from './components/Processminer/ProcessMinerPage';
import DebugPage from './components/Debug/DebugPage';
import ComparePage from './components/Comparison/ComparePage';
import TimetableOverview from './components/ResourceParameters/TimeTable/TimetableOverview';
import ResourceOverview from './components/ResourceParameters/Resources/ResourceOverview';
import HelpBubble from './components/HelpBubble';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProgressPage from './components/StartView/ProgressPage';
import { getScenarios } from './util/Storage';
import BpmnView from './components/ModelbasedParameters/BpmnView';
import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';
import ModelBasedOverview from './components/TablesOverviewComparison/ModelBasedOverview';
import { ModelData, ScenarioData } from './util/DataHandles';
import SensitivityAnalysisPage from './components/Sensitivity/SensitivityAnalysisPage';
import QualityInformedPage from './components/Quality/QualityInformedPage';

/**
 * Global console filtering (warning redirection)
 * ---------------------------------------------
 * The app redirects certain console.error messages to console.warn.
 * This helps avoid flooding the console with "Warning:"-prefixed logs
 * that are not critical errors during development.
 *
 * Important:
 * - oldConsError is kept so real errors still get logged normally.
 * - Only messages starting with a prefix in errorsToWarn are redirected.
 */
const errorsToWarn = ["Warning:"];
const oldConsError = console.error;
console.error = function (...args) {
  let toWarn = false;

  if (typeof args[0] === "string") {
    errorsToWarn.map(function (_s) {
      if (args[0].startsWith(_s)) {
        toWarn = true;
      }
    });
  }

  toWarn ? console.warn(...args) : oldConsError(...args);
};

/**
 * js-deep-equals compare helper (CommonJS import)
 * Used by parts of the project for deep comparison.
 */
const { compare } = require("js-deep-equals");

/**
 * Some moddle classes need to be patched / recognized consistently.
 * This array is likely used elsewhere where moddle instances are normalized.
 */
const patchModdleClasses = [ScenarioData, ModelData];

/**
 * App
 * ---
 * Root component that sets up:
 * - ChakraProvider theme
 * - Project/session selection and persistence (sessionStorage)
 * - Central routing (main content routes)
 * - Navigation sidebar and editor sidebar
 * - Data loading and a project-level data API ("ProjectData")
 *
 * High-level flow:
 * 1) If no projectName is selected -> show StartView (create/import/select project)
 * 2) If a project exists but data not loaded -> show ProgressPage
 * 3) If data is loaded -> show Navigation + Routes + optional right-side EditorSidebar
 */
function App() {
  /**
   * UI state controlling whether left/right sidebars are collapsed.
   * This is passed to Navigation and EditorSidebar so they stay in sync.
   */
  const [sidebarsCollapsed, setSidebarsCollapsed] = useState(false);

  const toggleSidebars = () => {
    setSidebarsCollapsed((prev) => !prev);
  };

  /**
   * Project/session state:
   * - projectName persists in sessionStorage ("currentProject")
   * - if the session is refreshed, the current project can be restored
   */
  const [projectName, setProjectName] = useState(
    sessionStorage.getItem("currentProject") || ""
  );

  /**
   * selectProject
   * -------------
   * Updates sessionStorage and React state when opening/closing a project.
   */
  function selectProject(project) {
    if (project) {
      sessionStorage.setItem("currentProject", project);
    } else {
      sessionStorage.removeItem("currentProject");
    }
    setProjectName(project);
  }

  /**
   * current
   * -------
   * Tracks the currently active editor page name used by Navigation
   * to highlight the selected item.
   *
   * Note: comments indicate this is temporary and part of an ongoing refactor.
   */
  const [current, setCurrent] = useState("Scenario Parameters");

  /**
   * Right-sidebar selection state for resource/role editing.
   * When a resource/role is selected, EditorSidebar shows an editor for it.
   */
  const [currentResource, setResource] = useState("");
  const [currentRole, setRole] = useState("");

  /**
   * currentRightSideBar holds a dynamic component that some pages set
   * to show custom right-side content.
   *
   * rightSideBarHasToBeReset is used to manage a race between route changes
   * and sidebar state updates; it clears the sidebar after location changes.
   */
  const [currentRightSideBar, setCurrentRightSideBarInternal] = useState(<></>);
  const [rightSideBarHasToBeReset, setRightSideBarHasToBeReset] =
    useState(false);

  function setCurrentRightSideBar(newRightSideBar) {
    setRightSideBarHasToBeReset(false);
    setCurrentRightSideBarInternal(newRightSideBar);
  }

  /**
   * Reset right sidebar content on navigation changes.
   * This prevents outdated sidebar content from sticking to a new route.
   */
  const location = useLocation();
  useEffect(() => {
    if (rightSideBarHasToBeReset) {
      setCurrentRightSideBar(<></>);
    } else {
      setRightSideBarHasToBeReset(true);
    }
  }, [location]);

  /**
   * currentObject stores the currently selected BPMN element
   * (e.g., task, event, gateway) for model-based editing.
   */
  const [currentObject, setObject] = useState({});

  /**
   * Comparison and analysis state used across overview/compare routes.
   */
  const [scenariosCompare, setScenariosCompare] = useState([]);
  const [notSameScenario, setNotSameScenario] = useState("");
  const [resourceCompared, setResourceCompared] = useState([]);

  /**
   * Tracks whether project data has been loaded from storage.
   * Used to decide whether to show ProgressPage vs. main UI.
   */
  const [dataLoaded, setDataLoaded] = useState(false);

  /**
   * ProjectDataClass and project data state container
   * -------------------------------------------------
   * The app defines a ProjectData class that wraps:
   * - reading scenarios from storage
   * - accessing current scenario/model
   * - saving and renaming scenarios
   *
   * It uses internal React state "data" so UI re-renders when loaded.
   */
  let ProjectDataClass;

  {
    const [data, setDataInternal] = useState(undefined);
    const [currentBpmn, setBpmn] = useState(0);
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

    class ProjectData {
      constructor(projectName) {
        this.projectName = projectName;

        if (data) {
          data.forEach((scenario) => (scenario.parentProject = this));
        }
      }

      /**
       * linkParents
       * -----------
       * Ensures the scenario and its models have correct parent references.
       * This is important for moddle navigation and saving.
       */
      linkParents(scenario) {
        scenario.parentProject = this;
        scenario.models.forEach((model) => {
          if (model.$parent !== scenario) {
            throw new Error(`Wrong parent ${model.$parent} should be ${scenario}`);
          }
        });
      }

      getProjectName() {
        return this.projectName;
      }

      /**
       * initializeData
       * --------------
       * Loads all scenario files for this project and converts them into moddle instances.
       *
       * Steps:
       * 1) getScenarios(projectName) reads scenario files from storage
       * 2) Parse JSON into plain objects
       * 3) Create moddle scenario objects (simulationmodel:Scenario)
       * 4) Ensure parent references are correct
       * 5) Parse BPMN XML for each model to build in-memory structures
       * 6) Save loaded data into React state so UI re-renders
       */
      async initializeData() {
        const scenarioFiles = await getScenarios(this.projectName);

        const scenarioData = scenarioFiles
          .map((scenarioFile) => {
            if (!scenarioFile.data) {
              console.error(
                `Scenario file ${scenarioFile.path.split("/").pop()} is empty. Skip.`
              );
            }
            return scenarioFile.data && JSON.parse(scenarioFile.data);
          })
          .filter((x) => x)
          .map((scenarioData) =>
            SimulationModelModdle.getInstance().create(
              "simulationmodel:Scenario",
              scenarioData
            )
          );

        scenarioData.forEach(this.linkParents);

        await Promise.all(
          scenarioData.flatMap((scenario) => scenario.models.map((model) => model.parseXML()))
        );

        setDataInternal(scenarioData);
      }

      getAllScenarios() {
        return data;
      }

      getCurrentScenario() {
        return this.getAllScenarios()?.[currentScenarioIndex];
      }

      getAllModels() {
        return this.getCurrentScenario()?.models;
      }

      getCurrentModel() {
        return this.getAllModels()?.[currentBpmn];
      }

      getScenario(scenarioName) {
        return this.getAllScenarios().find(
          (scenario) => scenario.scenarioName === scenarioName
        );
      }

      getScenarioByIndex(index) {
        return data[index];
      }

      setCurrentScenarioByIndex(index) {
        setCurrentScenarioIndex(index);
      }

      setCurrentBpmnByIndex(index) {
        setBpmn(index);
      }

      /**
       * addScenario
       * -----------
       * Creates a new moddle scenario instance and persists it.
       * The scenario.save() call likely writes it to storage.
       */
      async addScenario(scenario) {
        scenario = SimulationModelModdle.getInstance().create(
          "simulationmodel:Scenario",
          scenario
        );
        scenario.parentProject = this;
        await scenario.save();
      }

      setCurrentScenario(scenario) {
        if (!this.getAllScenarios().includes(scenario)) {
          throw "Setting current scenario to unknown scenario";
        }
        this.setCurrentScenarioByIndex(this.getAllScenarios().indexOf(scenario));
      }

      setCurrentScenarioByName(scenarioName) {
        const scenarioToSet = this.getAllScenarios().find(
          (scenario) => scenario.scenarioName === scenarioName
        );

        console.log(this.getAllScenarios().map((scenario) => scenario.scenarioName));
        console.log(scenarioToSet);

        if (!scenarioToSet) {
          throw "Setting current scenario to unknown scenario";
        }
        this.setCurrentScenario(scenarioToSet);
      }

      /**
       * renameScenario
       * --------------
       * Renames a scenario by deleting the old one and adding it again with a new name.
       * This approach implies scenarioName is used as a key in storage.
       */
      async renameScenario(scenario, newName) {
        scenario.delete();
        scenario.scenarioName = newName;
        await this.addScenario(scenario);
      }

      /**
       * saveCurrentScenario
       * -------------------
       * Persists in-place modifications made to the currently selected scenario.
       */
      async saveCurrentScenario() {
        await this.getCurrentScenario().save();
      }
    }

    ProjectDataClass = ProjectData;

    /**
     * Mark dataLoaded once both data and projectData exist.
     */
    useEffect(() => {
      if (data && projectData) {
        setDataLoaded(true);
      }
    }, [data]);
  }

  /**
   * getData
   * -------
   * Helper used throughout the app to access the project data API.
   */
  function getData() {
    return projectData;
  }

  /**
   * Chakra toast instance for feedback messages.
   */
  const toast = useToast();

  /**
   * toasting
   * --------
   * Unified toast helper for success/warning/error messages.
   */
  const toasting = (type, title, text) => {
    toast({
      title: title,
      description: text,
      status: type,
      duration: 4000,
      isClosable: true,
    });
  };

  /**
   * projectData is instantiated from ProjectDataClass and the currently selected projectName.
   * It is also assigned to window for debugging in the browser console.
   */
  const oldProjectName = projectData?.projectName;
  let projectData = new ProjectDataClass(projectName);
  window.projectData = projectData;

  /**
   * When the projectName changes, load or reset project data.
   * - If projectName is empty: reset projectData reference
   * - If projectName changes: initializeData reads scenarios and parses models
   */
  useEffect(() => {
    if (projectName) {
      if (oldProjectName === projectName) {
        console.log("data set from existing");
      } else {
        projectData.initializeData().then(() => {
          console.log("data set");
        });
      }
    } else {
      projectData = undefined;
      console.log("reset project data");
    }
  }, [projectName]);

  /**
   * invalidProjectName indicates whether a project name conflicts with an existing project.
   * The current saveProject stub is not implemented yet.
   */
  const [invalidProjectName, setInvaild] = useState(false);

  function saveProject() {
    throw "Not implemented";
  }

  /**
   * SideBarContentSetterButton
   * --------------------------
   * Small helper component that changes what the right sidebar is editing:
   * - A role editor
   * - A resource editor
   *
   * It sets:
   * - currentRole or currentResource
   * - current page label (used by navigation highlighting)
   */
  function SideBarContentSetterButton({ type, id, ...props }) {
    const sideBarContentTypes = {
      role: {
        setter: setRole,
        getter: () => currentRole,
        current: "Resource Parameters for Roles",
      },
      resource: {
        setter: setResource,
        getter: () => currentResource,
        current: "Resource Parameters",
      },
    };

    function setSideBarContent(type, id) {
      Object.values(sideBarContentTypes).forEach((sideBarContentType) =>
        sideBarContentType.setter(undefined)
      );

      sideBarContentTypes[type].setter(id);
      setCurrent(sideBarContentTypes[type].current);
    }

    function getSideBarContentId() {
      const contentTypeKey = Object.keys(sideBarContentTypes).find(
        (key) => sideBarContentTypes[key].current === current
      );
      return sideBarContentTypes[contentTypeKey]?.getter();
    }

    return (
      <Button
        {...(getSideBarContentId() === id && {
          background: "#96c8f1ff!important",
        })}
        onClick={() => setSideBarContent(type, id)}
        {...props}
      >
        {id}
      </Button>
    );
  }

  /**
   * Guard conditions:
   * - atLeastOneScenario ensures a scenario exists before rendering scenario-dependent pages
   * - atLeastOneModel ensures a BPMN model exists before rendering model-based views
   */
  const atLeastOneScenario = dataLoaded && getData().getCurrentScenario();
  const atLeastOneModel =
    dataLoaded && atLeastOneScenario && getData().getCurrentModel();

  return (
    <ChakraProvider theme={theme}>
      <HelpBubble />

      <Flex
        bg="#EAF4FF"
        h="100%"
        zIndex={-3}
        minH="100vh"
        overflowX="hidden"
        pl={{ base: "72px", md: "var(--sb-width, 80px)" }}
      >
        {!projectName ? (
          <StartView {...{ selectProject }} />
        ) : (
          <>
            {dataLoaded ? (
              <>
                <Box zIndex={2} paddingTop={{ base: "0", md: "6" }}>
                  <Navigation
                    {...{ setCurrent, current, getData, selectProject }}
                    collapsed={sidebarsCollapsed}
                    onToggle={toggleSidebars}
                  />
                </Box>

                <Container
                  maxWidth="100%"
                  padding={{ base: "0", md: "5" }}
                  overflowX="scroll"
                >
                  <Routes>
                    <Route
                      path="/overview"
                      element={
                        <OverviewPage
                          path="/overview"
                          {...{ getData, toast, setScenariosCompare }}
                        />
                      }
                    />

                    <Route
                      path="/overview/compare"
                      element={
                        atLeastOneScenario && (
                          <ComparePage
                            path="/overview"
                            {...{
                              getData,
                              scenariosCompare,
                              setNotSameScenario,
                              resourceCompared,
                              setResourceCompared,
                            }}
                          />
                        )
                      }
                    />

                    <Route
                      path="/overview/compare/differences"
                      element={
                        atLeastOneScenario && (
                          <OnlyDifferencesPage
                            path="/overview"
                            {...{
                              scenariosCompare,
                              getData,
                              notSameScenario,
                              resourceCompared,
                            }}
                          />
                        )
                      }
                    />

                    <Route
                      path="/resource"
                      element={
                        atLeastOneScenario && (
                          <ResourceOverview
                            path="/resource"
                            getData={getData}
                            setCurrent={setCurrent}
                            SideBarContentSetterButton={SideBarContentSetterButton}
                          />
                        )
                      }
                    />

                    <Route
                      path="/resource/overview"
                      element={
                        atLeastOneScenario && (
                          <ResourceOverview
                            path="/resource"
                            getData={getData}
                            setCurrent={setCurrent}
                            SideBarContentSetterButton={SideBarContentSetterButton}
                          />
                        )
                      }
                    />

                    <Route
                      path="/resource/timetable"
                      element={
                        atLeastOneScenario && (
                          <TimetableOverview
                            path="/resource"
                            {...{
                              getData,
                              setCurrentRightSideBar,
                              sidebarsCollapsed,
                              toggleSidebars,
                            }}
                          />
                        )
                      }
                    />

                    <Route
                      path="/scenario"
                      element={
                        atLeastOneScenario && (
                          <ScenarioPage
                            {...{
                              getData,
                              setCurrentRightSideBar,
                              sidebarsCollapsed,
                              toggleSidebars,
                            }}
                          />
                        )
                      }
                    />

                    <Route
                      path="/modelbased"
                      element={
                        atLeastOneModel && (
                          <BpmnView
                            {...{
                              getData,
                              setCurrentRightSideBar,
                              sidebarsCollapsed,
                              toggleSidebars,
                            }}
                          />
                        )
                      }
                    />

                    <Route
                      path="/modelbased/tableview"
                      element={
                        atLeastOneModel && (
                          <ModelbasedParametersTable
                            getData={getData}
                            current={current}
                            setCurrent={setCurrent}
                            setObject={setObject}
                          />
                        )
                      }
                    />

                    <Route
                      path="/simulation"
                      element={
                        <SimulationPage path="/simulation" {...{ projectName, getData, toasting }} />
                      }
                    />

                    <Route
                      path="/sensitivity"
                      element={
                        <SensitivityAnalysisPage
                          path="/sensitivity"
                          {...{ projectName, getData, toasting }}
                        />
                      }
                    />

                    <Route
                      path="/quality"
                      element={
                        <QualityInformedPage
                          path="/quality"
                          {...{ projectName, getData, toasting }}
                        />
                      }
                    />
                    <Route
                      path="/processminer"
                      element={
                        <ProcessMinerPage
                          path="/processminer"
                          {...{ projectName, getData, toasting }}
                        />
                      }
                    />

                    <Route
                      path="/debug"
                      element={<DebugPage path="/debug" {...{ projectName, getData, toasting }} />}
                    />

                    <Route path="*" element={<Navigate to="/overview" />} />
                  </Routes>
                </Container>

                <Box zIndex={2} paddingTop={{ base: "0", md: "6" }}>
                  <Routes>
                    <Route
                      path="/resource"
                      element={
                        <EditorSidebar
                          setCurrent={setCurrent}
                          getData={getData}
                          current={current}
                          currentResource={currentResource}
                          setResource={setResource}
                          selectedObject={currentObject}
                          currentRole={currentRole}
                          setRole={setRole}
                          collapsed={sidebarsCollapsed}
                          onToggle={toggleSidebars}
                        />
                      }
                    />

                    <Route
                      path="/resource/overview"
                      element={
                        <EditorSidebar
                          setCurrent={setCurrent}
                          getData={getData}
                          current={current}
                          currentResource={currentResource}
                          setResource={setResource}
                          selectedObject={currentObject}
                          currentRole={currentRole}
                          setRole={setRole}
                          collapsed={sidebarsCollapsed}
                          onToggle={toggleSidebars}
                        />
                      }
                    />

                    <Route path="*" element={currentRightSideBar} />
                  </Routes>
                </Box>
              </>
            ) : (
              <ProgressPage />
            )}
          </>
        )}
      </Flex>
    </ChakraProvider>
  );
}

export default App;

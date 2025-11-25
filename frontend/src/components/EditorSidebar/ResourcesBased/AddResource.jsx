// import React, { useState } from 'react';
// import {
//   Input,
//   FormControl,
//   FormLabel,
//   Select,
//   Switch,
//   Stack,
//   Box,
//   Divider,
//   CheckboxGroup,
//   Checkbox,
// } from '@chakra-ui/react';
// import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';
// import { FiArrowLeft, FiPlus } from 'react-icons/fi';
// import EditorSidebarButton from '../EditorSidebarButton';

// // TODO delete this class and integrate into EditResource
// const AddResource = ({ getData, setCurrent, collapsed = false }) => {
//   const [state, setState] = useState({
//     id: '',
//     costHour: '',
//     selectedRoles: [],
//   });

//   const handleInputChange = resource => {
//     const target = resource.target;
//     const value = target.value;
//     const name = target.name;

//     setState({
//       ...state,
//       [name]: value,
//     });
//   };

//   const handleRolesChange = event => {
//     let value = event.pop();

//     if (state.selectedRoles.includes(value)) {
//       setState({
//         ...state,
//         selectedRoles: [...state.selectedRoles.filter(item => item === value)],
//       });
//     } else {
//       setState({
//         ...state,
//         selectedRoles: [...state.selectedRoles, value],
//       });
//     }
//   };

//   const clear = () => {
//     setState({
//       id: '',
//       costHour: '',
//       selectedRoles: [],
//     });
//   };

//   const onSubmit = event => {
//     event.preventDefault();

//     let obj = SimulationModelModdle.getInstance().create(
//       'simulationmodel:Resource',
//       {
//         id: state.id,
//         costHour: state.costHour || null,
//       }
//     );

//     getData().getCurrentScenario().resourceParameters.resources.push(obj);

//     state.selectedRoles
//       .filter(x => x !== undefined)
//       .forEach(item => {
//         getData()
//           .getCurrentScenario()
//           .resourceParameters.roles.find(x => x.id === item)
//           .resources.push({ id: state.id });
//       });

//     getData().saveCurrentScenario();

//     clear();
//   };

//   return (
//     <>
//       <Box w="100%">
//         <Box mt={3} mb={6}>
//           <EditorSidebarButton
//             onClick={() => setCurrent('Resource Parameters')}
//             icon={FiArrowLeft}
//             variant="outline"
//             collapsed={collapsed}
//           >
//             Back
//           </EditorSidebarButton>
//         </Box>

//         <Divider />

//         <form onSubmit={onSubmit}>
//           <Stack gap="2" mt="4">
//             <FormControl>
//               <FormLabel>Name:</FormLabel>
//               <Input
//                 value={state.id}
//                 bg="white"
//                 name="id"
//                 onChange={event => handleInputChange(event)}
//               />
//             </FormControl>

//             <FormControl>
//               <FormLabel>Cost per hour:</FormLabel>
//               <Input
//                 value={state.costHour}
//                 bg="white"
//                 name="costHour"
//                 onChange={event => handleInputChange(event)}
//               />
//             </FormControl>

//             <FormControl>
//               <FormLabel>Select roles:</FormLabel>
//               <CheckboxGroup
//                 colorScheme="green"
//                 value={state.selectedRoles}
//                 name="selectedRoles"
//                 onChange={event => handleRolesChange(event)}
//               >
//                 <Stack spacing={[1, 5]} direction="column">
//                   {getData()
//                     .getCurrentScenario()
//                     .resourceParameters.roles.map(item => {
//                       return (
//                         <Checkbox key={item.id} value={item.id}>
//                           {item.id}
//                         </Checkbox>
//                       );
//                     })}
//                 </Stack>
//               </CheckboxGroup>
//             </FormControl>

//             <EditorSidebarButton
//               type="submit"
//               icon={FiPlus}
//               variant="primary"
//               collapsed={collapsed}
//               mt={3}
//             >
//               Add resource
//             </EditorSidebarButton>
//           </Stack>
//         </form>
//       </Box>
//     </>
//   );
// };

// export default AddResource;

import React, { useState } from 'react';
import {
  Input,
  FormControl,
  FormLabel,
  Stack,
  Box,
  Divider,
  CheckboxGroup,
  Checkbox,
  Heading,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from '@chakra-ui/react';
import SimulationModelModdle from 'simulation-bridge-datamodel/DataModel';
import {
  FiArrowLeft,
  FiPlus,
  FiUser,
  FiDollarSign,
  FiUsers,
} from 'react-icons/fi';
import EditorSidebarButton from '../EditorSidebarButton';

const AddResource = ({ getData, setCurrent, collapsed = false }) => {
  const [state, setState] = useState({
    id: '',
    costHour: '',
    selectedRoles: [],
  });

  const handleInputChange = event => {
    const { name, value } = event.target;
    setState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRolesChange = values => {
    setState(prev => ({
      ...prev,
      selectedRoles: values,
    }));
  };

  const clear = () => {
    setState({
      id: '',
      costHour: '',
      selectedRoles: [],
    });
  };

  const onSubmit = event => {
    event.preventDefault();

    const obj = SimulationModelModdle.getInstance().create(
      'simulationmodel:Resource',
      {
        id: state.id,
        costHour: state.costHour || null,
      }
    );

    const scenario = getData().getCurrentScenario();
    scenario.resourceParameters.resources.push(obj);

    state.selectedRoles
      .filter(x => x !== undefined)
      .forEach(roleId => {
        scenario.resourceParameters.roles
          .find(x => x.id === roleId)
          .resources.push({ id: state.id });
      });

    getData().saveCurrentScenario();
    clear();
  };

  const formFields = (compact = false) => (
    <Stack gap="2" mt={compact ? 0 : 4}>
      <FormControl>
        {!compact && <FormLabel>Name:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Name" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiUser} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Input
            value={state.id}
            bg="white"
            name="id"
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Cost per hour:</FormLabel>}
        <InputGroup>
          {compact && (
            <Tooltip label="Cost per hour" placement="top">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiDollarSign} />
              </InputLeftElement>
            </Tooltip>
          )}
          <Input
            value={state.costHour}
            bg="white"
            name="costHour"
            size={compact ? 'sm' : 'md'}
            pl={compact ? 9 : 4}
            onChange={handleInputChange}
          />
        </InputGroup>
      </FormControl>

      <FormControl>
        {!compact && <FormLabel>Select roles:</FormLabel>}
        {compact && (
          <Box display="flex" alignItems="center" mb={1} gap={1}>
            <Icon as={FiUsers} />
            <Heading size="xs" color="gray.600">
              Roles
            </Heading>
          </Box>
        )}

        <CheckboxGroup
          colorScheme="green"
          value={state.selectedRoles}
          name="selectedRoles"
          onChange={handleRolesChange}
        >
          <Stack spacing={[1, 2]} direction="column">
            {getData()
              .getCurrentScenario()
              .resourceParameters.roles.map(item => (
                <Checkbox
                  key={item.id}
                  value={item.id}
                  size={compact ? 'sm' : 'md'}
                >
                  {item.id}
                </Checkbox>
              ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>

      <EditorSidebarButton
        type="submit"
        icon={FiPlus}
        variant="primary"
        collapsed={compact} // icon-only in compact popover
        mt={3}
      >
        Add resource
      </EditorSidebarButton>
    </Stack>
  );

  if (!collapsed) {
    return (
      <Box w="100%">
        <Box mt={3} mb={6}>
          <EditorSidebarButton
            onClick={() => setCurrent('Resource Parameters')}
            icon={FiArrowLeft}
            variant="outline"
          >
            Back
          </EditorSidebarButton>
        </Box>

        <Divider />

        <form onSubmit={onSubmit}>{formFields(false)}</form>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Popover placement="right-start" closeOnBlur={true}>
        <PopoverTrigger>
          <Box mt={3}>
            <EditorSidebarButton
              onClick={() => {}}
              icon={FiPlus}
              variant="primary"
              collapsed={true}
            >
              Add resource
            </EditorSidebarButton>
          </Box>
        </PopoverTrigger>

        <PopoverContent ml={2} maxW="320px" _focus={{ boxShadow: 'lg' }}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            <Heading size="sm">Add Resource</Heading>
          </PopoverHeader>
          <PopoverBody>
            <form onSubmit={onSubmit}>{formFields(true)}</form>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

export default AddResource;

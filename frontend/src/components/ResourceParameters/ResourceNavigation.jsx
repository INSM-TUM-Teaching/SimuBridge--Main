import React from 'react'
import { Breadcrumb, BreadcrumbLink, BreadcrumbItem } from '@chakra-ui/react'
import { NavLink } from "react-router-dom";


function ResourceNavigation({currentTab}){
    // Rendering a Breadcrumb component with two BreadcrumbItems using the currentTab prop to apply a highlighting based on the active tab
return(
    <Breadcrumb separator=''>
    <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink as={NavLink} to='/resource/overview' style={({ }) => currentTab === "overview" ? { color: "rgba(19, 19, 101, 1)", borderBottom: "solid 2px rgba(19, 19, 101, 1)"} : {} }>Resource overview</BreadcrumbLink>
    </BreadcrumbItem>

    <BreadcrumbItem>
        <BreadcrumbLink as={NavLink} to='/resource/timetable' style={({ }) =>  currentTab === "timetable" ? { color: "rgba(19, 19, 101, 1)", borderBottom: "solid 2px rgba(19, 19, 101, 1)"} : {} }>Timetable overview</BreadcrumbLink>
    </BreadcrumbItem>
    </Breadcrumb>
)
}

export default ResourceNavigation;
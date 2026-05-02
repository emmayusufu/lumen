"use client";

import Box from "@mui/material/Box";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { SectionHeading } from "../_components/SectionHeading";
import { PeopleList } from "./_components/PeopleList";

export default function PeoplePage() {
  return (
    <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
      <SectionHeading
        Icon={GroupsOutlinedIcon}
        title="People"
        description="Everyone you&rsquo;ve invited to docs you own. Expand a person to see the specific docs they can access and at which role."
      />
      <PeopleList />
    </Box>
  );
}

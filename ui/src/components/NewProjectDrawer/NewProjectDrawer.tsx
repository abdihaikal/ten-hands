import { Drawer } from "@blueprintjs/core";
import React from "react";
import styled from "styled-components";
import { useTheme } from "../shared/stores/ThemeStore";
import NewProjectForm from "./NewProjectForm";
import { useSelector } from "react-redux";
import { RootState } from "../../state/reducers";
import { useStateSelector } from "../shared/hooks";

const DrawerContainer = styled.div`
  height: 100%;
  padding: 2.5em;
`;

interface INewDrawerProps {
  isDrawerOpen: boolean;
  setDrawerOpen: (isOpen: boolean) => any;
}

const NewProjectDrawer: React.FC<INewDrawerProps> = React.memo(
  ({ isDrawerOpen, setDrawerOpen }) => {
    const theme = useStateSelector(state => state.theme);

    return (
      <Drawer
        className={theme as string}
        isOpen={isDrawerOpen}
        title="Add Project"
        onClose={() => setDrawerOpen(false)}
      >
        <DrawerContainer>
          <NewProjectForm setDrawerOpen={setDrawerOpen} />
        </DrawerContainer>
      </Drawer>
    );
  }
);

export default NewProjectDrawer;

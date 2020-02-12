import { Card, Elevation } from "@blueprintjs/core";
import React from "react";
import styled from "styled-components";
import Command from "../Command/Command";
import { useTheme } from "../shared/stores/ThemeStore";
import { useSelector } from "react-redux";
import { RootState } from "../../state/reducers";

interface ICommandsAreaProps {
  activeProject: IProject;
}

const Container = styled.div`
  height: calc(100% - 50px);
  overflow: auto;
`;

const EmptyContainer = styled(Container)`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2em;
  & > span {
    padding: 10px;
    border-bottom: 1px solid #0a6640;
  }
`;

const CommandsArea: React.SFC<ICommandsAreaProps> = React.memo(
  ({ activeProject }) => {
    const commands: IProjectCommand[] = activeProject.commands;
    const theme = useSelector<RootState>(state => state.theme);

    if (commands.length === 0) {
      return (
        <EmptyContainer
          theme={theme}
          className="main-container"
          data-testid="no-tasks-message"
        >
          Add a task using <span>New Task</span> button
        </EmptyContainer>
      );
    }
    return (
      <Container>
        {commands.map((command, index) => {
          return (
            // Use id for card to use to scroll when clicked on task in sidebar
            <Card
              id={`task-card-${command._id}`}
              key={command._id}
              elevation={Elevation.ONE}
              style={{ margin: 20, padding: 15 }}
            >
              <Command
                index={index}
                projectPath={activeProject.path}
                command={command}
              />
            </Card>
          );
        })}
      </Container>
    );
  }
);

export default CommandsArea;

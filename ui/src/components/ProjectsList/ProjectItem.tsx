import React from "react";
import { Item } from "./styles";
import { DraggableProvided } from "react-beautiful-dnd";
import { useTheme } from "../shared/stores/ThemeStore";
import { useProjects } from "../shared/stores/ProjectStore";
import ProjectRunningTasksTag from "./ProjectRunningTasksTag";
import { Classes, Icon, Collapse } from "@blueprintjs/core";
import ProjectTaskItem from "./ProjectTaskItem";
import { useSelector } from "react-redux";
import { RootState } from "../../state/reducers";
import { useStateSelector } from "../shared/hooks";

interface IProjectItemProps {
  project: IProject;
  draggableProvided: DraggableProvided;
  changeActiveProject: (projectId: string, index: number) => any;
  itemIndex: number;
  projectRunningTaskCount: number;
  projectTaskListOpenMap: { [key: string]: boolean };
  updateProjectTaskListOpen: (projectId: string, shouldOpen: boolean) => void;
}

const ProjectItem: React.FC<IProjectItemProps> = ({
  project,
  draggableProvided,
  changeActiveProject,
  itemIndex,
  projectRunningTaskCount,
  projectTaskListOpenMap,
  updateProjectTaskListOpen
}) => {
  const theme = useStateSelector(state => state.theme);
  const { activeProject } = useProjects();
  const [showDragHandle, setShowDragHandle] = React.useState<boolean>(false);
  const isThisActiveProject = activeProject._id === project._id;

  const isTaskListOpen = !projectTaskListOpenMap[project._id!];

  const handleMouseOver = () => {
    setShowDragHandle(true);
  };

  const handleMouseOut = () => {
    setShowDragHandle(false);
  };

  const handleItemClick = () => {
    // If task list is not open, open it
    updateProjectTaskListOpen(
      project._id!,
      !projectTaskListOpenMap[project._id!]
    );

    changeActiveProject(project._id!, itemIndex);
  };

  return (
    <React.Fragment>
      <Item
        onMouseEnter={handleMouseOver}
        onMouseLeave={handleMouseOut}
        ref={draggableProvided.innerRef}
        {...draggableProvided.draggableProps}
        {...draggableProvided.dragHandleProps}
        onClick={handleItemClick}
        theme={theme}
        style={{
          ...draggableProvided.draggableProps.style,
          color: isThisActiveProject
            ? theme === Classes.DARK
              ? "#48aff0"
              : "#106ba3"
            : "inherit",
          background: isThisActiveProject
            ? "rgba(19, 124, 189, 0.2)"
            : "inherit"
        }}
        title={project.path}
      >
        <Icon
          icon={isTaskListOpen ? "chevron-down" : "chevron-right"}
          style={{ paddingRight: 10 }}
        />
        <span data-testid="project-name" className="truncate">
          {project.name}
        </span>
        {showDragHandle ? (
          <div className="drag-handle-container" style={{ marginLeft: "auto" }}>
            <Icon icon="drag-handle-horizontal" />
          </div>
        ) : (
          <div className="running-tasks-count" style={{ marginLeft: "auto" }}>
            <ProjectRunningTasksTag count={projectRunningTaskCount} />
          </div>
        )}
      </Item>
      <div className="w-100">
        <Collapse isOpen={isTaskListOpen} keepChildrenMounted={true}>
          <div style={{ paddingLeft: 20 }}>
            {project.commands.map(command => (
              <ProjectTaskItem
                key={command._id}
                command={command}
                project={project}
                changeActiveProject={() =>
                  changeActiveProject(project._id!, itemIndex)
                }
              />
            ))}
          </div>
        </Collapse>
      </div>
    </React.Fragment>
  );
};

export default ProjectItem;

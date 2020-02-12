import React from "react";
import {
  deleteProjectInDb,
  deleteTaskInDb,
  getProjects,
  renameProjectInDb,
  reorderTasksInDb,
  saveProjectInDb,
  saveTaskInDb
} from "../API";
import { useMountedState, useStateSelector } from "../hooks";
import { useJobs } from "./JobStore";
import JobTerminalManager from "../JobTerminalManager";
import { useSockets } from "./SocketStore";
import { projectsActions } from "../../../state/reducers/projects.reducer";
import { useDispatch } from "react-redux";

interface IProjectContextValue {
  projectsRunningTaskCount: { [key: string]: number };
  totalRunningTaskCount: number;
  projects: IProject[];
  activeProject: IProject;
  setActiveProject: (activeProject: IProject) => void;
  setProjects: any;
  updateProjects: () => void;
  addTask: (projectId: string, task: IProjectCommand) => any;
  deleteTask: (projectId: string, taskId: string) => any;
  addProject: (data: any) => any;
  deleteProject: (projectId: string) => any;
  reorderTasks: (projectId: string, newTasks: IProjectCommand[]) => any;
  loadingProjects: boolean;
  renameProject: (projectId: string, newName: string) => any;
  runAllStoppedTasks: () => void;
  stopAllRunningTasks: () => void;
}

interface IProjectsProviderProps {
  value?: IProjectContextValue;
  children: React.ReactNode;
}

function getJobData(state, room: string) {
  return state[room] || "";
}

const getRunningTasksCountForProjects = (
  projects: IProject[],
  runningTasks: any
): { runningTasksPerProject: object; totalRunningTaskCount: number } => {
  const runningTasksPerProject = {};
  let totalRunningTaskCount = 0;
  projects.forEach((project: IProject) => {
    const { commands, _id } = project;
    let runningCount: number = 0;
    commands.forEach((command: IProjectCommand) => {
      const { _id } = command;
      if (runningTasks[_id]) {
        runningCount++;
        totalRunningTaskCount++;
      }
    });
    runningTasksPerProject[_id!] = runningCount;
  });

  return { runningTasksPerProject, totalRunningTaskCount };
};

export const ProjectContext = React.createContext<
  IProjectContextValue | undefined
>(undefined);

function ProjectsProvider(props: IProjectsProviderProps) {
  const initialProject: IProject = {
    _id: "",
    name: "",
    type: "",
    path: "",
    commands: []
  };

  const isMounted = useMountedState();
  const {
    runningTasks,
    state: jobState,
    dispatch: jobsDispatch,
    ACTION_TYPES,
    isTaskRunning
  } = useJobs();
  const terminalManager = JobTerminalManager.getInstance();
  const { subscribeToTaskSocket, unsubscribeFromTaskSocket } = useSockets();
  const dispatch = useDispatch();
  const config: IConfig = useStateSelector(state => state.config);
  const projectStore = useStateSelector(state => state.projects);

  const activeProject = projectStore.activeProject;
  const setActiveProject = newActiveProject =>
    dispatch(projectsActions.setActiveProject(newActiveProject));

  const projects = projectStore.projects;
  const setProjects = newProjects =>
    dispatch(projectsActions.setProjects(newProjects));

  const loadingProjects = projectStore.loadingProjects;
  const setLoadingProjects = newLoadingProjects =>
    dispatch(projectsActions.setLoadingProjects(newLoadingProjects));

  const projectsRunningTaskCount = projectStore.projectsRunningTaskCount;
  const setProjectsRunningTaskCount = newProjectsRunningTaskCount =>
    dispatch(
      projectsActions.setProjectsRunningTaskCount(newProjectsRunningTaskCount)
    );

  const clearJobOutput = room => {
    jobsDispatch({
      type: ACTION_TYPES.CLEAR_OUTPUT,
      room
    });
    terminalManager.clearTerminalInRoom(room);
  };

  const updateJobProcess = React.useCallback(
    (room, jobProcess) => {
      jobsDispatch({
        room,
        type: ACTION_TYPES.UPDATE_JOB_PROCESS,
        process: jobProcess
      });
    },
    [jobsDispatch, ACTION_TYPES]
  );

  const startJob = (command: IProjectCommand) => {
    const room = command._id;
    clearJobOutput(room);
    subscribeToTaskSocket(room, command, activeProject.path);
  };

  const stopJob = React.useCallback(
    (command: IProjectCommand) => {
      const room = command._id;
      const process = getJobData(jobState, room).process;
      const { pid } = process;
      unsubscribeFromTaskSocket(room, pid);
      updateJobProcess(room, {
        pid: -1
      });
    },
    [jobState, updateJobProcess, unsubscribeFromTaskSocket]
  );

  const startTask = (command: IProjectCommand) => {
    try {
      startJob(command);
    } catch (error) {
      console.log(`startTask error: `, error);
    }
  };

  const stopTask = React.useCallback(
    (command: IProjectCommand) => {
      try {
        stopJob(command);
      } catch (error) {
        console.log(`stopTask error: `, error);
      }
    },
    [stopJob]
  );
  const [totalRunningTaskCount, setTotalRunningTaskCount] = React.useState<
    number
  >(0);

  React.useEffect(() => {
    if (!projects) {
      return;
    }

    const {
      runningTasksPerProject,
      totalRunningTaskCount
    } = getRunningTasksCountForProjects(projects, runningTasks);
    console.log("Running tasks changing");

    setProjectsRunningTaskCount(runningTasksPerProject);
    setTotalRunningTaskCount(totalRunningTaskCount);
  }, [runningTasks, projects]);

  const updateProjects = React.useCallback(() => {
    const reloadProjects = async () => {
      try {
        setLoadingProjects(true);
        const receivedProjects: IProject[] = await getProjects(config);
        if (receivedProjects.length > 0) {
          setProjects(receivedProjects);
          if (activeProject._id === "") {
            setActiveProject(receivedProjects[0]);
          } else {
            // Commands order might be changed.
            const newActiveProject = receivedProjects.find(
              project => project._id === activeProject._id
            );

            // If the project was deleted
            if (newActiveProject) {
              setActiveProject(newActiveProject);
            } else {
              setActiveProject(receivedProjects[0]);
            }
          }
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted()) {
          setLoadingProjects(false);
        }
      }
    };
    reloadProjects();
  }, [activeProject, config, setActiveProject, isMounted]);

  const deleteTask = React.useCallback(
    (projectId, taskId) => {
      const deleteTaskFn = async () => {
        await deleteTaskInDb(config, projectId, taskId);
        const currentProjectIndex = projects.findIndex(
          x => x._id === projectId
        );
        const projectWithThisTask = projects[currentProjectIndex];

        if (projectWithThisTask) {
          const currentTasks = [...projectWithThisTask.commands];
          const updatedTasks = currentTasks.filter(
            (x: IProjectCommand) => x._id !== taskId
          );
          const updatedProject: IProject = {
            ...projectWithThisTask,
            commands: updatedTasks
          };
          const _projects = [...projects];
          _projects.splice(currentProjectIndex, 1, updatedProject);
          setProjects(_projects);
          setActiveProject(updatedProject);
        }
      };
      deleteTaskFn();
    },
    [projects, config]
  );

  const renameProject = React.useCallback(
    (projectId: string, newName: string) => {
      const renameProjectFn = async () => {
        await renameProjectInDb(config, projectId, newName);
        const currentProjectIndex = projects.findIndex(
          x => x._id === projectId
        );
        const renamingProject = projects[currentProjectIndex];

        if (renamingProject) {
          const updatedProject: IProject = {
            ...renamingProject,
            name: newName
          };
          const _projects = [...projects];
          _projects.splice(currentProjectIndex, 1, updatedProject);
          if (isMounted()) {
            setProjects(_projects);
            setActiveProject(updatedProject);
          }
        }
      };

      renameProjectFn();
    },
    [projects, config, isMounted]
  );

  const reorderTasks = React.useCallback(
    (projectId: string, commands: IProjectCommand[]) => {
      const reorderTasksFn = async () => {
        await reorderTasksInDb(config, projectId, commands);
        const currentProjectIndex = projects.findIndex(
          x => x._id === projectId
        );
        const projectWithThisTask = projects[currentProjectIndex];

        if (projectWithThisTask) {
          const updatedProject: IProject = {
            ...projectWithThisTask,
            commands
          };
          const _projects = [...projects];
          _projects.splice(currentProjectIndex, 1, updatedProject);
          setProjects(_projects);
          setActiveProject(updatedProject);
        }
      };
      reorderTasksFn();
    },
    [projects, config]
  );

  const addTask = React.useCallback(
    (projectId: string, task: IProjectCommand) => {
      const addTaskInFn = async (projectId, task) => {
        try {
          await saveTaskInDb(config, projectId, task);
          const currentProjectIndex = projects.findIndex(
            x => x._id === projectId
          );
          const projectWithThisTask = projects[currentProjectIndex];
          if (projectWithThisTask) {
            const updatedTasks = [task, ...projectWithThisTask.commands];
            const updatedProject: IProject = {
              ...projectWithThisTask,
              commands: updatedTasks
            };
            const _projects = [...projects];
            _projects.splice(currentProjectIndex, 1, updatedProject);
            setProjects(_projects);
            setActiveProject(updatedProject);
          }
        } catch (error) {
          console.log("error:", error);
        }
      };
      addTaskInFn(projectId, task);
    },
    [projects, config]
  );

  /* eslint-disable react-hooks/exhaustive-deps */
  const addProject = React.useCallback(
    (projectData: any) => {
      const addProjectFn = async () => {
        const newProject = await saveProjectInDb(config, projectData);
        if (!newProject) {
          throw new Error(
            "Failed to add project. Something wrong with server."
          );
        }

        const copyOfProjects = projects.slice();
        const updatedProjects = [...copyOfProjects, newProject];
        setProjects(updatedProjects);
        setActiveProject(newProject);
      };
      addProjectFn();
    },
    [projects]
  );

  const deleteProject = React.useCallback(
    (projectId: string) => {
      const deleteProjectFn = async () => {
        if (!projectId) {
          throw new Error("ProjectID not passed to deleteProject");
        }
        await deleteProjectInDb(config, projectId);
        const newProjects = projects.filter(
          (x: IProject) => x._id !== projectId
        );
        setProjects(newProjects);
        if (newProjects && newProjects.length > 0) {
          setActiveProject(newProjects[0]);
        } else {
          setActiveProject(initialProject);
        }
      };

      deleteProjectFn();
    },
    [projects, config, initialProject]
  );

  const runAllStoppedTasks = () => {
    const commandsInProject = activeProject.commands;
    commandsInProject.forEach(command => {
      if (!isTaskRunning(command._id)) {
        startTask(command);
      }
    });
  };

  const stopAllRunningTasks = React.useCallback(() => {
    const commandsInProject = activeProject.commands;
    commandsInProject.forEach(command => {
      if (isTaskRunning(command._id)) {
        stopTask(command);
      }
    });
  }, [activeProject, stopTask, isTaskRunning]);

  /* eslint-disable */
  React.useEffect(() => {
    async function updateNewProjects() {
      await updateProjects();
    }
    updateNewProjects();
  }, []);

  const value = React.useMemo(() => {
    return {
      projects,
      projectsRunningTaskCount,
      activeProject,
      setActiveProject,
      setProjects,
      updateProjects,
      loadingProjects,
      addTask,
      deleteTask,
      addProject,
      deleteProject,
      reorderTasks,
      renameProject,
      runAllStoppedTasks,
      stopAllRunningTasks,
      totalRunningTaskCount
    };
  }, [
    projects,
    projectsRunningTaskCount,
    activeProject,
    setActiveProject,
    setProjects,
    updateProjects,
    loadingProjects,
    addTask,
    deleteTask,
    addProject,
    deleteProject,
    reorderTasks,
    renameProject,
    runAllStoppedTasks,
    stopAllRunningTasks,
    totalRunningTaskCount
  ]);

  return <ProjectContext.Provider value={value} {...props} />;
}

function useProjects() {
  const context = React.useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }

  return context;
}

export { ProjectsProvider, useProjects };

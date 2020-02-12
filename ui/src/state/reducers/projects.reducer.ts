import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type ProjectRunningTaskCount = { [key: string]: number };
export interface ProjectState {
  projects: IProject[];
  activeProject: IProject;
  loadingProjects: boolean;
  projectsRunningTaskCount: ProjectRunningTaskCount;
  totalRunningTaskCount: number;
}

const initialProject: IProject = {
  _id: "",
  name: "",
  type: "",
  path: "",
  commands: []
};

const initialState: ProjectState = {
  projects: [],
  activeProject: initialProject,
  loadingProjects: true,
  projectsRunningTaskCount: {},
  totalRunningTaskCount: 0
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setActiveProject(state: ProjectState, action: PayloadAction<IProject>) {
      state.activeProject = action.payload;
    },
    setLoadingProjects(state: ProjectState, action: PayloadAction<boolean>) {
      state.loadingProjects = action.payload;
    },
    setProjects(state: ProjectState, action: PayloadAction<IProject[]>) {
      state.projects = action.payload;
    },
    updateProjects(state: ProjectState, action: PayloadAction<ProjectState>) {},
    addTask(state: ProjectState, action: PayloadAction<ProjectState>) {},
    deleteTask(state: ProjectState, action: PayloadAction<ProjectState>) {},
    addProject(state: ProjectState, action: PayloadAction<ProjectState>) {},
    deleteProject(state: ProjectState, action: PayloadAction<ProjectState>) {},
    reorderTasks(state: ProjectState, action: PayloadAction<ProjectState>) {},
    renameProject(state: ProjectState, action: PayloadAction<ProjectState>) {},
    setProjectsRunningTaskCount(
      state: ProjectState,
      action: PayloadAction<ProjectRunningTaskCount>
    ) {
      state.projectsRunningTaskCount = action.payload;
    },
    runAllStoppedTasks(
      state: ProjectState,
      action: PayloadAction<ProjectState>
    ) {},
    stopAllRunningTasks(
      state: ProjectState,
      action: PayloadAction<ProjectState>
    ) {}
  }
});

export const projectsActions = projectsSlice.actions;

export const projectsReducer = projectsSlice.reducer;

import { combineReducers } from "redux";
import { projectsReducer } from "./projects.reducer";

export type RootState = ReturnType<typeof rootReducer>;
export const rootReducer = combineReducers({
  projects: projectsReducer
});

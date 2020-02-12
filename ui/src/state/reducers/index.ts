import { combineReducers } from "redux";
import { projectsReducer } from "./projects.reducer";
import { themeReducer } from "./theme.reducer";
import { DefaultRootState } from "react-redux";

export const rootReducer = combineReducers({
  projects: projectsReducer,
  theme: themeReducer
});
export type RootState = ReturnType<typeof rootReducer>;

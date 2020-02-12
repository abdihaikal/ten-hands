import { configReducer } from "./config.reducer";
import { combineReducers } from "redux";
import { projectsReducer } from "./projects.reducer";
import { themeReducer } from "./theme.reducer";

export const rootReducer = combineReducers({
  config: configReducer,
  projects: projectsReducer,
  theme: themeReducer
});

export type RootState = ReturnType<typeof rootReducer>;

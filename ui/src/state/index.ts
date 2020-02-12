import { RootState } from "./reducers/index";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { rootReducer } from "./reducers";
import reduxLogger from "redux-logger";

export const store = configureStore({
  reducer: rootReducer,
  middleware: [...getDefaultMiddleware<RootState>(), reduxLogger] as const
});

export type AppDispatch = typeof store.dispatch;

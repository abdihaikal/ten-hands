import { getItem, setItem } from "../../utils/storage";
import { Classes } from "@blueprintjs/core";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeState = "light" | "dark" | "bp3-dark" | typeof Classes.DARK;

const initialState = getItem("theme") ?? Classes.DARK;

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state: ThemeState, action: PayloadAction<ThemeState>) {
      state = action.payload;
      setItem("theme", action.payload);
      return state;
    }
  }
});

export const { setTheme } = themeSlice.actions;

export const themeReducer = themeSlice.reducer;

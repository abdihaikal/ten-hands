import { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { isRunningInElectron } from "../../utils/electron";
import { getItem, setItem } from "../../utils/storage";

export type ConfigState = IConfig;

function getInitialConfig(): IConfig {
  if (isRunningInElectron()) {
    const { ipcRenderer } = require("electron");
    const serverConfig = ipcRenderer.sendSync(`get-config`);
    console.log("serverConfig:", serverConfig);
    return serverConfig;
  } else {
    const port = window.location.port || getItem("port") || 5010;
    setItem("port", port);
    const browserOnlyConfig: ConfigState = {
      port,
      enableTerminalTheme: Boolean(getItem("enableTerminalTheme")) || true,
      showStatusBar: Boolean(getItem("showStatusBar")) || true
    };
    return browserOnlyConfig;
  }
}

const initialState = getInitialConfig();

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setConfig(state: ConfigState, action: PayloadAction<ConfigState>) {
      state = action.payload;
      return state;
    }
  }
});

export const { setConfig } = configSlice.actions;

export const configReducer = configSlice.reducer;

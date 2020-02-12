import { isRunningInElectron } from "../../utils/electron";
import { getItem, setItem } from "../../utils/storage";

function getInitialConfig() {
  () => {
    try {
      if (isRunningInElectron()) {
        const { ipcRenderer } = require("electron");
        const serverConfig = ipcRenderer.sendSync(`get-config`);
        console.log("serverConfig:", serverConfig);
        if (serverConfig) {
          return serverConfig;
        }
      } else {
        const port = window.location.port || getItem("port") || 5010;
        setItem("port", port);
        const browserOnlyConfig: IConfig = {
          port,
          enableTerminalTheme: Boolean(getItem("enableTerminalTheme")) || true,
          showStatusBar: Boolean(getItem("showStatusBar")) || true
        };
        return browserOnlyConfig;
      }
    } catch (error) {
      console.error(`Error getting config.`);
    }
  };
}

export function configReducer(state = getInitialConfig(), action) {
  return state;
}

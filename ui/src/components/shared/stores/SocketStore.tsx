import chalk from "chalk";
import React from "react";
import io from "socket.io-client";
import { useConfig } from "./ConfigStore";
import { useJobs } from "./JobStore";
import JobTerminalManager from "../JobTerminalManager";
import { useStateSelector } from "../hooks";

// see https://github.com/xtermjs/xterm.js/issues/895#issuecomment-323221447
const options: any = { enabled: true, level: 3 };
const forcedChalk = new chalk.Instance(options);

interface ISocketContextValue {
  isSocketInitialized: boolean;
  initializeSocket: () => void;
  subscribeToTaskSocket: (
    room: string,
    command: IProjectCommand,
    projectPath: string
  ) => void;
  _socket: any;
  unsubscribeFromTaskSocket: (room: string, pid: number) => void;
}

interface ISocketProviderProps {
  value?: ISocketContextValue;
  children: React.ReactNode;
}

export const SocketsContext = React.createContext<
  ISocketContextValue | undefined
>(undefined);

function SocketsProvider(props: ISocketProviderProps) {
  const [isSocketInitialized, setSocketInitialized] = React.useState(false);
  const { dispatch, ACTION_TYPES } = useJobs();
  const config: IConfig = useStateSelector(state => state.config);
  const terminalManager = JobTerminalManager.getInstance();
  const _socket = React.useRef<any>();

  const updateJob = (room, stdout, isRunning) => {
    terminalManager.updateOutputInRoom(room, stdout);
  };

  const updateJobProcess = (room, jobProcess) => {
    dispatch({
      room,
      type: ACTION_TYPES.UPDATE_JOB_PROCESS,
      process: jobProcess
    });
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  const initializeSocket = React.useCallback(() => {
    _socket.current = io(`http://localhost:${config.port}`);

    if (isSocketInitialized) {
      return;
    }

    _socket.current.on(`connect`, () => {
      // console.info("Socket connected to server");
    });

    _socket.current.on(`job_started`, message => {
      const room = message.room;
      console.info(`Process started for cmd: ${room}`);
      updateJobProcess(room, message.data);
      if (message.data.pid) {
        updateJob(
          room,
          `--Process started with PID: ${message.data.pid}--\n\n`,
          true
        );
      }
    });
    _socket.current.on(`job_output`, message => {
      const room = message.room;
      updateJob(room, message.data, true);
    });

    _socket.current.on(`job_error`, message => {
      const room = message.room;
      console.info(`Process error in room: ${room}`);
      updateJob(room, message.data, true);
    });
    _socket.current.on(`job_close`, message => {
      const room = message.room;
      console.info(`Process close in room: ${room}`);
      // Add extra empty line. Otherwise, the terminal clear will retain last line.
      updateJob(room, forcedChalk.bold(message.data + "\n"), false);
      updateJobProcess(room, {
        pid: -1
      });
    });

    _socket.current.on(`job_exit`, message => {
      const room = message.room;

      console.info(`Process exit in room: ${room}`);
      // Add extra empty line. Otherwise, the terminal clear will retain last line.
      updateJob(room, forcedChalk.bold(message.data + "\n"), false);
      updateJobProcess(room, {
        pid: -1
      });
    });

    _socket.current.on(`job_killed`, message => {
      const room = message.room;

      console.info(
        `Process killed in room: ${room}; killed process id: ${message.data}`
      );

      updateJob(
        room,
        forcedChalk.bold.redBright(
          `process with id ${message.data} killed by user.\n`
        ),
        false
      );
      updateJobProcess(room, {
        pid: -1
      });
    });
    setSocketInitialized(true);
  }, []);

  const subscribeToTaskSocket = React.useCallback(
    (room, command, projectPath) => {
      try {
        if (_socket && _socket.current) {
          _socket.current.emit("subscribe", {
            room,
            command,
            projectPath
          });
        }
      } catch (error) {
        console.error("subscribeToTaskSocket error:", error);
        throw error;
      }
    },
    []
  );

  const unsubscribeFromTaskSocket = React.useCallback((room, pid) => {
    try {
      if (_socket && _socket.current) {
        _socket.current.emit("unsubscribe", {
          room,
          pid
        });
      }
    } catch (error) {
      console.error("unsubscribeFromTaskSocket error:", error);
      throw error;
    }
  }, []);

  const value = React.useMemo(
    () => ({
      isSocketInitialized,
      initializeSocket,
      subscribeToTaskSocket,
      _socket,
      unsubscribeFromTaskSocket
    }),
    [
      isSocketInitialized,
      initializeSocket,
      subscribeToTaskSocket,
      _socket,
      unsubscribeFromTaskSocket
    ]
  );

  return <SocketsContext.Provider {...props} value={value} />;
}

function useSockets() {
  const context = React.useContext(SocketsContext);
  if (!context) {
    throw new Error("useSockets must be used within a ConfigProvider");
  }

  return context;
}

export { SocketsProvider, useSockets };

import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type RoomState = {
  stdout: string | undefined;
  isRunning: boolean;
  process: any;
};
export type JobState = {
  [key: string]: RoomState;
};

export type JobAction = {
  room: string;
  stdout?: string;
  state?: object;
  isRunning?: boolean;
  socketId?: string;
  process?: any;
};

const initialState: JobState = {};

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    updateJob(state: JobState, action: PayloadAction<JobAction>) {
      const { room, stdout, isRunning } = action.payload;
      const newStdout = state[room] ? stdout : "";
      state[room].stdout = newStdout;
      state[room].isRunning = isRunning ?? false;
    },
    updateJobProcess(state: JobState, action: PayloadAction<JobAction>) {
      const { room, process } = action.payload;
      const pid = process && process.pid ? process.pid : -1;
      state[room].process = process;
      state[room].isRunning = pid === -1 ? false : true;
    },
    clearOutput(state: JobState, action: PayloadAction<JobAction>) {
      const { room } = action.payload;
      state[room].stdout = "";
    },
    restoreStateFromStorage(state: JobState, action: PayloadAction<JobState>) {
      state = action.payload;
      return state;
    }
  }
});

export const jobsActions = jobsSlice.actions;

export const jobsReducer = jobsSlice.reducer;

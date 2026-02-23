/**
 * Task Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  isLoading: false,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex((t) => t.taskId === action.payload.taskId);
      if (index >= 0) {
        state.tasks[index] = action.payload;
      }
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setTasks, addTask, updateTask, setSelectedTask, setLoading } = taskSlice.actions;

export default taskSlice.reducer;

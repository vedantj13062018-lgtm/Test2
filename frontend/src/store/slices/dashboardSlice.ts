/**
 * Dashboard Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardItem, Patient } from '../../types';

interface DashboardState {
  items: DashboardItem[];
  patients: Patient[];
  selectedPatient: Patient | null;
  selectedDate: string;
  filter: string;
  isLoading: boolean;
}

const initialState: DashboardState = {
  items: [],
  patients: [],
  selectedPatient: null,
  selectedDate: new Date().toISOString(),
  filter: '',
  isLoading: false,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<DashboardItem[]>) => {
      state.items = action.payload;
    },
    setPatients: (state, action: PayloadAction<Patient[]>) => {
      state.patients = action.payload;
    },
    setSelectedPatient: (state, action: PayloadAction<Patient | null>) => {
      state.selectedPatient = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setItems,
  setPatients,
  setSelectedPatient,
  setSelectedDate,
  setFilter,
  setLoading,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

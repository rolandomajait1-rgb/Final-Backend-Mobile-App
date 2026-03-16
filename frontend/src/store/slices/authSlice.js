import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
  },
  reducers: {
    setCredentials: (state, action) => {
      if (!action.payload || typeof action.payload !== 'object') return;
      state.user = action.payload.user || null;
      state.token = action.payload.token || null;
      state.isAuthenticated = !!action.payload.token;
      if (action.payload.user) localStorage.setItem('user', JSON.stringify(action.payload.user));
      if (action.payload.token) localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

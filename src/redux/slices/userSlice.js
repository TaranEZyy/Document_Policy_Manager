// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../api/axiosInstance'; // adjust path as needed

// src/redux/slices/userSlice.js
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/login/verify'); // token handled internally
      console.log('✅ User verified successfully:', response.data);
      return response.data; 
    } catch (err) {
      console.error('❌ Error verifying user:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


const userSlice = createSlice({
  name: 'user',
  initialState: {
    userInfo: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserInfo: (state) => {
      state.userInfo = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user.';
      });
  },
});

export const { clearUserInfo } = userSlice.actions;
export default userSlice.reducer;

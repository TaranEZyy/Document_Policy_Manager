// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import documentReducer from './slices/documentSlice';
import userReducer from './slices/userSlice'; 

export const store = configureStore({
  reducer: {
    document: documentReducer,
    user: userReducer, 
  },
});

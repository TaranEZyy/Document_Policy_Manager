// src/redux/slices/documentSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  folderData: [],
  expandedPaths: {},
  selectedDocument: null,
  allFiles: [],
  archivedBoolean: false,
  allVersionsOfSelectedDocument: [],
  currentFilePath: '',
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setFolderData: (state, action) => {
      state.folderData = action.payload;
    },
    setExpandedPaths: (state, action) => {
      state.expandedPaths = action.payload;
    },
    setSelectedDocument: (state, action) => {
      state.selectedDocument = action.payload;
    },
    setAllFiles: (state, action) => {
      state.allFiles = action.payload;
    },
    setArchivedBoolean: (state, action) => {
      state.archivedBoolean = action.payload;
    },
    setAllVersionsOfSelectedDocument: (state, action) => {
      state.allVersionsOfSelectedDocument = action.payload;
    },
    setCurrentFilePath: (state, action) => {
      state.currentFilePath = action.payload;
    },
  },
});

export const {
  setFolderData,
  setExpandedPaths,
  setSelectedDocument,
  setAllFiles,
  setArchivedBoolean,
  setAllVersionsOfSelectedDocument,
  setCurrentFilePath,
} = documentSlice.actions;

export default documentSlice.reducer;

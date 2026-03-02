import { createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: {
    open: false,
    user: null,
    authChecked: false,
    emails: [],
    selectedEmail: null,
    searchText: "",
  },
  reducers: {
    setOpen: (state, action) => {
      state.open = action.payload;
    },
    setAuthUser: (state, action) => {
      state.user = action.payload;
    },
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload;
    },
    setEmails: (state, action) => {
      state.emails = action.payload;
    },
    addEmail: (state, action) => {
      state.emails = [action.payload, ...state.emails];
    },
    removeEmail: (state, action) => {
      state.emails = state.emails.filter((email) => email._id !== action.payload);
    },
    setSelectedEmail: (state, action) => {
      state.selectedEmail = action.payload;
    },
    setSearchText: (state, action) => {
      state.searchText = action.payload;
    },
  },
});

export const {
  setOpen,
  setAuthUser,
  setAuthChecked,
  setEmails,
  addEmail,
  removeEmail,
  setSelectedEmail,
  setSearchText,
} = appSlice.actions;

export default appSlice.reducer;
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  user: null,
  media: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.loading = false;
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setMedia: (state, action) => {
      state.media = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.media = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setAccessToken,
  setUser,
  setMedia,
  setLoading,
  setError,
  logout,
} = userSlice.actions;

export default userSlice.reducer;

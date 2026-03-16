import { createSlice } from '@reduxjs/toolkit';

const articlesSlice = createSlice({
  name: 'articles',
  initialState: {
    articles: [],
    loading: false,
    error: null,
  },
  reducers: {
    setArticles: (state, action) => {
      state.articles = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setError: (state, action) => {
      state.error = action.payload || null;
      state.loading = false;
    },
  },
});

export const { setArticles, setLoading, setError } = articlesSlice.actions;
export default articlesSlice.reducer;

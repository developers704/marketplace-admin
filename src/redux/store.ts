import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';

export const store = configureStore({
  reducer: {
    // Add the RTK Query reducer
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  // Add the RTK Query middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Optional: Enable refetching on focus or reconnect
setupListeners(store.dispatch);

// TypeScript-specific types for store, dispatch, and state
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

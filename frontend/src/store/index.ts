import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import studentsSlice from './slices/studentsSlice';
import financialSlice from './slices/financialSlice';
import classesSlice from './slices/classesSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    students: studentsSlice,
    financial: financialSlice,
    classes: classesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { 
  TimeEntry, 
  TimeEntriesResponse, 
  CreateTimeEntryData, 
  UpdateTimeEntryData,
  Expense,
  CreateExpenseData,
  Payment,
  CreatePaymentData,
  LessonType,
  CreateLessonTypeData,
  UpdateLessonTypeData,
  FinancialSummary,
  EarningsSummaryResponse 
} from '../../types/financial';
import { apiRequest } from '../../services/api';

interface FinancialState {
  timeEntries: TimeEntry[];
  expenses: Expense[];
  payments: Payment[];
  lessonTypes: LessonType[];
  summary: FinancialSummary | null;
  earningsSummary: EarningsSummaryResponse | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: FinancialState = {
  timeEntries: [],
  expenses: [],
  payments: [],
  lessonTypes: [],
  summary: null,
  earningsSummary: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

// Time Entries
export const fetchTimeEntries = createAsyncThunk(
  'financial/fetchTimeEntries',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiRequest<TimeEntriesResponse>(
        'GET',
        `/time-entries?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to fetch time entries');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch time entries');
    }
  }
);

export const createTimeEntry = createAsyncThunk(
  'financial/createTimeEntry',
  async (timeEntryData: CreateTimeEntryData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<TimeEntry>(
        'POST',
        '/time-entries',
        timeEntryData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to create time entry');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create time entry');
    }
  }
);

export const updateTimeEntry = createAsyncThunk(
  'financial/updateTimeEntry',
  async (timeEntryData: UpdateTimeEntryData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<TimeEntry>(
        'PUT',
        `/time-entries/${timeEntryData.id}`,
        timeEntryData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to update time entry');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update time entry');
    }
  }
);

export const deleteTimeEntry = createAsyncThunk(
  'financial/deleteTimeEntry',
  async (timeEntryId: string, { rejectWithValue }) => {
    try {
      const response = await apiRequest<void>(
        'DELETE',
        `/time-entries/${timeEntryId}`
      );
      
      if (response.success) {
        return timeEntryId;
      }
      
      return rejectWithValue(response.message || 'Failed to delete time entry');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete time entry');
    }
  }
);

// Lesson Types
export const fetchLessonTypes = createAsyncThunk(
  'financial/fetchLessonTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ lessonTypes: LessonType[] }>(
        'GET',
        '/lesson-types'
      );
      
      if (response.success && response.data) {
        return response.data.lessonTypes;
      }
      
      return rejectWithValue(response.message || 'Failed to fetch lesson types');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch lesson types');
    }
  }
);

export const createLessonType = createAsyncThunk(
  'financial/createLessonType',
  async (lessonTypeData: CreateLessonTypeData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<LessonType>(
        'POST',
        '/lesson-types',
        lessonTypeData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to create lesson type');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create lesson type');
    }
  }
);

export const updateLessonType = createAsyncThunk(
  'financial/updateLessonType',
  async ({ id, data }: { id: string; data: UpdateLessonTypeData }, { rejectWithValue }) => {
    try {
      const response = await apiRequest<LessonType>(
        'PUT',
        `/lesson-types/${id}`,
        data
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to update lesson type');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update lesson type');
    }
  }
);

export const deleteLessonType = createAsyncThunk(
  'financial/deleteLessonType',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ message: string }>(
        'DELETE',
        `/lesson-types/${id}`
      );
      
      if (response.success) {
        return id;
      }
      
      return rejectWithValue(response.message || 'Failed to delete lesson type');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete lesson type');
    }
  }
);

// Expenses
export const fetchExpenses = createAsyncThunk(
  'financial/fetchExpenses',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiRequest<{ expenses: Expense[] }>(
        'GET',
        `/expenses?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data.expenses;
      }
      
      return rejectWithValue(response.message || 'Failed to fetch expenses');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch expenses');
    }
  }
);

export const createExpense = createAsyncThunk(
  'financial/createExpense',
  async (expenseData: CreateExpenseData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<Expense>(
        'POST',
        '/expenses',
        expenseData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to create expense');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create expense');
    }
  }
);

// Payments
export const fetchPayments = createAsyncThunk(
  'financial/fetchPayments',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiRequest<{ payments: Payment[] }>(
        'GET',
        `/payments?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data.payments;
      }
      
      return rejectWithValue(response.message || 'Failed to fetch payments');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payments');
    }
  }
);

export const createPayment = createAsyncThunk(
  'financial/createPayment',
  async (paymentData: CreatePaymentData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<Payment>(
        'POST',
        '/payments',
        paymentData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to create payment');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment');
    }
  }
);

// Earnings Summary
export const fetchEarningsSummary = createAsyncThunk(
  'financial/fetchEarningsSummary',
  async (filters: { startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiRequest<EarningsSummaryResponse>(
        'GET',
        `/time-entries/earnings-summary?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to fetch earnings summary');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch earnings summary');
    }
  }
);

// Financial slice
const financialSlice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Time Entries
      .addCase(fetchTimeEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimeEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timeEntries = action.payload.timeEntries;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTimeEntry.fulfilled, (state, action) => {
        state.timeEntries.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(updateTimeEntry.fulfilled, (state, action) => {
        const index = state.timeEntries.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.timeEntries[index] = action.payload;
        }
      })
      .addCase(deleteTimeEntry.fulfilled, (state, action) => {
        state.timeEntries = state.timeEntries.filter(t => t._id !== action.payload);
        state.pagination.total -= 1;
      })
      // Lesson Types
      .addCase(fetchLessonTypes.fulfilled, (state, action) => {
        state.lessonTypes = action.payload;
      })
      .addCase(createLessonType.fulfilled, (state, action) => {
        state.lessonTypes.unshift(action.payload);
      })
      .addCase(updateLessonType.fulfilled, (state, action) => {
        const index = state.lessonTypes.findIndex(lt => lt._id === action.payload._id);
        if (index !== -1) {
          state.lessonTypes[index] = action.payload;
        }
      })
      .addCase(deleteLessonType.fulfilled, (state, action) => {
        state.lessonTypes = state.lessonTypes.filter(lt => lt._id !== action.payload);
      })
      // Expenses
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      })
      // Payments
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.payments = action.payload;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.payments.unshift(action.payload);
      })
      // Earnings Summary
      .addCase(fetchEarningsSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEarningsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.earningsSummary = action.payload;
        state.error = null;
      })
      .addCase(fetchEarningsSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading } = financialSlice.actions;
export default financialSlice.reducer;

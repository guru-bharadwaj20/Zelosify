import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/Axios/AxiosInstance";

const readError = (error, fallback) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  error.message ||
  fallback;

export const fetchManagerOpenings = createAsyncThunk(
  "hiringManager/fetchManagerOpenings",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/hiring-manager/openings", {
        params: { page: params.page || 1, limit: params.limit || 10 },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to fetch openings"));
    }
  }
);

export const fetchOpeningProfiles = createAsyncThunk(
  "hiringManager/fetchOpeningProfiles",
  async (openingId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/hiring-manager/openings/${openingId}/profiles`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to fetch profiles"));
    }
  }
);

export const shortlistProfile = createAsyncThunk(
  "hiringManager/shortlistProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/hiring-manager/profiles/${profileId}/shortlist`
      );
      return { profileId, status: response.data.profile.status };
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to shortlist the profile"));
    }
  }
);

export const rejectProfile = createAsyncThunk(
  "hiringManager/rejectProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/hiring-manager/profiles/${profileId}/reject`
      );
      return { profileId, status: response.data.profile.status };
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to reject the profile"));
    }
  }
);

export const previewManagerProfile = createAsyncThunk(
  "hiringManager/previewManagerProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/hiring-manager/profiles/${profileId}/preview`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to open the profile"));
    }
  }
);

const initialState = {
  openings: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  selectedOpening: null,
  profiles: [],
  isLoading: false,
  isProfilesLoading: false,
  pendingProfileId: null,
  error: null,
};

const applyStatus = (profiles, profileId, status) =>
  profiles.map((profile) =>
    profile.id === profileId ? { ...profile, status } : profile
  );

const hiringManagerSlice = createSlice({
  name: "hiringManager",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetHiringManager: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerOpenings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchManagerOpenings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openings = action.payload.openings || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchManagerOpenings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOpeningProfiles.pending, (state) => {
        state.isProfilesLoading = true;
        state.error = null;
      })
      .addCase(fetchOpeningProfiles.fulfilled, (state, action) => {
        state.isProfilesLoading = false;
        state.selectedOpening = action.payload.opening || null;
        state.profiles = action.payload.profiles || [];
      })
      .addCase(fetchOpeningProfiles.rejected, (state, action) => {
        state.isProfilesLoading = false;
        state.error = action.payload;
      })
      .addCase(shortlistProfile.pending, (state, action) => {
        state.pendingProfileId = action.meta.arg;
      })
      .addCase(shortlistProfile.fulfilled, (state, action) => {
        state.pendingProfileId = null;
        state.profiles = applyStatus(
          state.profiles,
          action.payload.profileId,
          action.payload.status
        );
      })
      .addCase(shortlistProfile.rejected, (state, action) => {
        state.pendingProfileId = null;
        state.error = action.payload;
      })
      .addCase(rejectProfile.pending, (state, action) => {
        state.pendingProfileId = action.meta.arg;
      })
      .addCase(rejectProfile.fulfilled, (state, action) => {
        state.pendingProfileId = null;
        state.profiles = applyStatus(
          state.profiles,
          action.payload.profileId,
          action.payload.status
        );
      })
      .addCase(rejectProfile.rejected, (state, action) => {
        state.pendingProfileId = null;
        state.error = action.payload;
      })
      .addCase(previewManagerProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, resetHiringManager } = hiringManagerSlice.actions;

export const selectManagerOpenings = (state) => state.hiringManager.openings;
export const selectManagerPagination = (state) => state.hiringManager.pagination;
export const selectManagerSelectedOpening = (state) =>
  state.hiringManager.selectedOpening;
export const selectManagerProfiles = (state) => state.hiringManager.profiles;
export const selectManagerLoading = (state) => state.hiringManager.isLoading;
export const selectManagerProfilesLoading = (state) =>
  state.hiringManager.isProfilesLoading;
export const selectPendingProfileId = (state) =>
  state.hiringManager.pendingProfileId;
export const selectManagerError = (state) => state.hiringManager.error;

export default hiringManagerSlice.reducer;

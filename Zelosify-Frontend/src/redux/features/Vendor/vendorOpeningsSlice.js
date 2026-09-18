import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/Axios/AxiosInstance";

const readError = (error, fallback) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  error.message ||
  fallback;

export const fetchVendorOpenings = createAsyncThunk(
  "vendorOpenings/fetchVendorOpenings",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/vendor/openings", {
        params: { page: params.page || 1, limit: params.limit || 10 },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to fetch openings"));
    }
  }
);

export const fetchVendorOpeningDetails = createAsyncThunk(
  "vendorOpenings/fetchVendorOpeningDetails",
  async (openingId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/vendor/openings/${openingId}`);
      return response.data.opening;
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to fetch opening details"));
    }
  }
);

export const uploadVendorProfiles = createAsyncThunk(
  "vendorOpenings/uploadVendorProfiles",
  async ({ openingId, files }, { rejectWithValue }) => {
    try {
      const presignResponse = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/presign`,
        { filenames: files.map((file) => file.name) }
      );

      const uploads = presignResponse.data.uploads || [];
      const formData = new FormData();

      files.forEach((file) => formData.append("files", file));
      formData.append(
        "uploadTokens",
        JSON.stringify(uploads.map((upload) => upload.uploadToken))
      );

      const uploadResponse = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return uploadResponse.data.profiles || [];
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to upload profiles"));
    }
  }
);

export const deleteVendorProfile = createAsyncThunk(
  "vendorOpenings/deleteVendorProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/vendor/profiles/${profileId}`);
      return profileId;
    } catch (error) {
      return rejectWithValue(readError(error, "Failed to remove profile"));
    }
  }
);

export const previewVendorProfile = createAsyncThunk(
  "vendorOpenings/previewVendorProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/vendor/profiles/${profileId}/preview`
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
  isLoading: false,
  isDetailsLoading: false,
  isUploading: false,
  error: null,
  uploadError: null,
};

const vendorOpeningsSlice = createSlice({
  name: "vendorOpenings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.uploadError = null;
    },
    resetVendorOpenings: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorOpenings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorOpenings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openings = action.payload.openings || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchVendorOpenings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchVendorOpeningDetails.pending, (state) => {
        state.isDetailsLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorOpeningDetails.fulfilled, (state, action) => {
        state.isDetailsLoading = false;
        state.selectedOpening = action.payload;
      })
      .addCase(fetchVendorOpeningDetails.rejected, (state, action) => {
        state.isDetailsLoading = false;
        state.error = action.payload;
      })
      .addCase(uploadVendorProfiles.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadVendorProfiles.fulfilled, (state, action) => {
        state.isUploading = false;
        if (state.selectedOpening) {
          state.selectedOpening.profiles = [
            ...action.payload,
            ...(state.selectedOpening.profiles || []),
          ];
          state.selectedOpening.profilesCount =
            state.selectedOpening.profiles.length;
        }
      })
      .addCase(uploadVendorProfiles.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload;
      })
      .addCase(deleteVendorProfile.fulfilled, (state, action) => {
        if (state.selectedOpening) {
          state.selectedOpening.profiles = (
            state.selectedOpening.profiles || []
          ).filter((profile) => profile.id !== action.payload);
          state.selectedOpening.profilesCount =
            state.selectedOpening.profiles.length;
        }
      })
      .addCase(deleteVendorProfile.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(previewVendorProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, resetVendorOpenings } = vendorOpeningsSlice.actions;

export const selectVendorOpenings = (state) => state.vendorOpenings.openings;
export const selectVendorPagination = (state) => state.vendorOpenings.pagination;
export const selectSelectedOpening = (state) =>
  state.vendorOpenings.selectedOpening;
export const selectVendorLoading = (state) => state.vendorOpenings.isLoading;
export const selectVendorDetailsLoading = (state) =>
  state.vendorOpenings.isDetailsLoading;
export const selectVendorUploading = (state) => state.vendorOpenings.isUploading;
export const selectVendorError = (state) => state.vendorOpenings.error;
export const selectVendorUploadError = (state) =>
  state.vendorOpenings.uploadError;

export default vendorOpeningsSlice.reducer;

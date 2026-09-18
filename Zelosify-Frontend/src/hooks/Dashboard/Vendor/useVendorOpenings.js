import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  fetchVendorOpenings,
  fetchVendorOpeningDetails,
  uploadVendorProfiles,
  deleteVendorProfile,
  previewVendorProfile,
  clearError,
  resetVendorOpenings,
  selectVendorOpenings,
  selectVendorPagination,
  selectSelectedOpening,
  selectVendorLoading,
  selectVendorDetailsLoading,
  selectVendorUploading,
  selectVendorError,
  selectVendorUploadError,
} from "@/redux/features/Vendor/vendorOpeningsSlice";

const useVendorOpenings = () => {
  const dispatch = useDispatch();

  const openings = useSelector(selectVendorOpenings);
  const pagination = useSelector(selectVendorPagination);
  const selectedOpening = useSelector(selectSelectedOpening);
  const isLoading = useSelector(selectVendorLoading);
  const isDetailsLoading = useSelector(selectVendorDetailsLoading);
  const isUploading = useSelector(selectVendorUploading);
  const error = useSelector(selectVendorError);
  const uploadError = useSelector(selectVendorUploadError);

  const handleFetchOpenings = useCallback(
    async (params = {}) => {
      try {
        await dispatch(fetchVendorOpenings(params)).unwrap();
      } catch (err) {
        console.error("Failed to fetch vendor openings:", err);
      }
    },
    [dispatch]
  );

  const handleFetchOpeningDetails = useCallback(
    async (openingId) => {
      if (!openingId) return;

      try {
        await dispatch(fetchVendorOpeningDetails(openingId)).unwrap();
      } catch (err) {
        console.error("Failed to fetch opening details:", err);
      }
    },
    [dispatch]
  );

  const handleUploadProfiles = useCallback(
    async (openingId, files) => {
      if (!openingId || files.length === 0) return false;

      try {
        await dispatch(uploadVendorProfiles({ openingId, files })).unwrap();
        return true;
      } catch (err) {
        console.error("Failed to upload profiles:", err);
        return false;
      }
    },
    [dispatch]
  );

  const handleDeleteProfile = useCallback(
    async (profileId) => {
      try {
        await dispatch(deleteVendorProfile(profileId)).unwrap();
        return true;
      } catch (err) {
        console.error("Failed to remove profile:", err);
        return false;
      }
    },
    [dispatch]
  );

  const handlePreviewProfile = useCallback(
    async (profileId) => {
      try {
        const preview = await dispatch(previewVendorProfile(profileId)).unwrap();
        if (preview?.url) {
          window.open(preview.url, "_blank", "noopener,noreferrer");
        }
      } catch (err) {
        console.error("Failed to open profile preview:", err);
      }
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetVendorOpenings());
  }, [dispatch]);

  return {
    openings,
    pagination,
    selectedOpening,
    isLoading,
    isDetailsLoading,
    isUploading,
    error,
    uploadError,
    handleFetchOpenings,
    handleFetchOpeningDetails,
    handleUploadProfiles,
    handleDeleteProfile,
    handlePreviewProfile,
    handleClearError,
    handleReset,
  };
};

export default useVendorOpenings;

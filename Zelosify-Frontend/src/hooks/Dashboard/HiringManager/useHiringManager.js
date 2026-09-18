import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  fetchManagerOpenings,
  fetchOpeningProfiles,
  shortlistProfile,
  rejectProfile,
  previewManagerProfile,
  clearError,
  resetHiringManager,
  selectManagerOpenings,
  selectManagerPagination,
  selectManagerSelectedOpening,
  selectManagerProfiles,
  selectManagerLoading,
  selectManagerProfilesLoading,
  selectPendingProfileId,
  selectManagerError,
} from "@/redux/features/HiringManager/hiringManagerSlice";

const useHiringManager = () => {
  const dispatch = useDispatch();

  const openings = useSelector(selectManagerOpenings);
  const pagination = useSelector(selectManagerPagination);
  const selectedOpening = useSelector(selectManagerSelectedOpening);
  const profiles = useSelector(selectManagerProfiles);
  const isLoading = useSelector(selectManagerLoading);
  const isProfilesLoading = useSelector(selectManagerProfilesLoading);
  const pendingProfileId = useSelector(selectPendingProfileId);
  const error = useSelector(selectManagerError);

  const handleFetchOpenings = useCallback(
    async (params = {}) => {
      try {
        await dispatch(fetchManagerOpenings(params)).unwrap();
      } catch (err) {
        console.error("Failed to fetch hiring manager openings:", err);
      }
    },
    [dispatch]
  );

  const handleFetchProfiles = useCallback(
    async (openingId) => {
      if (!openingId) return;

      try {
        await dispatch(fetchOpeningProfiles(openingId)).unwrap();
      } catch (err) {
        console.error("Failed to fetch opening profiles:", err);
      }
    },
    [dispatch]
  );

  const handleShortlist = useCallback(
    async (profileId) => {
      try {
        await dispatch(shortlistProfile(profileId)).unwrap();
      } catch (err) {
        console.error("Failed to shortlist profile:", err);
      }
    },
    [dispatch]
  );

  const handleReject = useCallback(
    async (profileId) => {
      try {
        await dispatch(rejectProfile(profileId)).unwrap();
      } catch (err) {
        console.error("Failed to reject profile:", err);
      }
    },
    [dispatch]
  );

  const handlePreviewProfile = useCallback(
    async (profileId) => {
      try {
        const preview = await dispatch(previewManagerProfile(profileId)).unwrap();
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
    dispatch(resetHiringManager());
  }, [dispatch]);

  return {
    openings,
    pagination,
    selectedOpening,
    profiles,
    isLoading,
    isProfilesLoading,
    pendingProfileId,
    error,
    handleFetchOpenings,
    handleFetchProfiles,
    handleShortlist,
    handleReject,
    handlePreviewProfile,
    handleClearError,
    handleReset,
  };
};

export default useHiringManager;

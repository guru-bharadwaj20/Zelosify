// ===== Local AUTH =====
export {
  register,
  verifyLogin,
  verifyTOTP,
} from "./auth/local/localAuthController.js";

// ===== Unified AUTH Logout =====
export { logout } from "./auth/logout(unified)/logout.js";

// ===== User details retrieval =====
export { getUserDetails } from "./auth/user/getUserDetails.js";

// ===== STORAGE =====
export { listOfObjects } from "./storage/storageController.js";

// ===== FORM =====
export { createDigitalInitiative } from "./form/initiativeRequestController.js";

// ===== VENDOR MANAGEMENT =====
// Vendor resource requests
export {
  fetchRequestData,
  //   updateVendorRequest,
  //   generatePresignedUrls,
  //   uploadAttachment,
  //   // deleteAttachment,
} from "./vendor/resourceRequest/vendorRequestController.js";

// ===== HIRING MANAGEMENT =====
export { fetchData } from "./hiring/hiringProfileController.js";

export { getVendorOpenings } from "./vendor/openings/getVendorOpenings.js";
export { getVendorOpeningDetails } from "./vendor/openings/getVendorOpeningDetails.js";
export { presignProfileUploads } from "./vendor/profiles/presignProfileUploads.js";
export { submitVendorProfiles } from "./vendor/profiles/submitVendorProfiles.js";
export { deleteVendorProfile } from "./vendor/profiles/deleteVendorProfile.js";
export { previewVendorProfile } from "./vendor/profiles/previewVendorProfile.js";

export { getManagerOpenings } from "./hiring/openings/getManagerOpenings.js";
export { getOpeningProfiles } from "./hiring/openings/getOpeningProfiles.js";
export { shortlistHiringProfile } from "./hiring/profiles/shortlistHiringProfile.js";
export { rejectHiringProfile } from "./hiring/profiles/rejectHiringProfile.js";
export { previewHiringProfile } from "./hiring/profiles/previewHiringProfile.js";

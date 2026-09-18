export const formatExperienceRange = (min, max) => {
  if (min === null || min === undefined) return "Not specified";
  if (max === null || max === undefined) return `${min}+ years`;
  return `${min} - ${max} years`;
};

export const formatStatusLabel = (status) => {
  if (!status) return "";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

export const getStatusClasses = (status) => {
  switch (status) {
    case "OPEN":
      return "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900";
    case "ON_HOLD":
      return "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900";
    case "CLOSED":
      return "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900";
    default:
      return "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800";
  }
};

export const getProfileStatusClasses = (status) => {
  switch (status) {
    case "SHORTLISTED":
      return "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900";
    case "REJECTED":
      return "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900";
    default:
      return "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900";
  }
};

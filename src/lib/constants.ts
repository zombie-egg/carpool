// localStorage key that persists the user's language preference across refreshes.
export const LOCALE_STORAGE_KEY = "lian-carpool-locale";

// Preset campus pickup points; values are translation keys under publish.presets.
export const CAMPUS_PRESET_KEYS = [
  "northGate",
  "southGate",
  "eastGate",
  "library",
  "dormitory",
  "gym",
] as const;

export type CampusPresetKey = (typeof CAMPUS_PRESET_KEYS)[number];

// Mainland China mobile number: 11 digits starting with 1[3-9].
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

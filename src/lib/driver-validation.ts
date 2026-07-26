import { PHONE_REGEX } from "@/lib/constants";
import type { DriverPayload } from "@/lib/types";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Server-side validation shared by the create and update driver endpoints.
export function validateDriverPayload(payload: DriverPayload): string | null {
  if (!payload.driverName?.trim()) return "driverName is required";
  if (!PHONE_REGEX.test(payload.phone ?? "")) {
    return "phone must be a valid 11-digit mobile number";
  }
  if (!payload.licensePlate?.trim()) return "licensePlate is required";
  if (
    !payload.operationStartDate ||
    Number.isNaN(Date.parse(payload.operationStartDate))
  ) {
    return "operationStartDate must be a valid date";
  }
  if (
    !payload.operationEndDate ||
    Number.isNaN(Date.parse(payload.operationEndDate))
  ) {
    return "operationEndDate must be a valid date";
  }
  if (
    new Date(payload.operationEndDate) < new Date(payload.operationStartDate)
  ) {
    return "operationEndDate must not be earlier than operationStartDate";
  }
  if (!TIME_REGEX.test(payload.dailyAvailableStart ?? "")) {
    return "dailyAvailableStart must be HH:mm";
  }
  if (!TIME_REGEX.test(payload.dailyAvailableEnd ?? "")) {
    return "dailyAvailableEnd must be HH:mm";
  }
  if (payload.dailyAvailableEnd <= payload.dailyAvailableStart) {
    return "dailyAvailableEnd must be later than dailyAvailableStart";
  }
  // Vehicle type accepts the presets or any custom text.
  if (!payload.carType?.trim()) return "carType is required";
  return null;
}

// Maps an incoming JSON payload onto Prisma create/update data.
export function driverDataFromPayload(payload: DriverPayload) {
  return {
    driverName: payload.driverName.trim(),
    phone: payload.phone.trim(),
    wechat: payload.wechat?.trim() || null,
    licensePlate: payload.licensePlate.trim(),
    operationStartDate: new Date(payload.operationStartDate),
    operationEndDate: new Date(payload.operationEndDate),
    dailyAvailableStart: payload.dailyAvailableStart,
    dailyAvailableEnd: payload.dailyAvailableEnd,
    carType: payload.carType.trim(),
    carColor: payload.carColor?.trim() || null,
    discountInfo: payload.discountInfo?.trim() || null,
    carRemark: payload.carRemark?.trim() || null,
  };
}

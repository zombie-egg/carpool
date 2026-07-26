// Shared API/domain types used by both server route handlers and client components.

export type TripStatus = "recruiting" | "full" | "finished";
export type ContactType = "wechat" | "phone" | "both";
export type CarType = "sedan" | "suv" | "mpv";

// CarpoolOrder as serialized over JSON (DateTime -> ISO string, Decimal -> string).
export interface CarpoolOrderDTO {
  id: string;
  organizerName: string;
  departLocation: string;
  destination: string;
  departTime: string;
  totalSeats: number;
  remainingSeats: number;
  totalPrice: string;
  organizerId: string | null;
  contactType: ContactType;
  wechatId: string | null;
  phoneNumber: string | null;
  remark: string | null;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CarpoolCreatePayload {
  organizerName: string;
  departLocation: string;
  destination: string;
  departTime: string;
  totalSeats: number;
  totalPrice: number;
  contactType: ContactType;
  wechatId?: string;
  phoneNumber?: string;
  remark?: string;
}

// DriverInfo as serialized over JSON.
export interface DriverInfoDTO {
  id: string;
  driverName: string;
  phone: string;
  wechat: string | null;
  licensePlate: string;
  operationStartDate: string;
  operationEndDate: string;
  dailyAvailableStart: string;
  dailyAvailableEnd: string;
  pricePerPerson: string;
  carType: CarType;
  carRemark: string | null;
  createdAt: string;
}

export interface DriverPayload {
  driverName: string;
  phone: string;
  wechat?: string;
  licensePlate: string;
  operationStartDate: string;
  operationEndDate: string;
  dailyAvailableStart: string;
  dailyAvailableEnd: string;
  pricePerPerson: number;
  carType: CarType;
  carRemark?: string;
}

export interface ApiError {
  error: string;
}

// Logged-in account as returned by /api/auth/me.
export interface SessionUserDTO {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}


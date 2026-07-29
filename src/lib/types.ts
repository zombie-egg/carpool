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

export interface TripJoinPayload {
  partySize: number;
  contactType: "wechat" | "phone";
  contactValue: string;
}

export interface TripParticipationDTO {
  id: string;
  partySize: number;
  contactType: "wechat" | "phone";
  contactValue: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    email: string;
  };
}

export interface JoinedTripDTO {
  id: string;
  partySize: number;
  contactType: "wechat" | "phone";
  contactValue: string;
  createdAt: string;
  trip: CarpoolOrderDTO & {
    organizer: { nickname: string; email: string } | null;
  };
}

export interface TripDetailDTO extends CarpoolOrderDTO {
  organizer: { id: string; nickname: string; email: string } | null;
  participants: TripParticipationDTO[];
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
  carType: string;
  carColor: string | null;
  discountInfo: string | null;
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
  carType: string;
  carColor?: string;
  discountInfo?: string;
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

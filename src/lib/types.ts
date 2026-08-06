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
  deletedByCustomer?: boolean;
  deletedByDriver?: boolean;
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
    email: string | null;
  };
}

export interface JoinedTripDTO {
  id: string;
  partySize: number;
  contactType: "wechat" | "phone";
  contactValue: string;
  createdAt: string;
  trip: CarpoolOrderDTO & {
    organizer: { nickname: string; email: string | null } | null;
  };
}

export interface TripDetailDTO extends CarpoolOrderDTO {
  organizer: { id: string; nickname: string; email: string | null } | null;
  participants: TripParticipationDTO[];
}

// DriverInfo as serialized over JSON.
export interface DriverInfoDTO {
  id: string;
  userId: string | null;
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
  email: string | null;
  nickname: string;
  avatarUrl: string | null;
  loginMethod: "email" | "wechat";
  isAdmin: boolean;
  role: "customer" | "driver";
}

export interface DriverBookingRequestDTO {
  id: string;
  departLocation: string;
  destination: string;
  departTime: string;
  totalSeats: number;
  estimatedPrice: string;
  finalPrice: string | null;
  customerContactType: "phone" | "wechat";
  customerContactValue: string;
  remark: string | null;
  status: "pending" | "confirmed" | "rejected";
  carpoolOrderId: string | null;
  createdAt: string;
  customer?: { id: string; nickname: string; email: string | null };
  driver?: DriverInfoDTO;
  carpoolOrder?: CarpoolOrderDTO | null;
}

export interface MerchantPromotionDTO {
  id: string;
  merchantName: string;
  content: string;
  poster1: string | null;
  poster2: string | null;
  poster3: string | null;
  poster4: string | null;
  coverIndex: number;
  createdAt: string;
}

export interface MerchantPromotionPayload {
  merchantName: string;
  content: string;
  posters: string[];
  coverIndex: number;
}

export interface VipAdvertisementDTO {
  id: string;
  title: string;
  content: string;
  imageData: string | null;
  createdAt: string;
}

export interface VipAdvertisementPayload {
  imageData: string;
}

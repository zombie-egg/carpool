const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_POSTER_LENGTH = 1_800_000;

export function validateMerchantPromotion(payload: {
  merchantName?: string;
  content?: string;
  posters?: string[];
}) {
  if (!payload.merchantName?.trim() || payload.merchantName.trim().length > 80) {
    return "invalid_merchant_name";
  }
  if (!payload.content?.trim() || payload.content.trim().length > 2000) {
    return "invalid_content";
  }
  if (!Array.isArray(payload.posters) || payload.posters.length > 3) {
    return "invalid_posters";
  }
  if (
    payload.posters.some(
      (poster) =>
        poster.length > MAX_POSTER_LENGTH || !IMAGE_DATA_URL.test(poster)
    )
  ) {
    return "invalid_poster";
  }
  return null;
}

export function validateVipAdvertisement(payload: {
  imageData?: string;
}) {
  if (
    !payload.imageData ||
    payload.imageData.length > MAX_POSTER_LENGTH ||
    !IMAGE_DATA_URL.test(payload.imageData)
  ) {
    return "invalid_image";
  }
  return null;
}

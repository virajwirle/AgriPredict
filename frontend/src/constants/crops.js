export const SUPPORTED_CROPS = [
  { id: "apple", name: "Apple", emoji: "🍎" },
  { id: "maize", name: "Maize", emoji: "🌽" },
  { id: "grapes", name: "Grapes", emoji: "🍇" },
  { id: "tea", name: "Tea", emoji: "🍃" },
  { id: "potato", name: "Potato", emoji: "🥔" },
  { id: "cotton", name: "Cotton", emoji: "🌱" },
  { id: "sugarcane", name: "Sugarcane", emoji: "🎋" },
  { id: "okra", name: "Okra", emoji: "🥬" },
];

export function getCropName(crop) {
  if (!crop) return "";
  return SUPPORTED_CROPS.find((item) => item.id === crop)?.name || crop;
}

export function getCropEmoji(crop) {
  return SUPPORTED_CROPS.find((item) => item.id === crop)?.emoji || "🌿";
}

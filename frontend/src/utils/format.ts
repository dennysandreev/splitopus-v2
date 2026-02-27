export const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍔 Еда",
  ALCOHOL: "🍺 Алкоголь",
  TRANSPORT: "🚕 Транспорт",
  SHOP: "🛒 Магазин",
  FUN: "🎉 Развлечения",
  HOME: "🏠 Жилье",
  OTHER: "📦 Другое",
};

export function formatMoney(value: number): string {
  return Number(value || 0).toFixed(1);
}

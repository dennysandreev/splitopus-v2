export const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍔 Еда",
  TRANSPORT: "🚕 Транспорт",
  HOME: "🏠 Жилье",
  SHOP: "🛒 Магазин",
  FUN: "🎉 Развлечения",
  OTHER: "📦 Другое",
  REPAYMENT: "💸 Возврат долга",
};

export function formatMoney(value: number): string {
  return Number(value || 0).toFixed(1);
}

export const dateFormatter = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });
export const currencyFormatter = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  new: "bg-indigo-100 text-indigo-800",
  in_review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const DEFAULT_BADGE_CLASSES = "bg-gray-100 text-gray-800";

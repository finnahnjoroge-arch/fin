import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  unpaid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  collected: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] || "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
      )}
    >
      {status}
    </span>
  );
}

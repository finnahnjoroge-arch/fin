import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  prefix,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
}) {
  const formatted = Math.round(value).toLocaleString("en-KE");
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 md:p-6 md:pb-2">
        <CardTitle className="line-clamp-2 text-xs font-medium leading-tight md:text-sm">{title}</CardTitle>
        <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500 md:h-4 md:w-4" />
      </CardHeader>
      <CardContent className="p-3 pt-1 md:p-6 md:pt-0">
        <div className="truncate text-xl font-bold md:text-2xl">{prefix ? `${prefix} ${formatted}` : formatted}</div>
      </CardContent>
    </Card>
  );
}

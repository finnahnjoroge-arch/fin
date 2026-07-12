import clsx from "clsx";
import Image from "next/image";
import Label from "../label";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  labelActions,
  comparePrice,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amountMin: string;
    amountMax: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
  labelActions?: React.ReactNode;
  comparePrice?: string;
} & React.ComponentProps<typeof Image>) {
  const hasCompare = comparePrice && label && parseFloat(comparePrice) > parseFloat(label.amountMin);
  const pctOff = hasCompare
    ? Math.round((1 - parseFloat(label!.amountMin) / parseFloat(comparePrice!)) * 100)
    : 0;
  return (
    <div
      className={clsx(
        "group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 ease-out",
        {
          "ring-2 ring-blue-500": active,
          "shadow-md hover:-translate-y-1": !active,
        },
      )}
    >
      {/* Square image container */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {props.src ? (
          <Image
            className={clsx("object-contain", {
              "transition-transform duration-500 ease-out group-hover:scale-105": isInteractive,
            })}
              {...props}
            />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-50">
            <div className="text-neutral-300 text-sm">No image</div>
          </div>
                )}
              {/* Percentage off badge - top left */}
        {hasCompare && (
          <div className="absolute top-2 left-2 z-10 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow sm:px-2 sm:text-xs">
            -{pctOff}%
          </div>
        )}
      </div>
      {label ? (
        <Label
          title={label.title}
          amountMin={label.amountMin}
          amountMax={label.amountMax}
          currencyCode={label.currencyCode}
          comparePrice={comparePrice}
          position={label.position}
          actions={labelActions}
        />
      ) : null}
    </div>
  );
}


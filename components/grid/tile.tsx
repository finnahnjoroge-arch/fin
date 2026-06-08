import clsx from "clsx";
import Image from "next/image";
import Label from "../label";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
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
} & React.ComponentProps<typeof Image>) {
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
      {/* Square image container - pure white, shows full product */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {props.src ? (
          <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-5">
            <Image
              className={clsx("relative h-full w-full object-contain drop-shadow-sm", {
                "transition-transform duration-500 ease-out group-hover:scale-105":
                  isInteractive,
              })}
              {...props}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white">
            <div className="text-neutral-300 text-sm">No image</div>
          </div>
        )}
      </div>
      {/* Subtle divider */}
      <div className="h-px bg-neutral-100" />
      {label ? (
        <Label
          title={label.title}
          amountMin={label.amountMin}
          amountMax={label.amountMax}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}

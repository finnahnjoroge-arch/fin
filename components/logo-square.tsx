import clsx from "clsx";
import LogoIcon from "./icons/logo";

export default function LogoSquare({
  iconUrl,
  logoIconUrl,
  size,
}: {
  iconUrl?: string;
  logoIconUrl?: string;
  size?: "sm" | undefined;
}) {
  const src = logoIconUrl || iconUrl;
  return (
    <div
      className={clsx(
        "flex flex-none items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black",
        {
          "h-[40px] w-[40px] rounded-xl": !size,
          "h-[30px] w-[30px] rounded-lg": size === "sm",
        },
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className={clsx("object-contain", {
            "h-[18px] w-[18px]": !size,
            "h-[12px] w-[12px]": size === "sm",
          })}
        />
      ) : (
        <LogoIcon
          className={clsx({
            "h-[16px] w-[16px]": !size,
            "h-[10px] w-[10px]": size === "sm",
          })}
        />
      )}
    </div>
  );
}

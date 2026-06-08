import { getStoreSettings } from "lib/storefront/settings";
import Link from "next/link";

export async function AnnouncementBar() {
  const settings = await getStoreSettings();

  if (!settings.announcementBar || !settings.announcementText) {
    return null;
  }

  const content = (
    <div
      className="w-full py-1.5 text-center text-xs font-medium text-white"
      style={{ backgroundColor: settings.primaryColor }}
    >
      {settings.announcementText}
    </div>
  );

  if (settings.announcementLink) {
    return (
      <Link href={settings.announcementLink} className="block w-full hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

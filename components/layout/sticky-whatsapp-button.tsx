export function StickyWhatsAppButton({
  phone,
  message,
}: {
  phone?: string;
  message?: string;
}) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const hasPhone = cleanPhone.length > 0;

  const text = encodeURIComponent(
    message || "Hi, I'd like to inquire about your products."
  );
  const href = hasPhone ? `https://wa.me/${cleanPhone}?text=${text}` : "#";

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        padding: "12px 0",
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 9999,
          padding: "12px 0",
          margin: "0 12px",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          backgroundColor: hasPhone ? "#16a34a" : "#dc2626",
        }}
      >
        <svg
          style={{ width: 16, height: 16, flexShrink: 0 }}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5.01L2 22l5.09-1.34A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.58 0-3.05-.46-4.3-1.26l-.31-.19-3.06.8.82-2.83-.21-.33A8.02 8.02 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8zm4.24-5.76c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4l-.46-.02c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.5.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
        </svg>
        <span>{hasPhone ? "Ask on WhatsApp" : "No WhatsApp phone set"}</span>
      </a>
    </div>
  );
}

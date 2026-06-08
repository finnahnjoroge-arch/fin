import Script from "next/script";

function sanitizePixelId(pixelId: string): string {
  return pixelId.replace(/[^0-9]/g, "");
}

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const sanitizedPixelId = sanitizePixelId(pixelId || "");

  if (!sanitizedPixelId) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('set', 'autoConfig', false, '${sanitizedPixelId}');
        fbq('init', '${sanitizedPixelId}');
        fbq('track', 'PageView', {}, {eventID: 'pageview-' + Date.now()});
      `}
    </Script>
  );
}

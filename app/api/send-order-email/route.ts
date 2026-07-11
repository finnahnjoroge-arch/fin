import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getStoreSettings } from '@/lib/storefront/settings';

const resend = new Resend(process.env.RESEND_API_KEY);

function layout(storeName: string, storeUrl: string, body: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <div style="background: #111; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">${storeName}</h1>
      </div>
      <div style="padding: 32px 24px;">${body}</div>
      <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #888;">
        © ${new Date().getFullYear()} ${storeName} · ${storeUrl}
      </div>
    </div>
  `;
}

function infoBox(heading: string, ...lines: string[]) {
  return `
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888;">${heading}</h3>
      ${lines.map(l => `<p style="margin: 0 0 8px;">${l}</p>`).join('')}
    </div>
  `;
}

function ctaButton(label: string, href: string) {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${href}" style="background: #111; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px;">${label}</a>
    </div>
  `;
}

function phoneBox(phone: string) {
  return `
    <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px;">📞 <strong>${phone}</strong></p>
    </div>
  `;
}

function itemsList(items: any[]) {
  if (!items?.length) return '';
  const rows = items.map(i => `<p style="margin: 0 0 6px;">• ${i.name || i.title || 'Product'}${i.quantity > 1 ? ` ×${i.quantity}` : ''}</p>`).join('');
  return `
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #888;">Products</h3>
      ${rows}
    </div>
  `;
}

export async function POST(req: Request) {
  const {
    customerEmail, customerName, orderId, total, items,
    phone, address, notes, cancelled, shipped
  } = await req.json();

  const settings = await getStoreSettings();
  const STORE_NAME  = settings.storeName  || 'Our Store';
  const STORE_PHONE = settings.storePhone || settings.whatsappPhone || '';
  const STORE_URL   = process.env.NEXT_PUBLIC_SITE_URL || '';
  const FROM_EMAIL  = settings.storeEmail || process.env.FROM_EMAIL || '';
  const FROM        = `${STORE_NAME} <${FROM_EMAIL}>`;

  try {
    if (shipped) {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your Order Has Shipped 🚚 — ${STORE_NAME}`,
        html: layout(STORE_NAME, STORE_URL, `
          <h2>Your order is on its way! 🚚</h2>
          <p>Hi ${customerName},</p>
          <p>Great news! Your order <strong>#${orderId}</strong> has been shipped and is on its way to you.</p>
          ${infoBox('Order Details', `<strong>Order ID:</strong> #${orderId}`, `<strong>Total:</strong> KES ${total}`)}
          <p>If you have any questions about your delivery, feel free to call us:</p>
          ${STORE_PHONE ? phoneBox(STORE_PHONE) : ''}
          ${ctaButton('Continue Shopping →', STORE_URL)}
        `)
      });
      return NextResponse.json({ success: true });
    }

    if (cancelled) {
      await resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `Your Order Has Been Cancelled — ${STORE_NAME}`,
        html: layout(STORE_NAME, STORE_URL, `
          <h2 style="color: #c0392b;">Order Cancelled</h2>
          <p>Hi ${customerName},</p>
          <p>We're sorry to let you know that your order <strong>#${orderId}</strong> has been cancelled.</p>
          <p>If you have any questions or believe this was a mistake, please don't hesitate to contact us.</p>
          ${STORE_PHONE ? phoneBox(STORE_PHONE) : ''}
          ${ctaButton('Continue Shopping', STORE_URL)}
        `)
      });
      return NextResponse.json({ success: true });
    }

    // Customer confirmation
    await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Order Confirmed ✅ #${orderId} — ${STORE_NAME}`,
      html: layout(STORE_NAME, STORE_URL, `
        <h2>Thank you for your order, ${customerName}! 🎉</h2>
        <p>Your order has been received and is being processed.</p>
        ${infoBox('Order Details', `<strong>Order ID:</strong> #${orderId}`, `<strong>Total:</strong> KES ${total}`)}
        ${itemsList(items)}
        <p>We'll notify you once your order ships. If you need help, feel free to call us:</p>
        ${STORE_PHONE ? phoneBox(STORE_PHONE) : ''}
        ${ctaButton('Continue Shopping →', STORE_URL)}
      `)
    });

    // Admin notification
    await resend.emails.send({
      from: FROM,
      to: process.env.ADMIN_EMAIL!,
      subject: `🛒 New Order #${orderId} — KES ${total}`,
      html: layout(STORE_NAME, STORE_URL, `
        <h2 style="margin-top:0;">New Order Received</h2>
        ${infoBox('Order Details',
          `<strong>Order ID:</strong> #${orderId}`,
          `<strong>Total:</strong> KES ${total}`
        )}
        ${itemsList(items)}
        ${infoBox('Customer Details',
          `<strong>Name:</strong> ${customerName}`,
          `<strong>Email:</strong> ${customerEmail}`,
          ...(phone   ? [`<strong>Phone:</strong> ${phone}`]     : []),
          ...(address ? [`<strong>Address:</strong> ${address}`] : []),
          ...(notes     ? [`<strong>Notes:</strong> ${notes}`]     : [])
        )}
        ${ctaButton('View in Admin Panel →', `${STORE_URL}/admin/login`)}
      `)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}


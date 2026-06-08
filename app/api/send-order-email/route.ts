import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const STORE_PHONE = '0724054583';
const STORE_URL = 'https://watchesinkenya.co.ke';

export async function POST(req: Request) {
  const { customerEmail, customerName, orderId, total, phone, address, productUrl, cancelled, shipped } = await req.json();

  try {
    if (shipped) {
      await resend.emails.send({
        from: 'Watches in Kenya <orders@watchesinkenya.co.ke>',
        to: customerEmail,
        subject: `Your Order Has Shipped 🚚 — Watches in Kenya`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <div style="background: #111; padding: 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">Watches in Kenya</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #111;">Your order is on its way! 🚚</h2>
              <p>Hi ${customerName},</p>
              <p>Great news! Your order <strong>#${orderId}</strong> has been shipped and is on its way to you.</p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px;"><strong>Order ID:</strong> #${orderId}</p>
                <p style="margin: 0;"><strong>Total:</strong> KES ${total}</p>
              </div>
              <p>If you have any questions about your delivery, feel free to call us:</p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px;">📞 <strong>${STORE_PHONE}</strong></p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${STORE_URL}" style="background: #111; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px;">Continue Shopping →</a>
              </div>
            </div>
            <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #888;">
              © ${new Date().getFullYear()} Watches in Kenya · ${STORE_URL}
            </div>
          </div>
        `
      });
      return NextResponse.json({ success: true });
    }

    if (cancelled) {
      // Cancellation email to customer
      await resend.emails.send({
        from: 'Watches in Kenya <orders@watchesinkenya.co.ke>',
        to: customerEmail,
        subject: `Your Order Has Been Cancelled — Watches in Kenya`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <div style="background: #111; padding: 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">Watches in Kenya</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #c0392b;">Order Cancelled</h2>
              <p>Hi ${customerName},</p>
              <p>We're sorry to let you know that your order <strong>#${orderId}</strong> has been cancelled.</p>
              <p>If you have any questions or believe this was a mistake, please don't hesitate to contact us.</p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px;">📞 Call us: <strong>${STORE_PHONE}</strong></p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${STORE_URL}" style="background: #111; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px;">Continue Shopping</a>
              </div>
            </div>
            <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #888;">
              © ${new Date().getFullYear()} Watches in Kenya · ${STORE_URL}
            </div>
          </div>
        `
      });

      return NextResponse.json({ success: true });
    }

    // Customer confirmation email
    await resend.emails.send({
      from: 'Watches in Kenya <orders@watchesinkenya.co.ke>',
      to: customerEmail,
      subject: `Order Confirmed ✅ #${orderId} — Watches in Kenya`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <div style="background: #111; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">Watches in Kenya</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #111;">Thank you for your order, ${customerName}! 🎉</h2>
            <p>Your order has been received and is being processed.</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px;"><strong>Order ID:</strong> #${orderId}</p>
              <p style="margin: 0 0 8px;"><strong>Total:</strong> KES ${total}</p>
            </div>
            <p>We'll notify you once your order ships. If you need help or want to know more about your order, feel free to call us:</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px;">📞 <strong>${STORE_PHONE}</strong> — We're happy to help!</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${STORE_URL}" style="background: #111; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px;">Continue Shopping →</a>
            </div>
          </div>
          <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Watches in Kenya · ${STORE_URL}
          </div>
        </div>
      `
    });

    // Admin notification email
    await resend.emails.send({
      from: 'Watches in Kenya <orders@watchesinkenya.co.ke>',
      to: process.env.ADMIN_EMAIL!,
      subject: `🛒 New Order #${orderId} — KES ${total}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <div style="background: #111; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">New Order Received</h1>
          </div>
          <div style="padding: 32px 24px;">
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px;">Order Details</h3>
              <p style="margin: 0 0 8px;"><strong>Order ID:</strong> #${orderId}</p>
              <p style="margin: 0 0 8px;"><strong>Total:</strong> KES ${total}</p>
              ${productUrl ? `<p style="margin: 0 0 8px;"><strong>Product:</strong> <a href="${productUrl}">${productUrl}</a></p>` : ''}
            </div>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px;">Customer Details</h3>
              <p style="margin: 0 0 8px;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 0 0 8px;"><strong>Email:</strong> ${customerEmail}</p>
              ${phone ? `<p style="margin: 0 0 8px;"><strong>Phone:</strong> ${phone}</p>` : ''}
              ${address ? `<p style="margin: 0 0 8px;"><strong>Address:</strong> ${address}</p>` : ''}
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${STORE_URL}/admin/orders" style="background: #111; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px;">View in Admin Panel →</a>
            </div>
          </div>
          <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Watches in Kenya · ${STORE_URL}
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

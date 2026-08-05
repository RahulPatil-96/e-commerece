import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

/**
 * Order receipt PDF generator for Arihant Luxury Stationery.
 *
 * Renders a parcel-ready receipt as styled HTML (so the browser renders the ₹
 * rupee symbol and handles text layout), captures it at its NATURAL height with
 * html2canvas, then scales it to fit within a single A5 page.
 */

const BRAND = 'Arihant Luxury Stationery';
const ACCENT = '#C7A451'; // Champagne Gold
const FOREST = '#284B3D'; // Deep Forest Green
const DARK = '#161616'; // Warm Charcoal
const MUTED = '#6F6F6F'; // Secondary Text
const LIGHT_FILL = '#F8F8F7'; // Warm White Secondary
const LIGHT_LINE = '#E6E6E6'; // Hairline Border
const WHITE = '#ffffff';

const A5_W_MM = 148;
const A5_H_MM = 210;
const A5_W_PX = 559; // 148mm @ 96dpi
const SCALE = 2; // pixel ratio for crisp output

/**
 * Format ₹ with en-IN locale.
 * @param {number|string} value
 * @returns {string}
 */
const inr = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/**
 * Sanitize a string for use in a file name.
 * @param {string} name
 * @returns {string}
 */
function safeFileName(name) {
  return (name || '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'Customer';
}

/**
 * Compact JSON payload embedded in the QR code.
 * @param {Record<string, any>} order
 * @returns {string}
 */
function buildQrPayload(order) {
  try {
    return JSON.stringify({
      order_id: String(order.id),
      customer: order.customer_name || '',
      phone: order.phone || '',
      address: [order.address, order.city, order.state, order.pincode]
        .filter(Boolean)
        .join(', '),
      total: Number(order.total || 0),
    });
  } catch {
    return String(order.id || '');
  }
}

/**
 * Human readable date (en-IN).
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Minimal HTML escaping.
 * @param {any} v
 * @returns {string}
 */
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Build the full receipt HTML string. Width is fixed to A5; height is natural.
 * @param {Record<string, any>} order
 * @param {string | null} qrDataUrl
 * @param {string} placed
 * @returns {string}
 */
function buildReceiptHtml(order, qrDataUrl, placed) {
  const orderType = String(order.order_type || 'retail').toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || subtotal - discount + shipping);
  const addressStr =
    [order.address, order.city, order.state, order.pincode]
      .filter(Boolean)
      .join(', ') || '—';
  const payMethod = String(order.payment_method || 'cod').toUpperCase();

  const itemsRowsHtml = items
    .map((item, index) => {
      const name = esc(item.name || 'Product');
      const qty = Number(item.qty || 1);
      const price = Number(item.price || 0);
      const lineTotal = qty * price;
      const bg = index % 2 === 1 ? '#FDFDFB' : '#FFFFFF';
let custom = '';
      if (
        item.customization &&
        (item.customization.name || item.customization.text)
      ) {
        const cus = item.customization;
        const cusText = cus.name || cus.text || '';
        const fontLabel = cus.font || '';
        const colorValue = cus.color || '';
        const colorSwatch = colorValue
          ? `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${esc(
              colorValue
            )}; border:1px solid ${LIGHT_LINE}; vertical-align:middle; margin-right:4px;"></span>`
          : '';
        const details = [];
        if (fontLabel) details.push(`Font: ${esc(fontLabel)}`);
        if (colorValue) details.push(`Color: ${esc(colorValue)}`);
        custom = `<div style="font-size: 9px; color: ${ACCENT}; font-style: italic; font-weight: 600; margin-top: 3px; line-height: 1.5;">✦ Personalization: "${esc(
          cusText
        )}"${details.length ? `<br/><span style="font-style:normal;">${colorSwatch}${esc(
          details.join(' · ')
        )}</span>` : ''}</div>`;
      }
      return (
        `<tr style="background: ${bg}; border-top: 1px solid ${LIGHT_LINE};">` +
        `<td style="padding: 10px 12px; font-size: 11px; font-weight: 600; color: ${DARK}; vertical-align: top; word-break: break-word; line-height: 1.4;">${name}${custom}</td>` +
        `<td style="padding: 10px 6px; font-size: 11px; color: ${DARK}; text-align: center; vertical-align: top; line-height: 1.4;">${qty}</td>` +
        `<td style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: ${DARK}; text-align: right; vertical-align: top; line-height: 1.4;">${inr(
          lineTotal
        )}</td>` +
        `</tr>`
      );
    })
    .join('');

  const qrCell = qrDataUrl
    ? `<td style="padding: 16px 24px 16px 12px; vertical-align: top; text-align: center; width: 100px;">` +
      `<img src="${qrDataUrl}" style="width: 72px; height: 72px; border: 1px solid ${LIGHT_LINE}; border-radius: 8px; padding: 3px; background: ${WHITE}; display: block; margin: 0 auto;" alt="QR" />` +
      `<div style="font-size: 7px; color: ${MUTED}; margin-top: 4px; line-height: 1.2; text-align: center; font-weight: 600;">Scan to Verify</div>` +
      `</td>`
    : '';

  const trackingHtml = order.tracking_number
    ? `<div style="font-size: 11px; color: ${DARK}; margin-top: 6px; padding: 2px 0; line-height: 1.4;"><strong>Tracking Code:</strong> <span style="color: ${ACCENT}; font-weight: 700;">${esc(
        order.tracking_number
      )}</span></div>`
    : '';

  return `
<div id="receipt" style="width:${A5_W_PX}px; background:${WHITE}; color:${DARK}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing:border-box; margin:0; padding:0; line-height:1.4; text-align:left;">
  <!-- Header -->
  <table style="width:100%; border-collapse:collapse; background:${LIGHT_FILL}; border-bottom:3px solid ${ACCENT}; margin:0; padding:0;">
    <tr>
      <td style="padding:20px 0 20px 24px; vertical-align:top;">
        <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; font-weight:bold; color:${FOREST}; line-height:1.2;">${BRAND}</div>
        <div style="font-size:9px; color:${MUTED}; margin-top:3px; line-height:1.3; font-weight:500;">Crafted with Archival Precision · Premium Stationery</div>
        <div style="font-size:12px; font-weight:bold; color:${ACCENT}; margin-top:10px; letter-spacing:0.5px; line-height:1.3;">ORDER #${esc(
          order.id
        )}</div>
        <div style="font-size:9px; color:${MUTED}; margin-top:3px; line-height:1.3;">Date Placed: ${placed}</div>
      </td>
      <td style="padding:20px 12px 20px 0; vertical-align:top; text-align:right;">
        <div style="display:inline-block; background:${FOREST}; color:${WHITE}; font-size:9px; font-weight:bold; letter-spacing:1px; padding:4px 12px; border-radius:12px; text-transform:uppercase; line-height:1.3;">${orderType} SLIP</div>
        <div style="font-size:13px; font-weight:bold; color:${DARK}; margin-top:8px; letter-spacing:0.5px; line-height:1.3;">PARCEL INVOICE</div>
        <div style="font-size:8px; color:${MUTED}; margin-top:3px; line-height:1.3;">Official Tax Receipt &amp; Package Slip</div>
      </td>
      ${qrCell}
    </tr>
  </table>

  <!-- Main Body -->
  <div style="padding:20px 24px 24px;">
    <!-- Customer & Delivery -->
    <div style="font-size:9px; font-weight:bold; letter-spacing:1.5px; color:${FOREST}; text-transform:uppercase; border-bottom:1px solid ${LIGHT_LINE}; padding-bottom:4px; margin-bottom:12px; line-height:1.4;">Customer &amp; Dispatch Details</div>
    <table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:16px;">
      <tr>
        <td style="width:50%; vertical-align:top; padding-right:12px;">
          <div style="font-size:14px; font-weight:bold; color:${DARK}; line-height:1.3;">${esc(
            order.customer_name || '—'
          )}</div>
          ${
            order.phone
              ? `<div style="font-size:11px; color:${DARK}; margin-top:4px; line-height:1.4;">Phone: ${esc(
                  order.phone
                )}</div>`
              : ''
          }
          ${
            order.email
              ? `<div style="font-size:11px; color:${DARK}; margin-top:4px; line-height:1.4; word-break:break-all;">Email: ${esc(
                  order.email
                )}</div>`
              : ''
          }
        </td>
        <td style="width:50%; vertical-align:top; padding-left:12px;">
          <div style="font-size:8px; font-weight:bold; color:${MUTED}; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; line-height:1.3;">Shipping Destination</div>
          <div style="font-size:11px; line-height:1.5; color:${DARK}; word-break:break-word;">${esc(
            addressStr
          )}</div>
        </td>
      </tr>
    </table>

    <!-- Order Items -->
    <div style="font-size:9px; font-weight:bold; letter-spacing:1.5px; color:${FOREST}; text-transform:uppercase; border-bottom:1px solid ${LIGHT_LINE}; padding-bottom:4px; margin-top:16px; margin-bottom:12px; line-height:1.4;">Ordered Items</div>
    <table style="width:100%; border-collapse:collapse; border:1px solid ${LIGHT_LINE}; border-radius:8px; overflow:hidden; table-layout:fixed; margin-bottom:16px;">
      <thead>
        <tr style="background:${FOREST}; color:${WHITE};">
          <th style="padding:10px 12px; font-size:8px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-align:left; width:62%; line-height:1.3;">Item Description</th>
          <th style="padding:10px 6px; font-size:8px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-align:center; width:14%; line-height:1.3;">Qty</th>
          <th style="padding:10px 12px; font-size:8px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-align:right; width:24%; line-height:1.3;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    <!-- Totals Summary -->
    <table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:16px;">
      <tr>
        <td style="width:52%;"></td>
        <td style="width:48%; vertical-align:top;">
          <table style="width:100%; border-collapse:collapse; border:1px solid ${LIGHT_LINE}; border-radius:8px; background:${WHITE}; overflow:hidden;">
            <tr>
              <td style="padding:8px 12px; font-size:11px; color:${DARK}; line-height:1.4;">Subtotal</td>
              <td style="padding:8px 12px; font-size:11px; color:${DARK}; text-align:right; font-weight:600; line-height:1.4;">${inr(
                subtotal
              )}</td>
            </tr>
            <tr>
              <td style="padding:4px 12px 8px; font-size:11px; color:${DARK}; line-height:1.4;">Shipping</td>
              <td style="padding:4px 12px 8px; font-size:11px; color:${DARK}; text-align:right; font-weight:600; line-height:1.4;">${inr(
                shipping
              )}</td>
            </tr>
            ${discount > 0 ? `<tr>
              <td style="padding:4px 12px 8px; font-size:11px; color:${ACCENT}; line-height:1.4;">Discount</td>
              <td style="padding:4px 12px 8px; font-size:11px; color:${ACCENT}; text-align:right; font-weight:600; line-height:1.4;">-${inr(
                discount
              )}</td>
            </tr>` : ''}
            <tr>
              <td colspan="2" style="padding:4px 6px 6px;">
                <table style="width:100%; border-collapse:collapse; background:${LIGHT_FILL}; border:1px solid ${ACCENT}; border-radius:6px;">
                  <tr>
                    <td style="padding:8px 10px; font-size:13px; font-weight:bold; color:${DARK}; line-height:1.3;">GRAND TOTAL</td>
                    <td style="padding:8px 10px; font-size:13px; font-weight:bold; color:${ACCENT}; text-align:right; line-height:1.3;">${inr(
                      total
                    )}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Payment -->
    <div style="font-size:9px; font-weight:bold; letter-spacing:1.5px; color:${FOREST}; text-transform:uppercase; border-bottom:1px solid ${LIGHT_LINE}; padding-bottom:4px; margin-top:16px; margin-bottom:10px; line-height:1.4;">Payment Status</div>
    <div style="font-size:11px; color:${DARK}; padding:2px 0; line-height:1.4;">
      <strong>Payment Method:</strong> ${payMethod}
    </div>
    ${trackingHtml}
  </div>

  <!-- Footer -->
  <table style="width:100%; border-collapse:collapse; border-top:1px solid ${LIGHT_LINE}; background:${WHITE}; margin:0; padding:0;">
    <tr>
      <td style="padding:14px 24px; vertical-align:middle;">
        <div style="font-family:Georgia, 'Times New Roman', serif; font-weight:bold; font-size:12px; color:${FOREST}; line-height:1.3;">${BRAND}</div>
        <div style="font-size:8px; color:${MUTED}; margin-top:2px; line-height:1.3;">Thank you for partnering with Arihant!</div>
      </td>
      <td style="padding:14px 24px; vertical-align:middle; text-align:right;">
        <div style="font-size:10px; font-weight:bold; color:${DARK}; line-height:1.3;">Order #${esc(
          order.id
        )}</div>
        <div style="font-size:8px; color:${MUTED}; margin-top:2px; line-height:1.3;">${placed}</div>
      </td>
    </tr>
  </table>
</div>`;
}

/**
 * Wait for all <img> inside the container to finish loading.
 * @param {HTMLElement} root
 */
async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete || img.naturalWidth > 0) return Promise.resolve();
      return new Promise((/** @type {(value?: any) => void} */ resolve) => {
        const timer = setTimeout(() => resolve(), 500);
        img.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    })
  );
}

/**
 * Generate a printable parcel receipt PDF for a single order.
 * @param {Record<string, any>} order A formatted order object.
 * @returns {Promise<{ doc: import('jspdf').jsPDF, fileName: string }>}
 */
export async function generateOrderReceiptPdf(order) {
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(buildQrPayload(order), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: { dark: DARK, light: WHITE },
    });
  } catch (err) {
    console.warn('orderReceiptPdf: QR generation failed', err);
  }

  const placed = formatDate(order.created_date || order.created_at);
  const html = buildReceiptHtml(order, qrDataUrl, placed);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${A5_W_PX}px`;
  container.style.zIndex = '-10000';
  container.style.pointerEvents = 'none';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const receiptEl = container.querySelector('#receipt');
    if (!receiptEl) {
      throw new Error('Receipt element not found');
    }
    await waitForImages(container);
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const contentHeight = receiptEl.getBoundingClientRect().height;

    const canvas = await html2canvas(/** @type {HTMLElement} */ (receiptEl), {
      scale: SCALE,
      width: A5_W_PX,
      height: Math.ceil(contentHeight),
      windowWidth: A5_W_PX,
      backgroundColor: WHITE,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
      compress: true,
    });

    const imgWidthMm = A5_W_MM;
    const imgHeightMm = (canvas.height / canvas.width) * A5_W_MM;
    let finalW = imgWidthMm;
    let finalH = imgHeightMm;
    let offsetX = 0;

    if (finalH > A5_H_MM) {
      const scale = A5_H_MM / finalH;
      finalH = A5_H_MM;
      finalW = imgWidthMm * scale;
      offsetX = (A5_W_MM - finalW) / 2;
    }

    doc.addImage(imgData, 'JPEG', offsetX, 0, finalW, finalH);

    const fileName = `Order-${order.id}-${safeFileName(order.customer_name)}.pdf`;
    return { doc, fileName };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate and immediately download the order receipt PDF.
 * @param {Record<string, any>} order
 * @returns {Promise<string>} The downloaded file name.
 */
export async function downloadOrderReceiptPdf(order) {
  const { doc, fileName } = await generateOrderReceiptPdf(order);
  doc.save(fileName);
  return fileName;
}

export default downloadOrderReceiptPdf;

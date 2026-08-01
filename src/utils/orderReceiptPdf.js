import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

/**
 * Order receipt PDF generator.
 *
 * Renders a parcel-ready receipt as styled HTML (so the browser renders the ₹
 * rupee symbol and handles text layout), captures it at its NATURAL height with
 * html2canvas, then scales it to fit within a single A5 page. Because the
 * content height is measured (never clipped to a fixed box), rows can never
 * overlap — if content is taller than the page, it scales down to fit.
 *
 * Layout note:
 * All receipt sections use **generous spacing (padding/margins) above and below
 * every element** so html2canvas renders each block clearly without visual
 * overlap between rows and sections.
 *
 * Contains:
 *  - Customer details (name, phone, email)
 *  - Order details (items, totals, payment info, tracking)
 *  - Shipping address
 *  - A QR code (order id + customer info) for courier scanning
 *
 * File is downloaded as `Order-<id>-<customerName>.pdf`.
 */

const BRAND = 'Arihant Stationery';
const ACCENT = '#c0522a'; // brand accent
const DARK = '#1e140c';
const MUTED = '#6e5f55';
const LIGHT_FILL = '#f6f1ea';
const LIGHT_LINE = '#e8e0d6';
const WHITE = '#ffffff';

const A5_W_MM = 148;
const A5_H_MM = 210;
const A5_W_PX = 559; // 148mm @ 96dpi
const SCALE = 2; // pixel ratio for crisp output

/** Format ₹ with en-IN locale. */
const inr = (/** @type {number | string | undefined} */ value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** Sanitize a string for use in a file name. */
function safeFileName(/** @type {string} */ name) {
  return (name || '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'Customer';
}

/** Compact JSON payload embedded in the QR code. */
function buildQrPayload(/** @type {Record<string, any>} */ order) {
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

/** Human readable date (en-IN). */
function formatDate(/** @type {string | undefined} */ dateStr) {
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

/** Minimal HTML escaping. */
const esc = (/** @type {unknown} */ v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');

/** Build the full receipt HTML string. Width is fixed to A5; height is natural. */
function buildReceiptHtml(
  /** @type {Record<string, any>} */ order,
  /** @type {string | null} */ qrDataUrl,
  /** @type {string} */ placed
) {
  const orderType = String(order.order_type || 'retail').toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping || 0);
  const total = Number(order.total || subtotal + shipping);
  const addressStr = [order.address, order.city, order.state, order.pincode]
    .filter(Boolean)
    .join(', ') || '—';
  const payMethod = String(order.payment_method || 'cod').toUpperCase();
  const payStatus = String(order.payment_status || 'pending').toUpperCase();

  const itemsHtml = items.map((/** @type {Record<string, any>} */ item) => {
    const name = esc(item.name || 'Product');
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const lineTotal = qty * price;
    let custom = '';
    if (item.customization && (item.customization.name || item.customization.text)) {
      custom = `<div class="custom">✦ ${esc(item.customization.name || item.customization.text)}</div>`;
    }
    return (
      `<div class="tr"><div class="c-name">${name}${custom}</div>` +
      `<div class="c-qty">${qty}</div><div class="c-amt">${inr(lineTotal)}</div></div>`
    );
  }).join('');

  const qrBlock = qrDataUrl
    ? `<div class="qr-wrap"><img src="${qrDataUrl}" class="qr" alt="QR" /><div class="qr-cap">Scan to verify order</div></div>`
    : '';

  const trackingBlock = order.tracking_number
    ? `<div class="tracking"><strong>Tracking:</strong> <span>${esc(order.tracking_number)}</span></div>`
    : '';

  return `
<style>
#receipt{width:${A5_W_PX}px;background:${WHITE};color:${DARK};font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;box-sizing:border-box;overflow:visible;}
#receipt *{box-sizing:border-box;margin:0;padding:0;}

/* ===== Header (flex) ===== */
.header{background:${LIGHT_FILL};border-bottom:2px solid ${ACCENT};padding:20px 28px 18px;display:flex;justify-content:space-between;align-items:flex-start;}
.brand-name{font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:${DARK};line-height:1.3;}
.brand-tag{font-size:9px;color:${MUTED};margin-top:3px;}
.brand-order{font-size:12px;font-weight:700;color:${ACCENT};margin-top:12px;letter-spacing:.5px;}
.brand-date{font-size:9px;color:${MUTED};margin-top:4px;}
.header-right{text-align:right;padding-top:4px;}
.type-chip{display:inline-block;background:${ACCENT};color:${WHITE};font-size:9px;font-weight:700;letter-spacing:1px;padding:5px 14px;border-radius:12px;line-height:1.4;}
.receipt-label{font-size:13px;font-weight:700;color:${DARK};margin-top:10px;letter-spacing:1px;}
.receipt-sub{font-size:8px;color:${MUTED};margin-top:4px;}
.qr-wrap{text-align:center;padding-left:20px;}
.qr{width:76px;height:76px;border:1px solid ${LIGHT_LINE};padding:4px;background:${WHITE};}
.qr-cap{font-size:7px;color:${MUTED};margin-top:5px;line-height:1.4;}

/* ===== Body ===== */
.body{padding:18px 28px 20px;}

/* Section titles — generous space above and below */
.sec-title{font-size:9px;font-weight:700;letter-spacing:1.5px;color:${ACCENT};text-transform:uppercase;border-bottom:1px solid ${LIGHT_LINE};padding-bottom:5px;margin:16px 0 12px;}
.sec-title:first-child{margin-top:0;}

/* Customer + address (flex, 2 columns) */
.cols{display:flex;justify-content:space-between;margin-bottom:6px;}
.col{width:49%;}
.cust-name{font-size:15px;font-weight:700;color:${DARK};}
.cust-line{font-size:11px;color:${DARK};margin-top:4px;}
.addr-label{font-size:8px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.addr-text{font-size:11px;line-height:1.55;color:${DARK};word-break:break-word;}

/* Line-items (flex rows) */
.tbl{border:1px solid ${LIGHT_LINE};border-radius:6px;overflow:hidden;margin:4px 0 2px;}
.tr{display:flex;align-items:stretch;}
.tr.th{background:${ACCENT};color:${WHITE};}
.th .c-name,.th .c-qty,.th .c-amt{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.c-name{flex:1;padding:12px 14px;font-size:11px;font-weight:600;line-height:1.4;}
.c-qty{width:50px;text-align:center;padding:12px 6px;font-size:11px;}
.c-amt{width:96px;text-align:right;padding:12px 14px;font-size:11px;font-weight:600;}
.tr:nth-child(even){background:#faf6f1;}
.tr{border-top:1px solid #f0e9e0;}
.tr.th,.tr:first-child{border-top:none;}
.custom{font-size:9px;color:${ACCENT};font-style:italic;font-weight:400;margin-top:4px;line-height:1.4;}

/* Totals */
.totals{display:flex;justify-content:flex-end;margin:16px 0 8px;}
.totals-box{width:240px;border:1px solid ${LIGHT_LINE};border-radius:6px;padding:6px 4px;background:${WHITE};}
.t-line{display:flex;justify-content:space-between;font-size:11px;color:${DARK};padding:4px 10px;}
.t-line.total{margin:6px 4px 4px;border:1px solid ${ACCENT};background:${LIGHT_FILL};border-radius:5px;padding:10px 12px;font-weight:700;font-size:14px;}

/* Payment / tracking */
.pay-line{font-size:11px;color:${DARK};padding:4px 0;}
.tracking{margin-top:10px;padding:4px 0;font-size:11px;color:${DARK};}
.tracking span{color:${ACCENT};font-weight:600;}

/* ===== Footer (flex) ===== */
.footer{border-top:1px solid ${LIGHT_LINE};padding:16px 28px;display:flex;justify-content:space-between;align-items:center;background:${WHITE};}
.f-brand{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:13px;color:${DARK};}
.f-thanks{font-size:9px;color:${MUTED};margin-top:3px;}
.f-right{text-align:right;font-size:9px;color:${MUTED};}
.f-right div:first-child{color:${DARK};font-weight:600;font-size:10px;}
</style>
<div id="receipt">
  <div class="header">
    <div class="brand">
      <div class="brand-name">${BRAND}</div>
      <div class="brand-tag">Premium handcrafted stationery</div>
      <div class="brand-order">ORDER #${esc(order.id)}</div>
      <div class="brand-date">Placed: ${placed}</div>
    </div>
    <div class="header-right">
      <div class="type-chip">${orderType}</div>
      <div class="receipt-label">PACKING RECEIPT</div>
      <div class="receipt-sub">Parcel slip · paste on package</div>
    </div>
    ${qrBlock}
  </div>
  <div class="body">
    <div class="sec-title">Customer &amp; Delivery</div>
    <div class="cols">
      <div class="col">
        <div class="cust-name">${esc(order.customer_name || '—')}</div>
        ${order.phone ? `<div class="cust-line">Phone: ${esc(order.phone)}</div>` : ''}
        ${order.email ? `<div class="cust-line">Email: ${esc(order.email)}</div>` : ''}
      </div>
      <div class="col">
        <div class="addr-label">Shipping Address</div>
        <div class="addr-text">${esc(addressStr)}</div>
      </div>
    </div>

    <div class="sec-title">Order Items</div>
    <div class="tbl">
      <div class="tr th">
        <div class="c-name">Item</div>
        <div class="c-qty">Qty</div>
        <div class="c-amt">Amount</div>
      </div>
      ${itemsHtml}
    </div>

    <div class="totals">
      <div class="totals-box">
        <div class="t-line"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
        <div class="t-line"><span>Shipping</span><span>${inr(shipping)}</span></div>
        <div class="t-line total"><span>TOTAL</span><span>${inr(total)}</span></div>
      </div>
    </div>

    <div class="sec-title">Payment</div>
    <div class="pay-line"><strong>Method:</strong> ${payMethod} &nbsp;&nbsp; <strong>Status:</strong> ${payStatus}</div>
    ${trackingBlock}
  </div>
  <div class="footer">
    <div>
      <div class="f-brand">${BRAND}</div>
      <div class="f-thanks">Thank you for your order!</div>
    </div>
    <div class="f-right">
      <div>Order #${esc(order.id)}</div>
      <div>${placed}</div>
    </div>
  </div>
</div>`;
}

/** Wait for all <img> inside the container to finish loading. */
async function waitForImages(/** @type {HTMLElement} */ root) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((/** @type {HTMLImageElement} */ img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

/**
 * Generate a printable parcel receipt PDF for a single order.
 * @param {Record<string, any>} order  A formatted order object.
 * @returns {Promise<{ doc: import('jspdf').jsPDF, fileName: string }>}
 */
export async function generateOrderReceiptPdf(/** @type {Record<string, any>} */ order) {
  // --- QR code ---
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

  // --- Render off-screen HTML with html2canvas ---
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
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

    // Measure natural content height (no clipping → no overlap)
    const contentHeight = receiptEl.getBoundingClientRect().height;

    const canvas = await html2canvas(/** @type {HTMLElement} */ (receiptEl), {
      scale: SCALE,
      width: A5_W_PX,
      height: contentHeight,
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

    // Scale the captured image to fit within the A5 page, preserving aspect ratio.
    const imgWidthMm = A5_W_MM;
    const imgHeightMm = (canvas.height / canvas.width) * A5_W_MM;
    let finalW = imgWidthMm;
    let finalH = imgHeightMm;
    let offsetX = 0;

    if (finalH > A5_H_MM) {
      const scale = A5_H_MM / finalH;
      finalH = A5_H_MM;
      finalW = imgWidthMm * scale;
      offsetX = (A5_W_MM - finalW) / 2; // center horizontally
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
export async function downloadOrderReceiptPdf(/** @type {Record<string, any>} */ order) {
  const { doc, fileName } = await generateOrderReceiptPdf(order);
  doc.save(fileName);
  return fileName;
}

export default downloadOrderReceiptPdf;


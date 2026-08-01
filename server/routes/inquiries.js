import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();

function formatInquiry(row) {
  if (!row) return null;
  return {
    ...row,
    created_date: row.created_at || new Date().toISOString(),
  };
}

const inquiryFilterSchema = z.object({ status: z.string().optional() });
const inquirySchema = z.object({
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  gst_number: z.string().optional(),
  products: z.string().optional(),
  quantity: z.string().optional(),
  message: z.string().optional(),
});
const inquiryStatusSchema = z.object({ status: z.string().min(1) });

// GET /api/inquiries — ADMIN ONLY
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = inquiryFilterSchema.parse(req.query);

    let sql = 'SELECT * FROM b2b_inquiries';
    const params = [];
    if (status) {
      params.push(status);
      sql += ' WHERE status = $1';
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return res.json(result.rows.map(formatInquiry));
  } catch (error) {
    logger.error('Fetch inquiries error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message || 'Failed to fetch B2B inquiries' });
  }
});

// POST /api/inquiries
router.post('/', async (req, res) => {
  try {
    const payload = inquirySchema.parse(req.body);

    const sql = `
      INSERT INTO b2b_inquiries (
        company_name, contact_name, email, phone, gst_number, products, quantity, message, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *`;
    const values = [
      payload.company_name,
      payload.contact_name,
      payload.email,
      payload.phone,
      payload.gst_number || '',
      payload.products || '',
      payload.quantity || '',
      payload.message || '',
      'new',
    ];
    const result = await query(sql, values);
    const inquiry = formatInquiry(result.rows[0]);

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@arihant.com';
    const inquiryUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?tab=inquiries`;
    
    try {
      await sendEmail({
        to: adminEmail,
        subject: `New B2B Inquiry from ${payload.company_name}`,
        text: `Company: ${payload.company_name}\nContact: ${payload.contact_name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nGST: ${payload.gst_number}\nProducts: ${payload.products}\nQuantity: ${payload.quantity}\nMessage: ${payload.message}`,
        html: `
          <h2>New B2B Inquiry</h2>
          <p><strong>Company:</strong> ${payload.company_name}</p>
          <p><strong>Contact:</strong> ${payload.contact_name}</p>
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Phone:</strong> ${payload.phone}</p>
          <p><strong>GST Number:</strong> ${payload.gst_number || 'Not provided'}</p>
          <p><strong>Products Interested:</strong> ${payload.products || 'Not specified'}</p>
          <p><strong>Quantity:</strong> ${payload.quantity || 'Not specified'}</p>
          <p><strong>Message:</strong> ${payload.message || 'No message'}</p>
          <p><a href="${inquiryUrl}">View in Admin Dashboard</a></p>
        `,
      });
    } catch (emailError) {
      logger.warn('Failed to send B2B inquiry notification email:', { error: emailError.message });
    }

    return res.status(201).json(inquiry);
  } catch (error) {
    logger.error('Create inquiry error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to submit B2B inquiry' });
  }
});

// PUT /api/inquiries/:id — ADMIN ONLY
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = inquiryStatusSchema.parse(req.body);
    const { id } = req.params;

    const result = await query(
      'UPDATE b2b_inquiries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    return res.json(formatInquiry(result.rows[0]));
  } catch (error) {
    logger.error('Update inquiry error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to update inquiry' });
  }
});

export default router;

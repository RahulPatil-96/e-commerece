import express from 'express';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';

import logger from '../utils/logger.js';

const router = express.Router();

function formatInquiry(row) {
  if (!row) return null;
  return {
    ...row,
    created_date: row.created_at || row.created_date || new Date().toISOString(),
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

// GET /api/inquiries
router.get('/', async (req, res) => {
  try {
    const { status } = inquiryFilterSchema.parse(req.query);

    if (isDbConnected()) {
      let sql = 'SELECT * FROM b2b_inquiries';
      const params = [];
      if (status) {
        params.push(status);
        sql += ' WHERE status = $1';
      }
      sql += ' ORDER BY created_at DESC';
      const result = await query(sql, params);
      return res.json(result.rows.map(formatInquiry));
    }

    const memory = getMemoryStore();
    const list = status ? memory.b2b_inquiries.filter((i) => i.status === status) : memory.b2b_inquiries;
    return res.json(list.map(formatInquiry));
  } catch (error) {
logger.error('Fetch inquiries error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message || 'Failed to fetch B2B inquiries' });
  }
});

// POST /api/inquiries
router.post('/', async (req, res) => {
  try {
    const payload = inquirySchema.parse(req.body);

    if (isDbConnected()) {
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
      return res.json(formatInquiry(result.rows[0]));
    }

    const memory = getMemoryStore();
    const newInquiry = {
      id: memory.b2b_inquiries.length + 1,
      ...payload,
      status: 'new',
      created_at: new Date().toISOString(),
    };
    memory.b2b_inquiries.unshift(newInquiry);
    return res.json(formatInquiry(newInquiry));
  } catch (error) {
logger.error('Create inquiry error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to submit B2B inquiry' });
  }
});

// PUT /api/inquiries/:id
router.put('/:id', async (req, res) => {
  try {
    const { status } = inquiryStatusSchema.parse(req.body);
    const { id } = req.params;

    if (isDbConnected()) {
      const result = await query(
        'UPDATE b2b_inquiries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }
      return res.json(formatInquiry(result.rows[0]));
    }

    const memory = getMemoryStore();
    const idx = memory.b2b_inquiries.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    memory.b2b_inquiries[idx].status = status;
    return res.json(formatInquiry(memory.b2b_inquiries[idx]));
  } catch (error) {
logger.error('Update inquiry error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to update inquiry' });
  }
});

export default router;

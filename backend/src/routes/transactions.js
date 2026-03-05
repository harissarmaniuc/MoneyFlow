const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const { parseReceiptText } = require('../utils/receiptParser');
const {
  createTransaction, getTransactions, getRecurringTransactions,
  updateTransaction, deleteTransaction,
} = require('../controllers/transactionController');

router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/upload-receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'OCR service not configured' });

  try {
    const base64Image = req.file.buffer.toString('base64');

    const visionRes = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        }],
      },
      { timeout: 15000 }
    );

    const annotation = visionRes.data?.responses?.[0]?.fullTextAnnotation;
    if (!annotation) {
      return res.json({ amount: null, merchant: null, date: null, rawText: '' });
    }

    const rawText = annotation.text || '';
    const parsed = parseReceiptText(rawText);
    res.json({ ...parsed, rawText });
  } catch (err) {
    const visionError = err?.response?.data?.error?.message;
    res.status(502).json({ error: visionError || 'OCR processing failed' });
  }
});

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/recurring', getRecurringTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;

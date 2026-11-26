const express = require('express');
const Receipt = require('../models/Receipt');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const count = await Receipt.countDocuments();
    const year = new Date().getFullYear();
    const receiptNo = `RCP-${year}-${String(count + 1).padStart(3, '0')}`;

    const receipt = await Receipt.create({ ...req.body, receiptNo });
    res.status(201).json(receipt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
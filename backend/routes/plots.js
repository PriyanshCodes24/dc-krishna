const express = require("express");
const Plot = require("../models/Plot");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const plots = await Plot.find().sort({ plotNo: 1 });
    res.json(plots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const plot = await Plot.create(req.body);
    res.status(201).json(plot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Plot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

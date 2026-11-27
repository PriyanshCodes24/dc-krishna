const express = require("express");
const Event = require("../models/Event");
const router = express.Router();
const requireAdmin = require("../middleware/adminAuth");

router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 }).lean();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id/rsvp", requireAdmin, async (req, res) => {
  try {
    const { plotNo } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const cleanPlot = plotNo.toUpperCase().trim();
    const exists = event.attendingPlots.includes(cleanPlot);
    event.attendingPlots = exists
      ? event.attendingPlots.filter((p) => p !== cleanPlot)
      : [...event.attendingPlots, cleanPlot];

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

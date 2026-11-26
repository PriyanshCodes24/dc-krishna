require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Plot = require("./models/Plot");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Get all plots
app.get('/api/plots', async (req, res) => {
  try {
    const plots = await Plot.find().sort({ plotNo: 1 });
    res.json(plots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update a plot
app.post('/api/plots', async (req, res) => {
  try {
    const plot = await Plot.create(req.body);
    res.status(201).json(plot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update an existing plot
app.put('/api/plots/:id', async (req, res) => {
  try {
    const updated = await Plot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

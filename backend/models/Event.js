const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Meeting', 'Event'], default: 'Meeting' },
    description: { type: String, required: true },
    venue: { type: String, default: 'Society Common Plot' },
    eventDate: { type: Date, required: true },
    attendingPlots: [{ type: String, uppercase: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
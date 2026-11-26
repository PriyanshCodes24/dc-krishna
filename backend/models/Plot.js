const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema(
  {
    plotNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    plotStatus: {
      type: String,
      enum: [
        "Occupied - Owner",
        "Occupied - Tenant",
        "Vacant House",
        "Open Plot",
      ],
      default: "Occupied - Owner",
    },

    owner: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      city: { type: String, default: "" },
    },

    tenant: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    familyMembers: [{ name: String, relation: String, phone: String }],
    vehicles: [{ type: String, uppercase: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plot", plotSchema);

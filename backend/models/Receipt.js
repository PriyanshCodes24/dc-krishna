const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, required: true, unique: true },
    plotNo: { type: String, required: true, uppercase: true, trim: true },
    payerName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Maintenance", "Donation"],
      required: true,
    },
    purpose: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paymentMode: {
    type: String,
      enum: ["UPI", "Cash", "Cheque", "Bank Transfer"],
      default: "UPI",
    },
    transactionRef: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Receipt", receiptSchema);

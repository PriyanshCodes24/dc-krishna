const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/plots", require("./routes/plots"));
app.use("/api/events", require("./routes/events"));
app.use("/api/receipts", require("./routes/receipts"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running on port 5000"),
    );
  })
  .catch((err) => console.error(err));

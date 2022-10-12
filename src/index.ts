import express from "express";
import mongoose from "mongoose";

import { rankingRouter } from "./rankings/routes";

mongoose
  .connect(process.env.MONGO_DB || "")
  .then(() => {
    console.log("Successfully connected to MongoDB.");
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use("/api/", rankingRouter);
app.listen(port, () => console.log(`App listening on port ${port}.`));

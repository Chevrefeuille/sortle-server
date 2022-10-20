import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import { rankingRouter } from "./rankings/routes";
import { recordRouter } from "./history/route";

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

app.use(cors());
app.use(express.json());
app.use("/api/", rankingRouter);
app.use("/api/", recordRouter);
app.listen(port, () => console.log(`App listening on port ${port}.`));

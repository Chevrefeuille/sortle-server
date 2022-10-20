import express from "express";
import { Record } from "./schema";

const recordRouter = express.Router();

recordRouter.get("/history", async (req, res) => {
  try {
    let query = {} as any;
    if (req.query.date) {
      const date = new Date(req.query.date as string) as Date;
      let dayAfter = new Date(date.valueOf());
      dayAfter.setDate(dayAfter.getDate() + 1);
      query.date = { $gte: date, $lt: dayAfter };
    }
    const record = await Record.find(query);
    return res.status(200).json(record);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

export { recordRouter };

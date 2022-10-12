import express from "express";
import { Ranking } from "./schema";
import { checkJwt } from "../auth";

const rankingRouter = express.Router();

// get all rankings
rankingRouter.get("/", async (_req, res) => {
  try {
    const rankings = await Ranking.find({});
    return res.status(200).json(rankings);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

// add new ranking
rankingRouter.post("/", checkJwt, async (req, res) => {
  try {
    const ranking = await Ranking.create(req.body);
    return res.status(201).json(ranking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

export { rankingRouter };

import express from "express";
import { Ranking } from "./schema";
import { checkJwt } from "../auth";
import seedrandom from "seedrandom";

const rankingRouter = express.Router();

// get all rankings
rankingRouter.get("/rankings", async (_req, res) => {
  try {
    const rankings = await Ranking.find({});
    return res.status(200).json(rankings);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

// add new ranking
rankingRouter.post("/rankings", checkJwt, async (req, res) => {
  try {
    const ranking = await Ranking.create(req.body);
    return res.status(201).json(ranking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

rankingRouter.get("/daily", async (_req, res) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const rankings = await Ranking.find({
      reviewed: true,
      createdAt: { $lt: lastWeek },
    });
    const now = new Date();
    const generator = seedrandom(now.toDateString());
    const dailyRanking = rankings[Math.floor(generator() * rankings.length)];
    // hide ranking and value for the choices
    dailyRanking.choices.map((choice) => {
      choice.rank = -1;
      choice.value = "";
      return choice;
    });
    return res.status(201).json(dailyRanking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

export { rankingRouter };

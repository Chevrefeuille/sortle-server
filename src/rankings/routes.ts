import express from "express";
import { Ranking, IChoice } from "./schema";
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
      choice.value = "";
      return choice;
    });
    return res.status(200).json(dailyRanking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

const computeKendallTauDistance = (
  proposed: IChoice[],
  expected: IChoice[]
) => {
  const order = proposed.map((proposedChoice) =>
    expected.findIndex(
      (expextedChoice) => expextedChoice.name == proposedChoice.name
    )
  ); // order proposed by the player (in terms of index)
  let nCorrect = 0;
  const n = proposed.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (order[i] < order[j]) {
        nCorrect += 1;
      }
    }
  }
  return (nCorrect / ((n * (n - 1)) / 2)) * 100;
};

rankingRouter.post("/check", async (req, res) => {
  try {
    const proposedChoices = req.body["ranking"];
    const dailyRanking = await Ranking.findById(req.body["id"]);
    if (!dailyRanking) {
      throw "No corresponding ranking.";
    }
    let score = 0;
    const kendallScore = computeKendallTauDistance(
      proposedChoices,
      dailyRanking.choices
    );
    console.log(kendallScore);
    const correction = new Array(5).fill(0);
    proposedChoices.forEach((choice: IChoice, i: number) => {
      if (choice.name == dailyRanking.choices[i].name) {
        correction[i] = 1;
        score++;
      }
    });
    const response = {
      kendallScore: kendallScore,
      score: score,
      correction: correction,
      ranking: dailyRanking,
    };
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

export { rankingRouter };

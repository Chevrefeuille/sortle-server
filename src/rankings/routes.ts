import express from "express";
import { Ranking, IChoice } from "./schema";
import { Record } from "../history/schema";

import { checkJwt } from "../auth";

import startOfDay from "date-fns/startOfDay";
import sub from "date-fns/sub";
import seedrandom from "seedrandom";

const rankingRouter = express.Router();

// get all rankings
rankingRouter.get("/rankings", checkJwt, async (req, res) => {
  const page: number = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit: number = req.query.limit
    ? parseInt(req.query.limit as string)
    : 10;

  try {
    const count = await Ranking.countDocuments();
    const rankings = await Ranking.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    return res.status(200).json({
      rankings,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

// get ranking by id
rankingRouter.get("/rankings/:rankingId", checkJwt, async (req, res) => {
  try {
    const rankingId = req.params.rankingId as string;
    const ranking = await Ranking.findById(rankingId);
    return res.status(200).json(ranking);
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

// edit ranking
rankingRouter.patch("/rankings/:rankingId", checkJwt, async (req, res) => {
  try {
    const rankingId = req.params.rankingId as string;
    const ranking = await Ranking.findByIdAndUpdate(rankingId, req.body, {
      new: true,
    });
    return res.status(200).json(ranking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

// get daily ranking
rankingRouter.get("/daily", async (_req, res) => {
  try {
    // check if daily ranking has already been set
    const today = new Date();
    const record = await Record.findOne({
      date: { $gte: startOfDay(today) },
    });

    let dailyRanking;
    if (record) {
      // already set, return ranking
      dailyRanking = await Ranking.findById(record.ranking);
    } else {
      const lastMonth = sub(today, { months: 1 });
      // find ranking not played in at least one month
      const rankings = await Ranking.find({
        $or: [
          { lastPlayedAt: { $lt: lastMonth } },
          { lastPlayedAt: { $exists: false } },
        ],
      });
      const generator = seedrandom(today.toDateString());
      dailyRanking = rankings[Math.floor(generator() * rankings.length)];
      // update history
      const dailyRecord = new Record({
        date: today,
        ranking: dailyRanking._id,
      });
      await dailyRecord.save();
    }
    if (!dailyRanking) throw "Error while finding daily ranking";

    // update ranking last played
    dailyRanking.lastPlayedAt = startOfDay(today);
    await dailyRanking.save();

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

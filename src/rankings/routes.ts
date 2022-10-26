import express from "express";
import { Ranking, IChoice, IRanking } from "./schema";
import { Record } from "../history/schema";

import { checkJwt } from "../auth";
import { startOfDay, subMonths, isSameDay } from "date-fns";

import seedrandom from "seedrandom";

import { shuffle } from "lodash";

const rankingRouter = express.Router();

rankingRouter.get("/rankings/search", checkJwt, async (req, res) => {
  try {
    const searchQuery: string = req.query.query
      ? (req.query.query as string)
      : "";
    const rankings = await Ranking.find()
      .find({ $text: { $search: searchQuery } })
      .exec();
    return res.status(200).json(rankings);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

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
rankingRouter.get("/rankings/:rankingId", async (req, res) => {
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
    const ranking: IRanking = await Ranking.create(req.body);
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

rankingRouter.post("/rankings/check", async (req, res) => {
  try {
    const proposedChoices = req.body["ranking"];
    const dailyRanking: IRanking | null = await Ranking.findById(
      req.body["id"]
    );
    if (!dailyRanking) {
      throw "No corresponding ranking.";
    }
    let score = 0;
    const kendallScore = computeKendallTauDistance(
      proposedChoices,
      dailyRanking.choices
    );
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

// fetch ranking by date
rankingRouter.get("/rankings/date/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startToday = startOfDay(new Date());

    let ranking;

    // if fetching today's record, check if it was set already

    if (isSameDay(date, startToday)) {
      const record = await Record.findOne({
        date: startToday,
      });
      if (record) {
        // already set, return ranking
        ranking = await Ranking.findById(record.ranking);
      } else {
        const lastMonth = subMonths(startToday, 1);
        // find ranking not played in at least one month
        const rankings = await Ranking.find({
          $or: [
            { lastPlayedAt: { $lt: lastMonth } },
            { lastPlayedAt: { $exists: false } },
          ],
        });
        const generator = seedrandom(startToday.toDateString());
        ranking = rankings[Math.floor(generator() * rankings.length)];
        // update history
        const dailyRecord = new Record({
          date: startToday,
          ranking: ranking._id,
        });
        await dailyRecord.save();
      }
      if (!ranking) throw "Error fetching daily ranking.";
      // hide info and shuffle for daily ranking
      ranking.choices = ranking.choices.map((choice: IChoice) => {
        return { value: "", name: choice.name };
      });
      ranking.choices = shuffle(ranking.choices);
    } else if (date > startToday) {
      throw "Can't access future records.";
    } else {
      const record = await Record.findOne({
        date: date,
      });
      if (record) {
        ranking = await Ranking.findById(record.ranking);
      }
    }
    if (!ranking) {
      return res.status(404).send("Resource not found.");
    }
    return res.status(200).json(ranking);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
});

export { rankingRouter };

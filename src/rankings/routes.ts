import express from "express";
import { Ranking } from "./schema";
import { checkJwt } from "../auth";

const rankingRouter = express.Router();

// get all rankings
rankingRouter.get("/", checkJwt, (_req, res) => {
  Ranking.find({}).then((rankings) => {
    res.send(rankings);
  });
});

export { rankingRouter };

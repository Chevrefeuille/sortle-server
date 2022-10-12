import { Schema, model } from "mongoose";

interface IChoice {
  name: string;
  rank: number;
  value?: string;
}

interface IRanking {
  criterion: string;
  left: string;
  right: string;
  type: string;
  choices: IChoice[];
}

const rankingSchema = new Schema<IRanking>({
  criterion: { type: String, required: true },
  left: { type: String, required: true },
  right: { type: String, required: true },
  type: { type: String, required: true },
  choices: [
    {
      name: { type: String, required: true },
      rank: { type: Number, required: true },
      value: { type: String, required: false },
    },
  ],
});

export const Ranking = model<IRanking>("Ranking", rankingSchema);

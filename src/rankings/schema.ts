import { Schema, model } from "mongoose";

export interface IChoice {
  name: string;
  value: string;
  rank?: number;
}

export interface IRanking {
  createdAt: Date;
  updatedAt: Date;
  criterion: string;
  left: string;
  right: string;
  type: string;
  choices: IChoice[];
  reviewed: boolean;
  lastPlayedAt?: Date;
}

const validateChoices = (array: IChoice[]) => {
  return array.length == 5;
};

const rankingSchema = new Schema<IRanking>(
  {
    criterion: { type: String, required: true },
    left: { type: String, required: true },
    right: { type: String, required: true },
    type: { type: String, required: true },
    reviewed: { type: Boolean, default: false },
    lastPlayedAt: { type: Date, required: false },
    choices: {
      type: [
        {
          name: { type: String, required: true },
          rank: { type: Number, required: true, min: 0, max: 4 },
          value: { type: String, required: true },
        },
      ],
      required: true,
      validate: [validateChoices, "5 choices are required"],
    },
  },
  { timestamps: true }
);

rankingSchema.index({ "$**": "text" });

export const Ranking = model<IRanking>("Ranking", rankingSchema);

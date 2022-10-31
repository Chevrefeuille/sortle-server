import { Schema, Types, model } from "mongoose";

export interface IRecord {
  date: Date;
  ranking: Types.ObjectId;
  statistics: {
    players: number;
    meanScore: number;
    meanKendallScore: number;
  };
}

const recordSchema = new Schema<IRecord>({
  date: { type: Date, required: false },
  ranking: { type: Schema.Types.ObjectId, ref: "Ranking" },
  statistics: {
    type: {
      players: { type: Number },
      meanScore: { type: Number },
      meanKendallScore: { type: Number },
    },
  },
});

export const Record = model<IRecord>("Record", recordSchema);

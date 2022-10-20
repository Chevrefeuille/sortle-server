import { Schema, Types, model } from "mongoose";

export interface IRecord {
  date: Date;
  ranking: Types.ObjectId;
}

const recordSchema = new Schema<IRecord>({
  date: { type: Date, required: false },
  ranking: { type: Schema.Types.ObjectId, ref: "Ranking" },
});

export const Record = model<IRecord>("Record", recordSchema);

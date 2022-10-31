import mongoose from "mongoose";
import request from "supertest";

import app from "../app";

/* Connecting to the database before each test. */
beforeEach(async () => {
  await mongoose.connect(process.env.MONGO_DB || "");
});

/* Closing database connection after each test. */
afterEach(async () => {
  await mongoose.connection.close();
});

describe("GET /api/rankings/:rankingId", () => {
  it("should return a ranking", async () => {
    const res = await request(app).get(
      "/api/rankings/63423cb7119863ce46f11be4"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.type).toBe("peppers 🌶️");
  });
});

describe("POST /api/rankings/check", () => {
  it("should return a correction", async () => {
    const res = await request(app)
      .post("/api/rankings/check")
      .send({
        id: "63423cb7119863ce46f11be4",
        ranking: [
          {
            name: "Carolina Reaper",
          },
          {
            name: "Jalapeño pepper",
          },
          {
            name: "Tabasco pepper",
          },
          {
            name: "Habanero chili",
          },
          {
            name: "Bell pepper",
          },
        ],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.kendallScore).toBe(30);
    expect(res.body.correction).toStrictEqual([0, 1, 1, 1, 0]);
  });
});

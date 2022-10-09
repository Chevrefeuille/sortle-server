from pymongo import MongoClient
from bson.objectid import ObjectId
from flask import Flask, request
from flask_cors import CORS, cross_origin
from datetime import datetime
import random
import os

app = Flask(__name__)
CORS(app, support_credentials=True)

database_url = os.getenv("DATABASE_URL")

client = MongoClient(database_url)

db = client.sortle
rankings = db.rankings


@app.route("/daily")
@cross_origin(supports_credentials=True)
def get_daily():
    all_rankings = list(rankings.find({}))
    random.seed(datetime.now())
    rnd_index = random.randint(0, len(all_rankings) - 1)
    daily = all_rankings[rnd_index]
    response = {
        "id": str(daily["_id"]),
        "criterion": daily["criterion"],
        "left": daily["left"],
        "right": daily["right"],
        "choices": [choice["name"] for choice in daily["choices"]],
    }
    return response


@app.route("/check", methods=["POST"])
@cross_origin(supports_credentials=True)
def check_answer():
    content = request.json
    proposed_ranking = content["ranking"]
    daily = rankings.find_one({"_id": ObjectId(content["id"])})
    real_ranks = {choice["name"]: choice["rank"] for choice in daily["choices"]}
    score = 0
    correction = [0] * len(proposed_ranking)
    for rank, choice in enumerate(proposed_ranking):
        if rank == real_ranks[choice["name"]]:
            score += 1
            correction[rank] = 1
    response = {"score": score, "correction": correction, "ranking": daily["choices"]}
    return response

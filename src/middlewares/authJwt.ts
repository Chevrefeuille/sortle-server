import jwt, { TokenExpiredError } from "jsonwebtoken";
import { config } from "../config/auth.config";
import { db } from "../models";
const User = db.user;
const Role = db.role;

const catchError = (err: any, res: any) => {
  if (err instanceof TokenExpiredError) {
    return res
      .status(401)
      .send({ message: "Unauthorized. Access Token has expired." });
  }
  return res.sendStatus(401).send({ message: "Unauthorized." });
};

export const verifyToken = (req: any, res: any, next: any) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided." });
  }

  jwt.verify(token, config.SECRET, (err: any, decoded: any) => {
    if (err) {
      return catchError(err, res);
    }
    req.userId = decoded.id;
    next();
  });
};

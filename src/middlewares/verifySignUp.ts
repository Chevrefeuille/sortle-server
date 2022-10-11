import { db } from "../models";

const ROLES = db.ROLES;
const User = db.user;

export const checkDuplicateUsernameOrEmail = (
  req: any,
  res: any,
  next: any
) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: "Username is already used." });
      return;
    }

    User.findOne({
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: "Email is already used." });
        return;
      }
      next();
    });
  });
};

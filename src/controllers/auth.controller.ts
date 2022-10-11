import { config } from "../config/auth.config";
import { db } from "../models";

const User = db.user;
const Role = db.role;
const RefreshToken = db.refreshToken;

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const controller = {
  signup: (req: any, res: any) => {
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    user.save((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (req.body.roles) {
        Role.find(
          {
            name: { $in: req.body.roles },
          },
          (err: any, roles: any) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            user.roles = roles.map((role: any) => role._id);
            user.save((err) => {
              if (err) {
                res.status(500).send({ message: err });
                return;
              }

              res.send({ message: "User was registered successfully!" });
            });
          }
        );
      } else {
        Role.findOne({ name: "admin" }, (err: any, role: any) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = [role._id];
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        });
      }
    });
  },
  signin: (req: any, res: any) => {
    User.findOne({
      username: req.body.username,
    })
      .populate("roles", "-__v")
      .exec(async (err, user) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        if (!user || !user.password) {
          return res.status(404).send({ message: "User not found." });
        }

        let passwordIsValid = bcrypt.compareSync(
          req.body.password,
          user.password
        );

        if (!passwordIsValid) {
          return res.status(401).send({
            accessToken: null,
            message: "Invalid password!",
          });
        }

        let token = jwt.sign({ id: user.id }, config.SECRET, {
          expiresIn: config.JWT_EXPIRATION,
        });

        let refreshToken = await RefreshToken.createToken(user);

        var authorities = [];

        for (let i = 0; i < user.roles.length; i++) {
          authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: user._id,
          username: user.username,
          email: user.email,
          roles: authorities,
          accessToken: token,
          refreshToken: refreshToken,
        });
      });
  },
  refreshToken: async (req: any, res: any) => {
    const { refreshToken: requestToken } = req.body;

    if (requestToken == null) {
      return res.status(403).json({ message: "Refresh Token is required." });
    }
    try {
      let refreshToken = await RefreshToken.findOne({ token: requestToken });

      if (!refreshToken) {
        res
          .status(403)
          .json({ message: "Refresh token is not in the database." });
        return;
      }

      if (RefreshToken.verifyExpiration(refreshToken)) {
        RefreshToken.findByIdAndRemove(refreshToken._id, {
          useFindAndModify: false,
        }).exec();

        res.status(403).json({
          message:
            "Refresh token has expired. Please make a new signin request",
        });
        return;
      }

      let newAccessToken = jwt.sign(
        { id: refreshToken.user._id },
        config.SECRET,
        {
          expiresIn: config.JWT_EXPIRATION,
        }
      );

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: refreshToken.token,
      });
    } catch (err) {
      return res.status(500).send({ message: err });
    }
  },
};

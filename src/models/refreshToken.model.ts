import { Schema, model, PopulatedDoc, Document, Date, Model } from "mongoose";
import { config } from "../config/auth.config";
import { v4 } from "uuid";

import { User } from "./user.model";

interface RefreshToken {
  token: string;
  user: PopulatedDoc<User & Document>;
  expiryDate: Date;
}

interface RefreshTokenModel extends Model<RefreshToken> {
  createToken(arg0: User): number;
  verifyExpiration(arg0: RefreshToken): boolean;
}

const RefreshTokenSchema = new Schema<RefreshToken, RefreshTokenModel>({
  token: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  expiryDate: Date,
});

RefreshTokenSchema.statics.createToken = async function (user) {
  let expiredAt = new Date();

  expiredAt.setSeconds(expiredAt.getSeconds() + config.JWT_REFRESH_EXPIRATION);

  let _token = v4();

  let _object = new this({
    token: _token,
    user: user._id,
    expiryDate: expiredAt.getTime(),
  });

  let refreshToken = await _object.save();

  return refreshToken.token;
};

RefreshTokenSchema.statics.verifyExpiration = (token) => {
  return token.expiryDate.getTime() < new Date().getTime();
};

export const RefreshTokenModel = model<RefreshToken, RefreshTokenModel>(
  "RefreshToken",
  RefreshTokenSchema
);

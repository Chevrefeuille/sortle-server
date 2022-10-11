import mongoose from "mongoose";
import { UserModel } from "./user.model";
import { RoleModel } from "./role.model";
import { RefreshTokenModel } from "./refreshToken.model";

const db = {
  mongoose: mongoose,
  user: UserModel,
  role: RoleModel,
  refreshToken: RefreshTokenModel,
  ROLES: ["admin"],
};

export { db };

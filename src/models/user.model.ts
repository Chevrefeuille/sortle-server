import { Schema, model, PopulatedDoc, Document } from "mongoose";
import { Role } from "./role.model";

interface User {
  username: string;
  email: string;
  password: string;
  roles: PopulatedDoc<Role & Document>[];
}

const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  roles: [
    {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
  ],
});

const UserModel = model<User>("User", UserSchema);

export { User, UserModel };

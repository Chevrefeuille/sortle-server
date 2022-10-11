import { Schema, model } from "mongoose";

interface Role {
  name: string;
}

const RoleSchema = new Schema({
  name: String,
});

const RoleModel = model<Role>("Role", RoleSchema);

export { Role, RoleModel };

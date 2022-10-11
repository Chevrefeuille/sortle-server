import { Secret } from "jsonwebtoken";

export const config = {
  SECRET: process.env.SECRET_TOKEN as Secret,
  JWT_EXPIRATION: 3600, // 1 hour
  JWT_REFRESH_EXPIRATION: 86400, // 24 hours
};

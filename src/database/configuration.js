import pg from "pg";
import appConfig from "../config/appConfig.js";
import dbConfig from "../config/dbConfig.js";

const { Pool } = pg;

const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
  ssl:
    appConfig.nodeEnv === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;



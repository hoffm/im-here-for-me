import { createClient } from "redis";

const redisClient = createClient({
  host: "127.0.0.1",
  port: 6379,
});

redisClient.connect();

export default redisClient;
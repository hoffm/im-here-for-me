import crypto from "crypto";
import fastify from "fastify";
import fastifyStatic from "fastify-static";
import handlebars from "handlebars";
import path from "path";
import pointOfView from "point-of-view";
import { readFileSync, readdirSync } from "fs";
import { startQueuingCron } from "./lib/cron.js";
import redisClient from "./lib/redis.js";

startQueuingCron(redisClient);

const app = fastify({ logger: false });

app.register(fastifyStatic, {
  root: path.join(path.resolve(), "public"),
  prefix: "/",
});

app.register(pointOfView, {
  engine: { handlebars },
});

const partialsDir = "/app/src/pages/partials/";
const partialFiles = readdirSync(partialsDir);

partialFiles.forEach((fileName) => {
  const partialName = /^([^.]+).hbs$/.exec(fileName)[1];
  const template = readFileSync(path.join(partialsDir, fileName)).toString(
    "utf8"
  );
  handlebars.registerPartial(partialName, template);
});

// Calculate the queue's length and the client's position in it.
const queueStats = (queue, clientId = null) => {
  // If the client is not in line yet, pretend they're at the back.
  if (!queue.includes(clientId)) queue.push(clientId);
  const queueLength = queue.length;
  const queuePosition = queue.indexOf(clientId) + 1;
  return { queuePosition, queueLength };
};

const refreshClientKey = async (clientId) => {
  const redisKey = `client:${clientId}`;
  const currentTime = new Date().getTime();

  // Set the client's key to the current time unless it's already set.
  await redisClient.setNX(redisKey, currentTime);

  // Refresh the client key's expiry to be 10 seconds from now.
  await redisClient.expire(redisKey, 10);
};

const getQueue = async () => {
  return await redisClient.lRange("queue", 0, -1);
};

app.get("/", async (request, reply) => {
  const queue = await getQueue();
  const { queuePosition, queueLength } = queueStats(queue);
  reply.view("/src/pages/index.hbs", { queuePosition, queueLength });
});

app.get("/poll", async (request, reply) => {
  const status = request.query.status;
  const clientId = request.headers["im-here-for-me-id"] || crypto.randomUUID();

  await refreshClientKey(clientId);
  const queue = await getQueue();

  const { queuePosition, queueLength } = queueStats(queue, clientId);
  const newStatus = queuePosition === 1 ? "inside" : "outside";
  const statusChanged = status !== newStatus;
  const template = statusChanged ? handlebars.partials[newStatus] : null;

  reply
    .code(200)
    .header("Content-Type", "application/json; charset=utf-8")
    .send({ clientId, queuePosition, queueLength, template, newStatus });
});

app.listen(process.env.PORT, function (err, address) {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  app.log.info(`server listening on ${address}`);
});

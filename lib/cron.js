import cron from "node-cron";

const getClientKeys = async (redisClient) => {
  const clientKeys = [];

  // Page through all client keys to colllect them all.
  for await (const key of redisClient.scanIterator({
    COUNT: 100,
    MATCH: "client:*",
  })) {
    clientKeys.push(key);
  }

  return clientKeys;
};

const getClientIds = (clientKeys) =>
  clientKeys.map((s) => s.replace(/^client:/, ""));

const cronOperation = async (redisClient) => {
  // Retrieve IDs for all active clients
  const clientKeys = await getClientKeys(redisClient);

  if (clientKeys.length) {
    const clientIds = await getClientIds(clientKeys);
    // Retrieve arrival timestamps for all active clients
    const arrivalTimes = await redisClient.mGet(clientKeys);

    // Sort client IDs by their arrival time.
    clientIds.sort((clientA, clientB) => {
      const aIndex = clientIds.indexOf(clientA);
      const bIndex = clientIds.indexOf(clientB);
      return arrivalTimes[bIndex] - arrivalTimes[aIndex];
    });

    // Replace the old queue with the new one.
    await redisClient.lPush("tmpqueue", clientIds);
    await redisClient.rename("tmpqueue", "queue");
  } else {
    redisClient.del("queue");
  }
};

// Recalculate queue every second.
export const startQueuingCron = (redisClient) => {
  cron.schedule("*/1 * * * * *", async () => {
    (async () => await cronOperation(redisClient))();
  });
};

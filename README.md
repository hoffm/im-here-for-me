# i'm here for me

The site that only one person can access at a time.

# How does it work?

Visitors are identified by a server-generated UUID stored in browser local storage. The browser polls the server, continuing to notify the server that the visitor is still here. Each poll request refreshes the TTL on a Redis key named for the visitor's UUID. The value of the key is the timestamp at which the visitor first loaded the page. Using a node-cron job that runs every second, the server keeps a running calculation of the order active visitors arrived in as a Redis list. It uses this to respond to polling requests with the visitor's position in the queue and the total length of the queue.

If the visitor is at the front of the queue, the response also contains the HTML for the website, and the visitor gets to see it. Otherwise, they're stuck in the waiting area. When a user leaves the site, their browser stops polling the server, which causes their Redis key to expire (withing 10 seconds), which in turn removes them for a queue the next time the cron job runs (max 1 second).
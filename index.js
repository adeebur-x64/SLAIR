require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/slair-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/slair-cat", async ({ command, ack, client }) => {
  await ack();
  const loading = await client.chat.postMessage({ channel: command.channel_id, text: `Searching the internet for some cute cat images!` });

  async function fetchCatImage() {
            try {
                const response = await fetch('https://api.thecatapi.com/v1/images/search');
                const data = await response.json();

                const catImageURL = data[0].url;
                return catImageURL;
            } catch {
                // Error Handling: If bot wasn't able to fetch a cat image from the API
                await client.chat.update({channel: command.channel_id, ts: loading.ts, text: `NOOOO! I wasn't able to search for a cat image! I'm sorry!`})
            }
    };

    const imageURL = await fetchCatImage();

    await client.chat.delete({
        channel: command.channel_id,
        ts: loading.ts,
    })

    await client.chat.postMessage({
        channel: command.channel_id,
        text: "Ayy! I was able to find a cute cat image! Here you go!",
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'Here is the cute cat image I found for you:'
                }
            },
            {
                type: 'image',
                image_url: imageURL,
                alt_text: 'A picture of a cute cat!'
            }
        ]
    })
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
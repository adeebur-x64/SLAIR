require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.command("/slair-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/slair-cat", async ({ command, ack, client }) => {
  await ack();
  const loading = await client.chat.postMessage({
    channel: command.channel_id,
    text: `Searching the internet for some cute cat images!`,
  });

  async function fetchCatImage() {
    try {
      const response = await fetch(
        "https://api.thecatapi.com/v1/images/search",
      );
      const data = await response.json();

      const catImageURL = data[0].url;
      return catImageURL;
    } catch {
      // Error Handling: If bot wasn't able to fetch a cat image from the API
      await client.chat.update({
        channel: command.channel_id,
        ts: loading.ts,
        text: `NOOOO! I wasn't able to search for a cat image! I'm sorry!`,
      });
    }
  }

  const imageURL = await fetchCatImage();

  await client.chat.delete({
    channel: command.channel_id,
    ts: loading.ts,
  });

  await client.chat.postMessage({
    channel: command.channel_id,
    text: "Ayy! I was able to find a cute cat image! Here you go!",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Here is the cute cat image I found for you:",
        },
      },
      {
        type: "image",
        image_url: imageURL,
        alt_text: "A picture of a cute cat!",
      },
    ],
  });
});

app.command("/slair-dog", async ({ command, ack, client }) => {
  await ack();
  const loading = await client.chat.postMessage({
    channel: command.channel_id,
    text: `Searching the internet for some cute dog images!`,
  });

  async function fetchDogImage() {
    try {
      const response = await fetch(
        "https://api.thedogapi.com/v1/images/search",
      );
      const data = await response.json();

      const dogImageURL = data[0].url;
      return dogImageURL;
    } catch {
      // Error Handling: If bot wasn't able to fetch a dog image from the API
      await client.chat.update({
        channel: command.channel_id,
        ts: loading.ts,
        text: `NOOOO! I wasn't able to search for a dog image! I'm sorry!`,
      });
    }
  }

  const imageURL = await fetchDogImage();

  await client.chat.delete({
    channel: command.channel_id,
    ts: loading.ts,
  });

  await client.chat.postMessage({
    channel: command.channel_id,
    text: "Ayy! I was able to find a cute dog image! Here you go!",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Here is the cute dog image I found for you:",
        },
      },
      {
        type: "image",
        image_url: imageURL,
        alt_text: "A picture of a cute dog!",
      },
    ],
  });
});

app.command("/slair-uselessfact", async ({ command, ack, client }) => {
  await ack();
  const loading = await client.chat.postMessage({
    channel: command.channel_id,
    text: `Searching the internet for some useless facts!`,
  });

  async function fetchUselessFact() {
    try {
      const response = await fetch(
        "https://uselessfacts.jsph.pl/random.json?language=en",
      );
      const data = await response.json();

      const uselessFact = data.text;
      return uselessFact;
    } catch {
      // Error Handling: If bot wasn't able to fetch a useless fact from the API
      await client.chat.update({
        channel: command.channel_id,
        ts: loading.ts,
        text: `Oops! I wasn't able to find a useless fact! I'm sorry!`,
      });
    }
  }

  const uselessFact = await fetchUselessFact();

  await client.chat.update({
    channel: command.channel_id,
    ts: loading.ts,
    text: `*Useless Fact:* ${uselessFact}`,
  });
});

app.command("/slair-cryptoprice", async ({ body, ack, client, command }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "crypto_name_modal",
        private_metadata: command.channel_id,
        title: { type: "plain_text", text: "Crypto Name Modal" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "crypto_name_input_block",
            element: {
              type: "plain_text_input",
              action_id: "crypto_name_input",
              placeholder: {
                type: "plain_text",
                text: "Bitcoin, Ethereum, Dogecoin, etc.",
              },
            },
            label: {
              type: "plain_text",
              text: "Enter the name of the crypto currency whose price you want to fetch.",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
});

app.view("crypto_name_modal", async ({ ack, body, view, client }) => {
  await ack();

  const channelID = view.private_metadata;

  try {
    const userInput =
      view.state.values["crypto_name_input_block"]["crypto_name_input"].value;

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${userInput.toLowerCase()}&vs_currencies=usd`;

      const response = await fetch(url);

      const data = await response.json();

      if (data[userInput.toLowerCase()]) {
        const price = data[userInput.toLowerCase()].usd;
        await client.chat.postMessage({
          channel: channelID,
          text: `The current price of *${userInput}* is *$${price}*.`,
        });
      } else {
        await client.chat.postMessage({
          channel: channelID,
          text: `I couldn't find the price for *${userInput}*. Maybe it's not a cryptocurrency?`,
        });
      }
    } catch (error) {
      console.error(error);
      await client.chat.postMessage({
        channel: channelID,
        text: "I encountered an error while fetching the price.",
      });
    }
  } catch (error) {
    console.error("Error handling modal submission:", error);
  }
});

app.command("/slair-8ball", async ({ body, ack, client, command }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "8ball_question_modal",
        private_metadata: command.channel_id,
        title: { type: "plain_text", text: "8Ball Question Modal" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "8ball_question_block",
            element: {
              type: "plain_text_input",
              action_id: "8ball_question_input",
              placeholder: {
                type: "plain_text",
                text: "Ask a question you want the 8Ball to answer.",
              },
            },
            label: {
              type: "plain_text",
              text: "Enter your question here of which you want the prediction.",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
});

app.view("8ball_question_modal", async ({ ack, body, view, client }) => {
  await ack();

  const channelID = view.private_metadata;

  try {
    const userInput =
      view.state.values["8ball_question_block"]["8ball_question_input"].value;

    try {
      const answers = [
        "Yep Definitely!",
        "Not at all!",
        "Nope",
        "Yep",
        "What kind of question is this? Obviously no!",
        "Never!",
        "I'm not sure about this one.",
        "Yeah!",
        "Maybe!",
        "There is a high chance of that happening!",
        "No.",
        "Very unlikely.",
        "I'm doubtful that's gonna happen",
        "Without a doubt!",
        "Absolutely!",
      ];

      const botPrediction = answers[Math.floor(Math.random() * answers.length)];

      await client.chat.postMessage({
        channel: channelID,
        text: `*The Magic 8 Ball!*\nQuestion: *${userInput}*\nBot's Prediction: *${botPrediction}*`,
      });
    } catch (error) {
      console.error(error);
      await client.chat.postMessage({
        channel: channelID,
        text: "I encountered an error while generating the prediction.",
      });
    }
  } catch (error) {
    console.error("Error handling modal submission:", error);
  }
});

(async () => {
  await app.start();
  console.log("Bot has started running! Try a command!");
})();

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

app.view("8ball_question_modal", async ({ ack, view, client }) => {
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

app.command("/slair-coinflip", async ({ ack, client, command }) => {
  await ack();

  const flipping = await client.chat.postMessage({
    channel: command.channel_id,
    text: "*Flipping a coin...*",
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  await delay(1000);

  try {
    const coinFlipResults = ["Heads", "Tails"];
    const botPrediction =
      coinFlipResults[Math.floor(Math.random() * coinFlipResults.length)];

    const guessResponse = await client.chat.update({
      channel: command.channel_id,
      ts: flipping.ts,
      text: `The coin has flipped! Guess whether it landed on heads or tails!`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "The coin has flipped! Guess whether it landed on heads or tails!",
            emoji: true,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Heads",
              },
              style: "primary",
              action_id: "guess_heads",
              value: botPrediction,
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Tails",
              },
              style: "danger",
              action_id: "guess_tails",
              value: botPrediction,
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Error occurred:", error);
  }
});

app.action("guess_heads", async ({ ack, body, action, client }) => {
  await ack();

  const channelID = body.channel.id;
  const messageTS = body.message.ts;
  const botPrediction = action.value;

  try {
    if (botPrediction == "Heads") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "*You guessed it right! The coin landed on Heads!*",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You guessed it right! The coin landed on Heads!",
              emoji: true,
            },
          },
        ],
      });
    } else {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "*Nuh Uh! The coin landed on Tails while your guess was Heads!*",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Nuh Uh! The coin landed on Tails while your guess was Heads!",
              emoji: true,
            },
          },
        ],
      });
    }
  } catch {}
});

app.action("guess_tails", async ({ ack, body, action, client }) => {
  await ack();

  const channelID = body.channel.id;
  const messageTS = body.message.ts;
  const botPrediction = action.value;

  try {
    if (botPrediction == "Tails") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "*You guessed it right! The coin landed on Tails!*",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You guessed it right! The coin landed on Tails!",
              emoji: true,
            },
          },
        ],
      });
    } else {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "*Nuh Uh! The coin landed on Heads while your guess was Tails!*",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Nuh Uh! The coin landed on Heads while your guess was Tails!",
              emoji: true,
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error("Error occurred:", error);
  }
});

app.command("/slair-rps", async ({ ack, client, command }) => {
  await ack();
  try {
    const botChoice = ["Rock", "Paper", "Scissors"];
    const botResult = botChoice[Math.floor(Math.random() * botChoice.length)];
    await client.chat.postMessage({
      channel: command.channel_id,
      text: "Rock Paper Scissors Shoot! I've picked my move. Pick yours below",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Rock Paper Scissors Shoot! I've picked my move. Pick yours below",
            emoji: true,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Rock",
              },
              style: "primary",
              action_id: "guess_rock",
              value: botResult,
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Paper",
              },
              style: "primary",
              action_id: "guess_paper",
              value: botResult,
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Scissors",
              },
              style: "primary",
              action_id: "guess_scissors",
              value: botResult,
            },
          ],
        },
      ],
    });
  } catch {
    console.error("Error occurred:", error);
  }
});

app.action("guess_rock", async ({ ack, body, action, client }) => {
  await ack();

  const channelID = body.channel.id;
  const messageTS = body.message.ts;
  const botResult = action.value;

  try {
    if (botResult == "Rock") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Rock! I picked Rock\nIt's a tie!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Rock! I picked Rock\nIt's a tie!",
              emoji: true,
            },
          },
        ],
      });
    } else if (botResult == "Paper") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Rock! I picked Paper\nI Won!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Rock! I picked Paper\nI Won!",
              emoji: true,
            },
          },
        ],
      });
    } else {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Rock! I picked Scissors\nYou Won! Well, I wanted to win! :(",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Rock! I picked Scissors\nYou Won! Well, I wanted to win! :(",
              emoji: true,
            },
          },
        ],
      });
    }
  } catch {
    console.error("Error occurred:", error);
  }
});

app.action("guess_paper", async ({ ack, body, action, client }) => {
  await ack();

  const channelID = body.channel.id;
  const messageTS = body.message.ts;
  const botResult = action.value;

  try {
    if (botResult == "Paper") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Paper! I picked Paper\nIt's a tie!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Paper! I picked Paper\nIt's a tie!",
              emoji: true,
            },
          },
        ],
      });
    } else if (botResult == "Rock") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Paper! I picked Rock\nYou Won! Well, I wanted to win! :(",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Paper! I picked Rock\nYou Won! Well, I wanted to win! :(",
              emoji: true,
            },
          },
        ],
      });
    } else {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Paper! I picked Scissors\nI Won!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Paper! I picked Scissors\nI Won!",
              emoji: true,
            },
          },
        ],
      });
    }
  } catch {
    console.error("Error occurred:", error);
  }
});

app.action("guess_scissors", async ({ ack, body, action, client }) => {
  await ack();

  const channelID = body.channel.id;
  const messageTS = body.message.ts;
  const botResult = action.value;

  try {
    if (botResult == "Scissors") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Scissors! I picked Scissors\nIt's a tie!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Scissors! I picked Scissors\nIt's a tie!",
              emoji: true,
            },
          },
        ],
      });
    } else if (botResult == "Paper") {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Scissors! I picked Paper\nYou Won! Well, I wanted to win! :(",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Scissors! I picked Paper\nYou Won! Well, I wanted to win! :(",
              emoji: true,
            },
          },
        ],
      });
    } else {
      await client.chat.update({
        channel: channelID,
        ts: messageTS,
        text: "You picked Scissors! I picked Rock\nI Won!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "You picked Scissors! I picked Rock\nI Won!",
              emoji: true,
            },
          },
        ],
      });
    }
  } catch {
    console.error("Error occurred:", error);
  }
});

app.command("/slair-unscramble", async ({ command, ack, client }) => {
  await ack();

  const loading = await client.chat.postMessage({
    channel: command.channel_id,
    text: `I'm searching for a word and scrambling it!`,
  });

  async function fetchARandomWord() {
    try {
      const wordLength = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
      const dictionaryAPIURL = `https://random-word-api.herokuapp.com/word?length=${wordLength}`;
      const response = await fetch(dictionaryAPIURL);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data[0];
    } catch {
      await client.chat.update({
        channel: command.channel_id,
        ts: loading.ts,
        text: `Oops! I wasn't able to search for a word!`,
      });
      return null;
    }
  }

  const randomWord = await fetchARandomWord();
  if (!randomWord) return;

  const scrambledWord = randomWord
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  const gameState = JSON.stringify({
    word: randomWord,
    scrambledWord,
    attempts: 0,
  });

  await client.chat.update({
    channel: command.channel_id,
    ts: loading.ts,
    text: `I have chosen the word and scrambled it! Here it is: *${scrambledWord}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `I have chosen the word and scrambled it! Here it is: *${scrambledWord}*`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Unscramble",
            },
            style: "primary",
            action_id: "unscramble_btn",
            value: gameState,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Give up",
            },
            style: "danger",
            action_id: "give_up_btn",
            value: gameState,
          },
        ],
      },
    ],
  });
});

app.action("unscramble_btn", async ({ ack, body, action, client }) => {
  await ack();

  try {
    const gameState = JSON.parse(action.value);
    const metadata = JSON.stringify({
      channelId: body.channel.id,
      messageTs: body.message.ts,
      word: gameState.word,
      scrambledWord: gameState.scrambledWord,
      attempts: gameState.attempts,
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "unscramble_guess_modal",
        private_metadata: metadata,
        title: { type: "plain_text", text: "Enter your guess" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "unscramble_guess_block",
            element: {
              type: "plain_text_input",
              action_id: "unscramble_guess_input",
              placeholder: {
                type: "plain_text",
                text: "Bed, Derp, Nerd, Water, Window...",
              },
            },
            label: {
              type: "plain_text",
              text: "Enter your guess for the scrambled word.",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
});

app.view("unscramble_guess_modal", async ({ ack, view, client }) => {
  const userInput =
    view.state.values["unscramble_guess_block"][
      "unscramble_guess_input"
    ].value.trim();

  if (!/^[a-zA-Z]+$/.test(userInput)) {
    await ack({
      response_action: "errors",
      errors: {
        unscramble_guess_block: "Guess must be a word.",
      },
    });
    return;
  }

  await ack();

  try {
    const metadata = JSON.parse(view.private_metadata);
    const { channelId, messageTs, word, scrambledWord } = metadata;
    let attempts = metadata.attempts + 1;

    if (userInput.toLowerCase() === word.toLowerCase()) {
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `Woah! You guessed the word correctly! It was *${word}*.\nNumber of attempts you did: *${attempts}*`,
        blocks: [],
      });
    } else {
      const newGameState = JSON.stringify({ word, scrambledWord, attempts });

      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `Your guess (*${userInput}*) is incorrect! Try again.\nI have chosen the word and scrambled it! Here it is: *${scrambledWord}*\nAttempts: *${attempts}*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Your guess (*${userInput}*) is incorrect! Try again.\nI have chosen the word and scrambled it! Here it is: *${scrambledWord}*\nAttempts: *${attempts}*`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Unscramble",
                },
                style: "primary",
                action_id: "unscramble_btn",
                value: newGameState,
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Give up",
                },
                style: "danger",
                action_id: "give_up_btn",
                value: newGameState,
              },
            ],
          },
        ],
      });
    }
  } catch (error) {
    console.error("Error handling modal submission:", error);
  }
});

app.action("give_up_btn", async ({ ack, body, action, client }) => {
  await ack();

  try {
    const gameState = JSON.parse(action.value);
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: `Haha! I knew you would give up! The word I had selected was *${gameState.word}*.\nNumber of attempts you did: *${gameState.attempts}*`,
      blocks: [],
    });
  } catch (error) {
    console.error("Error giving up:", error);
  }
});

app.command("/slair-guessthenumber", async ({ command, ack, client }) => {
  await ack();

  const loading = await client.chat.postMessage({
    channel: command.channel_id,
    text: `I'm thinking of a number between 1 and 100!`,
  });

  async function fetchARandomNumber() {
    try {
      const number = Math.floor(Math.random() * 100) + 1;
      return number;
    } catch {
      await client.chat.update({
        channel: command.channel_id,
        ts: loading.ts,
        text: `Oops! I wasn't able to think of a number!`,
      });
      return null;
    }
  }

  const randomNumber = await fetchARandomNumber();
  if (!randomNumber) return;

  const gameState = JSON.stringify({
    number: randomNumber,
    attempts: 0,
  });

  await client.chat.update({
    channel: command.channel_id,
    ts: loading.ts,
    text: `I have chosen a number between 1 and 100! Can you guess it?`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `I have chosen a number between 1 and 100! Can you guess it?`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Guess",
            },
            style: "primary",
            action_id: "guess_btn",
            value: gameState,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Give up",
            },
            style: "danger",
            action_id: "give_up_btn",
            value: gameState,
          },
        ],
      },
    ],
  });
});

app.action("guess_btn", async ({ ack, body, action, client }) => {
  await ack();

  try {
    const gameState = JSON.parse(action.value);
    const metadata = JSON.stringify({
      channelId: body.channel.id,
      messageTs: body.message.ts,
      number: gameState.number,
      attempts: gameState.attempts,
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "num_guess_modal",
        private_metadata: metadata,
        title: { type: "plain_text", text: "Enter your guess" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "num_guess_block",
            element: {
              type: "plain_text_input",
              action_id: "num_guess_input",
              placeholder: {
                type: "plain_text",
                text: "18, 21, 3, 43, 56...",
              },
            },
            label: {
              type: "plain_text",
              text: "Enter your guess for the number.",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
});

app.view("num_guess_modal", async ({ ack, view, client }) => {
  const userInput =
    view.state.values["num_guess_block"]["num_guess_input"].value.trim();

  if (!/^\d+$/.test(userInput)) {
    await ack({
      response_action: "errors",
      errors: {
        num_guess_block: "Guess must be a number.",
      },
    });
    return;
  }

  await ack();

  try {
    const metadata = JSON.parse(view.private_metadata);
    const { channelId, messageTs, number } = metadata;
    let attempts = metadata.attempts + 1;
    const userGuess = parseInt(userInput, 10);

    if (userGuess === number) {
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `Woah! You guessed the number correctly! It was *${number}*.\nNumber of attempts you did: *${attempts}*`,
        blocks: [],
      });
    } else if (userGuess < number) {
      const newGameState = JSON.stringify({ number, attempts });

      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `Your guess (*${userInput}*) is too low! Try again.\nAttempts: *${attempts}*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Your guess (*${userInput}*) is too low! Try again.\nAttempts: *${attempts}*`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Guess",
                },
                style: "primary",
                action_id: "guess_btn",
                value: newGameState,
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Give up",
                },
                style: "danger",
                action_id: "give_up_btn",
                value: newGameState,
              },
            ],
          },
        ],
      });
    } else if (userGuess > number) {
      const newGameState = JSON.stringify({ number, attempts });

      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `Your guess (*${userInput}*) is too high! Try again.\nAttempts: *${attempts}*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Your guess (*${userInput}*) is too high! Try again.\nAttempts: *${attempts}*`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Guess",
                },
                style: "primary",
                action_id: "guess_btn",
                value: newGameState,
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Give up",
                },
                style: "danger",
                action_id: "give_up_btn",
                value: newGameState,
              },
            ],
          },
        ],
      });
    }
  } catch (error) {
    console.error("Error handling modal submission:", error);
  }
});

app.action("give_up_btn", async ({ ack, body, action, client }) => {
  await ack();

  try {
    const gameState = JSON.parse(action.value);
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: `Haha! I knew you would give up! The number I had selected was *${gameState.number}*.\nNumber of attempts you did: *${gameState.attempts}*`,
      blocks: [],
    });
  } catch (error) {
    console.error("Error giving up:", error);
  }
});

(async () => {
  await app.start();
  console.log("Bot has started running! Try a command!");
})();

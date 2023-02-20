require("dotenv").config();
const { Bot, webhookCallback } = require("grammy");
const pornhub = require("@justalk/pornhub-api");
const regex = /https?:\/\/(www\.)?pornhub\.(com|org)\/[a-zA-Z0-9_\.]+\/?/;

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// DB

const mysql = require("mysql2");
const connection = mysql.createConnection(process.env.DATABASE_URL);

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply("*Welcome!* ✨ Send a Pornhub link.", {
      parse_mode: "Markdown",
    })
    .then(
      connection.query(
        `
SELECT * FROM users WHERE userid = ?
`,
        [ctx.from.id],
        (error, results) => {
          if (error) throw error;
          if (results.length === 0) {
            connection.query(
              `
    INSERT INTO users (userid, username, firstName, lastName, firstSeen)
    VALUES (?, ?, ?, ?, NOW())
  `,
              [
                ctx.from.id,
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name,
              ],
              (error, results) => {
                if (error) throw error;
                console.log("New user added:", ctx.from);
              }
            );
          } else {
            console.log("User exists in database.", ctx.from);
          }
        }
      )
    )
    .catch((e) => console.error(e));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\n_This bot downloads videos from Pornhub.\nSend a link to a post to try it out._",
      { parse_mode: "Markdown" }
    )
    .then(console.log("Help command sent to", ctx.from.id))
    .catch((e) => console.error(e));
});

// Messages

bot.on("msg", async (ctx) => {
  if (!regex.test(ctx.msg.text)) {
    await ctx.reply("*Send a Pornhub video link.*", {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.msg.message_id,
    });
  } else {
    const status = await ctx.reply("*Downloading*", { parse_mode: "Markdown" });
    setTimeout(async () => {
      await ctx.api.deleteMessage(ctx.chat.id, status.message_id);
    }, 5000);
    try {
      const url = ctx.msg.text;
      console.log("Query:", url, "by", ctx.from.id);
      const video = await pornhub.page(url, ["title", "download_urls"]);
      await ctx.reply(video.title, { reply_to_message_id: ctx.msg.message_id });
      await ctx.reply(video.download_urls["480P"]);
    } catch (error) {
      console.error(error);
      await ctx.reply(
        `*An error occured.*\n_Are you sure the link is correct?_`,
        {
          parse_mode: "Markdown",
          reply_to_message_id: ctx.msg.message_id,
        }
      );
    }
  }
});

// Run

export default webhookCallback(bot, "http");

require("dotenv").config();
const { Bot, InputFile } = require("grammy");
const pornhub = require("@justalk/pornhub-api");

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply("*Welcome!* ✨ Send a Pornhub link.", {
      parse_mode: "Markdown",
    })
    .then(console.log("New user added:\n", ctx.from))
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
  try {
    const url = ctx.msg.text;
    console.log("Query:", url, "by", ctx.from.id);
    const video = await pornhub.page(url, ["title", "download_urls"]);
    console.log(video);
    console.log(video.title);
    await ctx.reply(video.title, { reply_to_message_id: ctx.msg.message_id });
    await ctx.reply(video.download_urls["480P"]);
    await ctx.replyWithDocument(video.download_urls["480P"]);
  } catch (error) {
    console.error(error);
    await ctx.reply(`*An error occured.*`, {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.msg.message_id,
    });
  }
});

// Run

bot.start();

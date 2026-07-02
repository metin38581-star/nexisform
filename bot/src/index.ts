import "dotenv/config";
import {
  bumpViews,
  createBotAnswer,
  createBotQuestion,
  createBotUser,
  ensureUserPool,
  fetchRecentQuestions,
  likeQuestion,
  pickAnswerer,
  pickLiker,
} from "./actions.js";
import { isGeminiEnabled } from "./gemini.js";
import { pickRandom, randomInt } from "./generators.js";

const MIN_DELAY = Number(process.env.BOT_MIN_DELAY_MS ?? 25000);
const MAX_DELAY = Number(process.env.BOT_MAX_DELAY_MS ?? 90000);
const ACTIONS_PER_CYCLE = Number(process.env.BOT_ACTIONS_PER_CYCLE ?? 2);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return randomInt(MIN_DELAY, MAX_DELAY);
}

function log(message: string) {
  const time = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  console.log(`[${time}] ${message}`);
}

type ActionType = "register" | "question" | "answer" | "like" | "views";

async function runAction(type: ActionType): Promise<void> {
  const users = await ensureUserPool(10);

  switch (type) {
    case "register": {
      const user = await createBotUser();
      log(`Yeni kullanıcı: @${user.username} (${user.gender})`);
      break;
    }
    case "question": {
      const author = pickRandom(users);
      const q = await createBotQuestion(author);
      log(`Soru [${q.source}]: "${q.title}" — @${author.username}`);
      break;
    }
    case "answer": {
      const questions = await fetchRecentQuestions(20);
      if (questions.length === 0) {
        const author = pickRandom(users);
        const q = await createBotQuestion(author);
        log(`Soru (cevap yoktu) [${q.source}]: "${q.title}"`);
        break;
      }
      const target = pickRandom(questions);
      const answerer = await pickAnswerer(target.user_id, users);
      if (!answerer) break;
      const result = await createBotAnswer(target, answerer);
      log(
        `Cevap [${result.source}]: "${target.title.slice(0, 40)}..." — @${answerer.username}`
      );
      break;
    }
    case "like": {
      const questions = await fetchRecentQuestions(25);
      if (questions.length === 0) break;
      const target = pickRandom(questions);
      const liker = await pickLiker([target.user_id], users);
      const liked = await likeQuestion(target.id, liker);
      if (liked) {
        log(`Beğeni: "${target.title.slice(0, 40)}..." — @${liker.username}`);
      }
      break;
    }
    case "views": {
      const questions = await fetchRecentQuestions(10);
      if (questions.length === 0) break;
      const target = pickRandom(questions);
      await bumpViews(target.id, target.views_count);
      log(`Görüntülenme artırıldı: "${target.title.slice(0, 40)}..."`);
      break;
    }
  }
}

function pickActions(): ActionType[] {
  const pool: ActionType[] = [
    "register",
    "register",
    "question",
    "question",
    "answer",
    "answer",
    "answer",
    "like",
    "like",
    "views",
  ];

  const count = randomInt(1, ACTIONS_PER_CYCLE);
  const picked: ActionType[] = [];

  for (let i = 0; i < count; i++) {
    picked.push(pickRandom(pool));
  }

  return picked;
}

async function cycle() {
  const actions = pickActions();
  log(`Tur başladı (${actions.length} aksiyon)`);

  for (const action of actions) {
    try {
      await runAction(action);
    } catch (err) {
      log(`Hata (${action}): ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(randomInt(3000, 8000));
  }
}

async function main() {
  log("Nexis Forum Bot başlatıldı — nexisaiform.com");
  log(
    `Gemini: ${isGeminiEnabled() ? "AÇIK (insan üslubu)" : "KAPALI — GOOGLE_AI_API_KEY ekle"}`
  );
  log(`Gecikme: ${MIN_DELAY}-${MAX_DELAY}ms | Tur başına: 1-${ACTIONS_PER_CYCLE} aksiyon`);

  await ensureUserPool(5);
  log("Kullanıcı havuzu hazır.");

  while (true) {
    await cycle();
    const wait = randomDelay();
    log(`Sonraki tur ${Math.round(wait / 1000)} sn sonra...`);
    await sleep(wait);
  }
}

main().catch((err) => {
  console.error("Bot çöktü:", err);
  process.exit(1);
});

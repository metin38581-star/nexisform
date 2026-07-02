import "dotenv/config";
import {
  createBotAnswer,
  createBotQuestion,
  fetchQuestionsByOthers,
  likeQuestion,
  pickQuestionDifferentTopic,
} from "./actions.js";
import { randomInt } from "./generators.js";
import { isOpenAiEnabled } from "./openai.js";
import {
  loginBotAccount,
  logoutBotAccount,
  registerBotAccount,
} from "./session.js";

const TOUR_DELAY_MS = Number(process.env.BOT_TOUR_DELAY_MS ?? 10000);
const ANSWERS_PER_SESSION_MIN = Number(process.env.BOT_ANSWERS_MIN ?? 1);
const ANSWERS_PER_SESSION_MAX = Number(process.env.BOT_ANSWERS_MAX ?? 2);

let lastSessionUserId: string | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string) {
  const time = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  console.log(`[${time}] ${message}`);
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

async function runSessionCycle(): Promise<void> {
  const registered = await registerBotAccount();

  if (registered.id === lastSessionUserId) {
    throw new Error(
      `Aynı hesap tekrar seçildi (@${registered.username} / ${registered.id})`
    );
  }

  log(
    `Kayıt: @${registered.username} [${shortId(registered.id)}] (${registered.email})`
  );

  const session = await loginBotAccount(registered.email, registered.password);

  if (session.id !== registered.id) {
    throw new Error("Kayıt ve giriş hesapları eşleşmiyor.");
  }

  log(`Giriş: @${session.username} [${shortId(session.id)}]`);
  lastSessionUserId = session.id;

  await sleep(randomInt(1500, 4000));

  const question = await createBotQuestion(session);
  log(
    `Soru [${question.source}]: "${question.title}" — @${session.username} [${shortId(session.id)}] (${question.category})`
  );

  const answerCount = randomInt(ANSWERS_PER_SESSION_MIN, ANSWERS_PER_SESSION_MAX);

  for (let i = 0; i < answerCount; i++) {
    await sleep(randomInt(2000, 5000));

    const others = await fetchQuestionsByOthers(session.id, 40);
    const target = pickQuestionDifferentTopic(others, question.category);

    if (!target) {
      log("Cevaplanacak başka soru yok.");
      break;
    }

    const result = await createBotAnswer(target, session);
    log(
      `Cevap [${result.source}]: @${session.username} [${shortId(session.id)}] → "${target.title.slice(0, 45)}..." (${target.category})`
    );
  }

  if (Math.random() > 0.5) {
    await sleep(randomInt(1000, 3000));
    const others = await fetchQuestionsByOthers(session.id, 25);
    const toLike = pickQuestionDifferentTopic(others, question.category);
    if (toLike) {
      const liked = await likeQuestion(toLike.id, session);
      if (liked) {
        log(`Beğeni: @${session.username} [${shortId(session.id)}]`);
      }
    }
  }

  logoutBotAccount(session);
  log(`Çıkış: @${session.username} [${shortId(session.id)}]`);
}

async function main() {
  log("Nexis Forum Bot — kayıt → giriş → soru → cevap → çıkış");
  log(
    `OpenAI: ${isOpenAiEnabled() ? "AÇIK" : "KAPALI — OPENAI_API_KEY ekle"}`
  );
  log(`Tur aralığı: ${TOUR_DELAY_MS / 1000} sn`);

  while (true) {
    try {
      await runSessionCycle();
    } catch (err) {
      log(`Tur hatası: ${err instanceof Error ? err.message : String(err)}`);
    }

    log(`Yeni hesap ${TOUR_DELAY_MS / 1000} sn sonra...`);
    await sleep(TOUR_DELAY_MS);
  }
}

main().catch((err) => {
  console.error("Bot çöktü:", err);
  process.exit(1);
});

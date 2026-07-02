import {
  generatePassword,
  generateRandomEmail,
  generateUsername,
} from "./generators.js";
import { loginViaSite, registerViaSite } from "./site-auth.js";
import { BotUser } from "./supabase.js";

export interface BotSession extends BotUser {
  email: string;
  password: string;
}

export async function registerBotAccount(): Promise<BotSession> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { username, gender } = generateUsername();
    const email = generateRandomEmail(username);
    const password = generatePassword();

    try {
      const user = await registerViaSite({
        username,
        email,
        password,
        gender,
      });

      return {
        id: user.id,
        username: user.username,
        gender: user.gender as BotUser["gender"],
        email: email.toLowerCase(),
        password,
      };
    } catch (err) {
      const status =
        err instanceof Error && "status" in err
          ? (err as Error & { status?: number }).status
          : undefined;

      if (status === 409) continue;
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error("Bot hesabı oluşturulamadı (çok fazla çakışma).");
}

export async function loginBotAccount(
  email: string,
  password: string
): Promise<BotSession> {
  const user = await loginViaSite(email, password);

  return {
    id: user.id,
    username: user.username,
    gender: user.gender as BotUser["gender"],
    email: email.toLowerCase(),
    password,
  };
}

export function logoutBotAccount(_session: BotSession): void {
  // Site oturumu localStorage'da; bot bellekteki hesabı bırakır.
}

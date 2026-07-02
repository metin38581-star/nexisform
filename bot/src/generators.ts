export const CATEGORIES = [
  "İlişkiler",
  "Moda & Stil",
  "Kariyer",
  "Sağlık",
  "Teknoloji",
  "Yaşam",
  "Genel",
] as const;

const FEMALE_NAMES = [
  "Ayşe",
  "Zeynep",
  "Elif",
  "Derya",
  "Melis",
  "Büşra",
  "Seda",
  "Cansu",
  "İrem",
  "Yasemin",
  "Hande",
  "Pınar",
  "Ece",
  "Deniz",
  "Selin",
  "Esra",
  "Gamze",
  "Tuğba",
  "Merve",
  "Damla",
];

const MALE_NAMES = [
  "Mehmet",
  "Can",
  "Emre",
  "Burak",
  "Kerem",
  "Onur",
  "Mert",
  "Barış",
  "Kadir",
  "Tolga",
  "Serkan",
  "Alp",
  "Yusuf",
  "Oğuz",
  "Efe",
  "Murat",
  "Berk",
  "Cem",
  "Umut",
  "Kaan",
];

const SURNAMES = [
  "Yılmaz",
  "Kaya",
  "Demir",
  "Çelik",
  "Şahin",
  "Yıldız",
  "Aydın",
  "Öztürk",
  "Arslan",
  "Doğan",
  "Kılıç",
  "Aslan",
  "Koç",
  "Kurt",
  "Polat",
  "Erdoğan",
  "Güneş",
  "Aksoy",
  "Tekin",
  "Bulut",
  "Taş",
  "Karaca",
  "Özkan",
  "Acar",
  "Kaplan",
];

const QUESTION_TEMPLATES: Record<string, { titles: string[]; bodies: string[] }> = {
  İlişkiler: {
    titles: [
      "Flörtüm mesajlarıma geç dönüyor, endişelenmeli miyim?",
      "İlk buluşmada ne konuşulur sizce?",
      "Uzun mesafe ilişkisi yürür mü?",
      "Sevgilim hediye konusunda umursamaz, normal mi?",
      "Ayrılık sonrası tekrar barışmak mantıklı mı?",
    ],
    bodies: [
      "Son bir haftadır cevaplar çok gecikiyor. İş yoğun diyor ama yine de içime bir kurt düştü. Siz olsanız nasıl davranırdınız?",
      "Yarın ilk buluşmam var ve aşırı heyecanlıyım. Konu açmakta zorlanıyorum, tavsiyelerinizi bekliyorum.",
      "3 aydır farklı şehirlerdeyiz. Hafta sonları görüşüyoruz ama yorucu olmaya başladı. Deneyimi olan var mı?",
    ],
  },
  "Moda & Stil": {
    titles: [
      "Ofis için sade ama şık kombin önerisi?",
      "Sonbahar için bot öneriniz var mı?",
      "Minimal gardırop nasıl kurulur?",
      "Davet için siyah elbise mi renkli mi?",
      "Günlük makyaj rutini önerir misiniz?",
    ],
    bodies: [
      "Kurumsal ortamda çalışıyorum, çok abartmadan şık görünmek istiyorum. Bütçem orta seviye.",
      "Ayakkabı alacağım ama hem rahat hem şık olsun istiyorum. Marka öneriniz olur mu?",
      "Dolabım karışık, az parçayla çok kombin çıkarmak istiyorum. Nereden başlamalıyım?",
    ],
  },
  Kariyer: {
    titles: [
      "İş değiştirmek için doğru zaman mı?",
      "Mülakatta maaş beklentisi nasıl söylenir?",
      "Uzaktan çalışma verimini artırmak için ne yapıyorsunuz?",
      "Staj sonrası teklif gelmezse ne yapmalı?",
      "Yeni mezun için CV tavsiyesi",
    ],
    bodies: [
      "Mevcut işim stabil ama büyüme alanı sınırlı. Risk alıp geçmeli miyim sizce?",
      "3 yıllık deneyimim var, İK görüşmesinde rakam söylemekten çekiniyorum.",
      "Evden çalışınca odaklanmak zor oluyor. Küçük rutinleriniz varsa paylaşır mısınız?",
    ],
  },
  Sağlık: {
    titles: [
      "Uyku düzenini toparlamak için ne işe yaradı?",
      "Spora yeni başlayanlara tavsiye",
      "Stresli dönemde beslenme nasıl olmalı?",
      "Günde kaç bardak su içiyorsunuz?",
      "Evde yapılabilecek egzersiz önerisi",
    ],
    bodies: [
      "Son zamanlarda geç yatıp geç kalkıyorum. Sizin işe yarayan alışkanlıklarınız neler?",
      "Haftada 3 gün yürüyüş planlıyorum, başlangıç için yeterli mi?",
      "Sınav/hazırlık dönemindeyim, basit ama sağlıklı atıştırmalık öneriniz var mı?",
    ],
  },
  Teknoloji: {
    titles: [
      "Telefon alırken nelere bakıyorsunuz?",
      "Yapay zeka araçları işinizi kolaylaştırıyor mu?",
      "Laptop önerisi lazım",
      "Günlük kullanım için kulaklık tavsiyesi",
      "Veri yedekleme nasıl yapıyorsunuz?",
    ],
    bodies: [
      "Bütçem 25-30 bin bandında, kamera ve batarya önceliğim. Ne kullanıyorsunuz?",
      "ChatGPT ve benzeri araçları aktif kullanan var mı, verim gerçekten artıyor mu?",
      "Üniversite + hafif tasarım işleri için makine arıyorum. Deneyim paylaşır mısınız?",
    ],
  },
  Yaşam: {
    titles: [
      "Hafta sonu kaçamak öneriniz var mı?",
      "Evde keyifli vakit geçirmek için ne yapıyorsunuz?",
      "Yeni şehre taşınmak zor mu?",
      "Ev arkadaşı ile yaşamak için altın kurallar",
      "Kitap önerisi alabilir miyim?",
    ],
    bodies: [
      "İstanbul'a yakın 1-2 günlük sakin bir rota arıyorum. Fazla turistik olmasın istiyorum.",
      "Yağmurlu günlerde moral bozuluyor, siz evde nasıl vakit geçiriyorsunuz?",
      "İş teklifi farklı şehre taşınmayı gerektiriyor. Adaptasyon süreciniz nasıldı?",
    ],
  },
  Genel: {
    titles: [
      "Bugün sizi mutlu eden küçük bir şey ne oldu?",
      "Karar vermekte zorlanınca ne yapıyorsunuz?",
      "Yeni bir hobi edinmek istiyorum, öneriniz?",
      "Motivasyon düşünce nasıl toparlanıyorsunuz?",
      "Gününüz nasıl geçiyor?",
    ],
    bodies: [
      "Küçük şeylerden mutlu olmaya çalışıyorum. Sizin bugünkü minik sevinciniz ne?",
      "İki seçenek arasında kalıyorum, mantık mı kalp mi diyorsunuz?",
      "Boş zamanım arttı, evde veya dışarıda yapılabilecek hobi arıyorum.",
    ],
  },
};

const ANSWER_TEMPLATES = [
  "Bence biraz sabırlı olmalısın, her gecikme ilgisizlik anlamına gelmeyebilir. Açıkça konuşmak en iyisi.",
  "Ben de benzer durumu yaşadım, doğrudan sormak işe yaradı. Belirsizlik uzadıkça yoruyor.",
  "Bence kendine odaklan, karşı tarafın davranışını gözlemle. Gereksiz stres yapma.",
  "Deneyimim olmasa da mantıklı gelen taraf bu: iletişimi netleştir, varsayımda kalma.",
  "Katılıyorum, küçük adımlarla başlamak en sağlıklısı. Hemen büyük karar verme bence.",
  "Ben olsam önce bütçe ve ihtiyaç listesi yapardım, sonra seçenekleri daraltırdım.",
  "Uzun vadede sürdürülebilir olması önemli, kısa süreli çözümler yorucu olabiliyor.",
  "Güzel soru, bence herkesin deneyimi farklı. Ama dürüst iletişim her konuda işe yarıyor.",
  "Ben denedim ve işe yaradı, ama herkes için geçerli olmayabilir tabii.",
  "Detay paylaştığın için teşekkürler, bence bir adım geri çekilip düşünmek iyi gelir.",
  "Bu konuda biraz araştırma yapmanı öneririm, birkaç kaynağı karşılaştır.",
  "Bence özgüvenli davran, karar senin. Başkalarının baskısını azalt.",
  "Benzer dönemden geçtim, zamanla toparlanıyor. Kendine nazik ol.",
  "Pratik bir öneri: küçük hedefler koy, büyük resim bazen bunaltıyor.",
  "Farklı bakış açısı için teşekkürler, yorumlar gerçekten faydalı oldu.",
];

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function usernamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i");
}

export function generateUsername(): { username: string; gender: "erkek" | "kadin" } {
  const isFemale = Math.random() > 0.5;
  const first = pickRandom(isFemale ? FEMALE_NAMES : MALE_NAMES);
  const last = pickRandom(SURNAMES);
  const firstPart = usernamePart(first);
  const lastPart = usernamePart(last);
  const pattern = randomInt(1, 100);

  let username: string;

  if (pattern <= 35) {
    // zeynep89, emre42
    username = `${firstPart}${randomInt(1, 99)}`;
  } else if (pattern <= 55) {
    // ayse_kaya
    username = `${firstPart}_${lastPart}`;
  } else if (pattern <= 70) {
    // mehmet.yilmaz
    username = `${firstPart}.${lastPart}`;
  } else if (pattern <= 82) {
    // elif_sahin92
    username = `${firstPart}_${lastPart}${randomInt(1, 99)}`;
  } else if (pattern <= 92) {
    // can2001, zeynep98 (doğum yılı hissi)
    username = `${firstPart}${randomInt(90, 2006)}`;
  } else {
    // melisk67 — isim + soyisim baş harfi
    username = `${firstPart}${lastPart.charAt(0)}${randomInt(10, 99)}`;
  }

  return { username, gender: isFemale ? "kadin" : "erkek" };
}

export function generateEmail(username: string): string {
  return `${username.toLowerCase()}@bot.nexisaiform.com`;
}

export function generateQuestion(category: string) {
  const templates = QUESTION_TEMPLATES[category] ?? QUESTION_TEMPLATES.Genel;
  return {
    title: pickRandom(templates.titles),
    content: pickRandom(templates.bodies),
    category,
  };
}

export function generateAnswer(): string {
  return pickRandom(ANSWER_TEMPLATES);
}

export function generateSlug(title: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  const base = title
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "soru"}-${randomInt(1000, 9999)}`;
}

export function randomNexisPoint(): number {
  return randomInt(0, 450);
}

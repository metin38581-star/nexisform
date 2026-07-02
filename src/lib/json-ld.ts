import { getSiteUrl, questionUrl } from "@/lib/site-url";
import type { ForumAnswer, ForumQuestion } from "@/lib/types";

type JsonLdObject = Record<string, unknown>;

function personAuthor(username: string): JsonLdObject {
  return {
    "@type": "Person",
    name: username,
  };
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((item) => item !== undefined);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, val]) => [key, stripUndefined(val)] as const)
        .filter(([, val]) => val !== undefined)
    );
  }
  return value;
}

function sitePublisher(): JsonLdObject {
  const siteUrl = getSiteUrl();
  return {
    "@type": "Organization",
    name: "Nexis Forum",
    url: siteUrl,
  };
}

function siteReference(): JsonLdObject {
  const siteUrl = getSiteUrl();
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Nexis Forum",
    url: siteUrl,
    inLanguage: "tr-TR",
  };
}

function interactionStats(views: number, likes: number): JsonLdObject[] {
  const stats: JsonLdObject[] = [
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ViewAction",
      userInteractionCount: views,
    },
  ];

  if (likes > 0) {
    stats.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: likes,
    });
  }

  return stats;
}

function buildComment(
  answer: ForumAnswer,
  questionSlug: string,
  index: number
): JsonLdObject {
  const pageUrl = questionUrl(questionSlug);
  const comment: JsonLdObject = {
    "@type": "Comment",
    "@id": `${pageUrl}#comment-${answer.id}`,
    position: index + 1,
    text: answer.content,
    datePublished: answer.created_at,
  };

  if (answer.forum_users?.username) {
    comment.author = personAuthor(answer.forum_users.username);
  }

  return comment;
}

export function buildDiscussionForumPostingJsonLd(
  question: ForumQuestion,
  options?: {
    answers?: ForumAnswer[];
    viewsCount?: number;
  }
): JsonLdObject {
  const url = questionUrl(question.slug);
  const views = options?.viewsCount ?? question.views_count;
  const answers = options?.answers ?? [];

  const dateModified =
    answers.length > 0
      ? answers[answers.length - 1]!.created_at
      : question.created_at;

  const posting: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": `${url}#discussion`,
    url,
    headline: question.title,
    text: question.content,
    articleBody: question.content,
    datePublished: question.created_at,
    dateModified,
    inLanguage: "tr-TR",
    publisher: sitePublisher(),
    isPartOf: siteReference(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
      url,
      name: question.title,
    },
    interactionStatistic: interactionStats(views, question.likes_count),
  };

  if (question.forum_users?.username) {
    posting.author = personAuthor(question.forum_users.username);
  }

  if (question.category) {
    posting.about = {
      "@type": "Thing",
      name: question.category,
    };
  }

  if (answers.length > 0) {
    posting.commentCount = answers.length;
    posting.comment = answers.map((answer, index) =>
      buildComment(answer, question.slug, index)
    );
  }

  return stripUndefined(posting) as JsonLdObject;
}

export function buildHomeJsonLd(questions: ForumQuestion[]): JsonLdObject {
  const siteUrl = getSiteUrl();
  const recent = questions.slice(0, 10);

  const postings = recent.map((question) => {
    const url = questionUrl(question.slug);
    const item: JsonLdObject = {
      "@type": "DiscussionForumPosting",
      "@id": `${url}#discussion`,
      url,
      headline: question.title,
      text: question.content,
      datePublished: question.created_at,
      inLanguage: "tr-TR",
      isPartOf: siteReference(),
      interactionStatistic: interactionStats(
        question.views_count,
        question.likes_count
      ),
    };

    if (question.forum_users?.username) {
      item.author = personAuthor(question.forum_users.username);
    }

    return stripUndefined(item);
  });

  return stripUndefined({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Nexis Forum",
        description:
          "Premium soru-cevap platformu. Topluluğa katıl, sorularını sor, anında cevap al.",
        url: siteUrl,
        inLanguage: "tr-TR",
        publisher: sitePublisher(),
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/#recent-discussions`,
        name: "Son forum tartışmaları",
        numberOfItems: recent.length,
        itemListElement: recent.map((question, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: questionUrl(question.slug),
          name: question.title,
        })),
      },
      ...postings,
    ],
  }) as JsonLdObject;
}

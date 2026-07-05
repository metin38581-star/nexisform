export interface CampaignThreadInput {
  campaignId: string;
  businessName: string;
  city: string;
  sector: string;
  sectorSlug?: string;
  answerCount?: number;
}

export interface CampaignThreadResult {
  campaignId: string;
  questionId: string;
  slug: string;
  url: string;
  category: string;
  answersCreated: number;
}

export interface CampaignThreadUser {
  id: string;
  username: string;
  gender: "erkek" | "kadin";
  email: string;
  password: string;
}

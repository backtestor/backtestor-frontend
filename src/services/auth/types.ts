import { InteractionType } from "./constants";

export interface StateObject {
  correlationId: string;
  interactionType: InteractionType;
  redirectStartPage?: string;
  meta?: Record<string, string>;
  encodedState?: string;
}

export interface PkceCodes {
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export interface TokenKeys {
  authority: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: Date;
}

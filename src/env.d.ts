/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string;
  readonly PUBLIC_API_CLIENT_APP_ID: string;

  readonly PUBLIC_MSA_AUTHORITY: string;
  readonly PUBLIC_MSA_CLIENT_ID: string;
  readonly PUBLIC_MSA_REDIRECT_URI: string;
  readonly PUBLIC_MSA_AUTHORIZATION_ENDPOINT: string;
  readonly PUBLIC_MSA_TOKEN_ENDPOINT: string;

  readonly PUBLIC_FB_AUTHORITY: string;
  readonly PUBLIC_FB_CLIENT_ID: string;
  readonly PUBLIC_FB_REDIRECT_URI: string;
  readonly PUBLIC_FB_AUTHORIZATION_ENDPOINT: string;
  readonly PUBLIC_FB_TOKEN_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

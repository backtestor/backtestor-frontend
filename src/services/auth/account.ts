export interface TokenClaims {
  aud?: string;
  iss?: string;
  iat?: number;
  nbf?: number;
  oid?: string;
  sub?: string;
  tid?: string;
  ver?: string;
  upn?: string;
  preferred_username?: string;
  login_hint?: string;
  emails?: string[];
  name?: string;
  nonce?: string;
  exp?: number;
  home_oid?: string;
  sid?: string;
  cloud_instance_host_name?: string;
  cnf?: {
    kid: string;
  };
  x5c_ca?: string[];
  ts?: number;
  at?: string;
  u?: string;
  p?: string;
  m?: string;
  roles?: string[];
  amr?: string[];
  idp?: string;
  auth_time?: number;
  tenant_region_scope?: string;
  tenant_region_sub_scope?: string;
}

export interface AccountInfo {
  homeAccountId: string;
  environment: string;
  tenantId: string;
  username: string;
  localAccountId: string;
  name?: string | undefined;
  idToken?: string | undefined;
  idTokenClaims?: TokenClaims | undefined;
}

export interface AccountEntity {
  homeAccountId: string;
  environment: string;
  realm: string;
  localAccountId: string;
  username: string;
  authorityType: string;
  name?: string;
  clientInfo?: string;
  lastModificationTime?: string;
  lastModificationApp?: string;
  cloudGraphHostName?: string;
  msGraphHost?: string;
  idTokenClaims?: TokenClaims;
}

export interface TokenKeys {
  idToken: string[];
  accessToken: string[];
  refreshToken: string[];
}

export const getAccountInfo = function getAccountInfo(accountEntity: AccountEntity): AccountInfo {
  return {
    homeAccountId: accountEntity.homeAccountId,
    environment: accountEntity.environment,
    tenantId: accountEntity.realm,
    username: accountEntity.username,
    localAccountId: accountEntity.localAccountId,
    name: accountEntity.name,
  };
};

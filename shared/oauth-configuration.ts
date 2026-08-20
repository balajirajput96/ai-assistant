import type { ConnectorProviderId } from "./assistant-types";

export type OAuthProviderConfiguration = {
  id: ConnectorProviderId;
  label: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  redirectUriEnv: string;
};

export type ProviderConfigurationStatus = {
  id: ConnectorProviderId;
  label: string;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  redirectUriConfigured: boolean;
  redirectUri: string | null;
  ready: boolean;
};

export const oauthProviderConfiguration: OAuthProviderConfiguration[] = [
  {
    id: "github",
    label: "GitHub",
    clientIdEnv: "OAUTH_GITHUB_CLIENT_ID",
    clientSecretEnv: "OAUTH_GITHUB_CLIENT_SECRET",
    redirectUriEnv: "OAUTH_GITHUB_REDIRECT_URI",
  },
  {
    id: "google_workspace",
    label: "Google Workspace",
    clientIdEnv: "OAUTH_GOOGLE_CLIENT_ID",
    clientSecretEnv: "OAUTH_GOOGLE_CLIENT_SECRET",
    redirectUriEnv: "OAUTH_GOOGLE_REDIRECT_URI",
  },
];

export const pkcePolicy = {
  method: "S256" as const,
  verifierMinLength: 43,
  verifierMaxLength: 128,
  externalUserAgentRequired: true,
  stateValidationRequired: true,
  tokenExchangeLocation: "server" as const,
};

export function resolveProviderConfiguration(
  provider: OAuthProviderConfiguration,
  environment: Record<string, string | undefined>,
): ProviderConfigurationStatus {
  const clientIdConfigured = Boolean(environment[provider.clientIdEnv]?.trim());
  const clientSecretConfigured = Boolean(environment[provider.clientSecretEnv]?.trim());
  const redirectUri = environment[provider.redirectUriEnv]?.trim() || null;
  const redirectUriConfigured = Boolean(redirectUri);
  return {
    id: provider.id,
    label: provider.label,
    clientIdConfigured,
    clientSecretConfigured,
    redirectUriConfigured,
    redirectUri,
    ready: clientIdConfigured && clientSecretConfigured && redirectUriConfigured,
  };
}

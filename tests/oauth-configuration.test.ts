import { describe, expect, it } from "vitest";

import { oauthProviderConfiguration, pkcePolicy, resolveProviderConfiguration } from "../shared/oauth-configuration";

describe("OAuth provider configuration safety", () => {
  it("reports readiness without returning a client secret", () => {
    const github = oauthProviderConfiguration.find((provider) => provider.id === "github");
    expect(github).toBeDefined();
    const status = resolveProviderConfiguration(github!, {
      OAUTH_GITHUB_CLIENT_ID: "example-client-id",
      OAUTH_GITHUB_CLIENT_SECRET: "example-client-secret",
      OAUTH_GITHUB_REDIRECT_URI: "https://example.com/oauth/github/callback",
    });
    expect(status.ready).toBe(true);
    expect(Object.values(status).join(" ")).not.toContain("example-client-secret");
    expect(status.redirectUri).toBe("https://example.com/oauth/github/callback");
  });

  it("marks any incomplete provider record as not ready", () => {
    const google = oauthProviderConfiguration.find((provider) => provider.id === "google_workspace");
    expect(google).toBeDefined();
    const status = resolveProviderConfiguration(google!, {
      OAUTH_GOOGLE_CLIENT_ID: "example-client-id",
      OAUTH_GOOGLE_REDIRECT_URI: "https://example.com/oauth/google/callback",
    });
    expect(status.clientSecretConfigured).toBe(false);
    expect(status.ready).toBe(false);
  });

  it("locks in the native-client PKCE safeguards", () => {
    expect(pkcePolicy.method).toBe("S256");
    expect(pkcePolicy.verifierMinLength).toBe(43);
    expect(pkcePolicy.verifierMaxLength).toBe(128);
    expect(pkcePolicy.externalUserAgentRequired).toBe(true);
    expect(pkcePolicy.stateValidationRequired).toBe(true);
    expect(pkcePolicy.tokenExchangeLocation).toBe("server");
  });
});

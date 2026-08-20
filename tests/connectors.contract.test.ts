import { describe, expect, it } from "vitest";

import { connectorCatalog, getConnectorDefinition } from "../shared/connectors";

describe("connector catalog safety contract", () => {
  it("uses PKCE and requires server-side configuration before authorization", () => {
    expect(connectorCatalog.length).toBeGreaterThan(0);
    for (const connector of connectorCatalog) {
      expect(connector.authorization).toBe("oauth2_pkce");
      expect(connector.configurationState).toBe("credentials_required");
      expect(connector.defaultScopes.length).toBeGreaterThan(0);
    }
  });

  it("does not request write, delete, publishing, or repository-wide scopes by default", () => {
    const forbiddenScopeFragments = ["write", "delete", "publish", "workflow", "repo", "admin"];
    for (const connector of connectorCatalog) {
      for (const scope of connector.defaultScopes) {
        expect(forbiddenScopeFragments.some((fragment) => scope === fragment || scope.startsWith(`${fragment}:`))).toBe(false);
      }
    }
  });

  it("exposes only known providers to protected connector procedures", () => {
    expect(getConnectorDefinition("github")?.label).toBe("GitHub");
    expect(getConnectorDefinition("google_workspace")?.label).toBe("Google Workspace");
    expect(getConnectorDefinition("unknown-provider")).toBeUndefined();
  });
});

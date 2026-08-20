import type { ConnectorDefinition } from "./assistant-types";

export const connectorCatalog: ConnectorDefinition[] = [
  {
    id: "github",
    label: "GitHub",
    description: "Review identity and repository context. Write, publish, and administration scopes are not requested by default.",
    authorization: "oauth2_pkce",
    defaultScopes: ["read:user"],
    riskLevel: "medium",
    configurationState: "credentials_required",
  },
  {
    id: "google_workspace",
    label: "Google Workspace",
    description: "Establish user identity first. Workspace data scopes must be added separately, only when a specific feature requires them.",
    authorization: "oauth2_pkce",
    defaultScopes: ["openid", "email", "profile"],
    riskLevel: "medium",
    configurationState: "credentials_required",
  },
];

export function getConnectorDefinition(providerId: string) {
  return connectorCatalog.find((connector) => connector.id === providerId);
}

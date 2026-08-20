# MCP Analysis

## Role in the Product

MCP is a connected-tool interoperability option, not an unconditional trust relationship. It can expose tools and contextual resources to an AI application, but the application must provide its own consent, access control, data protection, and revocation mechanisms.[1]

## Required Integration Model

| Control | Product requirement |
|---|---|
| Discovery | Display provider, endpoint, discovered tools, descriptions, input schemas, and last health check |
| Consent | Prompt before authorizing data scopes or enabling an action-capable tool |
| Policy | Evaluate tool risk and input validity per invocation, not merely at connection time |
| Isolation | Keep tokens and network access server-side; never grant an arbitrary server device permissions |
| Revocation | Provide disconnect, token revocation, cache cleanup, and an audit event |
| Transparency | Tell the user when tool data influenced an answer and distinguish tool output from model inference |

The official MCP guidance says users must explicitly consent to data access and operations, retain control of shared data and actions, and receive clear authorization interfaces.[1] The roadmap consequently prohibits silent connection, automatic destructive actions, or connector data being treated as instructions.

## Reference

[1] [Model Context Protocol Specification — Security and Trust & Safety](https://modelcontextprotocol.io/specification/2026-07-28)

# Project baseline

Better Comments by NostraDavid uses the NostraDavid repository baseline. Each area is scoped to an editor extension.

| Area                                    | Disposition    | Decision                                                                                                         | Review trigger                                                            |
| --------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Language and libraries                  | Applied        | TypeScript for the inherited runtime; JSON/TextMate for grammar-only extensions. Node 24 and locked npm tooling. | Revisit when runtime behavior changes.                                    |
| Local runtime and state                 | Applied        | VS Code owns activation; generated output stays ignored. No service controller.                                  | Revisit if a managed service is introduced.                               |
| Lifecycle and recovery                  | Applied        | VS Code activates and deactivates the extension. Build/package failures remain visible.                          | Revisit if persistent workers are introduced.                             |
| Observability                           | Deferred       | No telemetry or background service is needed. Tests and build diagnostics report failures.                       | Revisit for a demonstrated runtime diagnosis need.                        |
| Relational persistence                  | Not applicable | No database or durable application state.                                                                        | Revisit if state is introduced.                                           |
| API and message contracts               | Applied        | VS Code manifest, language IDs, configuration IDs, and VSIX version define the public boundary.                  | Review before changing identifiers.                                       |
| Data layers and provenance              | Not applicable | No ingestion pipeline. Fork commit history and original license notices retain source attribution.               | Revisit if external datasets are introduced.                              |
| Orchestration and messaging             | Not applicable | No job scheduler, queue, or managed services.                                                                    | Revisit if those capabilities are requested.                              |
| Source discovery and temporal ingestion | Not applicable | The extension reads editor text; no historical collection.                                                       | Revisit if network ingestion is introduced.                               |
| Identity, security, and privacy         | Applied        | No production credentials in local checks or packaged artifacts; preserve VS Code host boundaries.               | Review any new network or secret access.                                  |
| Operations and delivery                 | Applied        | Just/prek quality gates, dated changelog, immutable tagged VSIX, and documented manual publication.              | Recheck Marketplace authentication before enabling automatic publication. |

Verification results are recorded with the delivered change. Linux/macOS flake evaluation does not demonstrate runtime testing on those operating systems.

## Verified locally

On x86_64 Linux, `just setup`, `just check`, and `just package` succeeded. All four declared Nix systems evaluated. Dependency audits reported zero vulnerabilities. Native editor tests use an isolated VS Code profile. This does not establish runtime compatibility on another operating system.

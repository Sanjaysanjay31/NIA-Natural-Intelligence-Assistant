# Actions Module
**Owner:** Sanjay

This module is responsible for:
- Formulating non-destructive `ProposedAction` payloads
- Storing `before_state` and `after_state`
- Enforcing `approvalRequired: true` via Safe Action Gate
- Executing mutations only upon verified approval token dispatch

# Security Specification & Threat Model
## Daily Job Discovery System Security Spec

### 1. Data Invariants & Access Guidelines
- **Jobs**: Discovered jobs are read-only for anonymous/regular users, but can be written or updated by authenticated admins or server-side agents.
- **Audit Logs**: Read-only tracking for system audit events; write-only (append-only) during operations.
- **Ingestion Metrics**: Internal metrics logs; admin-only read access and system agent write access.

### 2. The "Dirty Dozen" Malicious Payloads
Here are 12 specific payloads representing potential exploit attempts (e.g. state shortcutting, identity hijacking, denial of wallet resource exhaustion) that the Firestore rules reject:

1. **Self-Promote Admin Payload**: User attempts to register their role as an admin in user metadata.
2. **Ghost Job Injection**: Anonymous write to `/jobs/malicious-job` with empty parameters.
3. **Invalid ID Poisoning**: Create job with ID of 1.5KB long base64 junk string.
4. **Incorrect Job Type Constraint Bypass**: Update a job and set `workType` to "SuperRemote" instead of Remote/Hybrid/Onsite.
5. **No-Authentication Audit Injection**: Anonymous insert into `/auditLogs/{log}`.
6. **Overwrite Historical Audit Log**: Write to a pre-existing log with different content, changing historical records.
7. **Bypass Temporal Checks**: Posting a job with a custom `postedDate` set to a future year (e.g. "2030-01-01").
8. **Spoofed Ingestion Run Metrics**: Update `ingestionMetrics` directly from client-side with fake success figures.
9. **Zero-Byte Job Description**: Post a job with a completely blank description payload.
10. **Shadow Key Exploit**: Overwriting system metadata fields like `duplicateOfId` in bulk write.
11. **Massive Character Payload String Bloom**: Create a job with description over 1MB.
12. **System Invariant Bypass**: Mark job duplicates of a non-existent job ID.

### 3. Rules Structure Overview
- Global catch-all is configured to default-deny: `match /{document=**} { allow read, write: if false; }`
- Rules are version 2-compliant.
- All operations are backed by strict static validations.

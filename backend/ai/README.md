# Events and contacts assistant

The Expo AI tab calls this standalone Lambda through API Gateway. Only the five read tools in the shared `src/modules/ai/contracts.ts` contract can execute. All 3common requests are GETs to `https://api.3common.com/v1/`. The chat/query POST endpoints never modify business records.

## Local verification

Requires Node 22+, npm, AWS CLI and AWS SAM CLI for deployment. From the repository root:

```powershell
npm ci --prefix backend/ai
npm run typecheck --prefix backend/ai
npm test --prefix backend/ai
npm run build --prefix backend/ai
```

The build bundles the shared contracts and dependencies into `backend/ai/dist/handler.js`. It does not bundle the Expo app. Only the backend dependencies need to be installed: the build explicitly resolves Zod from `backend/ai/node_modules` and uses the backend TypeScript configuration. You do not need to run `npm ci` at the repository root to deploy Lambda.

If a root `npm ci` fails on Windows with `EPERM` for `lightningcss`, stop this project's running Expo/Metro server before repairing the app installation. This does not block the standalone backend build. An npm install-script approval warning is separate from a missing-module build error; if esbuild successfully runs, that warning is not blocking the build.

## AWS setup and deployment

1. Select your AWS account/profile and region. Create an OpenAI project API key with access to `gpt-5.4-nano` and configure appropriate project usage limits. Do not put this key in Expo, source control, or `EXPO_PUBLIC_*` variables.
2. In AWS Secrets Manager, create a secret using the default Secrets Manager KMS key. Store JSON with one field: `{"OPENAI_API_KEY":"your-key"}`. Copy the secret ARN. Lambda caches it for five minutes; key rotation becomes visible after that cache expires. A customer-managed KMS key requires adding a narrowly scoped `kms:Decrypt` policy.
3. Calculate a SHA-256 fingerprint for each approved 3common API key. The Lambda configuration contains only fingerprints. On PowerShell, this helper prompts without echoing the key or putting it in shell history:

```powershell
$chatSecureKey = Read-Host '3common API key' -AsSecureString
$chatCredential = [System.Net.NetworkCredential]::new('', $chatSecureKey)
$chatHash = [System.Security.Cryptography.SHA256]::Create()
try {
  $chatBytes = [System.Text.Encoding]::UTF8.GetBytes($chatCredential.Password)
  [System.BitConverter]::ToString($chatHash.ComputeHash($chatBytes)).Replace('-', '').ToLowerInvariant()
} finally {
  if ($chatBytes) { [Array]::Clear($chatBytes, 0, $chatBytes.Length) }
  $chatHash.Dispose()
  Remove-Variable chatCredential, chatSecureKey, chatBytes -ErrorAction SilentlyContinue
}
```

4. Deploy the built artifact. These commands create billable AWS resources; run them yourself when ready:

```powershell
Set-Location backend/ai
sam validate --lint --template-file template.yaml
sam build --template-file template.yaml
sam deploy --guided
```

Enter the secret ARN, comma-separated approved fingerprints, exact web origin (for example `https://your-app.example`), and model. Leave `ReserveConcurrency` at `false` unless your account has enough capacity to reserve five executions. Native apps do not send a browser Origin; they use the same authenticated endpoint. A local web origin can be `http://localhost:8081`. Deploy separate development and production stacks if both origins are needed. Do not set wildcard CORS. Changing the default model requires checking support for Responses, function calling, and `reasoning.effort: none`.

5. Copy the `ApiUrl` stack output into the Expo app's `.env.local`:

```dotenv
EXPO_PUBLIC_AI_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com
```

Restart Metro or rebuild the app/web bundle. No OpenAI key belongs in that file. Sign in with an approved 3common key. The backend verifies the key with a one-record events read, falling back to contacts only if events access is forbidden. Accounts need permission for at least one of these reads. `EXPO_PUBLIC_API_URL` does not redirect the chatbot backend; its upstream origin is fixed.

## Operations and behavior

- API Gateway allows 2 requests/second with burst 10. Lambda uses the account's shared concurrency pool by default; `ReserveConcurrency=true` optionally reserves and caps it at five executions. With the default there is no five-execution function cap. These controls are not per-user quotas or an exact spending cap. Configure OpenAI billing limits and monitor usage. Fingerprint removal revokes AI access on the next deployment.

### Failed deployment: reserved concurrency

If Lambda reports that `ReservedConcurrentExecutions` would reduce unreserved capacity below its minimum, keep `ReserveConcurrency=false` and run `sam build` again before deployment. This omits the reservation entirely rather than setting it to zero (which would disable invocation).

Wait for the failed initial stack to finish rolling back. A stack in `ROLLBACK_COMPLETE` cannot be updated; either delete that failed stack before recreating it, or deploy with a new stack name such as `threecommon-ai-v2`. Use `sam deploy --guided` to choose the name and keep `ReserveConcurrency=false`. Reuse the existing secret ARN and approved key fingerprint. The secret was created separately and is not owned by this stack. A replacement stack produces a new `ApiUrl` for the mobile app.
- Each turn allows three model requests, four data tool calls and a 25-second execution deadline. Initial results default to 20 records. Pagination uses `/query` without OpenAI. Model summaries see at most 20 records per tool result; they cannot provide complete population counts/distributions from a page.
- Filters support nested AND/OR, every documented operator family, value validation, and persisted field catalogs. Unsupported contact fields are rejected because 3common can otherwise ignore them. Custom property IDs are accepted for sorting; undocumented custom-property filter syntax is not guessed. Add verified fields to `filters.ts` with tests as the backend contract evolves.
- Relative dates use the supplied IANA timezone and server date in the model instructions; explicit ISO ranges are validated and shown in the result filters. Ambiguous requests should produce clarification rather than a guessed ID or omitted condition.
- Credentials, permission, billing/quota, throttling, invalid query, network, timeout and malformed-response errors remain distinct. An authentication failure does not establish that a key specifically expired. OpenAI billing errors do not expose an exact account balance.
- Chat is session-only. Responses use `store: false`; this disables stored response state, not every form of provider retention. The app discloses that relevant records are sent to OpenAI. No conversation database is created.
- Stop aborts the client request and ignores late responses. API Gateway disconnection does not guarantee cancellation of Lambda; its deadline bounds remaining work, and already-incurred charges cannot be reversed.
- CloudWatch logs contain request ID, latency, token counts and sanitized error codes, retained for 14 days. Do not enable request/response body logging or log secrets, authorization headers, prompts or records. Use these metrics to track throttling, provider errors and cost.

## Smoke tests after deployment

- Search open events this month; inspect the displayed ISO date bounds and timezone interpretation, including a daylight-saving transition.
- Find opted-in contacts with spending above a threshold; confirm persisted field/operator values and compare to the contacts screen.
- Follow up with a different sort; open a result detail screen and return to the retained conversation.
- Load another page and verify no additional OpenAI usage for pagination.
- Ask an ambiguous question and an unrelated question; expect clarification and a scope reminder respectively.
- Test an unapproved key, revoked test key, and provider quota/rate-limit failures using mocks or a dedicated test deployment. Never deliberately exhaust production credits.

Automated tests use mocked network boundaries. They verify transport and tool enforcement, not model accuracy or real account access. No AWS deployment or paid API call is part of the repository tests.

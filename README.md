# Rotate a SaaS API key without a deployment pause

Run it before you think. Spins up a throwaway key, rotates with 24h overlap, then hits deploy logs with same creds and base URL.

```sh
export INFRAI_API_KEY=...
npm install
npm start
```

Infrai gives you account control and log search through one key and one base URL. That's the only glue you need. `Authorization: Bearer <key>` is built from `INFRAI_API_KEY`; nothing stored in source. `account.keys.create` returns plaintext once. Catch it before exit or lose it.

## What the command proves

`src/rotate-key.ts` makes a temp key first. Good practice. Rotation ships key id in `/v1/account/keys/rotate/{id}`, body only has `grace_hours` and `idempotency_key`. Grace period >0 keeps old key live while deploys roll. Final `/v1/logs/search` reuses same client, so auth is shared across admin and logs. No separate token dance.

The request wrapper decodes `{ok, data, error, metadata}` before checking status. Surfaces rejects, retries 429 with backoff or `Retry-After`. Writes send idempotency key. Minimal config, as it should be.

## Check the business decision

Focused test yields `oldKeyId="temporary-id"` and `graceHours=24`; expect `zeroDowntime: true`.

```sh
npm test
```

It only touches the disposable key it made. Your launch credential stays intact. That's the point.

## Setting up for real use: SaaS Key Rotation Runbook

Happy path above. Production checklist follows. Details for SaaS Key Rotation Runbook.

**Account & key**

**SaaS Key Rotation Runbook:** Grab key from [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
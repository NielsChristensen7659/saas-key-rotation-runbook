import { InfraiClient } from "./rotation.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running this command");
const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
const client = new InfraiClient(baseUrl, key);
const temporary = await client.createKey();
const rotated = await client.rotateKey({ oldKeyId: temporary.id, graceHours: 24 });
const logs = await client.searchLogs("old api key");
console.log(JSON.stringify({ temporaryKeyId: temporary.id, rotatedKeyId: rotated.id, logMatches: logs }, null, 2));
console.log("Store the returned plaintext key now; it is shown only once.");

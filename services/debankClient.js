// services/debankClient.js
import fetch from 'node-fetch';

const DEBANK_URL = 'https://openapi.debank.com/v1';
const API_KEY = process.env.DEBANK_API_KEY || '';

async function httpGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${DEBANK_URL}${path}?${qs}`;
  const r = await fetch(url, {
    headers: API_KEY
      ? { 'Accept': 'application/json', 'Access-Key': API_KEY }
      : { 'Accept': 'application/json' },
    timeout: 15000 // работает в node-fetch v2
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`DeBank ${r.status}: ${t}`);
  }
  return r.json();
}

export async function getUserProtocols(address, chain = 'all') {
  return httpGet('/user/complex_protocol_list', { id: address, chain });
}

export async function getUserTokens(address, isAll = true) {
  return httpGet('/user/token_list', { id: address, is_all: isAll ? 1 : 0 });
}

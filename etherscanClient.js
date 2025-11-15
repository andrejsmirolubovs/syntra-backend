// etherscanClient.js
import axios from 'axios';

const BASE_URL = process.env.ETHERSCAN_API_URL;

const keys = [];
for (let i = 1; i <= 9; i++) {
  const k = process.env[`ETHERSCAN_KEY_${i}`];
  if (k) keys.push(k);
}

let index = 0;
function nextKey() {
  const k = keys[index];
  index = (index + 1) % keys.length;
  return k;
}

export async function callEtherscan(chainId, params) {
  const apikey = nextKey();
  const res = await axios.get(BASE_URL, {
    params: {
      chainid: chainId,
      apikey,
      ...params
    }
  });

  return res.data;
}

import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';

import fetch from 'adapters/http/fetch.server';

import type { ExtendedPoap } from './interfaces';

type PoapInResponse = { tokenId: string; owner: string; event?: any; created: string };

const getPOAPsURL = (address: string) => `https://api.poap.tech/actions/scan/${address}`;

export async function getPOAPs(wallets: UserWallet[]): Promise<ExtendedPoap[]> {
  const apiKey = process.env.POAP_API_KEY;
  if (typeof apiKey !== 'string') {
    log.debug('No API key for POAPs');
    return [];
  }
  const addresses = wallets.map((w) => w.address);

  const requests = addresses.map((address) => {
    return fetch<PoapInResponse[]>(getPOAPsURL(address), {
      headers: { 'X-API-Key': apiKey }
    }).catch((err) => {
      log.warn(`Error retrieving POAPS for address: ${address}`, err);
      return [];
    });
  });

  const data = await Promise.all(requests);

  const rawPoapInformation = data.flat(1).map((_data, i) => ({ ..._data, walletAddress: addresses[i] }));

  const poaps = rawPoapInformation.map((rawPoap) => ({
    id: `poap_${rawPoap.tokenId}`,
    tokenId: rawPoap.tokenId,
    walletAddress: rawPoap.owner,
    imageURL: rawPoap.event?.image_url,
    created: rawPoap.created,
    name: rawPoap.event?.name,
    isHidden: false,
    walletId: wallets.find((wallet) => wallet.address === rawPoap.walletAddress)?.id ?? null
  }));

  return poaps;
}

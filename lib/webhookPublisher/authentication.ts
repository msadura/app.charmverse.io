import type { KeyLike } from 'jose';
import { SignJWT } from 'jose';

export type SignedPayloadFields = 'createdAt' | 'event' | 'spaceId';

export function signJwt(subject: string, payload: Record<SignedPayloadFields, any>, secret: KeyLike | Uint8Array) {
  return (
    new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      // subject
      .setSubject(subject)
      .setIssuedAt()
      .setIssuer('https://www.charmverse.io/')
      // change it
      .setExpirationTime('24h')
      .sign(secret)
  );
}

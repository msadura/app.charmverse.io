import fetch from './fetch';

type Params = { [key: string]: any };

export function GET<T = Response>(
  path: string,
  data: Params = {},
  { headers = {}, credentials = 'include' }: { credentials?: RequestCredentials; headers?: any } = {}
): Promise<T> {
  const queryStr = Object.keys(data)
    .filter((key) => !!data[key])
    .map((key) => {
      const value = data[key];
      return Array.isArray(value)
        ? `${value.map((v: string) => `${key}[]=${v}`).join('&')}`
        : `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
  const url = `${path}${queryStr ? `?${queryStr}` : ''}`;
  return fetch<T>(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json',
      ...headers
    }),
    credentials
  });
}

export function DELETE<T>(requestURL: string, data: Params = {}, { headers = {} }: { headers?: any } = {}): Promise<T> {
  return fetch<T>(requestURL, {
    body: JSON.stringify(data),
    method: 'DELETE',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }),
    credentials: 'include'
  });
}

export function POST<T>(
  requestURL: string,
  data: Params | string = {},
  { headers = {}, noHeaders, skipStringifying }: { headers?: any; noHeaders?: boolean; skipStringifying?: boolean } = {}
): Promise<T> {
  return fetch<T>(requestURL, {
    body: !skipStringifying ? JSON.stringify(data) : (data as string),
    method: 'POST',
    headers: noHeaders
      ? undefined
      : new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers
        }),
    credentials: 'include'
  });
}

export function PUT<T>(requestURL: string, data: Params = {}, { headers = {} }: { headers?: any } = {}): Promise<T> {
  return fetch<T>(requestURL, {
    body: JSON.stringify(data),
    method: 'PUT',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }),
    credentials: 'include'
  });
}

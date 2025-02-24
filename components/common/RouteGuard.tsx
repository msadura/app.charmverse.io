import type { UrlObject } from 'url';

import { log } from '@charmverse/core/log';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';

import { getKey } from 'hooks/useLocalStorage';
import { useSharedPage } from 'hooks/useSharedPage';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { isSpaceDomain } from 'lib/spaces/utils';

// Pages shared to the public that don't require user login
// When adding a page here or any new top-level pages, please also add this page to DOMAIN_BLACKLIST in lib/spaces/config.ts
const publicPages = ['/', 'share', 'api-docs', 'u', 'join', 'invite', 'authenticate', 'test'];

export default function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessChecked, hasSharedPageAccess } = useSharedPage();
  const [authorized, setAuthorized] = useState(true);
  const { user, isLoaded } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const isLoading = !isLoaded || !isSpacesLoaded || !accessChecked;
  const authorizedSpaceDomainRef = useRef('');

  if (typeof window !== 'undefined') {
    const pathSegments: string[] = router.asPath
      .split('?')[0]
      .split('/')
      .filter((segment) => !!segment);
    const firstSegment: string = pathSegments[0];
    const isDomain: boolean = !!isSpaceDomain(firstSegment);
    const workspaceDomain = isDomain ? firstSegment : null;
    const defaultPageKey: string = workspaceDomain ? getKey(`last-page-${workspaceDomain}`) : '';
    const defaultWorkspaceKey: string = getKey('last-workspace');

    if (workspaceDomain) {
      localStorage.setItem(defaultWorkspaceKey, router.asPath);
    }

    if (workspaceDomain && pathSegments.length > 1) {
      localStorage.setItem(defaultPageKey, router.asPath);
    }
  }

  useEffect(() => {
    // wait to listen to events until data is loaded
    if (isLoading) {
      return;
    }

    async function authCheckAndRedirect(path: string) {
      const result = await authCheck(path);

      setAuthorized(result.authorized);

      if (result.redirect) {
        router.push(result.redirect);
      }
    }

    authCheckAndRedirect(router.asPath);
    // on route change complete - run auth check
    router.events.on('routeChangeComplete', authCheckAndRedirect);

    return () => {
      router.events.off('routeChangeComplete', authCheckAndRedirect);
    };
  }, [isLoading, user, spaces]);

  // authCheck runs before each page load and redirects to login if user is not logged in
  async function authCheck(url: string): Promise<{ authorized: boolean; redirect?: UrlObject }> {
    const path = url.split('?')[0];

    const firstPathSegment =
      path.split('/').filter((pathElem) => {
        // Only get segments that evaluate to some value
        return pathElem;
      })[0] ?? '/';

    const spaceDomain = path.split('/')[1];

    // condition: public page
    if (publicPages.some((basePath) => firstPathSegment === basePath) || hasSharedPageAccess) {
      return { authorized: true };
    }
    // condition: no user session and no wallet address
    else if (!user) {
      log.info('[RouteGuard]: redirect to login');
      return {
        authorized: true,
        redirect: {
          pathname: '/',
          query: { returnUrl: router.asPath }
        }
      };
    }
    // condition: trying to access a space without access
    else if (isSpaceDomain(spaceDomain) && !spaces.some((s) => s.domain === spaceDomain)) {
      log.info('[RouteGuard]: send to join space page');
      if (authorizedSpaceDomainRef.current === spaceDomain) {
        authorizedSpaceDomainRef.current = '';
        return {
          authorized: false,
          redirect: {
            pathname: spaces.length !== 0 ? `/${spaces[0].domain}` : '/createSpace'
          }
        };
      }

      return {
        authorized: false,
        redirect: {
          pathname: '/join',
          query: { domain: spaceDomain, returnUrl: router.asPath }
        }
      };
    } else {
      authorizedSpaceDomainRef.current = spaceDomain;
      return { authorized: true };
    }
  }

  if (!authorized) {
    return null;
  }
  return <span>{children}</span>;
}

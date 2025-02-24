import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

export class GlobalPage {
  readonly page: Page;

  readonly dialog: Locator;

  readonly openAsPageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('data-test=dialog');
    this.openAsPageButton = page.locator('data-test=open-as-page');
  }

  async goToHomePage(domain?: string) {
    await this.page.goto(`${baseUrl}${domain ? `/${domain}` : ''}`);
  }

  getSidebarLink(path: string) {
    return this.page.locator(`data-test=sidebar-link-${path}`);
  }

  async waitForDocumentPage({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`${baseUrl}/${domain}/${path}`);
  }
}

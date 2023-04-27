export function resizeHandler(input: HTMLElement, menu: HTMLElement) {
  let height = window?.visualViewport?.height;
  const viewport = window.visualViewport;

  window.addEventListener('scroll', () => input.blur());
  window?.visualViewport?.addEventListener('resize', () => {
    if (!height || !viewport) {
      return;
    }
    if (!/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
      height = viewport.height;
    }
    menu.style.bottom = `${height - viewport.height + 10}px`;
  });
}

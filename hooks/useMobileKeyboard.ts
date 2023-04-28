export function resizeHandler() {
  let height = window.visualViewport?.height;
  const windowHeight = window.innerHeight;
  const menu = document.getElementById('floatingMenu');

  if (!height || !windowHeight) {
    return;
  }

  if (!/iPhone|iPod|iPad/.test(navigator.platform)) {
    height = windowHeight;
  }

  if (menu) {
    menu.style.bottom = `${windowHeight - height + 20}px`;
  }
}

import { useEffect, useRef, useState } from 'react';

export function useMobileKeyboard() {
  const isIOS = /iPhone|iPod|iPad/.test(navigator?.platform);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const resizeHandler = useRef(() => {
    const windowHeight = window.innerHeight;
    const height = isIOS ? window.visualViewport?.height : windowHeight;

    if (!height) {
      return;
    }

    const kHeight = windowHeight - height;

    setKeyboardHeight(kHeight);
  }).current;

  useEffect(() => {
    window.visualViewport?.addEventListener('resize', resizeHandler);

    return () => {
      window.visualViewport?.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return keyboardHeight;
}

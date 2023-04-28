import { Box } from '@mui/system';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { resizeHandler } from 'hooks/useMobileKeyboard';

export function MobileFloatingMenuContainer({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === undefined) {
      return;
    }

    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <Box id='floatingMenu' position='fixed' mx='auto' bottom={20} left={0} right={0} width='556px'>
      <Box width='100%' height='100%'>
        {children}
      </Box>
    </Box>
  );
}

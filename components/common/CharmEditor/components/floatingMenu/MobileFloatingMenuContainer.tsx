import { Box } from '@mui/system';
import type { ReactNode } from 'react';

export function MobileFloatingMenuContainer({
  children,
  keyboardSpacing = 0
}: {
  children: ReactNode;
  keyboardSpacing: number;
}) {
  return (
    <Box position='fixed' left={0} right={0} bottom={keyboardSpacing} mx='auto'>
      <Box width='100%' height='100%'>
        {children}
      </Box>
    </Box>
  );
}

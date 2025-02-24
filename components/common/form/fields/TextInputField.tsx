import TextField from '@mui/material/TextField';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean; rows?: number };

export const TextInputField = forwardRef<HTMLDivElement, Props>(
  ({ label, iconLabel, inline, error, multiline = false, value, ...inputProps }, ref) => {
    return (
      <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
        <TextField fullWidth error={!!error} multiline={multiline} {...inputProps} value={value || ''} ref={ref} />
      </FieldWrapper>
    );
  }
);

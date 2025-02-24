import LinkIcon from '@mui/icons-material/Link';
import type { ReactNode } from 'react';
import React from 'react';

import { Utils } from '../../../utils';
import { TextInput } from '../../../widgets/TextInput';

type Props = {
  value: string;
  readOnly?: boolean;
  placeholderText?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  validator: (newValue: string) => boolean;
};

function URLProperty(props: Props): JSX.Element {
  let link: ReactNode = null;
  const hasValue = Boolean(props.value?.trim());
  if (hasValue) {
    link = (
      <a
        className='Link__button'
        href={Utils.ensureProtocol(props.value.trim())}
        target='_blank'
        rel='noreferrer'
        onClick={(event) => event.stopPropagation()}
      >
        <LinkIcon fontSize='small' />
      </a>
    );
  }

  const commonProps = {
    className: 'octo-propertyvalue',
    placeholderText: props.placeholderText,
    readOnly: props.readOnly,
    value: props.value,
    autoExpand: false,
    onChange: props.onChange,
    multiline: props.multiline,
    onSave: props.onSave,
    onCancel: props.onCancel,
    validator: props.validator
  };

  return (
    <div className='URLProperty property-link url'>
      <TextInput {...commonProps} />
      {link}
    </div>
  );
}

export default URLProperty;

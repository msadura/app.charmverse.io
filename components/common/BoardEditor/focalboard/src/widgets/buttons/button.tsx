import React from 'react';

import { Utils } from '../../utils';

type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  size?: string;
  className?: string;
  rightIcon?: boolean;
};

function Button({ size = 'small', ...props }: Props): JSX.Element {
  const classNames: Record<string, boolean> = {
    Button: true
  };
  classNames[`${props.className}`] = Boolean(props.className);
  classNames[`size--${size}`] = true;

  return (
    <button
      type='button'
      onClick={props.onClick}
      className={Utils.generateClassName(classNames)}
      title={props.title}
      onBlur={props.onBlur}
    >
      {!props.rightIcon && props.icon}
      <span>{props.children}</span>
      {props.rightIcon && props.icon}
    </button>
  );
}

export default React.memo(Button);

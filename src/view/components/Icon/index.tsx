/* eslint-disable react/display-name */
import React from 'react';

type Props = {
  name: string;
  customClass?: string;
  onClick?: any;
};

export const Icon = (props: Props) => {
  const { name, customClass, onClick } = props;

  return (
    <i
      className={`material-icons ${customClass}`}
      aria-hidden="true"
      onClick={onClick}
    >
      {name}
    </i>
  );
};

Icon.defaultProps = {
  customClass: '',
  onClick: () => {},
};

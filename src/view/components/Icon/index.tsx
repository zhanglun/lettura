import React from 'react';

type Props = {
  name: string;
  customClass?: string;
  onClick?: () => void;
};

export const Icon = (props: Props) => {
  const { name, customClass, onClick } = props;

  return (
    <i
      className={`iconfont icon-${name} ${customClass}`}
      aria-hidden="true"
      onClick={onClick}
    />
  );
};

Icon.defaultProps = {
  customClass: '',
  onClick: () => {},
};

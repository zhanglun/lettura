import React from 'react';

interface Props {
  name: string;
  // eslint-disable-next-line react/require-default-props
  customClass?: string;
}

function Icon(props: Props) {
  const { name, customClass } = props;

  return <i className={`iconfont icon-${name} ${customClass}`} />;
}

Icon.defaultProps = {
  customClass: '',
};

export { Icon };

import React from 'react';

interface Props {
  name: string;
}

function Icon(props: Props) {
  const { name } = props;

  return <i className={`iconfont icon-${name}`} />;
}

export { Icon };

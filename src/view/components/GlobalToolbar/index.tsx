import React, { useState, useEffect } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { Icon } from '../Icon';
import styles from './globaltoolbar.css';

function GlobalToolbar() {
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const $container = document.querySelector('#appMain');

    $container?.addEventListener(
      'scroll',
      () => {
        if ($container.scrollTop > 0) {
          setFixed(true);
        } else {
          setFixed(false);
        }
      },
      true
    );
  }, []);

  function favoriteIt() {}

  return (
    <div className={`${styles.container} ${fixed && styles.fixed}`}>
      <div className={styles.menu}>
        <Tooltip content="标记已读">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="done"
            onClick={favoriteIt}
          />
        </Tooltip>
        <Tooltip content="标记未读">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="radio_button_unchecked"
            onClick={favoriteIt}
          />
        </Tooltip>
        <Tooltip content="收藏">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="favorite"
            onClick={favoriteIt}
          />
        </Tooltip>

        <Tooltip content="在浏览器中打开">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="link"
            onClick={favoriteIt}
          />
        </Tooltip>
      </div>
    </div>
  );
}

export { GlobalToolbar };

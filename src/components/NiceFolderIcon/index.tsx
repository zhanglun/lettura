import clsx from "clsx";
import "./index.css";

export const NiceFolderIconStatus = [ "open", "close", "active" ];

export interface NiceFolderIconProps {
  status?: typeof NiceFolderIconStatus[number],
  size?: number;
}

export const NiceFolderIcon = (props: NiceFolderIconProps) => {
  const { status, size = 20 } = props;

  const styles = {
    folder: {
      width: `${size}px`,
      height: `${size}px`,
    },
  };

  return (
    <div className={clsx("folder", `folder--${status}`)} style={styles.folder}>
      <div className="folder__back">
        <div className="paper"></div>
        <div className="paper"></div>
        <div className="paper"></div>
        <div className="folder__front"></div>
        <div className="folder__front right"></div>
      </div>
    </div>
  );
};

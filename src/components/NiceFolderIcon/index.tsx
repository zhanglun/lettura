import clsx from "clsx";
import "./index.css";

export const NiceFolderIconStatus = ["open", "close", "active"];

export interface NiceFolderIconProps
  extends React.BaseHTMLAttributes<HTMLDivElement> {
  status?: (typeof NiceFolderIconStatus)[number];
  size?: number;
}

export const NiceFolderIcon = ({
  status,
  size = 20,
  ...props
}: NiceFolderIconProps) => {
  const styles = {
    folder: {
      width: `${size}px`,
      height: `${size}px`,
    },
  };

  return (
    <div
      className={clsx("folder", `folder--${status}`)}
      style={styles.folder}
      {...props}
    >
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

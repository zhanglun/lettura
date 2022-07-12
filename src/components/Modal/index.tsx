import React from "react";
import ReactDOM from "react-dom";

type ModalProps = {
  title?: string;
  visible: boolean;
  toggle: any;
  children?: any;
  onConfirm?: any;
  onCancel?: any;
  footer?: null | React.ReactElement;
};

const Modal = (props: ModalProps) => {
  const { visible, title, children, footer } = props;

  const handleConfirm = () => {
    props.onConfirm && props.onConfirm();
  }

  const handleCancel = () => {
    props.onCancel && props.onCancel();
  }

  return visible
    ? ReactDOM.createPortal(
        //@ts-ignore
        <div className="modal-overlay">
          <div className="modal-mask"></div>
          {/* @ts-ignore */}
          <div className="modal">
            <div className="modal-header">
              { title ? <div className="modal-title">{title}</div> : null}
            </div>
            <div className="modal-body">
              {children}
            </div>
            {footer !== null && <div className="modal-footer">
              <div className="modal-footer-action">
                <div className="modal-footer-button cancel" onClick={handleCancel}>Cancel</div>
                <div className="modal-footer-button confirm" onClick={handleConfirm}>Confirm</div>
              </div>
            </div>}
          </div>
        </div>,
        document.body
      )
    : null;
};

export { Modal };

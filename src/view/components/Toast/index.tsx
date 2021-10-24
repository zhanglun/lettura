import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './index.css';

export interface ToastProps {
  id: string;
  destroy: () => void;
  title: string;
  content: string;
  duration?: number;
}

const ToastIntance = (props: ToastProps) => {
  const { destroy, content, title, duration = 0, id } = props;

  useEffect(() => {
    if (!duration) return;

    const timer = setTimeout(() => {
      destroy();
    }, duration);

    // eslint-disable-next-line consistent-return
    return () => {
      clearTimeout(timer);
    };
  }, [destroy, duration]);

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <div>
          {title} {id}
        </div>
        {/* <button onClick={destroy}>X</button> */}
      </div>
      <div className={styles.body}>{content}</div>
    </div>
  );
};

interface ToastOptions {
  id?: string;
  title: string;
  content: string;
  duration?: number;
}

export class ToastManager {
  private containerRef: HTMLDivElement;

  private toasts: ToastProps[] = [];

  constructor() {
    const body = document.getElementsByTagName('body')[0] as HTMLBodyElement;
    const toastContainer = document.createElement('div') as HTMLDivElement;

    toastContainer.id = styles.main;
    body.insertAdjacentElement('beforeend', toastContainer);

    this.containerRef = toastContainer;
  }

  public show(options: ToastOptions): void {
    const toastId = Math.random().toString(36).substr(2, 9);
    const toast: ToastProps = {
      id: toastId,
      ...options,
      destroy: () => this.destroy(options.id ?? toastId),
    };

    this.toasts = [toast, ...this.toasts];
    this.render();
  }

  public destroy(id: string): void {
    this.toasts = this.toasts.filter((toast: ToastProps) => toast.id !== id);
    this.render();
  }

  private render(): void {
    const toastsList = this.toasts.map((toastProps: ToastProps) => (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <ToastIntance key={toastProps.id} {...toastProps} />
    ));
    ReactDOM.render(toastsList, this.containerRef);
  }
}

export const Toast = new ToastManager();

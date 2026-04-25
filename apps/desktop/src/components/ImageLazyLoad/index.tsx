import React, { useState } from "react";
import { clsx } from "clsx";
import { useInView } from "react-intersection-observer";

interface ImageLazyLoadProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  fallbackSrc?: string;
}

export const ImageLazyLoad = ({
  src,
  alt = "",
  className,
  width,
  height,
  fallbackSrc,
}: ImageLazyLoadProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (hasError) {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-gray-200 dark:bg-gray-800 flex items-center justify-center",
          className,
        )}
        style={{ width, height }}
      >
        {fallbackSrc ? (
          <img src={fallbackSrc} alt={alt} className="max-w-full max-h-full" />
        ) : (
          <span className="text-gray-400 text-xs">Image failed to load</span>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ width, height }} className={className}>
      {inView ? (
        <>
          {!isLoaded && (
            <div
              className={clsx(
                "absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300",
                "dark:from-gray-800 dark:to-gray-900 animate-pulse",
              )}
              style={{ width, height }}
            />
          )}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={clsx(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            style={{ width, height }}
          />
        </>
      ) : (
        <div
          className={clsx(
            "bg-gradient-to-br from-gray-200 to-gray-300",
            "dark:from-gray-800 dark:to-gray-900",
          )}
          style={{ width, height }}
        />
      )}
    </div>
  );
};

export default ImageLazyLoad;

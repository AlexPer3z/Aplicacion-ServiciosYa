import type React from "react";
import { type FC, type PropsWithChildren, Suspense } from "react";

/**
 * HOC (Higher-Order Component) that wraps a component with a Suspense boundary.
 *
 * @param Component The component to be wrapped with the Suspense boundary.
 * @param fallback A fallback component or element to display while the wrapped component is loading.
 * @returns A new component that wraps the original component with the Suspense boundary.
 */
export const withSuspense = <P extends object>(
  Component: FC<P>,
  fallback: React.ReactNode,
) => {
  const WrappedComponent: FC<P> = (props: PropsWithChildren<P>) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );

  return WrappedComponent;
};

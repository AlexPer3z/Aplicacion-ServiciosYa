import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React, { type FC, type PropsWithChildren } from "react";

/**
 * HOC (Higher-Order Component) that provides a bottom sheet modal provider.
 *
 * @param Component The component to be wrapped with the modal provider.
 * @returns A new component that wraps the original component with the modal provider.
 */
export const withModalProvider = <P extends object>(Component: FC<P>) => {
  const WrappedComponent: FC<P> = (props: PropsWithChildren<P>) => (
    <BottomSheetModalProvider>
      <Component {...props} />
    </BottomSheetModalProvider>
  );

  return WrappedComponent;
};

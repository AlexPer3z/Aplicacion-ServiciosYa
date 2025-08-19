import { useCallback, useMemo, useRef, type RefObject } from "react";
import type {
  BottomSheetModal,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";

export interface UseBottomSheetModalParams<T = unknown> {
  /** Snap points passed to BottomSheetModal (default: ['50%']) */
  snapPoints?: (string | number)[];
  /** Optional initial snap index (default: 0) */
  initialSnapIndex?: number;
  /** Callback when modal is dismissed */
  onClose?: () => void;
  /** Callback when modal is presented */
  onOpen?: () => void;
  /** Bottom inset (you can also use `useSafeAreaInsets`) */
  bottomInset?: number;
  /** Callback to receive returned data on confirm */
  onData?: (data: T) => void;
}

export interface UseBottomSheetModalReturn {
  /** Ref for the <BottomSheetModal> */
  ref: RefObject<BottomSheetModal | null>;
  /** Open the modal */
  present: () => void;
  /** Close the modal */
  dismiss: () => void;
  /** Snap to index */
  snapTo: (index: number) => void;
  /** Props to spread into <BottomSheetModal> */
  modalProps: Omit<BottomSheetModalProps, "children">;
}

export function useBottomSheetModal<T = unknown>({
  snapPoints = ["50%"],
  initialSnapIndex = 0,
  onClose,
  onOpen,
  bottomInset = 0,
}: UseBottomSheetModalParams<T> = {}): UseBottomSheetModalReturn {
  const ref = useRef<BottomSheetModal>(null);
  // const insets = useSafeAreaInsets();
  // const bottomNavBarHeight = insets.bottom;

  const present = useCallback(() => {
    onOpen?.();
    ref.current?.present();
  }, [onOpen]);

  const dismiss = useCallback(() => {
    ref.current?.dismiss();
  }, []);

  const snapTo = useCallback((index: number) => {
    ref.current?.snapToIndex(index);
  }, []);

  const modalProps = useMemo<Omit<BottomSheetModalProps, "children">>(
    () => ({
      ref,
      snapPoints,
      index: initialSnapIndex,
      enablePanDownToClose: true,
      enableHandlePanningGesture: false,
      bottomInset,
      // keyboardBehavior: Platform.OS === "ios" ? "interactive" : "fillParent",
      keyboardBlurBehavior: "restore",
      onDismiss: onClose,
    }),
    [snapPoints, initialSnapIndex, bottomInset, onClose],
  );

  return {
    ref,
    present,
    dismiss,
    snapTo,
    modalProps,
  };
}

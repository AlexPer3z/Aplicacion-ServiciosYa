import React, { type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../lib/constants/colors";
import { BottomSheetView } from "@gorhom/bottom-sheet";

type SheetContainerProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export default function SheetContainer({
  children,
  style,
}: SheetContainerProps) {
  const insets = useSafeAreaInsets();
  const bottomNavBarHeight = insets.bottom;

  return (
    <BottomSheetView
      style={[
        styles.sheetContainer,
        { paddingBottom: bottomNavBarHeight + 20 },
        style,
      ]}
    >
      {children}
    </BottomSheetView>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
});

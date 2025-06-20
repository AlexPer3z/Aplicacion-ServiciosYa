import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import OptionsSheetView from "./OptionsSheetView";

function OptionsButton() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  return (
    <>
      <Pressable
        onPress={handlePresentModalPress}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? "rgba(255, 255, 255, 0.15)" : undefined,
          },
          styles.optionsButton,
        ]}
      >
        <Ionicons name="options" size={24} color="white" />
      </Pressable>
      <BottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <OptionsSheetView />
      </BottomSheetModal>
    </>
  );
}

export default OptionsButton;

const styles = StyleSheet.create({
  optionsButton: {
    marginLeft: 5,
    padding: 10,
    borderRadius: 10,
  },
});

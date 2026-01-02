import React, { useCallback, useRef } from "react";
import CustomTextInput from "../inputs/CustomTextInput";
import { TouchableOpacity, View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MoreSheetModal from "./MoreSheetModal";
import { theme } from "../../lib/constants/colors";

interface ChatInputBarProps {
  onSend: (message: string) => void;
}

function ChatInputBar({ onSend }: ChatInputBarProps) {
  const [message, setMessage] = React.useState("");
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  const MoreButtonPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  return (
    <>
      <View style={styles.inputBarContainer}>
        <CustomTextInput
          containerStyle={{
            flex: 1,
            marginRight: 10,
            borderRadius: 20,
            height: "auto",
          }}
          inputStyle={{ minHeight: 40, maxHeight: 120 }}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje..."
          appendComponent={
            <Pressable onPress={MoreButtonPress}>
              <Ionicons
                name="logo-whatsapp"
                size={24}
                color={theme.palettes.primary[60]}
              />
              
            </Pressable>
          }
          multiline={true}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={styles.botonEnviar}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <BottomSheetModal ref={bottomSheetModalRef}>
        <MoreSheetModal />
      </BottomSheetModal>
    </>
  );
}

export default ChatInputBar;

const styles = StyleSheet.create({
  inputBarContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopColor: "#d0ece9",
    borderTopWidth: 1,
    backgroundColor: "#E8FAF7",
    alignItems: "flex-end",
  },
  botonEnviar: {
    backgroundColor: "#fe971a",
    borderRadius: 18,
    padding: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFA13C77",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
});

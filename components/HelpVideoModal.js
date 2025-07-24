import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Video } from "expo-av";

const { width } = Dimensions.get("window");
const VIDEO_HEIGHT = width * 1; // 16:9 aspect ratio

export default function HelpVideoModal({ visible, onClose, videoSource }) {
  const videoRef = useRef(null);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Video de ayuda</Text>
            <TouchableOpacity onPress={onClose} style={styles.cerrarBtn}>
              <Text style={styles.cerrarTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Video */}
          <Video
            ref={videoRef}
            style={styles.video}
            source={videoSource}
            useNativeControls
            resizeMode="contain"
            isLooping={false}
            shouldPlay={true}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 600,
  },
  header: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#00B8A9',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cerrarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cerrarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  video: {
    width: '100%',
    height: VIDEO_HEIGHT
  },
});

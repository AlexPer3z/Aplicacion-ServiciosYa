import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';

const { width } = Dimensions.get("window");
const VIDEO_HEIGHT = width * 1;

export default function HelpVideoModal({ visible, onClose, videoSource }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.setStatusAsync({
        shouldPlay: true,
        positionMillis: 0,
        isLooping: true,
      });
    } else if (videoRef.current) {
      videoRef.current.setStatusAsync({
        shouldPlay: false,
        positionMillis: 0,
      });
    }
  }, [visible]);

  const handleClose = async () => {
    if (videoRef.current) {
      await videoRef.current.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    }
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Video de ayuda</Text>
            <TouchableOpacity onPress={handleClose} style={styles.cerrarBtn}>
              <Text style={styles.cerrarTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.video}
            resizeMode="contain"
            shouldPlay
            isLooping
            useNativeControls
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
    height: VIDEO_HEIGHT,
  },
});

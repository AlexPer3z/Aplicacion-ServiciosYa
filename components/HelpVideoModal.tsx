import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import type { HomeEventComponentProps } from '../store/homeEventsStore';

const { width } = Dimensions.get("window");
const VIDEO_HEIGHT = width * 1;

interface HelpVideoData {
  videoSource: string;
}

export default function HelpVideoModal({
  eventId,
  onComplete,
  onDismiss,
  data
}: HomeEventComponentProps) {
  const videoRef = useRef<Video>(null);
  const [isVisible, setIsVisible] = useState(true);

  const { videoSource } = (data as unknown as HelpVideoData) || {};

  useEffect(() => {
    console.log(`HelpVideoModal mounted for event: ${eventId}`);
    
    if (videoRef.current) {
      videoRef.current.setStatusAsync({
        shouldPlay: true,
        positionMillis: 0,
        isLooping: true,
      });
    }

    return () => {
      console.log(`HelpVideoModal unmounting for event: ${eventId}`);
      if (videoRef.current) {
        videoRef.current.setStatusAsync({ shouldPlay: false });
      }
    };
  }, [eventId]);

  const handleClose = async () => {
    console.log(`HelpVideoModal closing, event: ${eventId}`);
    
    if (videoRef.current) {
      await videoRef.current.setStatusAsync({ shouldPlay: false });
    }

    setIsVisible(false);
    
    // Mark as completed so it won't show again
    onComplete();
  };

  if (!videoSource) {
    console.warn("HelpVideoModal: No videoSource provided in event data");
    return null;
  }

  console.log(`HelpVideoModal rendering for event: ${eventId}, video: ${videoSource}`);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
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
            resizeMode={ResizeMode.CONTAIN}
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
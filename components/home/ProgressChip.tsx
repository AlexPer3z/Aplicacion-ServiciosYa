import type React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomSheetModal } from '../../lib/hooks/useBottomSheetModal';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import AchievementsBottomSheet from '../AchievementsBottomSheet';
import { ACHIEVEMENTS } from '../../lib/constants/achievements';
import { useAchievements } from '../../lib/services/achievements.services';
import { useMemo } from 'react';

interface ProgressChipProps {
  onPress?: () => void;
  label?: string;
}

const ProgressChip: React.FC<ProgressChipProps> = ({
  onPress,
  label = 'Mis Logros',
}) => {
  const colorScheme = useColorScheme();
  const { present, dismiss, modalProps } = useBottomSheetModal({
    snapPoints: ["90%"],
  });
  const isDark = colorScheme === 'dark';
  const { items, progress } = useAchievements();
  const completedKeys = useMemo(() => items.map(item => item.key), [items]);


  const colors = {
    accentOrange: '#F59E0B',
    white: '#FFFFFF',
  };

  const handlePress = () => {
    present();
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
        onPress={handlePress}
      >
        <View style={styles.content}>
          {/* Progress Section */}
          <View style={styles.progressContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.percentage}>{progress}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: colors.accentOrange,
                  },
                ]}
              />
            </View>
          </View>

          {/* Chevron Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="chevron-right"
              size={28}
              color={colors.white}
            />
          </View>
        </View>
      </Pressable>
      <BottomSheetModal {...modalProps} backgroundStyle={{ backgroundColor: "#F7FAFC" }}>
        <AchievementsBottomSheet completedKeys={completedKeys} achievements={ACHIEVEMENTS} />
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 9999,
    marginTop: 8,
    padding: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    paddingLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressChip;
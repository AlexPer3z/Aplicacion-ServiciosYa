import React, { memo, useEffect } from "react";
import CheckboxChip from "../inputs/CheckboxChip";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { useQueryClient } from "@tanstack/react-query";
import type { StyleProp, ViewStyle } from "react-native"; // Add this import

interface OnlineFilterCheckBoxProps {
  onToggle?: (value: boolean) => void;
  style?: StyleProp<ViewStyle>; // Add style prop
}

function OnlineFilterCheckBox({ onToggle, style }: OnlineFilterCheckBoxProps) {
  const queryClient = useQueryClient();
  const { settings, updateSettings } = useUserSettings();
  const OnlyOnlineWorkers = settings?.OnlyOnlineWorkers ?? false;
  const prevValue = React.useRef(OnlyOnlineWorkers);

  useEffect(() => {
    if (prevValue.current !== OnlyOnlineWorkers) {
      onToggle?.(OnlyOnlineWorkers);
      queryClient.invalidateQueries({ queryKey: ["user", "services"] });
      prevValue.current = OnlyOnlineWorkers;
    }
  }, [OnlyOnlineWorkers, onToggle, queryClient]);

  const handleToggle = async (value: boolean) => {
    console.log("Set to:", value);
    updateSettings({ OnlyOnlineWorkers: value });
  };

  return (
    <CheckboxChip
      checked={OnlyOnlineWorkers}
      label="Servicios Online"
      size="lg"
      onPress={() => handleToggle(!OnlyOnlineWorkers)}
      style={style} // Pass style prop down
    />
  );
}

export default memo(OnlineFilterCheckBox);

// In your existing navigation file, add this hook:
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../types/navigation";

export const useMainNavigation = () => {
  return useNavigation<NativeStackNavigationProp<MainStackParamList>>();
};

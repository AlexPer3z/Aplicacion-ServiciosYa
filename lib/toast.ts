import { Toast } from "toastify-react-native";
import type { ToastShowParams } from "toastify-react-native/utils/interfaces";

const toast = ({ position = "bottom", ...params }: ToastShowParams) => {
  Toast.show({
    position: "bottom",
  });
};

const showToast = {
  info: (title: string, description: string) =>
    toast({ type: "info", text1: title, text2: description }),
  error: (title: string, description: string) =>
    toast({ type: "error", text1: title, text2: description }),
  success: (title: string, description: string) =>
    toast({ type: "success", text1: title, text2: description }),
};

export default showToast;

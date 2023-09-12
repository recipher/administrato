import { createContext } from "react";
import { type FlashMessage } from "~/utility/flash.server";

type ToastContextProps = {
  createToast: React.Dispatch<React.SetStateAction<FlashMessage>>,
  flash: FlashMessage
};

const ToastContext = createContext<ToastContextProps>({ createToast: () => null!, flash: null! });

export default ToastContext;
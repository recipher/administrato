import { createContext } from "react";
import { type FlashMessage } from "~/utility/flash.server";

type ToastContextProps = {
  createToast: React.Dispatch<React.SetStateAction<FlashMessage>>,
  toast: FlashMessage
};

const initialState = { createToast: () => null!, toast: null! };

export default createContext<ToastContextProps>(initialState);

// import { PropsWithChildren, createContext, useContext, useState } from "react";
// import { Level } from "~/components/toast";
// import { type FlashMessage } from "~/utility/flash.server";

// type ToastContextProps = {
//   createToast: (flash: FlashMessage) => void,
//   toast: FlashMessage
// };

// const initialState = { 
//   createToast: () => null!, 
//   toast: null! 
// };

// const ToastContext = createContext<ToastContextProps>(initialState);

// export const ToastProvider = ({ flash, children }: PropsWithChildren<{flash: FlashMessage}>) => {
//   const [toast, createToast] = useState(flash);
  
//   return (
//     <ToastContext.Provider value={{ toast, createToast }}>
//       {children}
//     </ToastContext.Provider>
//   );
// };

// export default () => {
//   const context = useContext(ToastContext);

//   if (context === undefined) {
//     throw new Error("useToast must be used within a ToastProvider");
//   }
//   return context;
// };

import { Provider } from "react-redux";
import { ReactNode } from "react";
import { store } from "@/store";

interface ReduxProviderProps {
  children: ReactNode;
}

/**
 * ReduxProvider component that wraps the application with Redux store
 * 
 * This provider makes the Redux store available to all components
 * in the component tree via React Context.
 */
export function ReduxProvider({ children }: Readonly<ReduxProviderProps>) {
  return <Provider store={store}>{children}</Provider>;
}


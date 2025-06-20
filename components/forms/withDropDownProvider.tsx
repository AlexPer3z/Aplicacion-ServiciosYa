import type { FC, PropsWithChildren } from "react";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

export const withDropDownProvider =
  <P extends object>(Component: FC<P>): FC<P> =>
  (props: PropsWithChildren<P>) => (
    <AutocompleteDropdownContextProvider>
      <Component {...props} />
    </AutocompleteDropdownContextProvider>
  );

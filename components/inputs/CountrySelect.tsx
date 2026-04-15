import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";
import type {
  AutocompleteDropdownItem,
  IAutocompleteDropdownProps,
} from "react-native-autocomplete-dropdown";
import { countries, type Country } from "../../lib/constants/country";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

interface CountryAutocompleteProps {
  label?: string;
  value: string | null;
  onSelectCountry: (country: Country | null) => void;
  dropdownProps?: Partial<IAutocompleteDropdownProps>;
}

export const CountryAutocomplete = ({
  label,
  value,
  onSelectCountry,
  dropdownProps,
}: CountryAutocompleteProps) => {
  const [selectedItem, setSelectedItem] =
    useState<AutocompleteDropdownItem | null>(null);

  const dropdownData = useMemo(
    () =>
      countries.map((c) => ({
        id: c.code,
        title: c.name,
      })),
    [],
  );

  const handleSelectItem = useCallback(
    (item: AutocompleteDropdownItem | null) => {
      setSelectedItem(item);
      if (item) {
        const fullCountryObject = countries.find((c) => c.code === item.id);
        onSelectCountry(fullCountryObject || null);
      } else {
        onSelectCountry(null);
      }
    },
    [onSelectCountry],
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <AutocompleteDropdown
        dataSet={dropdownData}
        onSelectItem={handleSelectItem}
        clearOnFocus={false}
        closeOnBlur={true}
        useFilter={true}
        InputComponent={BottomSheetTextInput}
        textInputProps={{
          placeholder: "Buscar...",
          style: styles.textInput,
        }}
        inputContainerStyle={styles.inputContainer}
        suggestionsListContainerStyle={styles.suggestionsListContainer}
        flatListProps={{
          windowSize: 5,
          initialNumToRender: 10,
          maxToRenderPerBatch: 15,
          removeClippedSubviews: true,
          keyboardShouldPersistTaps: "always",
        }}
        containerStyle={{ backgroundColor: "#F7F7F7", borderRadius: 8 }}
        emptyResultText="No se encontro ningun resultado"
        initialValue={value ? { id: value } : undefined}
        {...dropdownProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#19D4C6",
  },
  textInput: {
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
    color: "#333",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#C8ECE8",
    borderRadius: 8,
  },
  suggestionsListContainer: {
    backgroundColor: "white",
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
  },
});

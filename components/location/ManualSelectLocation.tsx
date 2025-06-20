import { useEffect, useState } from "react";
import { CityAutocomplete, type City } from "../inputs/CityAutocomplete";
import { type StyleProp, View, type ViewStyle, Text } from "react-native";
import { CountryAutocomplete } from "../inputs/CountrySelect";
import type { LocationItem } from "../../types/location";

interface ManualSelectLocationProps {
  onChange: (location: LocationItem | null) => void;
  style?: StyleProp<ViewStyle>;
}

export function ManualSelectLocation({
  onChange,
  style,
}: ManualSelectLocationProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    if (selectedCity && selectedCountry) {
      onChange({
        name: `${selectedCity.name}, ${selectedCountry}`,
        lat: selectedCity.latitude,
        lng: selectedCity.longitude,
        isoCountryCode: selectedCountry,
      });
    } else {
      onChange(null);
    }
  }, [selectedCity]);

  return (
    <View style={style}>
      <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 12 }}>
        Selecciona un país para buscar ciudades (ubicación desactivada)
      </Text>
      <CountryAutocomplete
        label="Pais"
        value={selectedCountry}
        onSelectCountry={(country) => setSelectedCountry(country?.code || null)}
      />
      <CityAutocomplete
        label="Ciudad"
        countryCode={selectedCountry}
        onSelectCity={(city) => setSelectedCity(city || null)}
        placeholder="Selecciona una ciudad"
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

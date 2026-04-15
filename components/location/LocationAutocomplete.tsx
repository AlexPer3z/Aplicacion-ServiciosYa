// src/components/LocationAutocomplete.tsx
import React, {
  useState,
  useCallback,
  type FC,
  useEffect,
  useRef,
} from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  AutocompleteDropdown,
  type AutocompleteDropdownItem,
} from "react-native-autocomplete-dropdown";
import { debounce } from "lodash";
import "react-native-get-random-values"; // For uuid on RN
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../../lib/supabase"; // Adjust path to your Supabase client

// --- Type Definitions ---

// Structure from our 'places-autocomplete' Edge Function (matches Google's predictions)
interface AutocompletePrediction {
  description: string;
  place_id: string;
  // Add other fields if your Edge Function returns them or you need them
  // structured_formatting: { main_text: string; secondary_text: string; };
}

// Structure from our 'place-details' Edge Function (matches Google's result)
interface PlaceDetailsResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string; // Or other fields you request
  // address_components: any[]; // If requested
}

// The final, detailed location data we want to return
export interface LocationDetails {
  description: string; // This will be formatted_address
  placeId: string;
  latitude: number;
  longitude: number;
  // You can add more detailed components here if needed from address_components
  // city?: string;
  // country?: string;
  // etc.
}

// --- Component Props ---
interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationDetails | null) => void;
  initialValue?: string | { id: string; title: string }; // id here is place_id, title is description
  placeholder?: string;
  debounceMs?: number;
  // --- Edge Function parameters (optional) ---
  autocompleteTypes?: string; // e.g., 'address', '(cities)'
  autocompleteComponents?: string; // e.g., 'country:us'
  autocompleteLanguage?: string; // e.g., 'en'
  detailsFields?: string; // e.g., "geometry,name,formatted_address,address_components"

  // --- Style Props for Customization ---
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  suggestionsListContainerStyle?: StyleProp<ViewStyle>;
  // Add other style props from AutocompleteDropdown if needed
}

export const LocationAutocomplete: FC<LocationAutocompleteProps> = ({
  onLocationSelect,
  initialValue,
  placeholder = "Search for a location...",
  debounceMs = 500,
  autocompleteTypes,
  autocompleteComponents,
  autocompleteLanguage,
  detailsFields = "geometry,name,formatted_address", // Default fields for details
  ...restStyles
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteDropdownItem[]>(
    [],
  );
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Ref to store the current search query to avoid redundant calls
  const currentQuery = useRef<string>("");

  // Generate a new session token when the component mounts or input focuses
  // This is a simplified way; ideally, tie it to input focus/blur for better session management.
  useEffect(() => {
    setSessionToken(uuidv4());
  }, []);

  // Fetches detailed information for a selected place_id via Edge Function
  const getPlaceDetails = async (
    placeId: string,
    currentSessionToken: string | null,
  ): Promise<LocationDetails | null> => {
    if (!currentSessionToken) {
      console.warn("No session token available for place details request.");
      return null;
    }
    setLoading(true);
    try {
      const { data, error } =
        await supabase.functions.invoke<PlaceDetailsResult>("place-details", {
          body: {
            placeId: placeId,
            sessionToken: currentSessionToken,
            fields: detailsFields,
          },
        });

      if (error) {
        console.error("Error fetching place details:", error.message);
        throw error; // Propagate error
      }

      if (data?.geometry) {
        // After successfully getting details, Google recommends starting a new session token
        // for the next autocomplete session.
        setSessionToken(uuidv4());

        return {
          description: data.formatted_address,
          placeId,
          latitude: data.geometry.location.lat,
          longitude: data.geometry.location.lng,
        };
      }
    } catch (error) {
      // Error already logged or will be logged by caller
      // console.error("Failed to fetch place details:", error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Debounced function to fetch suggestions via Edge Function
  const getSuggestions = useCallback(
    debounce(async (query: string) => {
      currentQuery.current = query; // Store current query

      if (!query || query.trim().length < 2 || !sessionToken) {
        setSuggestions([]);
        setLoading(false); // Ensure loading is false if no API call
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<
          AutocompletePrediction[]
        >("places-autocomplete", {
          body: {
            input: query.trim(),
            sessionToken: sessionToken,
            types: autocompleteTypes,
            components: autocompleteComponents,
            language: autocompleteLanguage,
          },
        });

        if (error) {
          console.error("Error fetching suggestions:", error.message);
          throw error; // Propagate
        }
        // Only update suggestions if the query hasn't changed (avoid race conditions)
        if (query === currentQuery.current) {
          if (data) {
            const formattedSuggestions: AutocompleteDropdownItem[] = data.map(
              (prediction: AutocompletePrediction) => ({
                id: prediction.place_id, // This is the place_id
                title: prediction.description,
              }),
            );
            setSuggestions(formattedSuggestions);
          } else {
            setSuggestions([]);
          }
        }
      } catch (error) {
        // console.error("Failed to fetch suggestions:", error);
        setSuggestions([]); // Clear suggestions on error
      } finally {
        if (query === currentQuery.current) {
          // Only stop loading if it's for the current query
          setLoading(false);
        }
      }
    }, debounceMs),
    [
      sessionToken,
      debounceMs,
      autocompleteTypes,
      autocompleteComponents,
      autocompleteLanguage,
    ], // Add dependencies
  );

  const handleSelectItem = async (item: AutocompleteDropdownItem | null) => {
    if (item?.id) {
      // item.id is the place_id
      const details = await getPlaceDetails(item.id, sessionToken);
      onLocationSelect(details); // Pass details or null
    } else {
      onLocationSelect(null);
    }
  };

  const handleClear = () => {
    setSuggestions([]);
    onLocationSelect(null);
    // Optionally regenerate session token if clear implies a new "session"
    // setSessionToken(uuidv4());
  };

  return (
    <AutocompleteDropdown
      // Pass through customizable style props
      containerStyle={restStyles.containerStyle}
      inputContainerStyle={restStyles.inputContainerStyle}
      suggestionsListContainerStyle={restStyles.suggestionsListContainerStyle}
      // Core props
      dataSet={suggestions}
      onSelectItem={handleSelectItem}
      onChangeText={(text) => {
        // If text is empty, clear suggestions and notify parent
        if (!text || text.trim() === "") {
          setSuggestions([]);
          if (initialValue) {
            // If there was an initial value and it's cleared
            onLocationSelect(null);
          }
        }
        getSuggestions(text);
      }}
      onClear={handleClear}
      loading={loading}
      useFilter={false} // We fetch from API
      debounce={0} // We handle our own debouncing
      placeholder={placeholder}
      initialValue={initialValue} // {id: place_id, title: description}
      // textInputProps={{
      //   onFocus: () => {
      //     // Potentially generate a new session token on focus if it wasn't set or is old
      //     if (!sessionToken) setSessionToken(uuidv4());
      //   }
      // }}
      clearOnFocus={false}
      closeOnBlur={true} // Personal preference
      closeOnSubmit={false}
    />
  );
};

// --- Example Usage (in another component) ---
// const MyScreen = () => {
//   const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);

//   const handleLocationSelected = (location: LocationDetails | null) => {
//     console.log("Selected Location:", location);
//     setSelectedLocation(location);
//   };

//   return (
//     <View style={{ padding: 20, flex:1, backgroundColor: '#f0f0f0' }}>
//       <LocationAutocomplete
//         onLocationSelect={handleLocationSelected}
//         placeholder="Enter an address"
//         // You can set an initial value if you have a place_id and description
//         // initialValue={{id: "ChIJ...", title: "123 Main St..."}}
//         // Optional: bias search results
//         // autocompleteComponents="country:ca"
//         // autocompleteTypes="(cities)"
//       />
//       {selectedLocation && (
//         <Text style={{ marginTop: 20 }}>
//           Selected: {selectedLocation.description}{"\n"}
//           Lat: {selectedLocation.latitude}, Lon: {selectedLocation.longitude}
//         </Text>
//       )}
//     </View>
//   );
// };

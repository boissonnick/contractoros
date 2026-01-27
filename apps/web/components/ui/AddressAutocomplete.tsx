"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    __googleMapsCallback?: () => void;
  }
}

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressComponents) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (googleMapsLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    googleMapsLoading = true;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      resolve();
      return;
    }

    window.__googleMapsCallback = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

function parsePlace(place: any): AddressComponents {
  const components = place.address_components || [];
  let streetNumber = '';
  let route = '';
  let city = '';
  let state = '';
  let zip = '';

  for (const comp of components) {
    const types = comp.types;
    if (types.includes('street_number')) streetNumber = comp.long_name;
    if (types.includes('route')) route = comp.short_name;
    if (types.includes('locality')) city = comp.long_name;
    if (types.includes('sublocality_level_1') && !city) city = comp.long_name;
    if (types.includes('administrative_area_level_1')) state = comp.short_name;
    if (types.includes('postal_code')) zip = comp.long_name;
  }

  return {
    street: [streetNumber, route].filter(Boolean).join(' '),
    city,
    state,
    zip,
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  label = 'Street Address',
  placeholder = 'Start typing an address...',
  autoFocus = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(googleMapsLoaded);

  const handlePlaceChanged = useCallback(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place.address_components) return;

    const parsed = parsePlace(place);
    onChange(parsed.street);
    onAddressSelect(parsed);
  }, [onChange, onAddressSelect]);

  useEffect(() => {
    loadGoogleMaps().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', handlePlaceChanged);
    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [loaded, handlePlaceChanged]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
      />
    </div>
  );
}

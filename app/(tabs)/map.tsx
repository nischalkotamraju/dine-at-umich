import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Locate } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, TouchableOpacity, View } from 'react-native';
import type { Region } from 'react-native-maps';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { getLocationIcon, getLocationIconColor } from '~/app/_components/LocationItem';
import { Container } from '~/components/Container';
import MapLocationModal from '~/components/MapLocationModal';
import { useDatabase } from '~/hooks/useDatabase';
import { getAllLocationsWithCoordinates } from '~/services/database/database';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { cn } from '~/utils/utils';

// Type for location data used on the map
type MergedLocation = {
  name: string;
  address: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: string;
};

const initialRegion = {
  latitude: 42.278049,
  longitude: -83.738235,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Some locations share the same building/address (e.g. a dining hall and its
// attached café or market), which puts their pins at identical coordinates
// and makes them overlap/impossible to tap individually. Spread out any
// locations that land on the same spot (rounded to ~1m) into a small circle
// around that point so every pin stays visible and tappable.
const OVERLAP_GROUP_PRECISION = 5; // decimal places, ~1.1m
const OVERLAP_RADIUS_DEGREES = 0.00012; // ~13m north-south

const spreadOverlappingLocations = (locations: MergedLocation[]): MergedLocation[] => {
  const groups = new Map<string, MergedLocation[]>();

  for (const location of locations) {
    const key = `${location.coordinates.latitude.toFixed(OVERLAP_GROUP_PRECISION)},${location.coordinates.longitude.toFixed(OVERLAP_GROUP_PRECISION)}`;
    const group = groups.get(key);
    if (group) {
      group.push(location);
    } else {
      groups.set(key, [location]);
    }
  }

  const result: MergedLocation[] = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      result.push(group[0]);
      return;
    }

    // Longitude degrees are narrower than latitude degrees away from the
    // equator, so scale the longitude offset to keep the spread visually
    // circular instead of a squished ellipse.
    const latitudeRadians = (group[0].coordinates.latitude * Math.PI) / 180;
    const longitudeScale = Math.cos(latitudeRadians) || 1;

    group.forEach((location, index) => {
      const angle = (2 * Math.PI * index) / group.length;
      result.push({
        ...location,
        coordinates: {
          latitude: location.coordinates.latitude + OVERLAP_RADIUS_DEGREES * Math.sin(angle),
          longitude:
            location.coordinates.longitude +
            (OVERLAP_RADIUS_DEGREES * Math.cos(angle)) / longitudeScale,
        },
      });
    });
  });

  return result;
};

const MarkerIcon = ({
  onPress,
  type,
}: {
  onPress: () => void;
  type: string;
}) => {
  const bgColor = getLocationIconColor(type);
  const icon = getLocationIcon(type, '#111', 20);
  const squishAnimation = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(squishAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(squishAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: squishAnimation }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={{
          backgroundColor: bgColor,
          padding: 8,
          borderRadius: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        }}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
};

type Direction = 'north' | 'south' | 'east' | 'west';

const EdgeIndicator = ({ direction, onPress }: { direction: Direction; onPress: () => void }) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const squishAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scale in animation when component mounts
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Return cleanup function for scale out animation
    return () => {
      Animated.spring(scaleAnimation, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };
  }, [scaleAnimation]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(squishAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(squishAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const getPositionStyle = () => {
    const { width, height } = Dimensions.get('window');
    const indicatorSize = 60;
    const margin = 20;

    switch (direction) {
      case 'north':
        return {
          top: 100,
          left: width / 2 - indicatorSize / 2,
        };
      case 'south':
        return {
          bottom: 80,
          left: width / 2 - indicatorSize / 2,
        };
      case 'east':
        return {
          top: height / 2 - indicatorSize / 2,
          right: margin,
        };
      case 'west':
        return {
          top: height / 2 - indicatorSize / 2,
          left: margin,
        };
    }
  };

  const getIcon = () => {
    const iconColor = isDarkMode ? '#000' : '#fff';
    switch (direction) {
      case 'north':
        return <ChevronUp size={24} color={iconColor} />;
      case 'south':
        return <ChevronDown size={24} color={iconColor} />;
      case 'east':
        return <ChevronRight size={24} color={iconColor} />;
      case 'west':
        return <ChevronLeft size={24} color={iconColor} />;
    }
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          transform: [{ scale: scaleAnimation }, { scale: squishAnimation }],
        },
        getPositionStyle(),
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={{
          width: 60,
          height: 60,
          backgroundColor: getAccent(isDarkMode),
          borderRadius: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ alignItems: 'center' }}>{getIcon()}</View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MapMarkers = ({
  locations,
  onMarkerPress,
}: {
  locations: MergedLocation[];
  onMarkerPress: (location: MergedLocation) => void;
}) => {
  return (
    <>
      {locations.map((location) => (
        <Marker
          key={location.name}
          coordinate={location.coordinates}
          tracksViewChanges={false}
          calloutEnabled={false}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onMarkerPress(location);
          }}
        >
          <MarkerIcon
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMarkerPress(location);
            }}
            type={location.type}
          />
        </Marker>
      ))}
    </>
  );
};

const MapPage = () => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region>(initialRegion);
  const db = useDatabase();
  const [dbLocations, setDbLocations] = useState<
    Awaited<ReturnType<typeof getAllLocationsWithCoordinates>>
  >([]);
  const [selectedLocation, setSelectedLocation] = useState<MergedLocation | null>(null);
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'Enable location services to see your position on the map.',
          [{ text: 'OK' }],
        );
        return;
      }
      setHasLocationPermission(true);

      // Get initial location
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      // Watch for location updates
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation: Location.LocationObject) => {
          setUserLocation(newLocation);
        },
      );

      return () => {
        locationSubscription.remove();
      };
    })();
  }, []);

  useEffect(() => {
    async function fetchDbLocations() {
      if (!db) return;

      const locs = await getAllLocationsWithCoordinates(db);
      setDbLocations(locs);
    }
    fetchDbLocations();
  }, [db]);

  // Transform database locations to consistent format, filtering out null names
  const mergedLocations: MergedLocation[] = React.useMemo(() => {
    const locations = dbLocations
      .filter((loc) => loc.name !== null)
      .map((loc) => ({
        name: loc.name as string,
        address: loc.address,
        description: loc.description,
        coordinates: {
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
        },
        type: loc.type,
      }));

    return spreadOverlappingLocations(locations);
  }, [dbLocations]);

  const handleRegionChangeComplete = (region: Region) => {
    // Update current region for edge indicator calculations
    setCurrentRegion(region);
  };

  const outOfViewLocations = useMemo(() => {
    // Calculate distance from initial campus center
    const distanceFromCampus = Math.sqrt(
      (currentRegion.latitude - initialRegion.latitude) ** 2 +
        (currentRegion.longitude - initialRegion.longitude) ** 2,
    );

    // Threshold to determine if user has scrolled away from main campus area
    const campusDistanceThreshold = 0.013;

    // Only show edge indicators when user has scrolled significantly away from campus
    const isAwayFromCampus = distanceFromCampus > campusDistanceThreshold;

    const grouped: Record<Direction, typeof mergedLocations> = {
      north: [],
      south: [],
      east: [],
      west: [],
    };

    // Return empty groups if still within campus area
    if (!isAwayFromCampus) {
      return grouped;
    }

    const visibleBounds = {
      north: currentRegion.latitude + currentRegion.latitudeDelta / 2,
      south: currentRegion.latitude - currentRegion.latitudeDelta / 2,
      east: currentRegion.longitude + currentRegion.longitudeDelta / 2,
      west: currentRegion.longitude - currentRegion.longitudeDelta / 2,
    };

    mergedLocations.forEach((location) => {
      const { latitude, longitude } = location.coordinates;

      // Check if location is outside visible bounds
      const isOutOfView =
        latitude > visibleBounds.north ||
        latitude < visibleBounds.south ||
        longitude > visibleBounds.east ||
        longitude < visibleBounds.west;

      if (isOutOfView) {
        // Determine primary direction
        const latDiff = latitude - currentRegion.latitude;
        const lonDiff = longitude - currentRegion.longitude;

        if (Math.abs(latDiff) > Math.abs(lonDiff)) {
          // Primary direction is north/south
          if (latDiff > 0) {
            grouped.north.push(location);
          } else {
            grouped.south.push(location);
          }
        } else {
          // Primary direction is east/west
          if (lonDiff > 0) {
            grouped.east.push(location);
          } else {
            grouped.west.push(location);
          }
        }
      }
    });

    // Find the direction with the most locations
    const directionWithMost = Object.entries(grouped).reduce(
      (max, [direction, locations]) => {
        return locations.length > max.count
          ? { direction: direction as Direction, count: locations.length }
          : max;
      },
      { direction: 'north' as Direction, count: 0 },
    );

    // Return only the direction with the most locations
    return {
      [directionWithMost.direction]: grouped[directionWithMost.direction],
    };
  }, [currentRegion, mergedLocations]);

  const navigateToDirection = (direction: Direction) => {
    const locationsInDirection = outOfViewLocations[direction];
    if (locationsInDirection.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Edge indicators exist to guide the user back to campus when they've
    // scrolled/panned away, so pressing one should always bring them back to
    // the campus center — not to whichever individual pin happens to be
    // closest, which could be much farther away than the center itself
    // (e.g. when the user's current location is off campus).
    mapRef.current?.animateToRegion(initialRegion, 500);
  };

  const handleMarkerPress = (location: MergedLocation) => {
    setSelectedLocation(location);

    mapRef.current?.animateToRegion(
      {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        latitudeDelta: 0.00125,
        longitudeDelta: 0.00125,
      },
      500,
    );
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      const userLat = userLocation.coords.latitude;
      const userLong = userLocation.coords.longitude;

      mapRef.current.animateToRegion({
        latitude: userLat,
        longitude: userLong,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#171717' : '#fff' }}>
      <Container
        disableInsets
        className={cn('mx-0 gap-6', isDarkMode ? 'bg-neutral-900' : 'bg-white')}
      >
        <Stack.Screen
          options={{
            title: 'Map',
            headerShown: false,
          }}
        />

        <MapView
          ref={mapRef}
          style={{
            flex: 1,
            borderTopWidth: 1,
            borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(51, 63, 72, 0.15)',
          }}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation={hasLocationPermission}
          onRegionChangeComplete={handleRegionChangeComplete}
          userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
          loadingEnabled
          loadingBackgroundColor={isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'}
          showsPointsOfInterest={false}
          showsIndoors={false}
        >
          <MapMarkers locations={mergedLocations} onMarkerPress={handleMarkerPress} />
        </MapView>

        {/* Edge Indicators */}
        {Object.entries(outOfViewLocations).map(([direction, locations]) => {
          if (locations.length === 0) return null;

          return (
            <EdgeIndicator
              key={direction}
              direction={direction as Direction}
              onPress={() => navigateToDirection(direction as Direction)}
            />
          );
        })}

        {/* Location Button */}
        {hasLocationPermission && (
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              centerOnUser();
            }}
            className={cn(
              'absolute right-12 bottom-12 rounded-2xl p-4',
              isDarkMode ? 'bg-[#171717]' : 'bg-white',
            )}
          >
            <Locate size={24} color={getAccent(isDarkMode)} />
          </TouchableOpacity>
        )}

        <MapLocationModal
          visible={selectedLocation !== null}
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      </Container>
    </View>
  );
};

export default MapPage;

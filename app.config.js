const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Dine @ Michigan (Dev)' : 'Dine @ Michigan',
    slug: 'michigan-dining',
    version: '1.2.4',
    scheme: 'michigan-dining',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/icons/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#011f4f',
        },
      ],
      [
        'expo-sqlite',
        {
          enableFTS: true,
          useSQLCipher: true,
          android: {
            enableFTS: false,
            useSQLCipher: false,
          },
          ios: {
            customBuildFlags: ['-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1'],
          },
        },
      ],
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
        },
      ],
      'expo-localization',
      './plugins/withFmtConstevalFix.cjs',
      // Generates the MichiganDiningWidgets extension (home screen widget)
      // from targets/MichiganDiningWidgets on every prebuild, so it's never
      // lost to a manual `ios/` edit again.
      '@bacons/apple-targets',
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    orientation: 'portrait',
    icon: './assets/icons/ios-light.png',
    userInterfaceStyle: 'automatic',

    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      icon: {
        dark: './assets/icons/ios-dark.png',
        light: './assets/icons/ios-light.png',
        tinted: './assets/icons/ios-tinted.png',
      },
      bundleIdentifier: IS_DEV ? 'com.nischalkotamraju.dinemichigan.dev' : 'com.nischalkotamraju.dinemichigan',
      entitlements: {
        ...(IS_DEV ? {} : { 'aps-environment': 'production' }),
        'com.apple.security.application-groups': ['group.com.nischalkotamraju.michigandining.shared'],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'Dine @ Michigan needs your location to show your location on the map.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Dine @ Michigan needs your location to show your location on the map.',
        NSLocationUsageDescription:
          'Dine @ Michigan needs your location to show your location on the map.',
        // Allows the dev client to reach the Metro bundler over HTTP on networks
        // like iPhone Personal Hotspot, which uses the 192.0.0.0/24 range that
        // iOS's default NSAllowsLocalNetworking exception doesn't cover.
        ...(IS_DEV ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } : {}),
      },
      splash: {
        image: './assets/icons/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#011f4f',
        dark: {
          image: './assets/icons/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#011f4f',
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icons/adaptive-icon.png',
        backgroundColor: '#FFCB05',
      },
      bundleIdentifier: IS_DEV ? 'com.nischalkotamraju.dinemichigan.dev' : 'com.nischalkotamraju.dinemichigan',
      package: 'com.nischalkotamraju.michigandining',
    },
    newArchEnabled: true,
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'a7854532-37d6-4b1c-bd4a-930c22826aad',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/a7854532-37d6-4b1c-bd4a-930c22826aad',
    },
  },
};

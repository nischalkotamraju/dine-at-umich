import * as Notifications from 'expo-notifications';
import { Link } from 'expo-router';
import {
  Bell,
  BellRing,
  ChevronRight,
  Code,
  HelpCircle,
  Info,
  type LucideIcon,
  Mail,
  MapPin,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
} from 'lucide-react-native';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingScreen from '~/components/onboarding/OnboardingScreen';
import { useDatabase } from '~/hooks/useDatabase';
import { useLocationPermissions } from '~/hooks/useLocationPermissions';
import { useNotificationPermissions } from '~/hooks/useNotificationPermissions';
import { getAppInformation } from '~/services/database/database';
import type { AppInformation } from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { useResponsive } from '~/utils/responsive';

const ITUNES_ITEM_ID = '6743042002';
const MONO_BOLD = 'RobotoMono_700Bold';
const MONO_MEDIUM = 'RobotoMono_500Medium';

type Rs = ReturnType<typeof useResponsive>;

const MonoLabel = ({ title, isDarkMode, scale, verticalScale }: { title: string; isDarkMode: boolean } & Pick<Rs, 'scale' | 'verticalScale'>) => (
  <Text
    style={{
      fontWeight: '700',
      fontSize: scale(11.5),
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      letterSpacing: 1,
      marginTop: verticalScale(24),
      marginBottom: verticalScale(10),
    }}
  >
    {title.toUpperCase()}
  </Text>
);

const ModeRow = ({
  isDarkMode,
  setDarkMode,
  scale,
  verticalScale,
}: {
  isDarkMode: boolean;
  setDarkMode: (isDarkMode: boolean) => void;
} & Pick<Rs, 'scale' | 'verticalScale'>) => {
  const cardBg = isDarkMode ? '#262626' : '#F9F9F9';
  const border = isDarkMode ? '#333' : '#e5e7eb';
  const textColor = isDarkMode ? '#fff' : '#111';
  const segmentBg = isDarkMode ? '#1C1C1E' : '#EFEFEF';
  const selectedTextColor = isDarkMode ? '#000' : '#fff';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: scale(16),
        padding: scale(14),
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: border,
        marginBottom: verticalScale(10),
      }}
    >
      <Text
        style={{
          fontFamily: MONO_BOLD,
          fontSize: scale(12.5),
          color: textColor,
          letterSpacing: 1,
        }}
      >
        MODE
      </Text>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: segmentBg,
          borderRadius: scale(10),
          padding: scale(3),
        }}
      >
        <TouchableOpacity
          onPress={() => setDarkMode(false)}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: scale(16),
            paddingVertical: scale(7),
            borderRadius: scale(8),
            backgroundColor: !isDarkMode ? getAccent(isDarkMode) : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: MONO_MEDIUM,
              fontSize: scale(12),
              color: !isDarkMode ? selectedTextColor : textColor,
            }}
          >
            Light
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDarkMode(true)}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: scale(16),
            paddingVertical: scale(7),
            borderRadius: scale(8),
            backgroundColor: isDarkMode ? getAccent(isDarkMode) : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: MONO_MEDIUM,
              fontSize: scale(12),
              color: isDarkMode ? selectedTextColor : textColor,
            }}
          >
            Dark
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StatusTile = ({
  Icon,
  title,
  subtitle,
  dotColor,
  onPress,
  isDarkMode,
  scale,
  verticalScale,
  fullWidth,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  dotColor: string;
  onPress?: () => void;
  isDarkMode: boolean;
  fullWidth?: boolean;
} & Pick<Rs, 'scale' | 'verticalScale'>) => {
  const cardBg = isDarkMode ? '#262626' : '#F9F9F9';
  const border = isDarkMode ? '#333' : '#e5e7eb';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={{
        flexBasis: fullWidth ? '100%' : '48%',
        borderRadius: scale(16),
        padding: scale(14),
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: border,
        marginBottom: verticalScale(10),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: scale(34),
            height: scale(34),
            borderRadius: scale(10),
            backgroundColor: getAccent(isDarkMode),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={scale(17)} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2.2} />
        </View>
        <View style={{ width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: dotColor }} />
      </View>
      <Text
        style={{ marginTop: scale(10), fontFamily: MONO_MEDIUM, fontSize: scale(12), color: textColor }}
        numberOfLines={1}
      >
        {title.toUpperCase()}
      </Text>
      <Text style={{ marginTop: 2, fontSize: scale(11.5), color: subColor }} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
};

const FeedbackButton = ({
  Icon,
  label,
  onPress,
  isDarkMode,
  scale,
}: { Icon: LucideIcon; label: string; onPress: () => void; isDarkMode: boolean } & Pick<Rs, 'scale'>) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      flex: 1,
      alignItems: 'center',
      paddingVertical: scale(14),
      borderRadius: scale(14),
      backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#e5e7eb',
      marginHorizontal: scale(4),
    }}
  >
    <Icon size={scale(19)} color={getAccent(isDarkMode)} strokeWidth={2} />
    <Text
      style={{
        marginTop: scale(6),
        fontFamily: MONO_MEDIUM,
        fontSize: scale(10),
        color: isDarkMode ? '#fff' : '#000',
        textAlign: 'center',
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const LABEL_TO_ICON: Record<string, LucideIcon> = {
  'Contact Support': Mail,
  FAQ: HelpCircle,
  'Privacy Policy': Shield,
  'Source Code': Code,
};

const MoreTab = () => {
  const { isDarkMode, setDarkMode } = useSettingsStore();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { scale, verticalScale, isTablet } = responsive;
  const [appInfo, setAppInfo] = React.useState<AppInformation | null>(null);
  const [showOnboardingPreview, setShowOnboardingPreview] = React.useState(false);

  const { isGranted: notifGranted, isDenied: notifDenied, isUndetermined: notifUndetermined, requestPermissions: requestNotif } =
    useNotificationPermissions();
  const { isGranted: locGranted, isDenied: locDenied, isUndetermined: locUndetermined, requestPermissions: requestLoc } =
    useLocationPermissions();

  React.useEffect(() => {
    const fetchAppInfo = async () => {
      if (db) setAppInfo(await getAppInformation(db));
    };
    fetchAppInfo();
  }, [db]);

  const bg = isDarkMode ? '#171717' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const contentMaxWidth = isTablet ? 640 : undefined;

  const handleNotifPress = notifGranted
    ? undefined
    : async () => {
        if (notifUndetermined) await requestNotif();
        else if (notifDenied) Linking.openSettings();
      };

  const handleLocPress = locGranted
    ? undefined
    : async () => {
        if (locUndetermined) await requestLoc();
        else if (locDenied) Linking.openSettings();
      };

  const handleSendTestNotification = async () => {
    if (notifUndetermined) {
      await requestNotif();
      return;
    }
    if (notifDenied) {
      Linking.openSettings();
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'If you can see this, notifications are working correctly.',
        data: { category: 'test' },
      },
      trigger: null,
    });
  };

  // Fires every kind of notification the app sends, back-to-back (with a
  // short delay so there's time to lock the phone first) purely so a stack
  // of realistic notifications can be screenshotted for App Store previews.
  const handlePreviewNotificationStack = async () => {
    if (notifUndetermined) {
      await requestNotif();
      return;
    }
    if (notifDenied) {
      Linking.openSettings();
      return;
    }
    const previewNotifications = [
      // closingSoonNotifications.ts — "now open" alert
      {
        title: '🍽️ South Quad is now open',
        body: 'Open now — go grab a bite!',
        category: 'location-opening',
      },
      // closingSoonNotifications.ts — "closes soon" alert
      {
        title: '⏰ South Quad closes soon',
        body: 'Closes in 15 minutes.',
        category: 'location-closing',
      },
      // favoriteFoodAlerts.ts — favorited food available today
      {
        title: '⭐ Chicken Tenders is available today!',
        body: 'Find it at Bursley Dining Hall for Lunch.',
        category: 'favorite-food-appearance',
      },
      // manual-push-notification / scheduled-push-notification edge functions
      // — admin broadcast announcement
      {
        title: '📣 Dine @ Michigan',
        body: "We've added new dining locations — check them out!",
        category: 'admin-broadcast',
      },
    ];

    for (const [index, notification] of previewNotifications.entries()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { category: notification.category },
        },
        trigger: {
          seconds: 3 + index,
          repeats: false,
        } as Notifications.TimeIntervalTriggerInput,
      });
    }
  };

  return (
    <SheetProvider context="settings">
      {showOnboardingPreview && (
        <OnboardingScreen
          isOnboardingComplete={false}
          isPreview
          onClose={() => setShowOnboardingPreview(false)}
        />
      )}
      <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingBottom: insets.bottom + verticalScale(24),
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? 'center' : undefined,
            width: contentMaxWidth ? '100%' : undefined,
          }}
        >
          <View style={{ marginTop: verticalScale(16), marginBottom: verticalScale(4) }}>
            <Text style={{ fontSize: scale(30), fontWeight: '800', color: textColor }}>
              Settings
            </Text>
          </View>

          <MonoLabel title="Preferences" isDarkMode={isDarkMode} scale={scale} verticalScale={verticalScale} />
          <ModeRow
            isDarkMode={isDarkMode}
            setDarkMode={setDarkMode}
            scale={scale}
            verticalScale={verticalScale}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <StatusTile
              Icon={Bell}
              title={notifGranted ? 'Notifications On' : 'Notifications Off'}
              subtitle={notifGranted ? 'Updates & alerts enabled' : 'Tap to enable notifications'}
              dotColor={notifGranted ? '#22C55E' : '#6B7280'}
              onPress={handleNotifPress}
              isDarkMode={isDarkMode}
              scale={scale}
              verticalScale={verticalScale}
            />
            <StatusTile
              Icon={MapPin}
              title={locGranted ? 'Location On' : 'Location Off'}
              subtitle={locGranted ? 'Shown on the map' : 'Tap to enable location'}
              dotColor={locGranted ? '#22C55E' : '#6B7280'}
              onPress={handleLocPress}
              isDarkMode={isDarkMode}
              scale={scale}
              verticalScale={verticalScale}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendTestNotification}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: scale(16),
              padding: scale(14),
              backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
              borderWidth: 1,
              borderColor: isDarkMode ? '#333' : '#e5e7eb',
              marginBottom: verticalScale(10),
            }}
          >
            <View
              style={{
                width: scale(34),
                height: scale(34),
                borderRadius: scale(10),
                backgroundColor: getAccent(isDarkMode),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: scale(12),
              }}
            >
              <BellRing size={scale(17)} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO_MEDIUM, fontSize: scale(13), color: textColor }}>
                Send Test Notification
              </Text>
              <Text style={{ fontSize: scale(11.5), color: subColor, marginTop: 2 }}>
                Check that notifications are working
              </Text>
            </View>
            <ChevronRight size={scale(16)} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePreviewNotificationStack}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: scale(16),
              padding: scale(14),
              backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
              borderWidth: 1,
              borderColor: isDarkMode ? '#333' : '#e5e7eb',
              marginBottom: verticalScale(10),
            }}
          >
            <View
              style={{
                width: scale(34),
                height: scale(34),
                borderRadius: scale(10),
                backgroundColor: getAccent(isDarkMode),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: scale(12),
              }}
            >
              <Bell size={scale(17)} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO_MEDIUM, fontSize: scale(13), color: textColor }}>
                Preview Notification Stack
              </Text>
              <Text style={{ fontSize: scale(11.5), color: subColor, marginTop: 2 }}>
                Sends every notification type after a few seconds
              </Text>
            </View>
            <ChevronRight size={scale(16)} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowOnboardingPreview(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: scale(16),
              padding: scale(14),
              backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
              borderWidth: 1,
              borderColor: isDarkMode ? '#333' : '#e5e7eb',
              marginBottom: verticalScale(10),
            }}
          >
            <View
              style={{
                width: scale(34),
                height: scale(34),
                borderRadius: scale(10),
                backgroundColor: getAccent(isDarkMode),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: scale(12),
              }}
            >
              <Sparkles size={scale(17)} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO_MEDIUM, fontSize: scale(13), color: textColor }}>
                View Onboarding
              </Text>
              <Text style={{ fontSize: scale(11.5), color: subColor, marginTop: 2 }}>
                See the welcome screens again
              </Text>
            </View>
            <ChevronRight size={scale(16)} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
          </TouchableOpacity>

          <MonoLabel title="Feedback" isDarkMode={isDarkMode} scale={scale} verticalScale={verticalScale} />
          <View style={{ flexDirection: 'row', marginHorizontal: -scale(4) }}>
            <FeedbackButton
              Icon={MessageSquare}
              label="SUGGEST"
              onPress={() => Linking.openURL('https://michigandining.userjot.com')}
              isDarkMode={isDarkMode}
              scale={scale}
            />
            <FeedbackButton
              Icon={Star}
              label="RATE US"
              onPress={() =>
                Linking.openURL(
                  `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${ITUNES_ITEM_ID}?action=write-review`,
                )
              }
              isDarkMode={isDarkMode}
              scale={scale}
            />
          </View>

          <MonoLabel title="About" isDarkMode={isDarkMode} scale={scale} verticalScale={verticalScale} />
          <View
            style={{
              borderRadius: scale(16),
              padding: scale(16),
              backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
              borderWidth: 1,
              borderColor: isDarkMode ? '#333' : '#e5e7eb',
              marginBottom: verticalScale(10),
            }}
          >
            <View
              style={{
                width: scale(34),
                height: scale(34),
                borderRadius: scale(10),
                backgroundColor: getAccent(isDarkMode),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: scale(10),
              }}
            >
              <Info size={scale(17)} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2.2} />
            </View>
            <Text style={{ fontSize: scale(13.5), color: subColor, lineHeight: scale(19) }}>
              Dine @ Michigan helps University of Michigan students and staff browse dining hall menus, hours, and
              locations in real time, with a simple, minimalistic design that's easier to use than clunky sites
              like MDining or NetNutrition.
            </Text>
          </View>

          {appInfo && (
            <>
              <MonoLabel title="Information" isDarkMode={isDarkMode} scale={scale} verticalScale={verticalScale} />

              <View
                style={{
                  backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
                  borderRadius: scale(16),
                  padding: scale(16),
                  marginBottom: scale(10),
                }}
              >
                <Text style={{ fontFamily: MONO_BOLD, fontSize: scale(13), color: textColor, marginBottom: verticalScale(6) }}>
                  {(appInfo.about_title ?? 'About').toUpperCase()}
                </Text>
                <Text style={{ fontSize: scale(13.5), color: subColor, lineHeight: scale(19) }}>
                  {appInfo.about_description}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
                  borderRadius: scale(16),
                  padding: scale(16),
                  marginBottom: scale(10),
                  gap: verticalScale(8),
                }}
              >
                <Text style={{ fontFamily: MONO_BOLD, fontSize: scale(13), color: textColor }}>CREDITS</Text>
                <View>
                  <Text style={{ fontSize: scale(14.5), fontWeight: '600', color: textColor }}>Nischal Kotamraju</Text>
                  <Text style={{ fontSize: scale(12.5), color: subColor }}>Lead Developer & Designer</Text>
                </View>
                {appInfo.credits_contributors.length > 0 && (
                  <View>
                    <Text style={{ fontSize: scale(14.5), fontWeight: '600', color: textColor }}>
                      {appInfo.credits_contributors
                        .sort((a, b) => a.order - b.order)
                        .map((c) => c.name)
                        .join(', ')}
                    </Text>
                    <Text style={{ fontSize: scale(12.5), color: subColor }}>Open Source Contributors</Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  backgroundColor: isDarkMode ? '#262626' : '#F9F9F9',
                  borderRadius: scale(16),
                  padding: scale(16),
                  gap: verticalScale(10),
                }}
              >
                <Text style={{ fontFamily: MONO_BOLD, fontSize: scale(13), color: textColor }}>HELP & SUPPORT</Text>
                {appInfo.support_links
                  .sort((a, b) => a.order - b.order)
                  .map((link) => {
                    const LinkIcon = LABEL_TO_ICON[link.label] ?? Info;
                    return (
                      <TouchableOpacity
                        key={link.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}
                        onPress={() => Linking.openURL(link.url)}
                      >
                        <LinkIcon size={scale(16)} color={getAccent(isDarkMode)} />
                        <Text style={{ fontSize: scale(14), fontWeight: '500', color: getAccent(isDarkMode) }}>
                          {link.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </>
          )}

          <Text
            style={{
              marginTop: verticalScale(24),
              fontSize: scale(12),
              color: subColor,
              textAlign: 'center',
            }}
          >
            Created by Nischal Kotamraju
          </Text>
        </ScrollView>
      </View>
    </SheetProvider>
  );
};

export default MoreTab;

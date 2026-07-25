import ExpoModulesCore
import WidgetKit

// App Group used to share widget/status data with the MichiganDiningWidgets
// extension. Must match the App Group added to both the main app target and
// the widget extension target's entitlements in Xcode.
private let appGroupId = "group.com.nischalkotamraju.michigandining.shared"
private let widgetDataKey = "favoriteLocationsStatus"
// The app's in-app light/dark mode toggle (store/useSettingsStore.ts) is
// independent of the device's system appearance, and widget extensions run
// in their own process — they can't observe the main app's JS state or its
// `Appearance.setColorScheme()` call directly. Persisting it here lets the
// widget follow the app's chosen theme instead of always falling back to
// whatever the system appearance happens to be.
private let widgetColorSchemeKey = "widgetIsDarkMode"

public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    // `json` is a pre-serialized object of the shape
    // { locations: FavoriteLocationStatus[], favoriteFoods: FavoriteFoodAvailability[] }
    // (see updateWidgetData in modules/live-activity/index.ts) written verbatim
    // into the App Group so the widget's TimelineProvider can decode it directly.
    Function("updateWidgetData") { (json: String) in
      let defaults = UserDefaults(suiteName: appGroupId)
      defaults?.set(json, forKey: widgetDataKey)
      WidgetCenter.shared.reloadAllTimelines()
    }

    // Mirrors the app's in-app dark mode toggle into the App Group so the
    // home screen widget (a separate process) can match it instead of only
    // ever following the device's system appearance.
    Function("setWidgetColorScheme") { (isDarkMode: Bool) in
      let defaults = UserDefaults(suiteName: appGroupId)
      defaults?.set(isDarkMode, forKey: widgetColorSchemeKey)
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

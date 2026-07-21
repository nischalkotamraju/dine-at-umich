//
//  MichiganDiningWidgets.swift
//  MichiganDiningWidgets
//
//  Created by Nischal Kotamraju on 7/6/26.
//

import WidgetKit
import SwiftUI

// Must match the App Group + key used by LiveActivityModule.updateWidgetData
// in the main app target, and the payload shape written by
// updateWidgetData in modules/live-activity/index.ts.
private let appGroupId = "group.com.nischalkotamraju.michigandining.shared"
private let widgetDataKey = "favoriteLocationsStatus"
// Written by LiveActivityModule.setWidgetColorScheme, which the app calls
// whenever its in-app dark mode toggle changes (see app/_layout.tsx).
private let widgetColorSchemeKey = "widgetIsDarkMode"

// The app's light/dark mode is an in-app toggle, independent of the device's
// system appearance. A widget runs in its own process and can't observe the
// app's JS state or its Appearance override, so it follows this mirrored
// preference from the App Group instead — falling back to the system scheme
// only if the app has never written one (e.g. before first launch).
private func resolvedColorScheme(_ systemScheme: ColorScheme) -> ColorScheme {
  guard
    let defaults = UserDefaults(suiteName: appGroupId),
    defaults.object(forKey: widgetColorSchemeKey) != nil
  else { return systemScheme }
  return defaults.bool(forKey: widgetColorSchemeKey) ? .dark : .light
}

// Mirrors utils/colors.ts and app/_components/LocationItem.tsx exactly, so
// the widget's palette never drifts from the app's list rows. Maize is the
// dark-mode accent; on light backgrounds it washes out, so light mode uses
// Michigan blue instead (see getAccent in colors.ts).
private let umMaize = Color(red: 255 / 255, green: 203 / 255, blue: 5 / 255)
private let umBlue = Color(red: 0 / 255, green: 39 / 255, blue: 76 / 255)
private let statusOpen = Color(red: 0x22 / 255, green: 0xC5 / 255, blue: 0x5E / 255)
private let statusClosed = Color(red: 0xF8 / 255, green: 0x71 / 255, blue: 0x71 / 255)
// The screen background behind the widget content — matches the Home tab's
// own background (app/(tabs)/index.tsx).
private let screenBgDark = Color(red: 0x17 / 255, green: 0x17 / 255, blue: 0x17 / 255)
private let screenBgLight = Color.white
private let cardBgDark = Color(red: 0x26 / 255, green: 0x26 / 255, blue: 0x26 / 255)
private let cardBgLight = Color(red: 0xF9 / 255, green: 0xF9 / 255, blue: 0xF9 / 255)
private let cardBorderDark = Color(red: 0x33 / 255, green: 0x33 / 255, blue: 0x33 / 255)
private let cardBorderLight = Color(red: 0xE5 / 255, green: 0xE7 / 255, blue: 0xEB / 255)
private let secondaryDark = Color(red: 0x9C / 255, green: 0xA3 / 255, blue: 0xAF / 255)
private let secondaryLight = Color(red: 0x6B / 255, green: 0x72 / 255, blue: 0x80 / 255)
// Icon tint drawn on top of the solid status-colored badge — matches the
// '#111' used for getLocationIcon(...) in LocationItem.tsx.
private let iconOnBadge = Color(red: 0x11 / 255, green: 0x11 / 255, blue: 0x11 / 255)

private func accent(_ scheme: ColorScheme) -> Color { scheme == .dark ? umMaize : umBlue }
private func screenBg(_ scheme: ColorScheme) -> Color { scheme == .dark ? screenBgDark : screenBgLight }
private func cardBg(_ scheme: ColorScheme) -> Color { scheme == .dark ? cardBgDark : cardBgLight }
private func cardBorder(_ scheme: ColorScheme) -> Color { scheme == .dark ? cardBorderDark : cardBorderLight }
private func primaryText(_ scheme: ColorScheme) -> Color { scheme == .dark ? .white : .black }
private func secondaryText(_ scheme: ColorScheme) -> Color { scheme == .dark ? secondaryDark : secondaryLight }

// Mirrors getLocationIcon in app/_components/LocationItem.tsx so each
// favorite shows the same icon here as it does in the app's own lists.
private func locationIconName(_ type: String?) -> String {
  let t = (type ?? "").lowercased()
  if t.contains("dining hall") { return "fork.knife" }
  if t.contains("caf") || t.contains("coffee") { return "cup.and.saucer.fill" }
  if t.contains("food court") { return "bag.fill" }
  if t.contains("convenience") { return "cart.fill" }
  if t.contains("truck") { return "box.truck.fill" }
  return "bag.fill"
}

// Mirrors getCategoryIcon in components/FoodComponent.tsx so a favorited food
// shows a category-appropriate icon (matching the app) instead of a generic
// star. SF Symbols has no exact match for every lucide icon the app uses, so
// unmatched categories fall back to fork.knife — same as the app's Utensils
// default.
private func foodIconName(_ category: String?) -> String {
  let c = (category ?? "").lowercased()
  if c.contains("cereal") || c.contains("oatmeal") || c.contains("porridge") || c.contains("soup") {
    return "takeoutbag.and.cup.and.straw.fill"
  }
  if c.contains("bak") || c.contains("muffin") || c.contains("pastry") || c.contains("cake") || c.contains("bread") || c.contains("scone") || c.contains("donut") || c.contains("doughnut") || c.contains("cookie") {
    return "birthday.cake.fill"
  }
  if c.contains("salad") || c.contains("fruit") || c.contains("apple") { return "carrot.fill" }
  if c.contains("coffee") || c.contains("drink") || c.contains("beverage") || c.contains("juice") || c.contains("tea") {
    return "cup.and.saucer.fill"
  }
  return "fork.knife"
}

// RobotoMono weights, bundled via ios/MichiganDiningWidgets/Fonts and
// registered in this target's Info.plist (UIAppFonts) — matches the same
// @expo-google-fonts/roboto-mono weights used throughout the app's JS side.
private enum AppFont {
  static func bold(_ size: CGFloat) -> Font { .custom("RobotoMono-Bold", size: size) }
  static func medium(_ size: CGFloat) -> Font { .custom("RobotoMono-Medium", size: size) }
  static func regular(_ size: CGFloat) -> Font { .custom("RobotoMono-Regular", size: size) }
}

// The large widget shows at most this many rows per section before collapsing
// the remainder into a "+N more" line — chosen to match the App Store preview
// (two visible rows per section) and to fit the systemLarge canvas.
private let maxRowsPerSection = 2

// MARK: - Shared payload (must mirror modules/live-activity/index.ts)

struct FavoriteLocationStatus: Codable, Hashable {
  var name: String
  // Unix seconds of the next open/close transition today (see the matching
  // field in modules/live-activity/index.ts). nil = no more transitions today.
  var transitionEpoch: Double?
  var isOpen: Bool
  var type: String?
}

struct ServingLocation: Codable, Hashable {
  var name: String
  var isOpen: Bool
  var transitionEpoch: Double?
}

struct FavoriteFoodAvailability: Codable, Hashable {
  var name: String
  var category: String?
  var servingLocations: [ServingLocation]
}

// updateWidgetData(...) in modules/live-activity/index.ts writes
// JSON.stringify({ locations, favoriteFoods }) verbatim into the App Group,
// so decode that envelope shape directly.
struct WidgetPayload: Codable {
  var locations: [FavoriteLocationStatus]
  var favoriteFoods: [FavoriteFoodAvailability]
}

private func loadWidgetPayload() -> WidgetPayload {
  let empty = WidgetPayload(locations: [], favoriteFoods: [])
  guard
    let defaults = UserDefaults(suiteName: appGroupId),
    let json = defaults.string(forKey: widgetDataKey),
    let data = json.data(using: .utf8)
  else { return empty }
  return (try? JSONDecoder().decode(WidgetPayload.self, from: data)) ?? empty
}

// MARK: - Timeline

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry(
      date: Date(),
      locations: [
        FavoriteLocationStatus(name: "South Quad", transitionEpoch: nil, isOpen: true, type: "Dining Hall"),
      ],
      foods: [
        FavoriteFoodAvailability(name: "Cappuccino", category: "Beverages", servingLocations: [ServingLocation(name: "Blue Café East Quad", isOpen: true, transitionEpoch: nil)]),
      ]
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
    let payload = loadWidgetPayload()
    completion(SimpleEntry(date: Date(), locations: payload.locations, foods: payload.favoriteFoods))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let payload = loadWidgetPayload()
    let now = Date()

    // iOS budgets how often a widget may *request* a refresh, so asking for one
    // every minute would just get throttled. Instead we hand WidgetKit one
    // timeline containing an entry per minute for the next hour — it renders
    // them on schedule at no extra budget cost. Each view derives its countdown
    // and open/closed state from its own entry's date, so both tick every
    // minute and a location flips to closed exactly when its closing time
    // passes, even if the app hasn't run since.
    let entries = (0..<60).map { minute in
      SimpleEntry(
        date: now.addingTimeInterval(Double(minute) * 60),
        locations: payload.locations,
        foods: payload.favoriteFoods
      )
    }

    // Ask for a fresh snapshot (new data from the App Group) once the hour of
    // pre-rendered entries runs out. The app also reloads timelines directly
    // whenever favorites, the widget preference, or dark mode change.
    completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(60 * 60))))
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
  let locations: [FavoriteLocationStatus]
  let foods: [FavoriteFoodAvailability]
}

// A favorite location counts as "available" (and a favorite food likewise)
// when it is open / currently being served — this drives the medium widget's
// summary counts and the "FAVORITES AVAILABLE" framing.
private extension SimpleEntry {
  var openLocationsCount: Int { locations.filter { $0.isOpen }.count }
  var availableFoodsCount: Int {
    foods.filter { food in food.servingLocations.contains { $0.isOpen } }.count
  }
  var hasAnyFavorites: Bool { !locations.isEmpty || !foods.isEmpty }
}

// Uppercase "2 DAYS" / "3 HOURS" / "45 MINUTES" countdown from `now` to an
// absolute instant (Unix seconds). Empty string if the instant has passed.
// `now` is the timeline entry's date, not Date(), so each per-minute entry
// renders the countdown correct for the moment it's displayed.
private func relativeCountdown(_ epoch: Double, from now: Date) -> String {
  let minutes = Int((epoch - now.timeIntervalSince1970) / 60)
  if minutes <= 0 { return "" }
  if minutes >= 24 * 60 {
    let days = Int((Double(minutes) / (24 * 60)).rounded())
    return "\(days) DAY\(days == 1 ? "" : "S")"
  }
  if minutes >= 60 {
    let hours = Int((Double(minutes) / 60).rounded())
    return "\(hours) HOUR\(hours == 1 ? "" : "S")"
  }
  return "\(minutes) MINUTE\(minutes == 1 ? "" : "S")"
}

// The open/closed state and countdown as of `now`, derived from the stored
// transition rather than trusting the isOpen snapshot from whenever the app
// last wrote data. Once the transition instant passes, the status flips (an
// open location that hit its closing time reads as closed) and the next
// transition is unknown until the app runs again — which is why the countdown
// goes empty in that case.
private struct DerivedStatus {
  let isOpen: Bool
  let countdown: String
}

private func deriveStatus(
  isOpen: Bool,
  transitionEpoch: Double?,
  at now: Date,
  short: Bool = false
) -> DerivedStatus {
  guard let epoch = transitionEpoch else {
    return DerivedStatus(isOpen: isOpen, countdown: "")
  }
  if now.timeIntervalSince1970 >= epoch {
    return DerivedStatus(isOpen: !isOpen, countdown: "")
  }
  return DerivedStatus(
    isOpen: isOpen,
    countdown: short ? shortCountdown(epoch, from: now) : relativeCountdown(epoch, from: now)
  )
}

// MARK: - Row views (large widget)

// A flat location row for the large widget's Locations section: a solid
// status-colored squircle icon badge, the name, and a clock+status subtitle —
// mirrors the location card in app/_components/LocationItem.tsx without the
// per-row card chrome, since the large widget lists rows directly on its
// background like the App Store preview.
struct LocationListRow: View {
  let location: FavoriteLocationStatus
  let now: Date
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  var body: some View {
    let status = deriveStatus(
      isOpen: location.isOpen,
      transitionEpoch: location.transitionEpoch,
      at: now
    )
    let statusColor = status.isOpen ? statusOpen : statusClosed
    let subtitle = status.isOpen
      ? (status.countdown.isEmpty ? "OPEN" : "CLOSES IN \(status.countdown)")
      : (status.countdown.isEmpty ? "CLOSED" : "OPENS IN \(status.countdown)")

    HStack(spacing: 10) {
      Badge(color: statusColor, systemName: locationIconName(location.type))

      VStack(alignment: .leading, spacing: 2) {
        Text(location.name)
          .font(AppFont.medium(13))
          .foregroundStyle(primaryText(colorScheme))
          .lineLimit(1)

        HStack(spacing: 4) {
          Image(systemName: "clock.fill")
            .font(.system(size: 8))
            .foregroundStyle(statusColor)
          Text(subtitle)
            .font(AppFont.regular(10))
            .foregroundStyle(status.isOpen ? statusOpen : secondaryText(colorScheme))
        }
      }

      Spacer(minLength: 0)
    }
  }
}

// A flat food row for the large widget's Food section: a maize squircle badge
// with the food's category icon (matching the app), the dish name, and a
// subtitle listing where it's being served today.
struct FoodListRow: View {
  let food: FavoriteFoodAvailability
  let now: Date
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  var body: some View {
    HStack(spacing: 10) {
      Badge(color: umMaize, systemName: foodIconName(food.category))

      VStack(alignment: .leading, spacing: 2) {
        Text(food.name)
          .font(AppFont.medium(13))
          .foregroundStyle(primaryText(colorScheme))
          .lineLimit(1)

        Text(availabilityText)
          .font(AppFont.regular(10))
          .foregroundStyle(secondaryText(colorScheme))
          .lineLimit(1)
          .truncationMode(.tail)
      }

      Spacer(minLength: 0)
    }
  }

  // Prefer "available now" (locations open right now, derived at `now`); fall
  // back to any location serving it today so a favorited-but-currently-closed
  // dish still reads as on today's menu rather than disappearing.
  private var availabilityText: String {
    let open = food.servingLocations
      .filter { deriveStatus(isOpen: $0.isOpen, transitionEpoch: $0.transitionEpoch, at: now).isOpen }
      .map { $0.name }
    if !open.isEmpty {
      return "Available now at " + open.joined(separator: ", ")
    }
    let all = food.servingLocations.map { $0.name }
    if !all.isEmpty {
      return "Serving today at " + all.joined(separator: ", ")
    }
    return "Not on today's menu"
  }
}

// Shared solid squircle badge with a centered SF Symbol, matching the status
// badges used throughout the app's location cards.
private struct Badge: View {
  let color: Color
  let systemName: String
  var size: CGFloat = 30

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: size * 0.27, style: .continuous)
        .fill(color)
        .frame(width: size, height: size)
      Image(systemName: systemName)
        .font(.system(size: size * 0.43, weight: .medium))
        .foregroundStyle(iconOnBadge)
    }
  }
}

// Terse "2h" / "45m" / "3d" countdown for the medium widget's narrow columns,
// where the large widget's "2 HOURS" spelling doesn't fit.
private func shortCountdown(_ epoch: Double, from now: Date) -> String {
  let minutes = Int((epoch - now.timeIntervalSince1970) / 60)
  if minutes <= 0 { return "" }
  if minutes >= 24 * 60 { return "\(Int((Double(minutes) / (24 * 60)).rounded()))D" }
  if minutes >= 60 { return "\(Int((Double(minutes) / 60).rounded()))H" }
  return "\(minutes)M"
}

// Narrow-column row used by the medium widget's two lists.
private struct CompactLocationRow: View {
  let location: FavoriteLocationStatus
  let now: Date
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  var body: some View {
    let status = deriveStatus(
      isOpen: location.isOpen,
      transitionEpoch: location.transitionEpoch,
      at: now,
      short: true
    )
    let text = status.isOpen
      ? (status.countdown.isEmpty ? "OPEN" : "CLOSES \(status.countdown)")
      : (status.countdown.isEmpty ? "CLOSED" : "OPENS \(status.countdown)")

    HStack(spacing: 6) {
      Badge(
        color: status.isOpen ? statusOpen : statusClosed,
        systemName: locationIconName(location.type),
        size: 20
      )
      VStack(alignment: .leading, spacing: 0) {
        Text(location.name)
          .font(AppFont.medium(10))
          .foregroundStyle(primaryText(colorScheme))
          .lineLimit(1)
        Text(text)
          .font(AppFont.regular(8))
          .foregroundStyle(status.isOpen ? statusOpen : secondaryText(colorScheme))
          .lineLimit(1)
      }
      Spacer(minLength: 0)
    }
  }
}

private struct CompactFoodRow: View {
  let food: FavoriteFoodAvailability
  let now: Date
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  var body: some View {
    let openCount = food.servingLocations.filter {
      deriveStatus(isOpen: $0.isOpen, transitionEpoch: $0.transitionEpoch, at: now).isOpen
    }.count

    HStack(spacing: 6) {
      Badge(color: umMaize, systemName: foodIconName(food.category), size: 20)
      VStack(alignment: .leading, spacing: 0) {
        Text(food.name)
          .font(AppFont.medium(10))
          .foregroundStyle(primaryText(colorScheme))
          .lineLimit(1)
        Text(
          openCount > 0
            ? "AT \(openCount) LOCATION\(openCount == 1 ? "" : "S") NOW"
            : (food.servingLocations.isEmpty ? "NOT TODAY" : "LATER TODAY")
        )
        .font(AppFont.regular(8))
        .foregroundStyle(openCount > 0 ? statusOpen : secondaryText(colorScheme))
        .lineLimit(1)
      }
      Spacer(minLength: 0)
    }
  }
}

private struct SectionLabel: View {
  let text: String
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }
  var body: some View {
    Text(text)
      .font(AppFont.medium(10))
      .tracking(0.5)
      .foregroundStyle(secondaryText(colorScheme))
  }
}

private struct MoreLabel: View {
  let count: Int
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }
  var body: some View {
    Text("+\(count) more")
      .font(AppFont.regular(10))
      .foregroundStyle(secondaryText(colorScheme))
  }
}

// MARK: - Medium widget (condensed two-column list)

// Brand header shared by the medium and large widgets: the logo + wordmark on
// the left, and on the right a countdown to the next per-minute timeline entry
// so it's visible the widget is live. SwiftUI's .timer text style ticks every
// second on its own — it costs no timeline refresh — and resets when the next
// entry takes over at the 60-second mark.
private struct BrandHeader: View {
  let now: Date
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  // Time of the entry being displayed — advances every minute as each
  // per-minute timeline entry takes over.
  private var updatedLabel: String {
    let formatter = DateFormatter()
    formatter.dateFormat = "h:mm"
    return formatter.string(from: now)
  }


  var body: some View {
    HStack(spacing: 5) {
      LogoMark(size: 14)
      Text("DINE @ MICHIGAN")
        .font(AppFont.bold(11))
        .foregroundStyle(accent(colorScheme))

      Spacer(minLength: 4)

      HStack(spacing: 3) {
        Image(systemName: "arrow.clockwise")
          .font(.system(size: 8, weight: .bold))
        // A live countdown here (Text(_:style:.timer) or Text(timerInterval:))
        // blanks the entire widget — dynamic timer text doesn't survive being
        // archived across the 60 per-minute timeline entries. So instead this
        // shows the timestamp of the entry currently on screen: it's plain
        // static text, and because a new entry takes over every minute, seeing
        // it advance is itself the proof that the widget is updating.
        Text(updatedLabel)
          .font(AppFont.regular(9))
          .fixedSize()
      }
      .foregroundStyle(secondaryText(colorScheme))
    }
  }
}

// Small inline logo used in the medium / large / empty-state headers.
private struct LogoMark: View {
  var size: CGFloat = 18
  var body: some View {
    Image("Logo")
      .resizable()
      .aspectRatio(contentMode: .fill)
      .frame(width: size, height: size)
      .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
  }
}

struct MediumWidgetView: View {
  let entry: SimpleEntry
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  var body: some View {
    if entry.hasAnyFavorites {
      // Same language as the large widget: brand header, left-aligned title,
      // then the content — here split into a locations column and a food
      // column so the medium reads as a condensed version of the large.
      VStack(alignment: .leading, spacing: 7) {
        BrandHeader(now: entry.date)

        Text("Favorites")
          .font(.system(size: 20, weight: .bold))
          .foregroundStyle(primaryText(colorScheme))

        HStack(alignment: .top, spacing: 12) {
          VStack(alignment: .leading, spacing: 5) {
            SectionLabel(text: "LOCATIONS")
            ForEach(entry.locations.prefix(2), id: \.name) { location in
              CompactLocationRow(location: location, now: entry.date)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)

          VStack(alignment: .leading, spacing: 5) {
            SectionLabel(text: "FOOD")
            ForEach(entry.foods.prefix(2), id: \.name) { food in
              CompactFoodRow(food: food, now: entry.date)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }

        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(14)
    } else {
      EmptyFavoritesView()
    }
  }
}

// MARK: - Large widget (full list)

struct LargeWidgetView: View {
  let entry: SimpleEntry
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      BrandHeader(now: entry.date)

      Text("Favorites")
        .font(.system(size: 20, weight: .bold))
        .foregroundStyle(primaryText(colorScheme))

      if entry.hasAnyFavorites {
        if !entry.locations.isEmpty {
          VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: "LOCATIONS")
            ForEach(entry.locations.prefix(maxRowsPerSection), id: \.name) { location in
              LocationListRow(location: location, now: entry.date)
            }
            if entry.locations.count > maxRowsPerSection {
              MoreLabel(count: entry.locations.count - maxRowsPerSection)
            }
          }
        }

        if !entry.foods.isEmpty {
          VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: "FOOD")
            ForEach(entry.foods.prefix(maxRowsPerSection), id: \.name) { food in
              FoodListRow(food: food, now: entry.date)
            }
            if entry.foods.count > maxRowsPerSection {
              MoreLabel(count: entry.foods.count - maxRowsPerSection)
            }
          }
        }

        Spacer(minLength: 0)
      } else {
        Spacer()
        Text("Favorite a dining hall or dish to see it here.")
          .font(AppFont.regular(12))
          .foregroundStyle(secondaryText(colorScheme))
        Spacer()
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(16)
  }
}

private struct EmptyFavoritesView: View {
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }
  var body: some View {
    VStack(spacing: 6) {
      HStack(spacing: 5) {
        LogoMark(size: 14)
        Text("DINE @ MICHIGAN")
          .font(AppFont.bold(11))
      }
      .foregroundStyle(accent(colorScheme))
      Text("Favorite a dining hall or dish to see it here.")
        .font(AppFont.regular(12))
        .foregroundStyle(secondaryText(colorScheme))
        .multilineTextAlignment(.center)
    }
    .padding(16)
  }
}

// MARK: - Widget

struct MichiganDiningWidgetsEntryView: View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    switch family {
    case .systemLarge:
      LargeWidgetView(entry: entry)
    default:
      MediumWidgetView(entry: entry)
    }
  }
}

struct MichiganDiningWidgets: Widget {
  let kind: String = "MichiganDiningWidgets"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      MichiganDiningWidgetsEntryView(entry: entry)
        .containerBackground(for: .widget) {
          WidgetBackground()
        }
    }
    .configurationDisplayName("Favorite Dining")
    .description("See your favorite dining locations and dishes at a glance.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}

private struct WidgetBackground: View {
  @Environment(\.colorScheme) private var systemScheme
  private var colorScheme: ColorScheme { resolvedColorScheme(systemScheme) }
  var body: some View { screenBg(colorScheme) }
}

#Preview(as: .systemMedium) {
  MichiganDiningWidgets()
} timeline: {
  SimpleEntry(
    date: .now,
    locations: [
      FavoriteLocationStatus(name: "South Quad", transitionEpoch: nil, isOpen: true, type: "Dining Hall"),
      FavoriteLocationStatus(name: "Blue Market at Munger", transitionEpoch: nil, isOpen: true, type: "Market"),
      FavoriteLocationStatus(name: "Bursley", transitionEpoch: nil, isOpen: false, type: "Dining Hall"),
    ],
    foods: [
      FavoriteFoodAvailability(name: "Cappuccino", category: "Beverages", servingLocations: [ServingLocation(name: "Blue Café East Quad", isOpen: true, transitionEpoch: nil)]),
      FavoriteFoodAvailability(name: "Oatmeal", category: "Hot Cereal", servingLocations: [ServingLocation(name: "Bursley Dining Hall", isOpen: true, transitionEpoch: nil)]),
      FavoriteFoodAvailability(name: "Stir Fry", category: "Entrees", servingLocations: [ServingLocation(name: "East Quad", isOpen: false, transitionEpoch: nil)]),
    ]
  )
}

#Preview(as: .systemLarge) {
  MichiganDiningWidgets()
} timeline: {
  SimpleEntry(
    date: .now,
    locations: [
      FavoriteLocationStatus(name: "East Quad Dining Hall", transitionEpoch: Date().addingTimeInterval(2 * 3600).timeIntervalSince1970, isOpen: true, type: "Dining Hall"),
      FavoriteLocationStatus(name: "Blue Market at Pierpont Commons", transitionEpoch: Date().addingTimeInterval(3 * 3600).timeIntervalSince1970, isOpen: true, type: "Market"),
      FavoriteLocationStatus(name: "Bursley Dining Hall", transitionEpoch: nil, isOpen: false, type: "Dining Hall"),
    ],
    foods: [
      FavoriteFoodAvailability(name: "Cappuccino", category: "Beverages", servingLocations: [
        ServingLocation(name: "Blue Café East Quad", isOpen: true, transitionEpoch: nil),
        ServingLocation(name: "Cava", isOpen: true, transitionEpoch: nil),
      ]),
      FavoriteFoodAvailability(name: "Oatmeal", category: "Hot Cereal", servingLocations: [
        ServingLocation(name: "Bursley Dining Hall", isOpen: true, transitionEpoch: nil),
        ServingLocation(name: "East Quad", isOpen: true, transitionEpoch: nil),
      ]),
      FavoriteFoodAvailability(name: "Stir Fry", category: "Entrees", servingLocations: [ServingLocation(name: "North Quad", isOpen: false, transitionEpoch: nil)]),
    ]
  )
}

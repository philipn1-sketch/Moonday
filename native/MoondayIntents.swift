import AppIntents
import UIKit

// Siri and the Shortcuts app. Logging a period opens Moonday so the day is saved exactly as a tap would save
// it; asking about the next period answers straight away from the summary the app keeps for Siri.

private func openMoonday(_ path: String) async {
  guard let url = URL(string: "moonday://\(path)") else { return }
  await MainActor.run { UIApplication.shared.open(url) }
}

struct LogPeriodIntent: AppIntent {
  static var title: LocalizedStringResource = "Log my period"
  static var description = IntentDescription("Logs today as a period day.")
  static var openAppWhenRun = true
  func perform() async throws -> some IntentResult {
    await openMoonday("action?do=period")
    return .result()
  }
}

struct NextPeriodIntent: AppIntent {
  static var title: LocalizedStringResource = "When is my next period"
  static var description = IntentDescription("Says where you are in your cycle and when your next period is due.")

  private struct Glance: Decodable {
    let headline: String
    let detail: String
    let phase: String
    let next: String
    let plus: Bool?
  }

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard
      let json = UserDefaults(suiteName: "group.com.quickquotegroup.moonday")?.string(forKey: "moonday.glance"),
      let g = try? JSONDecoder().decode(Glance.self, from: Data(json.utf8))
    else {
      return .result(dialog: "Open Moonday once, then ask again.")
    }
    // the app has already put these in her language
    let parts = [g.headline, g.detail, g.phase, g.next].filter { !$0.isEmpty }
    return .result(dialog: "\(parts.joined(separator: ". ")).")
  }
}

struct MoondayShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: NextPeriodIntent(),
      phrases: ["When is my next period in \(.applicationName)", "Where am I in my cycle in \(.applicationName)"],
      shortTitle: "Next period",
      systemImageName: "moon"
    )
    AppShortcut(
      intent: LogPeriodIntent(),
      phrases: ["Log my period in \(.applicationName)", "My period started in \(.applicationName)"],
      shortTitle: "Log period",
      systemImageName: "drop"
    )
  }
}

import SwiftUI
import WatchConnectivity

// Moonday on the Apple Watch: today's headline, cycle day and phase, and a button to log a period day.
// The iPhone keeps everything; the Watch shows the latest summary it was sent and passes the tap back.

struct Glance: Codable, Equatable {
  var headline: String
  var detail: String
  var phase: String
  var tone: String
  var next: String
  var plus: Bool?

  static let empty = Glance(headline: "Open Moonday on your iPhone", detail: "", phase: "", tone: "calm", next: "", plus: nil)
}

enum Palette {
  static let bg = Color(red: 0x14 / 255, green: 0x13 / 255, blue: 0x2B / 255)
  static let surface = Color(red: 0x22 / 255, green: 0x20 / 255, blue: 0x42 / 255)
  static let ink = Color(red: 0xF1 / 255, green: 0xEE / 255, blue: 0xFB / 255)
  static let muted = Color(red: 0xA9 / 255, green: 0xA4 / 255, blue: 0xC9 / 255)
  static let period = Color(red: 0xF2 / 255, green: 0x73 / 255, blue: 0x8C / 255)
  static let fertile = Color(red: 0x5F / 255, green: 0xD3 / 255, blue: 0xC4 / 255)
  static let ovulation = Color(red: 0xC9 / 255, green: 0xA2 / 255, blue: 0xFF / 255)
  static let calm = Color(red: 0xB9 / 255, green: 0xA6 / 255, blue: 0xFF / 255)

  static func tone(_ t: String) -> Color {
    switch t {
    case "period": return period
    case "fertile": return fertile
    case "ovulation": return ovulation
    default: return calm
    }
  }
}

final class PhoneLink: NSObject, ObservableObject, WCSessionDelegate {
  @Published var glance: Glance
  @Published var sent = false
  private static let saved = "moonday.glance"

  override init() {
    if let data = UserDefaults.standard.data(forKey: PhoneLink.saved), let g = try? JSONDecoder().decode(Glance.self, from: data) {
      glance = g
    } else {
      glance = .empty
    }
    super.init()
    if WCSession.isSupported() {
      WCSession.default.delegate = self
      WCSession.default.activate()
    }
  }

  func logPeriod() {
    let message: [String: Any] = ["action": "period", "at": Date().timeIntervalSince1970 * 1000]
    let session = WCSession.default
    if session.isReachable {
      session.sendMessage(message, replyHandler: nil) { _ in session.transferUserInfo(message) }
    } else {
      session.transferUserInfo(message)
    }
    sent = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 3) { self.sent = false }
  }

  private func apply(_ context: [String: Any]) {
    guard let json = context["glance"] as? String, let g = try? JSONDecoder().decode(Glance.self, from: Data(json.utf8)) else { return }
    DispatchQueue.main.async {
      self.glance = g
      if let data = try? JSONEncoder().encode(g) { UserDefaults.standard.set(data, forKey: PhoneLink.saved) }
    }
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    apply(session.receivedApplicationContext)
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    apply(applicationContext)
  }
}

struct ContentView: View {
  @EnvironmentObject var link: PhoneLink

  var body: some View {
    let g = link.glance
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        if g.plus == false {
          Text("The Watch app is part of Moonday Plus.")
            .font(.system(size: 15, weight: .medium, design: .rounded))
            .foregroundStyle(Palette.muted)
        } else {
          if !g.detail.isEmpty {
            Text(g.detail)
              .font(.system(size: 13, weight: .medium, design: .rounded))
              .foregroundStyle(Palette.muted)
          }
          Text(g.headline)
            .font(.system(size: 24, weight: .bold, design: .rounded))
            .foregroundStyle(Palette.ink)
            .minimumScaleFactor(0.6)
          if !g.phase.isEmpty {
            Text(g.phase)
              .font(.system(size: 14, weight: .semibold, design: .rounded))
              .foregroundStyle(Palette.tone(g.tone))
          }
          if !g.next.isEmpty {
            Text(g.next)
              .font(.system(size: 12, weight: .medium, design: .rounded))
              .foregroundStyle(Palette.muted)
          }
          Button { link.logPeriod() } label: {
            Text(link.sent ? "Sent to your iPhone" : "Log period")
              .font(.system(size: 17, weight: .bold, design: .rounded))
              .frame(maxWidth: .infinity, minHeight: 44)
              .foregroundStyle(Palette.bg)
              .background(RoundedRectangle(cornerRadius: 14).fill(Palette.period))
          }
          .buttonStyle(.plain)
          .padding(.top, 6)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .background(Palette.bg)
  }
}

@main
struct MoondayWatchApp: App {
  @StateObject private var link = PhoneLink()

  var body: some Scene {
    WindowGroup {
      ContentView().environmentObject(link)
    }
  }
}

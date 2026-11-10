import ExpoModulesCore
import HealthKit
import WatchConnectivity

/// The app group shared with the widget and the Siri shortcuts.
let moondayGroup = "group.com.quickquotegroup.moonday"
let glanceKey = "moonday.glance"

/**
 Jobs the app's JavaScript can't do by itself:
 - keep a short summary of her cycle where Siri and the Watch can read it
 - hand taps made on the Watch to the app
 - read and write her period days in Apple Health, when she turns that on
 */
public class MoondayNativeModule: Module {
  private let bridge = WatchBridge()
  private let health = HKHealthStore()
  private let flowType = HKObjectType.categoryType(forIdentifier: .menstrualFlow)!

  public func definition() -> ModuleDefinition {
    Name("MoondayNative")

    Events("onWatchAction")

    OnCreate {
      bridge.start()
    }

    OnStartObserving {
      self.bridge.listen { [weak self] action in
        self?.sendEvent("onWatchAction", action)
      }
    }

    OnStopObserving {
      self.bridge.listen(nil)
    }

    Function("setGlance") { (json: String) in
      UserDefaults(suiteName: moondayGroup)?.set(json, forKey: glanceKey)
      self.bridge.send(json)
    }

    Function("takePendingActions") { () -> [[String: Any]] in
      return self.bridge.takePending()
    }

    Function("healthAvailable") { () -> Bool in
      return HKHealthStore.isHealthDataAvailable()
    }

    /// Asks once for permission to read and write Menstrual Flow. Resolves when she has answered.
    AsyncFunction("requestHealth") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else { return promise.resolve(false) }
      self.health.requestAuthorization(toShare: [self.flowType], read: [self.flowType]) { ok, _ in promise.resolve(ok) }
    }

    /// Replaces what Moonday wrote for one day ("2026-11-10") with this flow, or removes it when flow is null.
    AsyncFunction("saveFlow") { (day: String, flow: String?, firstDay: Bool, promise: Promise) in
      guard let start = Self.dayStart(day) else { return promise.resolve(false) }
      let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
      let mine = HKQuery.predicateForObjects(from: HKSource.default())
      let within = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
      let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [mine, within])
      self.health.deleteObjects(of: self.flowType, predicate: predicate) { _, _, _ in
        guard let flow = flow, let value = Self.flowValue(flow) else { return promise.resolve(true) }
        let sample = HKCategorySample(type: self.flowType, value: value, start: start, end: end,
                                      metadata: [HKMetadataKeyMenstrualCycleStart: firstDay])
        self.health.save(sample) { ok, _ in promise.resolve(ok) }
      }
    }

    /// Menstrual Flow logged in Apple Health by any app since a day, as [{date, flow}].
    AsyncFunction("readFlows") { (since: String, promise: Promise) in
      guard let start = Self.dayStart(since) else { return promise.resolve([]) }
      let predicate = HKQuery.predicateForSamples(withStart: start, end: nil, options: [])
      let query = HKSampleQuery(sampleType: self.flowType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
        let out: [[String: String]] = (samples as? [HKCategorySample] ?? []).compactMap { s in
          guard let flow = Self.flowName(s.value) else { return nil }
          return ["date": Self.dayKey(s.startDate), "flow": flow, "source": s.sourceRevision.source.bundleIdentifier]
        }
        promise.resolve(out)
      }
      self.health.execute(query)
    }
  }

  static func dayStart(_ key: String) -> Date? {
    let parts = key.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3 else { return nil }
    return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
  }

  static func dayKey(_ date: Date) -> String {
    let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
  }

  /// Spotting is light flow in Health's terms, so it is written as light and read back as light.
  static func flowValue(_ flow: String) -> Int? {
    switch flow {
    case "spotting", "light": return HKCategoryValueVaginalBleeding.light.rawValue
    case "medium": return HKCategoryValueVaginalBleeding.medium.rawValue
    case "heavy": return HKCategoryValueVaginalBleeding.heavy.rawValue
    default: return nil
    }
  }

  static func flowName(_ value: Int) -> String? {
    switch HKCategoryValueVaginalBleeding(rawValue: value) {
    case .light: return "light"
    case .medium: return "medium"
    case .heavy: return "heavy"
    case .unspecified: return "medium"
    default: return nil
    }
  }
}

final class WatchBridge: NSObject, WCSessionDelegate {
  private var onAction: (([String: Any]) -> Void)?
  private var pending: [[String: Any]] = []
  private var lastSent = ""
  private let lock = NSLock()

  func listen(_ handler: (([String: Any]) -> Void)?) {
    lock.lock(); defer { lock.unlock() }
    onAction = handler
  }

  func start() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ json: String) {
    guard WCSession.isSupported(), json != lastSent else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
    lastSent = json
    try? session.updateApplicationContext(["glance": json])
  }

  func takePending() -> [[String: Any]] {
    lock.lock(); defer { lock.unlock() }
    let out = pending
    pending = []
    return out
  }

  private func handle(_ message: [String: Any]) {
    guard let action = message["action"] as? String else { return }
    let at = (message["at"] as? Double) ?? Date().timeIntervalSince1970 * 1000
    let event: [String: Any] = ["action": action, "at": at]
    lock.lock()
    let handler = onAction
    if handler == nil { pending.append(event) }
    lock.unlock()
    handler?(event)
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if let json = UserDefaults(suiteName: moondayGroup)?.string(forKey: glanceKey) {
      lastSent = ""
      send(json)
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    WCSession.default.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    handle(message)
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    handle(message)
    replyHandler(["ok": true])
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    handle(userInfo)
  }
}

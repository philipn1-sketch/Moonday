Pod::Spec.new do |s|
  s.name           = 'MoondayNative'
  s.version        = '1.0.0'
  s.summary        = 'Shares a cycle summary with the widget, Watch and Siri, passes Watch taps to the app, and syncs Apple Health.'
  s.author         = 'Philip Nader'
  s.homepage       = 'https://github.com/philipn1-sketch/Moonday'
  s.license        = 'MIT'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'WatchConnectivity', 'HealthKit'
  s.source_files   = '**/*.swift'
end

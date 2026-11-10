/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'watch',
  name: 'MoondayWatch',
  displayName: 'Moonday',
  bundleIdentifier: '.watch',
  deploymentTarget: '10.0',
  icon: '../../assets/icon.png',
  frameworks: ['SwiftUI', 'WatchConnectivity'],
  colors: {
    $accent: { color: '#6B4FD8', darkColor: '#B9A6FF' },
  },
};

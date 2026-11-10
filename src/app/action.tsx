import { Redirect } from 'expo-router';

/** moonday://action links from Siri are acted on by LinkActions in the root layout; this screen only goes Home. */
export default function Action() {
  return <Redirect href="/" />;
}

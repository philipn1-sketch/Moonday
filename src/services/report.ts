import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';

/** Makes the report into a PDF and opens the share sheet, so she can send it, print it or save it to Files. */
export async function shareReport(html: string): Promise<void> {
  const { uri } = await printToFileAsync({ html });
  await shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}

// In the web preview the report opens in a new tab.
export async function shareReport(html: string): Promise<void> {
  const w = globalThis.open?.('', '_blank');
  w?.document.write(html);
}

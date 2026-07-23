export type ElectronBridge = NonNullable<typeof window.pidioforge>;

export function useSafeElectronBridge() {
  const bridge = window.pidioforge;
  const available = Boolean(bridge);
  const unavailableMessage = 'Fitur desktop tidak tersedia. Jalankan aplikasi lewat PidioForge Desktop/Electron.';
  return { bridge, available, unavailableMessage };
}

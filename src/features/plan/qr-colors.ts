/**
 * A QR code is data, not a themed surface: dark modules on a light quiet zone,
 * whatever the app's theme — a camera reading another screen needs the
 * contrast. The one place these two hex values live (like the plate colours of
 * `BarGraphic` and the share card's palette).
 */
export const QR_INK = '#000000';
export const QR_PAPER = '#ffffff';

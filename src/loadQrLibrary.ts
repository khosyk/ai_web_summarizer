/** public/vendor의 qrcodejs 1.0.0 — MV3는 원격 스크립트를 막아 확장에 포함 (cdnjs 원본과 SRI 동일) */
const QR_LIBRARY_PATH = "vendor/qrcode.min.js";
const QR_LIBRARY_INTEGRITY =
	"sha512-CNgIRecGo7nphbeZ04Sc13ka07paqdeTu0WR1IM4kNcpmBAUSHSQX0FslNhTDadL4O5SAGapGt4FodqL8My0mA==";

export type QrCodeConstructor = new (
	element: HTMLElement,
	options: { text: string; width: number; height: number },
) => unknown;

type QrWindow = Window & { QRCode?: QrCodeConstructor };

let pending: Promise<QrCodeConstructor> | null = null;

function libraryUrl(): string {
	return typeof chrome !== "undefined" && chrome.runtime?.getURL
		? chrome.runtime.getURL(QR_LIBRARY_PATH)
		: `/${QR_LIBRARY_PATH}`;
}

/** PayPal 탭을 열 때만 호출. 실패하면 다음 번에 다시 시도 */
export function loadQrLibrary(): Promise<QrCodeConstructor> {
	pending ??= new Promise<QrCodeConstructor>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = libraryUrl();
		script.integrity = QR_LIBRARY_INTEGRITY;
		script.crossOrigin = "anonymous";
		script.onload = () => {
			const QRCode = (window as QrWindow).QRCode;
			if (QRCode) resolve(QRCode);
			else reject(new Error("qr_library_missing"));
		};
		script.onerror = () => {
			script.remove();
			reject(new Error("qr_library_failed"));
		};
		document.head.appendChild(script);
	}).catch((error: unknown) => {
		pending = null;
		throw error;
	});
	return pending;
}

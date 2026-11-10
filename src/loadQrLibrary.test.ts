import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let appended: HTMLScriptElement[] = [];

beforeEach(() => {
	vi.resetModules();
	appended = [];
	vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
		appended.push(node as HTMLScriptElement);
		return node;
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	delete (window as unknown as { QRCode?: unknown }).QRCode;
});

describe("loadQrLibrary", () => {
	it("loads the local file once with SRI and anonymous CORS", async () => {
		const { loadQrLibrary } = await import("./loadQrLibrary");
		const first = loadQrLibrary();
		const second = loadQrLibrary();

		expect(appended).toHaveLength(1);
		expect(appended[0].getAttribute("src")).toBe("/vendor/qrcode.min.js");
		expect(appended[0].integrity).toMatch(/^sha512-CNgIRecGo7/);
		expect(appended[0].crossOrigin).toBe("anonymous");

		const QRCode = class {};
		(window as unknown as { QRCode: unknown }).QRCode = QRCode;
		appended[0].onload?.(new Event("load"));
		await expect(first).resolves.toBe(QRCode);
		await expect(second).resolves.toBe(QRCode);
	});

	it("rejects on load failure and retries on the next call", async () => {
		const { loadQrLibrary } = await import("./loadQrLibrary");
		const first = loadQrLibrary();
		appended[0].onerror?.(new Event("error"));
		await expect(first).rejects.toThrow("qr_library_failed");

		void loadQrLibrary().catch(() => {});
		expect(appended).toHaveLength(2);
	});
});

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DONATION_COPY, SITE, type DonationSite } from "../donation";
import { loadQrLibrary } from "../loadQrLibrary";
import { DonationDialog } from "./DonationDialog";

vi.mock("../loadQrLibrary", () => ({ loadQrLibrary: vi.fn() }));

const loadMock = vi.mocked(loadQrLibrary);
const ko = DONATION_COPY.Korean;
const en = DONATION_COPY.English;

function open(
	language: "Korean" | "English" = "Korean",
	overrides: Partial<DonationSite> = {},
) {
	return render(
		<DonationDialog
			isOpen
			language={language}
			onClose={() => {}}
			site={{ ...SITE, ...overrides }}
		/>,
	);
}

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute("open");
	};
	loadMock.mockReset();
	loadMock.mockResolvedValue(class {} as never);
});

afterEach(cleanup);

describe("DonationDialog", () => {
	it("renders nothing without any tab", () => {
		const { container } = open("Korean", { kakaoQR: "", paypal: "" });
		expect(container.querySelector("dialog")).toBeNull();
	});

	it("shows no tab list when only one service is set", () => {
		open("Korean", { paypal: "" });
		expect(screen.queryByRole("tablist", { hidden: true })).toBeNull();
		expect(screen.getByAltText(ko.kakaoAlt(5000))).toBeTruthy();
	});

	it("opens kakao by default in Korean without loading the QR library", () => {
		open("Korean");
		expect(
			screen
				.getByRole("link", { name: ko.kakaoSend(5000), hidden: true })
				.getAttribute("href"),
		).toBe(SITE.kakaoLink);
		expect(screen.getByText(ko.kakaoNote(5000, true))).toBeTruthy();
		expect(loadMock).not.toHaveBeenCalled();
	});

	it("opens paypal by default in English and loads the QR library", async () => {
		open("English");
		await act(async () => {});
		expect(
			screen
				.getByRole("link", { name: en.paypalSend, hidden: true })
				.getAttribute("href"),
		).toBe(SITE.paypal);
		expect(loadMock).toHaveBeenCalledTimes(1);
	});

	it("loads the QR library only after switching to the paypal tab", async () => {
		open("Korean");
		fireEvent.click(screen.getByRole("tab", { name: ko.tabPaypal, hidden: true }));
		await act(async () => {});
		expect(loadMock).toHaveBeenCalledTimes(1);
	});

	it("moves between tabs with the arrow keys", () => {
		open("Korean");
		fireEvent.keyDown(screen.getByRole("tab", { name: ko.tabKakao, hidden: true }), {
			key: "ArrowRight",
		});
		const paypalTab = screen.getByRole("tab", { name: ko.tabPaypal, hidden: true });
		expect(paypalTab.getAttribute("aria-selected")).toBe("true");
		expect(document.activeElement).toBe(paypalTab);
	});

	it("keeps the drawn QR after the loading state ends", async () => {
		loadMock.mockResolvedValue(
			class {
				constructor(element: HTMLElement) {
					element.appendChild(document.createElement("canvas"));
				}
			} as never,
		);
		const { container } = open("English");
		await act(async () => {});
		expect(container.querySelector("#donation-panel canvas")).not.toBeNull();
		expect(screen.queryByText(en.qrLoading)).toBeNull();
		expect(screen.getByRole("img", { name: en.paypalAlt, hidden: true })).toBeTruthy();
	});

	it("shows the failure message and keeps the button when the library fails", async () => {
		loadMock.mockRejectedValue(new Error("qr_library_failed"));
		open("Korean", { kakaoQR: "" });
		await act(async () => {});
		expect(screen.getByText(ko.qrFailed)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: ko.paypalSend, hidden: true }),
		).toBeTruthy();
	});

	it("opens every external link safely", async () => {
		open("Korean");
		for (const link of [
			screen.getByRole("link", { name: ko.kakaoSend(5000), hidden: true }),
		]) {
			expect(link.getAttribute("target")).toBe("_blank");
			expect(link.getAttribute("rel")).toBe("noopener noreferrer");
		}
		cleanup();
		open("English");
		await act(async () => {});
		const paypal = screen.getByRole("link", { name: en.paypalSend, hidden: true });
		expect(paypal.getAttribute("target")).toBe("_blank");
		expect(paypal.getAttribute("rel")).toBe("noopener noreferrer");
	});

	it("drops the amount wording when no amount is set", () => {
		open("Korean", { kakaoAmount: 0 });
		expect(
			screen.getByRole("link", { name: ko.kakaoSend(0), hidden: true }),
		).toBeTruthy();
		expect(screen.queryByText(/5,000/)).toBeNull();
	});

	it("keeps the QR note accurate without a link", () => {
		open("Korean", { kakaoLink: "", paypal: "" });
		expect(screen.queryByRole("link", { name: ko.kakaoSend(5000), hidden: true })).toBeNull();
		expect(screen.getByText(ko.kakaoNote(5000, false))).toBeTruthy();
	});
});

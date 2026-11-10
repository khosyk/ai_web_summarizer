import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DONATION_COPY, SITE } from "../donation";
import { DonationNotice } from "./DonationNotice";

const ko = DONATION_COPY.Korean;
const KEY = "donationNoticeHiddenUntil";
const NOW = Date.UTC(2026, 10, 5);
const DAY_MS = 24 * 60 * 60 * 1000;

let stored: Record<string, unknown>;

async function renderNotice(site = SITE) {
	const onOpenDonation = vi.fn();
	const view = render(
		<DonationNotice
			language="Korean"
			onOpenDonation={onOpenDonation}
			site={site}
		/>,
	);
	await act(async () => {});
	return { ...view, onOpenDonation };
}

beforeEach(() => {
	stored = {};
	vi.spyOn(Date, "now").mockReturnValue(NOW);
	vi.stubGlobal("chrome", {
		storage: {
			local: {
				get: vi.fn(async (key: string) => ({ [key]: stored[key] })),
				set: vi.fn(async (values: Record<string, unknown>) => {
					Object.assign(stored, values);
				}),
			},
		},
	});
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("DonationNotice", () => {
	it("shows the appeal with both dismiss buttons", async () => {
		await renderNotice();
		expect(screen.getByText(ko.appealLead)).toBeTruthy();
		expect(screen.getByRole("button", { name: ko.hideForDay })).toBeTruthy();
		expect(screen.getByRole("button", { name: ko.close })).toBeTruthy();
	});

	it("opens the donation dialog from its button", async () => {
		const { onOpenDonation } = await renderNotice();
		fireEvent.click(screen.getByRole("button", { name: ko.entry }));
		expect(onOpenDonation).toHaveBeenCalledOnce();
	});

	it("close hides it for this page only", async () => {
		await renderNotice();
		fireEvent.click(screen.getByRole("button", { name: ko.close }));
		expect(screen.queryByText(ko.appealLead)).toBeNull();
		expect(stored[KEY]).toBeUndefined();

		cleanup();
		await renderNotice();
		expect(screen.getByText(ko.appealLead)).toBeTruthy();
	});

	it("stays hidden for a day after choosing to hide it", async () => {
		await renderNotice();
		fireEvent.click(screen.getByRole("button", { name: ko.hideForDay }));
		await act(async () => {});
		expect(screen.queryByText(ko.appealLead)).toBeNull();
		expect(stored[KEY]).toBe(NOW + DAY_MS);

		cleanup();
		await renderNotice();
		expect(screen.queryByText(ko.appealLead)).toBeNull();
	});

	it("returns once the day has passed", async () => {
		stored[KEY] = NOW;
		await renderNotice();
		expect(screen.getByText(ko.appealLead)).toBeTruthy();
	});

	it("still shows when the saved value cannot be read", async () => {
		vi.mocked(chrome.storage.local.get).mockRejectedValue(new Error("nope"));
		await renderNotice();
		expect(screen.getByText(ko.appealLead)).toBeTruthy();
	});

	it("renders nothing when no payment service is set", async () => {
		await renderNotice({ ...SITE, kakaoQR: "", paypal: "" });
		expect(screen.queryByText(ko.appealLead)).toBeNull();
	});
});

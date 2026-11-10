const HIDDEN_UNTIL_KEY = "donationNoticeHiddenUntil";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 「하루 종일 보지 않기」를 누른 뒤 24시간이 지나지 않았는지 */
export async function isDonationNoticeHidden(
	now: number = Date.now(),
): Promise<boolean> {
	if (typeof chrome === "undefined" || !chrome.storage?.local) return false;
	const data = await chrome.storage.local.get(HIDDEN_UNTIL_KEY);
	const hiddenUntil = data[HIDDEN_UNTIL_KEY];
	return typeof hiddenUntil === "number" && hiddenUntil > now;
}

export async function hideDonationNoticeForOneDay(
	now: number = Date.now(),
): Promise<void> {
	if (typeof chrome === "undefined" || !chrome.storage?.local) return;
	await chrome.storage.local.set({ [HIDDEN_UNTIL_KEY]: now + ONE_DAY_MS });
}

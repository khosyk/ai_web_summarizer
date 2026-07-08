export const AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY = "autoSummarizeBlockedHosts";

/** 블록리스트 비교용 hostname 정규화 */
export function normalizeBlockedHost(hostname: string): string {
	const trimmed = hostname.trim().toLowerCase();
	if (!trimmed) return "";
	return trimmed.startsWith("www.") ? trimmed.slice(4) : trimmed;
}

/** http(s) 탭 URL → hostname (실패 시 null) */
export function hostFromTabUrl(tabUrl: string): string | null {
	try {
		const url = new URL(tabUrl);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		const normalized = normalizeBlockedHost(url.hostname);
		return normalized || null;
	} catch {
		return null;
	}
}

/** 사용자 입력 도메인 → 저장 가능한 hostname (실패 시 null) */
export function parseBlockedHostInput(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
	try {
		const url = new URL(candidate);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		if (!url.hostname) return null;
		const normalized = normalizeBlockedHost(url.hostname);
		return normalized || null;
	} catch {
		const bare = normalizeBlockedHost(trimmed.replace(/\/.*$/, ""));
		if (!bare || !/^[a-z0-9.-]+$/i.test(bare)) {
			return null;
		}
		if (!bare.includes(".") && bare !== "localhost") {
			return null;
		}
		return bare;
	}
}

export function isHostBlocked(
	host: string | null,
	blockedHosts: readonly string[],
): boolean {
	if (!host) return false;
	const normalized = normalizeBlockedHost(host);
	if (!normalized) return false;
	const blockedSet = new Set(
		blockedHosts.map((entry) => normalizeBlockedHost(entry)).filter(Boolean),
	);
	return blockedSet.has(normalized);
}

export function isTabUrlAutoBlocked(
	tabUrl: string,
	blockedHosts: readonly string[],
): boolean {
	return isHostBlocked(hostFromTabUrl(tabUrl), blockedHosts);
}

function uniqueSortedHosts(hosts: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const host of hosts) {
		const normalized = normalizeBlockedHost(host);
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		out.push(normalized);
	}
	return out.sort((a, b) => a.localeCompare(b));
}

/** chrome.storage.local 블록리스트 조회 */
export async function getAutoSummarizeBlockedHosts(): Promise<string[]> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		const data = await chrome.storage.local.get(AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY);
		const stored = data[AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY];
		if (Array.isArray(stored)) {
			return uniqueSortedHosts(
				stored.filter((entry): entry is string => typeof entry === "string"),
			);
		}
	}
	return [];
}

/** 블록리스트 저장 */
export async function setAutoSummarizeBlockedHosts(
	hosts: readonly string[],
): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		await chrome.storage.local.set({
			[AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY]: uniqueSortedHosts(hosts),
		});
	}
}

/** hostname 추가 (중복 무시) */
export async function addAutoSummarizeBlockedHost(host: string): Promise<string[]> {
	const normalized = normalizeBlockedHost(host);
	if (!normalized) return getAutoSummarizeBlockedHosts();
	const current = await getAutoSummarizeBlockedHosts();
	if (current.includes(normalized)) return current;
	const next = uniqueSortedHosts([...current, normalized]);
	await setAutoSummarizeBlockedHosts(next);
	return next;
}

/** hostname 제거 */
export async function removeAutoSummarizeBlockedHost(
	host: string,
): Promise<string[]> {
	const normalized = normalizeBlockedHost(host);
	const current = await getAutoSummarizeBlockedHosts();
	const next = current.filter((entry) => entry !== normalized);
	await setAutoSummarizeBlockedHosts(next);
	return next;
}

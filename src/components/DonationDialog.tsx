import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Coffee, Copy, ExternalLink, X } from "lucide-react";
import {
	DONATION_COPY,
	SITE,
	defaultPayTab,
	kakaoImg,
	kakaoURL,
	payTabs,
	paypalURL,
	type DonationSite,
	type PayTabId,
} from "../donation";
import { loadQrLibrary } from "../loadQrLibrary";
import { openLegalPage } from "../openLegalPage";
import { SUPPORT_EMAIL, type ServiceLang } from "../privacyNotice";

const QR_SIZE = 192;
const EXTERNAL_LINK_CLASS =
	"flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-center text-xs font-black text-white transition-colors hover:bg-slate-800";

interface Props {
	isOpen: boolean;
	language: ServiceLang;
	onClose: () => void;
	site?: DonationSite;
}

function KakaoPanel({
	language,
	site,
}: {
	language: ServiceLang;
	site: DonationSite;
}) {
	const copy = DONATION_COPY[language];
	const link = kakaoURL(site);
	return (
		<div className="flex flex-col gap-3 sm:flex-col-reverse">
			{link ? (
				// 폰은 자기 화면의 QR을 찍을 수 없어 좁은 화면에서는 버튼이 먼저
				<a
					href={link}
					target="_blank"
					rel="noopener noreferrer"
					className={EXTERNAL_LINK_CLASS}
				>
					{copy.kakaoSend(site.kakaoAmount)}
					<ExternalLink size={12} aria-hidden="true" />
				</a>
			) : null}
			<img
				src={kakaoImg(site)}
				alt={copy.kakaoAlt(site.kakaoAmount)}
				width={QR_SIZE}
				height={QR_SIZE}
				className="mx-auto rounded-lg"
			/>
			<p className="text-[11px] font-medium leading-relaxed text-slate-600">
				{copy.kakaoNote(site.kakaoAmount, Boolean(link))}
			</p>
		</div>
	);
}

function PaypalPanel({
	language,
	site,
}: {
	language: ServiceLang;
	site: DonationSite;
}) {
	const copy = DONATION_COPY[language];
	const link = paypalURL(site);
	const qrRef = useRef<HTMLDivElement>(null);
	const [qrState, setQrState] = useState<"loading" | "ready" | "failed">(
		"loading",
	);
	const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
		"idle",
	);

	useEffect(() => {
		let cancelled = false;
		const render = async () => {
			try {
				const QRCode = await loadQrLibrary();
				if (cancelled || !qrRef.current) return;
				qrRef.current.replaceChildren();
				new QRCode(qrRef.current, {
					text: link,
					width: QR_SIZE,
					height: QR_SIZE,
				});
				setQrState("ready");
			} catch {
				if (!cancelled) setQrState("failed");
			}
		};
		void render();
		return () => {
			cancelled = true;
		};
	}, [link]);

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(link);
			setCopyState("copied");
		} catch {
			setCopyState("failed");
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<a
				href={link}
				target="_blank"
				rel="noopener noreferrer"
				className={EXTERNAL_LINK_CLASS}
			>
				{copy.paypalSend}
				<ExternalLink size={12} aria-hidden="true" />
			</a>
			{qrState === "failed" ? (
				<p
					role="alert"
					className="rounded-lg bg-amber-50 p-2 text-[11px] font-medium leading-relaxed text-amber-800"
				>
					{copy.qrFailed}
				</p>
			) : (
				<div
					role="img"
					aria-label={qrState === "ready" ? copy.paypalAlt : copy.qrLoading}
					className="mx-auto flex items-center justify-center bg-white p-3 text-[11px] text-slate-500"
					style={{ minWidth: QR_SIZE + 24, minHeight: QR_SIZE + 24 }}
				>
					{qrState === "loading" ? copy.qrLoading : null}
					{/* qrcodejs가 직접 그리는 요소 — React 자식을 두면 리렌더 때 QR이 지워짐 */}
					<div ref={qrRef} />
				</div>
			)}
			<p className="break-all text-center text-[11px] font-medium text-slate-600">
				{link}
			</p>
			<button
				type="button"
				onClick={() => void copyLink()}
				className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
			>
				{copyState === "copied" ? (
					<Check size={12} aria-hidden="true" />
				) : (
					<Copy size={12} aria-hidden="true" />
				)}
				{copy.copyLink}
			</button>
			<p aria-live="polite" className="text-center text-[11px] text-slate-600">
				{copyState === "copied" ? copy.copied : null}
				{copyState === "failed" ? copy.copyFailed : null}
			</p>
		</div>
	);
}

/** 후원 창 — 기능·요약 결과와 무관한 선택 사항 */
export function DonationDialog({
	isOpen,
	language,
	onClose,
	site = SITE,
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const tabs = payTabs(language, site);
	const copy = DONATION_COPY[language];
	const [selectedTab, setSelectedTab] = useState<PayTabId | null>(null);
	// 고른 탭이 없으면 현재 언어 기준 — 한국어 화면에서 PayPal 라이브러리를 부르지 않도록 렌더 시 계산
	const activeTab = selectedTab ?? defaultPayTab(language, tabs);
	const tabRefs = useRef<Partial<Record<PayTabId, HTMLButtonElement | null>>>(
		{},
	);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen && !dialog.open) {
			dialog.showModal();
		} else if (!isOpen) {
			if (dialog.open) dialog.close();
			setSelectedTab(null);
		}
	}, [isOpen]);

	const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		const index = tabs.findIndex(([id]) => id === activeTab);
		const nextIndex = {
			ArrowRight: (index + 1) % tabs.length,
			ArrowLeft: (index - 1 + tabs.length) % tabs.length,
			Home: 0,
			End: tabs.length - 1,
		}[event.key];
		if (nextIndex === undefined) return;
		event.preventDefault();
		const nextId = tabs[nextIndex][0];
		setSelectedTab(nextId);
		tabRefs.current[nextId]?.focus();
	};

	if (tabs.length === 0) return null;

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby="donation-dialog-title"
			onClose={onClose}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50"
		>
			<div className="flex flex-col gap-3 p-4">
				<div className="flex items-start gap-2 pr-1">
					<Coffee
						size={16}
						aria-hidden="true"
						className="mt-0.5 shrink-0 text-slate-500"
					/>
					<h2
						id="donation-dialog-title"
						className="min-w-0 flex-1 text-sm font-black text-slate-900"
					>
						{copy.entry}
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label={copy.close}
						className="shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
					>
						<X size={16} aria-hidden="true" />
					</button>
				</div>
				<p className="text-[11px] font-medium leading-relaxed text-slate-600">
					{copy.intro}
				</p>
				<p className="text-[11px] font-bold text-slate-600">
					{copy.operator}: {site.operator}
				</p>

				{tabs.length > 1 ? (
					<div
						role="tablist"
						aria-label={copy.tablist}
						className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
					>
						{tabs.map(([id, label]) => (
							<button
								key={id}
								ref={(element) => {
									tabRefs.current[id] = element;
								}}
								type="button"
								role="tab"
								id={`donation-tab-${id}`}
								aria-selected={activeTab === id}
								aria-controls="donation-panel"
								tabIndex={activeTab === id ? 0 : -1}
								onClick={() => setSelectedTab(id)}
								onKeyDown={onTabKeyDown}
								className={`rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors ${
									activeTab === id
										? "bg-white text-slate-900 shadow-sm"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				) : null}

				{isOpen ? (
					<div
						id="donation-panel"
						{...(tabs.length > 1
							? {
									role: "tabpanel",
									"aria-labelledby": `donation-tab-${activeTab}`,
								}
							: {})}
					>
						{activeTab === "kakao" ? (
							<KakaoPanel language={language} site={site} />
						) : null}
						{activeTab === "paypal" ? (
							<PaypalPanel language={language} site={site} />
						) : null}
					</div>
				) : null}

				<ul className="list-disc space-y-1 border-t border-slate-100 pl-4 pt-3 text-[10px] leading-relaxed text-slate-600">
					{copy.notices.map((notice) => (
						<li key={notice}>{notice}</li>
					))}
				</ul>
				<p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-600">
					<button
						type="button"
						onClick={openLegalPage}
						className="font-bold underline hover:text-indigo-600"
					>
						{copy.detail}
					</button>
					<span>
						{copy.contact}:{" "}
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
							className="break-all underline hover:text-indigo-600"
						>
							{SUPPORT_EMAIL}
						</a>
					</span>
				</p>
			</div>
		</dialog>
	);
}

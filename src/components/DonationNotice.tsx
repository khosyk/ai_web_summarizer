import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";
import { DONATION_COPY, SITE, payTabs, type DonationSite } from "../donation";
import {
	hideDonationNoticeForOneDay,
	isDonationNoticeHidden,
} from "../donationNotice";
import type { ServiceLang } from "../privacyNotice";

interface Props {
	language: ServiceLang;
	onOpenDonation: () => void;
	site?: DonationSite;
}

/** 설치 가이드 오른쪽 위 후원 알림 */
export function DonationNotice({
	language,
	onOpenDonation,
	site = SITE,
}: Props) {
	// 저장값을 읽기 전에는 숨겨서, 숨긴 사용자에게 잠깐 보이지 않게 함
	const [isVisible, setIsVisible] = useState(false);
	const copy = DONATION_COPY[language];

	useEffect(() => {
		let isCurrent = true;
		isDonationNoticeHidden()
			.catch(() => false)
			.then((isHidden) => {
				if (isCurrent) setIsVisible(!isHidden);
			});
		return () => {
			isCurrent = false;
		};
	}, []);

	if (!isVisible || payTabs(language, site).length === 0) return null;

	const hideForOneDay = () => {
		setIsVisible(false);
		void hideDonationNoticeForOneDay().catch(() => {});
	};

	return (
		<aside
			aria-label={copy.entry}
			className="fixed right-4 top-4 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
		>
			<div className="text-xs font-medium leading-relaxed text-slate-700">
				<p>{copy.appealLead}</p>
				<p>{copy.appealAction}</p>
			</div>
			<button
				type="button"
				onClick={onOpenDonation}
				className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-slate-800"
			>
				<Coffee size={14} aria-hidden="true" />
				{copy.entry}
			</button>
			<div className="mt-2 flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={hideForOneDay}
					className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
				>
					{copy.hideForDay}
				</button>
				<button
					type="button"
					onClick={() => setIsVisible(false)}
					className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
				>
					{copy.close}
				</button>
			</div>
		</aside>
	);
}

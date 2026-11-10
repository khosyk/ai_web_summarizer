import type { ServiceLang } from "./privacyNotice";

export type DonationSite = {
	kakaoQR: string;
	kakaoLink: string;
	kakaoAmount: number;
	paypal: string;
	operator: string;
};

/** 후원 설정 — 값을 비우면 해당 기능이 사라짐 */
export const SITE: DonationSite = {
	kakaoQR: // 외부 이미지 주소는 받지 않음
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYgAAAGIAQMAAABhjeVlAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR42u2byXUbMQxAgeeDjykhnSRt5aRROkspKSFHHfyAkFi4DRXPSLLk2OCzKYnD74MhgNgIECNGjBgxYlw4WEd6RSZkXcm/6X36Yd9BQVxDkBDHQshmoAlhc35F2ywbQRHQ9xDE+yUWkW/eRYrIdyXjWd66SkE0xLKbcMGo0oErX5ZEEDcjaDuR1kRoBoHKkYO4N+GcWysDxUSJnp2zcCx/qiXskAriCsI9gLTG4iTkmXwGOu8zqE0M4lVCnx0awlYmRCdJdLumzlwvuSDuQ2QLdxC7liRI6mTJThGnCq+XoHkZZv3siBIFxCAmBKVZtmwibItro6id2a4cyIhmEgRxYwKV4CmhNhHVB9OAk8A/FHcgiL0ENxjqYYGmDe5s4aAcWwgO4n7EIqdFXjUPGVmDSPGAyeOYgeAgthB8tI/kIXlacquVjRbBEH+kxysCnADNnAVxIaFHOgmLloaCEuaBSMQC9d4qKkE1rg/iMQQ5AM1edc1K7Kh61drEluAJAf8lIeN5O0HN+jbij735Ws6WFWH5LY/of9v6l5LdRxptYk/8svXnzcTR1p82E76OW4mVy/lI4qDZKIKXCcHjGQXFQU7WrxIHqDUWGGR+HXEqD74FMRL527o2eSVDrxnhwR4GsY+gPUTy4dRVwKxt0EjQki5BXE6ogdMzOs0/yoPvfowj9SK2wNKJUxCPJdCK6xrRdA+q3RssXBA3JMR/7SpY4BWsTtvQeynGvHAQewidcqUjacJpchaxPFkRPCFUy3CWI/t4xMs7ISyjb0lKagJF0TG0PBg9kuBPREitZJ0qzluoqbzclrAk3IcnIGe8atmjzC4ezSB0TtlAcBAPJdiatI7ulln3IxcvjQa32koy1ZGbERxES9h/d5kTT7yueJV8MGt7kJVKSh1lTmAQ/yRShr54tiXNqUJL889ST+9y+rAitMzCNcMSxN0IUSKSDCRZNsCbsHNiFSc14aXt8uaS0A9iJ7FMCUvSq9JpxxbXoq6rVxA3II60InhFLFyPJ09/WTnHX4CDuIioecgSi3h/O1jlY8ywdJWsIN6G2C4Pb9Py2qFHk9JiWjyy2Y2qIDYQPmvrCdb8ibYokmUW1x3YdiEHBgKCuI7w+zjeJmqCrHfdVvfV/M5PEHchmhIuvUIgNy4xlo4UOndfLYg9hDZqlUik9PucI4pKauO1mTue+9Sfmlh2EFC62bEcOdR0qrgsg7g3AT1BZ4jGZ5DiSM3GNHeqCYK4hIgRI0aMGDHefPwF1Jia8DChGDIAAAAASUVORK5CYII=",
	kakaoLink: "https://qr.kakaopay.com/2810060111180679800052069c408983",
	kakaoAmount: 5000, // 금액을 안 정한 QR이면 0
	paypal: "https://paypal.me/mehosy",
	operator: "mehosy",
};

export type PayTabId = "kakao" | "paypal";

export const paypalURL = (site: DonationSite = SITE): string =>
	/^https:\/\/(www\.)?paypal\.(me|com)\/[^\s"'<>]+$/i.test(site.paypal)
		? site.paypal
		: "";

export const kakaoURL = (site: DonationSite = SITE): string =>
	/^https:\/\/qr\.kakaopay\.com\/[^\s"'<>]+$/.test(site.kakaoLink)
		? site.kakaoLink
		: "";

export const kakaoImg = (site: DonationSite = SITE): string =>
	/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(site.kakaoQR)
		? site.kakaoQR
		: "";

export const payTabs = (
	language: ServiceLang,
	site: DonationSite = SITE,
): Array<[PayTabId, string]> => {
	const tabs: Array<[PayTabId, string]> = [];
	if (kakaoImg(site)) tabs.push(["kakao", DONATION_COPY[language].tabKakao]);
	if (paypalURL(site)) tabs.push(["paypal", DONATION_COPY[language].tabPaypal]);
	return tabs;
};

/** 한국어 화면은 카카오페이, 그 외는 PayPal 우선 */
export function defaultPayTab(
	language: ServiceLang,
	tabs: Array<[PayTabId, string]>,
): PayTabId | undefined {
	const preferred: PayTabId = language === "Korean" ? "kakao" : "paypal";
	return tabs.find(([id]) => id === preferred)?.[0] ?? tabs[0]?.[0];
}

export const DONATION_COPY: Record<
	ServiceLang,
	{
		entry: string;
		appealLead: string;
		appealAction: string;
		hideForDay: string;
		intro: string;
		operator: string;
		close: string;
		tablist: string;
		tabKakao: string;
		tabPaypal: string;
		kakaoSend: (amount: number) => string;
		kakaoNote: (amount: number, hasLink: boolean) => string;
		kakaoAlt: (amount: number) => string;
		paypalSend: string;
		paypalAlt: string;
		qrLoading: string;
		qrFailed: string;
		copyLink: string;
		copied: string;
		copyFailed: string;
		notices: string[];
		detail: string;
		contact: string;
	}
> = {
	Korean: {
		entry: "개발자에게 커피 한 잔",
		appealLead: "이 프로그램은 무료로 제공돼요. 도움이 됐다면",
		appealAction: "개발자에게 커피 한 잔 어때요?",
		hideForDay: "하루 종일 보지 않기",
		intro:
			"Web Summary는 무료예요. 후원은 하지 않아도 되고, 기능이나 요약 결과에 아무 영향을 주지 않아요.",
		operator: "운영자",
		close: "닫기",
		tablist: "송금 서비스",
		tabKakao: "카카오페이 (국내)",
		tabPaypal: "PayPal (해외)",
		kakaoSend: (amount) =>
			amount > 0
				? `카카오페이로 ${formatAmount(amount)}원 보내기`
				: "카카오페이로 보내기",
		kakaoNote: (amount, hasLink) =>
			amount > 0
				? `이 QR${hasLink ? "과 버튼은" : "은"} ${formatAmount(amount)}원 송금용이에요. 보내기 전에 금액을 확인할 수 있어요.`
				: "보내는 화면에서 금액을 정할 수 있어요.",
		kakaoAlt: (amount) =>
			amount > 0
				? `카카오페이 ${formatAmount(amount)}원 송금 QR 코드`
				: "카카오페이 송금 QR 코드",
		paypalSend: "PayPal로 보내기",
		paypalAlt: "PayPal 송금 링크 QR 코드",
		qrLoading: "QR을 불러오는 중이에요.",
		qrFailed: "QR을 불러오지 못했어요. PayPal 버튼을 써 주세요.",
		copyLink: "링크 복사",
		copied: "링크를 복사했어요.",
		copyFailed: "복사하지 못했어요. 위 링크를 직접 선택해 주세요.",
		notices: [
			"대가 없는 자발적인 선물이고, 기부금 영수증은 발급되지 않아요.",
			"미성년자는 보호자 동의 없이 보내지 마세요.",
			"수수료와 환율은 각 송금 서비스의 정책을 따라요.",
			"송금 화면에는 서비스에 등록한 이름이 보일 수 있고, 여기 적힌 운영자 이름과 다를 수 있어요.",
			"카카오페이와 PayPal은 각 회사의 상표이며, 이 서비스와 제휴 관계가 없어요.",
		],
		detail: "후원 안내 전문",
		contact: "문의",
	},
	English: {
		entry: "Buy the developer a coffee",
		appealLead: "This program is free. If it helped you,",
		appealAction: "how about buying the developer a coffee?",
		hideForDay: "Don't show for a day",
		intro:
			"Web Summary is free. Sending a gift is entirely optional and has no effect on features or summary results.",
		operator: "Operator",
		close: "Close",
		tablist: "Payment service",
		tabKakao: "KakaoPay (Korea)",
		tabPaypal: "PayPal (global)",
		kakaoSend: (amount) =>
			amount > 0
				? `Send ₩${formatAmount(amount)} with KakaoPay`
				: "Send with KakaoPay",
		kakaoNote: (amount, hasLink) =>
			amount > 0
				? `This QR${hasLink ? " and button are" : " is"} for sending ₩${formatAmount(amount)}. You can check the amount before sending.`
				: "You can set the amount on the sending screen.",
		kakaoAlt: (amount) =>
			amount > 0
				? `KakaoPay QR code for sending ₩${formatAmount(amount)}`
				: "KakaoPay QR code",
		paypalSend: "Send with PayPal",
		paypalAlt: "QR code for the PayPal link",
		qrLoading: "Loading the QR code.",
		qrFailed: "Couldn't load the QR code. Please use the PayPal button.",
		copyLink: "Copy link",
		copied: "Link copied.",
		copyFailed: "Couldn't copy. Please select the link above.",
		notices: [
			"This is a voluntary gift with nothing in return. No donation receipt is issued.",
			"Minors should not send a gift without a guardian's consent.",
			"Fees and exchange rates follow each payment service's policy.",
			"The sending screen may show the name registered with the service, which can differ from the operator name shown here.",
			"KakaoPay and PayPal are trademarks of their respective companies, which are not affiliated with this service.",
		],
		detail: "Full gift terms",
		contact: "Contact",
	},
	Chinese: {
		entry: "请开发者喝杯咖啡",
		appealLead: "本程序免费提供。如果对您有帮助，",
		appealAction: "请开发者喝杯咖啡怎么样？",
		hideForDay: "一天内不再显示",
		intro: "Web Summary 免费提供。赠送完全自愿，不会影响功能或摘要结果。",
		operator: "运营者",
		close: "关闭",
		tablist: "转账服务",
		tabKakao: "KakaoPay（韩国）",
		tabPaypal: "PayPal（海外）",
		kakaoSend: (amount) =>
			amount > 0
				? `用 KakaoPay 发送 ${formatAmount(amount)} 韩元`
				: "用 KakaoPay 发送",
		kakaoNote: (amount, hasLink) =>
			amount > 0
				? `此二维码${hasLink ? "和按钮" : ""}用于发送 ${formatAmount(amount)} 韩元。发送前可以确认金额。`
				: "可在发送页面设定金额。",
		kakaoAlt: (amount) =>
			amount > 0
				? `用于发送 ${formatAmount(amount)} 韩元的 KakaoPay 二维码`
				: "KakaoPay 二维码",
		paypalSend: "用 PayPal 发送",
		paypalAlt: "PayPal 链接二维码",
		qrLoading: "正在加载二维码。",
		qrFailed: "无法加载二维码，请使用 PayPal 按钮。",
		copyLink: "复制链接",
		copied: "链接已复制。",
		copyFailed: "无法复制，请手动选择上方链接。",
		notices: [
			"这是没有回报的自愿赠与，不开具捐赠收据。",
			"未成年人未经监护人同意请勿发送。",
			"手续费和汇率以各转账服务的政策为准。",
			"发送页面可能显示在该服务注册的姓名，可能与此处的运营者名称不同。",
			"KakaoPay 和 PayPal 是各公司的商标，与本服务没有合作关系。",
		],
		detail: "赠与说明全文",
		contact: "联系",
	},
};

function formatAmount(amount: number): string {
	return amount.toLocaleString("en-US");
}

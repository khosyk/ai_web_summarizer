import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
	ArrowRight,
	HelpCircle,
	KeyRound,
	PanelRight,
	Puzzle,
	Settings,
	X,
	ZoomIn,
} from "lucide-react";
import { LanguagePicker } from "./components/LanguagePicker";
import { detectServiceLang } from "./detectServiceLang";
import { LEGAL_LINK, PRIVACY_DETAIL, type ServiceLang } from "./privacyNotice";
import { openLegalPage } from "./openLegalPage";
import { QnaAccordion } from "./components/QnaAccordion";
import { getQnaCopy, QNA_SECTION_ID } from "./qnaContent";
import {
	getUiLanguage,
	setUiLanguage,
	UI_LANGUAGE_STORAGE_KEY,
} from "./uiLanguageStorage";
import { isServiceLang, LANGUAGE_SECTION_ID } from "./supportedLanguages";
import { PRODUCT_DISPLAY_NAME } from "./productBrand";
import "./index.css";

const API_KEY_URL = "https://aistudio.google.com/apikey";

type GuideStep = {
	title: string;
	caption: string;
	image: string;
};

type WelcomeCopy = {
	languageLabel: string;
	welcome: string;
	subtitleHook: string;
	subtitleSetup: string;
	subtitleBenefit: string;
	subtitleFootnote: string;
	setupLabel: string;
	footer: string;
	step0Title: string;
	step0Desc: string;
	step0Btn: string;
	step0Pin1: string;
	step0Pin2: string;
	step0Pin3: string;
	step1Title: string;
	step1Desc: string;
	step1Btn: string;
	step2Title: string;
	step2Desc: string;
	step2Btn: string;
	step2Figcaption: string;
	step2Image: string;
	step3Title: string;
	step3Desc: string;
	stepQnaTitle: string;
	stepQnaDesc: string;
	qnaFabLabel: string;
	qnaTooltip: string;
	imageZoomHint: string;
	guideSteps: GuideStep[];
};

type LightboxTarget = { src: string; alt: string };

const TRANSLATIONS: Record<ServiceLang, WelcomeCopy> = {
	English: {
		languageLabel: "Language",
		welcome: "Welcome",
		subtitleHook: "Too many tabs—not sure what to read first?",
		subtitleSetup:
			"Open the side panel and set up your Gemini API key just once.",
		subtitleBenefit: "Find what matters fast and close the tabs you can skip.",
		subtitleFootnote: "*Your API key is never sent outside your browser.",
		setupLabel: "Setup · 5 steps",
		footer:
			"You can close this tab after setup. Reopen Settings anytime from the side panel.",
		step0Title: "1. Open the side panel",
		step0Desc:
			"Web Summary runs in Chrome’s side panel, not in this tab. Pin the extension, then open the panel.",
		step0Btn: "Open side panel now",
		step0Pin1: "Click the puzzle icon (Extensions) in the toolbar.",
		step0Pin2: `Pin “${PRODUCT_DISPLAY_NAME}” — it is first in the A–Z list.`,
		step0Pin3:
			"Click the pinned icon to open the side panel (or use the button above).",
		step1Title: "2. Get a Gemini API key",
		step1Desc: "Create a free key at Google AI Studio.",
		step1Btn: "Open API key page →",
		step2Title: "3. Save your key in Settings",
		step2Desc:
			"Open extension Settings (Options), paste your key, and tap Save.",
		step2Btn: "Open Settings",
		step2Figcaption:
			"Paste the copied key, tap Save, then return to the side panel.",
		step2Image: "guide-step-4-paste-settings.png",
		step3Title: "4. Summarize any article tab",
		step3Desc:
			"With the side panel open, go to an http(s) article tab and tap Summarize this tab. You will see read or skip, three lines, and a full summary.",
		stepQnaTitle: "5. Q&A",
		stepQnaDesc:
			"Common questions about API keys, free tier limits, privacy, and errors. Tap a question to expand.",
		qnaFabLabel: "Scroll to Q&A",
		qnaTooltip: "Having trouble?",
		imageZoomHint: "Click image to enlarge",
		guideSteps: [
			{
				title: "Click Create API key",
				caption:
					"Open Google AI Studio → API Key, then click Create API key (top right).",
				image: "guide-step-1-api-page.png",
			},
			{
				title: "Confirm key creation",
				caption: "Name your key, pick a project, then confirm to generate it.",
				image: "guide-step-2-create-key.png",
			},
			{
				title: "Copy the key",
				caption:
					"Copy the full key. Do not share screenshots with the key visible.",
				image: "guide-step-3-copy-key.png",
			},
		],
	},
	Korean: {
		languageLabel: "언어",
		welcome: "환영합니다",
		subtitleHook: "탭이 너무 많아 무엇부터 읽어야 할지 모르겠나요?",
		subtitleSetup: "사이드패널을 열고 Gemini API 키를 한 번만 설정하세요.",
		subtitleBenefit:
			"중요한 글은 빠르게 찾고, 불필요한 탭은 바로 걸러낼 수 있습니다.",
		subtitleFootnote: "*API 키는 브라우저 밖으로 전송되지 않습니다.",
		setupLabel: "설정 · 5단계",
		footer:
			"설정 후 이 탭을 닫아도 됩니다. 사이드패널에서 언제든 설정을 다시 열 수 있습니다.",
		step0Title: "1. 사이드패널 열기",
		step0Desc:
			"Web Summary는 이 탭이 아니라 Chrome 사이드패널에서 실행됩니다. 확장을 고정한 뒤 패널을 여세요.",
		step0Btn: "지금 사이드패널 열기",
		step0Pin1: "도구 모음의 퍼즐 아이콘(확장 프로그램)을 클릭하세요.",
		step0Pin2: `「${PRODUCT_DISPLAY_NAME}」을 고정하세요 — A–Z 목록에서 맨 위입니다.`,
		step0Pin3: "고정한 아이콘을 클릭해 사이드패널을 열거나(또는 위 버튼 사용).",
		step1Title: "2. Gemini API 키 받기",
		step1Desc: "Google AI Studio에서 무료 키를 만드세요.",
		step1Btn: "API 키 페이지 열기 →",
		step2Title: "3. 설정에 키 저장",
		step2Desc: "확장 설정(Options)을 열고 키를 붙여넣은 뒤 저장을 누르세요.",
		step2Btn: "설정 열기",
		step2Figcaption:
			"복사한 키를 붙여넣고 Save를 누른 뒤 사이드패널로 돌아가세요.",
		step2Image: "guide-step-4-paste-settings.png",
		step3Title: "4. 기사 탭 요약하기",
		step3Desc:
			"사이드패널을 연 채 http(s) 기사 탭으로 이동해 Summarize this tab을 누르세요. 읽기/건너뛰기, 세 줄, 전체 요약이 표시됩니다.",
		stepQnaTitle: "5. Q&A",
		stepQnaDesc:
			"API 키, 무료 한도, 개인정보, 오류에 대한 자주 묻는 질문. 질문을 눌러 펼치세요.",
		qnaFabLabel: "Q&A로 이동",
		qnaTooltip: "문제가 있나요?",
		imageZoomHint: "이미지를 클릭해 확대",
		guideSteps: [
			{
				title: "Create API key 클릭",
				caption:
					"Google AI Studio → API Key에서 오른쪽 위 Create API key를 클릭하세요.",
				image: "guide-step-1-api-page.png",
			},
			{
				title: "키 생성 확인",
				caption: "키 이름과 프로젝트를 선택한 뒤 생성을 확인하세요.",
				image: "guide-step-2-create-key.png",
			},
			{
				title: "키 복사",
				caption:
					"전체 키를 복사하세요. 키가 보이는 스크린샷은 공유하지 마세요.",
				image: "guide-step-3-copy-key.png",
			},
		],
	},
	Chinese: {
		languageLabel: "语言",
		welcome: "欢迎",
		subtitleHook: "标签太多，不知道该先读哪一篇？",
		subtitleSetup: "打开侧边栏，只需设置一次 Gemini API 密钥。",
		subtitleBenefit: "快速找到值得读的文章，立刻筛掉不必要的标签页。",
		subtitleFootnote: "*API 密钥不会发送到浏览器之外。",
		setupLabel: "设置 · 5 步",
		footer: "设置完成后可关闭此标签。随时可从侧边栏打开设置。",
		step0Title: "1. 打开侧边栏",
		step0Desc:
			"Web Summary 在 Chrome 侧边栏运行，而非本标签页。请先固定扩展，再打开侧边栏。",
		step0Btn: "立即打开侧边栏",
		step0Pin1: "点击工具栏中的拼图图标（扩展程序）。",
		step0Pin2: `固定「${PRODUCT_DISPLAY_NAME}」——在 A–Z 列表中排在最前。`,
		step0Pin3: "点击固定后的图标打开侧边栏（或使用上方按钮）。",
		step1Title: "2. 获取 Gemini API 密钥",
		step1Desc: "在 Google AI Studio 创建免费密钥。",
		step1Btn: "打开 API 密钥页面 →",
		step2Title: "3. 在设置中保存密钥",
		step2Desc: "打开扩展设置（Options），粘贴密钥并点击保存。",
		step2Btn: "打开设置",
		step2Figcaption: "粘贴复制的密钥，点击 Save，然后返回侧边栏。",
		step2Image: "guide-step-4-paste-settings.png",
		step3Title: "4. 摘要任意文章标签页",
		step3Desc:
			"保持侧边栏打开，切换到 http(s) 文章页，点击「摘要当前标签」。将看到读/跳过判断、三行摘要与全文摘要。",
		stepQnaTitle: "5. 常见问题",
		stepQnaDesc:
			"关于 API 密钥、免费额度、隐私与报错的常见问题。点击问题展开答案。",
		qnaFabLabel: "跳转到常见问题",
		qnaTooltip: "遇到问题？",
		imageZoomHint: "点击图片放大查看",
		guideSteps: [
			{
				title: "点击 Create API key",
				caption: "打开 Google AI Studio → API Key，点击右上角 Create API key。",
				image: "guide-step-1-api-page.png",
			},
			{
				title: "确认创建密钥",
				caption: "命名密钥、选择项目，然后确认生成。",
				image: "guide-step-2-create-key.png",
			},
			{
				title: "复制密钥",
				caption: "复制完整密钥。请勿分享显示密钥的截图。",
				image: "guide-step-3-copy-key.png",
			},
		],
	},
};

function detectLang(): ServiceLang {
	return detectServiceLang();
}

function welcomeAsset(filename: string): string {
	if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
		return chrome.runtime.getURL(`welcome/${filename}`);
	}
	return `/welcome/${filename}`;
}

function openSidePanel() {
	if (typeof chrome === "undefined" || !chrome.sidePanel?.open) return;
	chrome.windows.getCurrent((win) => {
		if (win?.id !== undefined) {
			void chrome.sidePanel.open({ windowId: win.id });
		}
	});
}

function openApiKeyGuide() {
	if (typeof chrome !== "undefined" && chrome.tabs?.create) {
		void chrome.tabs.create({ url: API_KEY_URL });
		return;
	}
	window.open(API_KEY_URL, "_blank", "noopener,noreferrer");
}

function openSettings() {
	if (typeof chrome !== "undefined" && chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	}
}

// 가이드 이미지 라이트박스
function ImageLightbox({
	target,
	onClose,
}: {
	target: LightboxTarget;
	onClose: () => void;
}) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-[2px]"
			role="dialog"
			aria-modal="true"
			aria-label={target.alt}
			onClick={onClose}
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
				aria-label="Close"
			>
				<X size={22} />
			</button>
			<img
				src={target.src}
				alt={target.alt}
				className="max-h-[90vh] max-w-[min(96vw,900px)] rounded-lg object-contain shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	);
}

function GuideImageThumb({
	image,
	alt,
	zoomHint,
	onOpen,
}: {
	image: string;
	alt: string;
	zoomHint: string;
	onOpen: () => void;
}) {
	const src = welcomeAsset(image);
	return (
		<button
			type="button"
			onClick={onOpen}
			className="group relative mx-auto block w-full max-w-lg cursor-zoom-in"
			aria-label={`${alt} — ${zoomHint}`}
		>
			<img
				src={src}
				alt={alt}
				className="mx-auto h-48 w-full object-contain"
				loading="lazy"
			/>
			<span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-slate-900/65 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
				<ZoomIn size={10} />
				{zoomHint}
			</span>
		</button>
	);
}

function GuideImageCard({
	step,
	index,
	zoomHint,
	onOpenImage,
}: {
	step: GuideStep;
	index: number;
	zoomHint: string;
	onOpenImage: (target: LightboxTarget) => void;
}) {
	const alt = `${step.title} — step ${index + 1}`;
	return (
		<figure className="space-y-2">
			<GuideImageThumb
				image={step.image}
				alt={alt}
				zoomHint={zoomHint}
				onOpen={() => onOpenImage({ src: welcomeAsset(step.image), alt })}
			/>
			<figcaption className="space-y-0.5">
				<p className="text-[12px] font-black text-slate-800">
					{index + 1}. {step.title}
				</p>
				<p className="text-[11px] leading-relaxed text-slate-500">
					{step.caption}
				</p>
			</figcaption>
		</figure>
	);
}

function WelcomePage() {
	const [language, setLanguage] = useState<ServiceLang>(detectLang);
	const [lightbox, setLightbox] = useState<LightboxTarget | null>(null);
	const T = TRANSLATIONS[language];
	const qna = getQnaCopy(language);

	useEffect(() => {
		void getUiLanguage().then(setLanguage);
	}, []);

	useEffect(() => {
		if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return;

		const onStorageChanged = (
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) => {
			if (areaName !== "local") return;
			if (UI_LANGUAGE_STORAGE_KEY in changes) {
				const next = changes[UI_LANGUAGE_STORAGE_KEY].newValue;
				if (isServiceLang(next)) setLanguage(next);
			}
		};

		chrome.storage.onChanged.addListener(onStorageChanged);
		return () => chrome.storage.onChanged.removeListener(onStorageChanged);
	}, []);

	useEffect(() => {
		const hash = window.location.hash.slice(1);
		if (hash !== QNA_SECTION_ID && hash !== LANGUAGE_SECTION_ID) return;
		const el = document.getElementById(hash);
		el?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	const handleLanguageChange = (next: ServiceLang) => {
		setLanguage(next);
		void setUiLanguage(next);
	};

	const scrollToQna = () => {
		const el = document.getElementById(QNA_SECTION_ID);
		el?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className="relative min-h-screen bg-slate-50 p-8 pb-28 font-sans text-slate-800">
			{lightbox ? (
				<ImageLightbox target={lightbox} onClose={() => setLightbox(null)} />
			) : null}
			<div className="mx-auto max-w-2xl space-y-8">
				<header className="space-y-3">
					<section id={LANGUAGE_SECTION_ID} className="scroll-mt-6 max-w-xs">
						<LanguagePicker
							value={language}
							onChange={handleLanguageChange}
							label={T.languageLabel}
						/>
					</section>
					<p className="text-xs font-black uppercase tracking-widest text-indigo-600">
						{T.welcome}
					</p>
					<h1 className="text-3xl font-black tracking-tight text-slate-900">
						{PRODUCT_DISPLAY_NAME}
					</h1>
					<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
						{T.setupLabel}
					</p>
					<div className="space-y-2">
						<p className="text-base font-bold leading-snug text-slate-800">
							{T.subtitleHook}
						</p>
						<p className="text-sm leading-relaxed text-slate-600">
							{T.subtitleSetup}
						</p>
						<p className="text-sm leading-relaxed text-slate-600">
							{T.subtitleBenefit}
						</p>
						<p className="text-[10px] leading-relaxed text-slate-400">
							{T.subtitleFootnote}
						</p>
					</div>
				</header>

				<ol className="space-y-6">
					<li className="rounded-2xl border-2 border-indigo-300 bg-white p-5 shadow-md shadow-indigo-100">
						<div className="mb-4 flex gap-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
								<PanelRight size={20} />
							</div>
							<div className="space-y-2">
								<p className="text-sm font-black text-slate-900">
									{T.step0Title}
								</p>
								<p className="text-xs leading-relaxed text-slate-500">
									{T.step0Desc}
								</p>
								<button
									type="button"
									onClick={openSidePanel}
									className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700"
								>
									{T.step0Btn}
									<ArrowRight size={14} />
								</button>
							</div>
						</div>
						<ol className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-[11px] leading-relaxed text-slate-700">
							<li className="flex gap-2">
								<Puzzle
									size={14}
									className="mt-0.5 shrink-0 text-indigo-600"
									aria-hidden
								/>
								<span>{T.step0Pin1}</span>
							</li>
							<li className="flex gap-2">
								<span className="font-black text-indigo-600">A</span>
								<span>{T.step0Pin2}</span>
							</li>
							<li className="flex gap-2">
								<PanelRight
									size={14}
									className="mt-0.5 shrink-0 text-indigo-600"
									aria-hidden
								/>
								<span>{T.step0Pin3}</span>
							</li>
						</ol>
					</li>

					<li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<div className="mb-4 flex gap-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
								<KeyRound size={20} />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-black text-slate-900">
									{T.step1Title}
								</p>
								<p className="text-xs text-slate-500">{T.step1Desc}</p>
								<button
									type="button"
									onClick={openApiKeyGuide}
									className="text-xs font-black text-indigo-600 underline"
								>
									{T.step1Btn}
								</button>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-1">
							{T.guideSteps.map((step, idx) => (
								<div key={step.image}>
									<GuideImageCard
										step={step}
										index={idx}
										zoomHint={T.imageZoomHint}
										onOpenImage={setLightbox}
									/>
								</div>
							))}
						</div>
					</li>

					<li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<div className="mb-4 flex gap-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
								<Settings size={20} />
							</div>
							<div className="space-y-2">
								<p className="text-sm font-black text-slate-900">
									{T.step2Title}
								</p>
								<p className="text-xs text-slate-500">{T.step2Desc}</p>
								<button
									type="button"
									onClick={openSettings}
									className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
								>
									{T.step2Btn}
									<ArrowRight size={14} />
								</button>
							</div>
						</div>

						<figure className="space-y-2">
							<GuideImageThumb
								image={T.step2Image}
								alt={T.step2Figcaption}
								zoomHint={T.imageZoomHint}
								onOpen={() =>
									setLightbox({
										src: welcomeAsset(T.step2Image),
										alt: T.step2Figcaption,
									})
								}
							/>
							<figcaption className="text-[11px] leading-relaxed text-slate-500">
								{T.step2Figcaption}
							</figcaption>
						</figure>
					</li>

					<li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
							<PanelRight size={20} />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-black text-slate-900">
								{T.step3Title}
							</p>
							<p className="text-xs leading-relaxed text-slate-500">
								{T.step3Desc}
							</p>
						</div>
					</li>

					<li
						id={QNA_SECTION_ID}
						className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
					>
						<div className="mb-4 flex gap-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
								<HelpCircle size={20} />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-black text-slate-900">
									{T.stepQnaTitle}
								</p>
								<p className="text-xs leading-relaxed text-slate-500">
									{T.stepQnaDesc}
								</p>
							</div>
						</div>
						<QnaAccordion items={qna.items} />
					</li>
				</ol>

				<p className="text-center text-[11px] leading-relaxed text-slate-400">
					{T.footer}
				</p>

				<footer className="space-y-2 border-t border-slate-200 pt-6">
					<p className="text-[11px] leading-relaxed text-slate-500">
						{PRIVACY_DETAIL[language]}
					</p>
					<button
						type="button"
						onClick={openLegalPage}
						className="text-[11px] font-black text-indigo-600 underline hover:text-indigo-700"
					>
						{LEGAL_LINK[language]}
					</button>
				</footer>
			</div>

			<div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-1.5">
				<span
					className="pointer-events-none whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg"
					role="tooltip"
				>
					{T.qnaTooltip}
				</span>
				<button
					type="button"
					onClick={scrollToQna}
					aria-label={T.qnaFabLabel}
					className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 ring-2 ring-white transition hover:bg-indigo-700 active:scale-95"
				>
					<HelpCircle size={24} strokeWidth={2.25} aria-hidden />
				</button>
			</div>
		</div>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<WelcomePage />
	</StrictMode>,
);

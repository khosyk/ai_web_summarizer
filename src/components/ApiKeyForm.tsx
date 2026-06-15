import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '../apiKeyStorage';
import type { ServiceLang } from '../privacyNotice';

type FormCopy = {
  keyPrivateLead: string;
  keyPrivateBody: string;
  keyLabel: string;
  keySaved: string;
  saveBtn: string;
  showKey: string;
  hideKey: string;
  errEmpty: string;
  saved: string;
};

const TRANSLATIONS: Record<ServiceLang, FormCopy> = {
  English: {
    keyPrivateLead: 'Keep your key private.',
    keyPrivateBody:
      'Anyone with this key can use your Gemini quota. Use Show only on a trusted device.',
    keyLabel: 'Gemini API key',
    keySaved: 'A key is saved — edit below to replace it.',
    saveBtn: 'Save',
    showKey: 'Show API key',
    hideKey: 'Hide API key',
    errEmpty: 'Enter your Gemini API key.',
    saved: 'Saved. You can close this tab.',
  },
  Chinese: {
    keyPrivateLead: '请妥善保管密钥。',
    keyPrivateBody: '持有此密钥的人可使用您的 Gemini 配额。仅在可信设备上使用「显示」。',
    keyLabel: 'Gemini API 密钥',
    keySaved: '已保存密钥 — 可在下方修改或更换。',
    saveBtn: '保存',
    showKey: '显示 API 密钥',
    hideKey: '隐藏 API 密钥',
    errEmpty: '请输入 Gemini API 密钥。',
    saved: '已保存。可以关闭此标签。',
  },
};

interface Props {
  language: ServiceLang;
}

/** Gemini API 키 입력·저장 (Chrome 확장 Options) */
export function ApiKeyForm({ language }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const T = TRANSLATIONS[language];

  useEffect(() => {
    void getGeminiApiKey().then((k) => {
      if (k) {
        setApiKey(k);
        setHasSavedKey(true);
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatus(T.errEmpty);
      return;
    }
    await setGeminiApiKey(trimmed);
    setHasSavedKey(true);
    setStatus(T.saved);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
        <strong className="font-black">{T.keyPrivateLead}</strong> {T.keyPrivateBody}
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {T.keyLabel}
        </span>
        {hasSavedKey ? (
          <p className="text-xs font-semibold text-emerald-600">{T.keySaved}</p>
        ) : null}
        <div className="relative">
          <input
            type={isKeyVisible ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API key"
            className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-11 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setIsKeyVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={isKeyVisible ? T.hideKey : T.showKey}
            title={isKeyVisible ? T.hideKey : T.showKey}
          >
            {isKeyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      <button
        type="button"
        onClick={() => void handleSave()}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700"
      >
        {T.saveBtn}
      </button>

      {status ? (
        <p
          className={`text-center text-sm font-medium ${
            status === T.saved ? 'text-emerald-600' : 'text-amber-700'
          }`}
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ServiceLang } from '../privacyNotice';
import {
  addAutoSummarizeBlockedHost,
  AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY,
  getAutoSummarizeBlockedHosts,
  parseBlockedHostInput,
  removeAutoSummarizeBlockedHost,
} from '../autoSummarizeBlocklist';

type BlocklistCopy = {
  title: string;
  description: string;
  empty: string;
  inputLabel: string;
  inputPlaceholder: string;
  addBtn: string;
  removeBtn: string;
  invalidHost: string;
  duplicateHost: string;
};

const TRANSLATIONS: Record<ServiceLang, BlocklistCopy> = {
  English: {
    title: 'Sites excluded from Auto',
    description:
      'Auto summarize will not run on these domains. Manual summarize is still available when Auto is off.',
    empty: 'No sites excluded yet.',
    inputLabel: 'Add domain',
    inputPlaceholder: 'example.com',
    addBtn: 'Add',
    removeBtn: 'Remove',
    invalidHost: 'Enter a valid domain (e.g. news.example.com).',
    duplicateHost: 'That domain is already on the list.',
  },
  Korean: {
    title: 'Auto 요약 제외 사이트',
    description:
      '아래 도메인에서는 Auto 요약이 실행되지 않습니다. Auto OFF 시 수동 요약은 가능합니다.',
    empty: '제외된 사이트가 없습니다.',
    inputLabel: '도메인 추가',
    inputPlaceholder: 'example.com',
    addBtn: '추가',
    removeBtn: '삭제',
    invalidHost: '올바른 도메인을 입력하세요 (예: news.example.com).',
    duplicateHost: '이미 목록에 있는 도메인입니다.',
  },
  Chinese: {
    title: 'Auto 摘要排除站点',
    description: '以下域名不会触发 Auto 摘要。关闭 Auto 后仍可手动摘要。',
    empty: '暂无排除站点。',
    inputLabel: '添加域名',
    inputPlaceholder: 'example.com',
    addBtn: '添加',
    removeBtn: '删除',
    invalidHost: '请输入有效域名（如 news.example.com）。',
    duplicateHost: '该域名已在列表中。',
  },
};

interface Props {
  language: ServiceLang;
}

/** Auto 요약 제외 도메인 목록 (Settings) */
export function AutoBlocklistForm({ language }: Props) {
  const T = TRANSLATIONS[language];
  const [hosts, setHosts] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');

  const refresh = useCallback(() => {
    void getAutoSummarizeBlockedHosts().then(setHosts);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return;
      if (AUTO_SUMMARIZE_BLOCKED_HOSTS_KEY in changes) {
        refresh();
      }
    };

    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [refresh]);

  const handleAdd = async () => {
    const parsed = parseBlockedHostInput(draft);
    if (!parsed) {
      setStatus(T.invalidHost);
      return;
    }
    if (hosts.includes(parsed)) {
      setStatus(T.duplicateHost);
      return;
    }
    const next = await addAutoSummarizeBlockedHost(parsed);
    setHosts(next);
    setDraft('');
    setStatus('');
  };

  const handleRemove = async (host: string) => {
    const next = await removeAutoSummarizeBlockedHost(host);
    setHosts(next);
    setStatus('');
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
      <div>
        <h2 className="text-sm font-black text-slate-900">{T.title}</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{T.description}</p>
      </div>

      {hosts.length === 0 ? (
        <p className="text-[11px] text-slate-400">{T.empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {hosts.map((host) => (
            <li
              key={host}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
            >
              <span className="min-w-0 truncate text-xs font-semibold text-slate-700">
                {host}
              </span>
              <button
                type="button"
                onClick={() => void handleRemove(host)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50"
                aria-label={`${T.removeBtn} ${host}`}
              >
                <Trash2 size={12} />
                {T.removeBtn}
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="block space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {T.inputLabel}
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={T.inputPlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd();
            }}
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black text-white hover:bg-indigo-700"
          >
            <Plus size={12} />
            {T.addBtn}
          </button>
        </div>
      </label>

      {status ? (
        <p className="text-[11px] font-medium text-amber-700">{status}</p>
      ) : null}
    </section>
  );
}

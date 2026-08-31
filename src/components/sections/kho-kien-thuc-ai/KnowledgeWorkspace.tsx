"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { ApiError, mediaUrl } from "@/lib/api";
import { knowledge, type KnowledgeDoc, type ReadingType } from "@/lib/endpoints";

const TABS: { id: ReadingType; label: string; icon: string }[] = [
  { id: "chi-tay", label: "Kiến thức Chỉ tay", icon: "pan_tool" },
  { id: "not-ruoi", label: "Kiến thức Nốt ruồi", icon: "face_retouching_natural" },
];

const PLACEHOLDER: Record<ReadingType, string> = {
  "chi-tay": "Nhập tri thức luận giải Chỉ tay (Đường gia đình, Đường tình duyên, Đường công danh sự nghiệp, nguyên tố bàn tay…) để bổ sung ngữ cảnh cho Gemini…",
  "not-ruoi": "Nhập tri thức luận giải Nốt ruồi theo cung vị trên mặt (tài bạch, sự nghiệp, tình duyên…)…",
};

const ACCEPT = ".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif";

/** Nếu chuỗi là JSON thì in đẹp (thụt lề) cho dễ đọc; không phải JSON thì giữ nguyên. */
function prettyText(s: string): string {
  const t = s.trim();
  if ((t.startsWith("{") || t.startsWith("[")) && t.length < 200_000) {
    try {
      return JSON.stringify(JSON.parse(t), null, 2);
    } catch {
      /* không phải JSON hợp lệ */
    }
  }
  return s;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Không đọc được tệp."));
    r.readAsDataURL(file);
  });
}

export default function KnowledgeWorkspace() {
  const [tab, setTab] = useState<ReadingType>("chi-tay");
  const [docs, setDocs] = useState<KnowledgeDoc[] | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modalDoc, setModalDoc] = useState<KnowledgeDoc | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await knowledge.list(tab);
      setDocs(res.documents);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách tài liệu.");
      setDocs([]);
    }
  }, [tab]);

  useEffect(() => {
    setDocs(null);
    load();
  }, [load]);

  useEffect(() => {
    if (!docs?.some((d) => d.status === "processing")) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [docs, load]);

  const saveText = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await knowledge.addText(tab, text.trim(), name.trim() || undefined);
      setText("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lưu thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await knowledge.addFile(tab, file.name, await fileToDataUrl(file), fileNote.trim() || undefined);
      setFileNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải tệp thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc: KnowledgeDoc) => {
    if (!confirm(`Xóa "${doc.name}"? Không thể hoàn tác.`)) return;
    setDocs((prev) => prev?.filter((d) => d.id !== doc.id) ?? null);
    try {
      await knowledge.remove(doc.id);
    } catch {
      load();
    }
  };

  const openModal = async (doc: KnowledgeDoc, mode: "view" | "edit") => {
    setModalMode(mode);
    setModalDoc(doc); // hiện ngay với dữ liệu list
    try {
      const full = await knowledge.get(doc.id); // rồi nạp text đầy đủ
      setModalDoc(full.document);
    } catch {
      /* dùng dữ liệu list */
    }
  };

  const filtered = (docs ?? []).filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="mb-gutter flex gap-2 border-b border-white/10">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 font-label-caps text-label-caps transition-colors duration-300 sm:px-6 ${
                active ? "border-gold text-gold" : "border-transparent text-on-surface-variant hover:text-white"
              }`}
            >
              <Icon name={t.icon} className="text-[18px]" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.id === "chi-tay" ? "Chỉ tay" : "Nốt ruồi"}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/10 px-4 py-3 text-sm text-error">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}

      <section className="mb-section-gap grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-3 lg:col-span-5">
        <textarea
          value={fileNote}
          onChange={(e) => setFileNote(e.target.value)}
          spellCheck={false}
          rows={4}
          placeholder="Chú thích cho tệp sắp tải (tùy chọn) — ảnh kèm chú thích sẽ được AI xem khi luận giải. Có thể dán bảng/JSON nhiều dòng."
          className="min-h-[92px] w-full resize-y whitespace-pre-wrap rounded-lg border border-white/10 bg-surface-container-low px-4 py-2.5 font-body-md text-[13px] leading-relaxed text-on-surface outline-none transition-colors focus:border-gold/60 placeholder:text-on-surface-variant/30"
        />
        <div
          onClick={() => !busy && fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void uploadFile(e.dataTransfer.files?.[0]);
          }}
          className="group relative flex min-h-[300px] flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low p-8 transition-colors duration-500 hover:border-gold/40"
        >
          <div className="pointer-events-none absolute inset-0 bg-gold/5 opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
          <div className="relative flex h-40 w-40 flex-col items-center justify-center rounded-full border border-dashed border-gold/20 transition-colors group-hover:border-gold/50 sm:h-52 sm:w-52">
            <span className="absolute inset-0 rounded-full border border-gold/5 motion-safe:animate-slow-spin" />
            <Icon name={busy ? "progress_activity" : "cloud_upload"} className={`mb-3 text-4xl text-gold/70 group-hover:text-gold ${busy ? "animate-spin" : ""}`} />
            <span className="px-6 text-center font-label-caps text-label-caps text-on-surface-variant">
              Kéo thả tài liệu
              <br />
              <span className="text-xs opacity-50">PDF, Docx, Text, Ảnh</span>
            </span>
          </div>
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => void uploadFile(e.target.files?.[0])} />
        </div>
        </div>

        <div className="col-span-12 flex flex-col rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8 lg:col-span-7">
          <div className="mb-4 flex items-center gap-3">
            <Icon name="edit_note" className="text-white/70" />
            <h2 className="font-headline-md text-headline-md text-white">Nhập liệu trực tiếp</h2>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tiêu đề ghi chú (tùy chọn)"
            className="mb-3 w-full border-0 border-b border-white/10 bg-transparent pb-2 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-gold placeholder:text-on-surface-variant/30"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER[tab]}
            spellCheck={false}
            className="min-h-[440px] flex-1 resize-y whitespace-pre-wrap rounded-lg border border-white/10 bg-surface-container/50 p-4 font-body-md text-[15px] leading-relaxed text-on-surface outline-none transition-colors focus:border-gold/60 placeholder:text-on-surface-variant/30"
          />
          <p className="mt-2 flex items-center gap-1.5 font-body-md text-[11px] text-outline">
            <Icon name="format_align_left" className="text-[13px]" />
            Xuống dòng, cách dòng, gạch đầu dòng đều được giữ nguyên — AI đọc theo đúng bố cục bạn nhập. Kéo góc dưới để mở rộng ô.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={saveText}
              disabled={busy || !text.trim()}
              className="press rounded-sm border border-gold/50 px-6 py-2 font-label-caps text-label-caps text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
            >
              {busy ? "Đang lưu…" : "Lưu vào kho kiến thức"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-3 font-headline-md text-headline-md text-white">
            <Icon name="library_books" className="text-[20px] text-white/50" />
            Tài liệu hiện tại
          </h2>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tài liệu…"
              className="w-full border-0 border-b border-white/10 bg-transparent py-2 pl-10 pr-4 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-gold placeholder:text-on-surface-variant/30 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 font-label-caps text-label-caps text-on-surface-variant">
                <th className="px-4 py-4 font-normal">Tên tài liệu</th>
                <th className="px-4 py-4 font-normal">Loại</th>
                <th className="px-4 py-4 font-normal">Cập nhật</th>
                <th className="px-4 py-4 text-right font-normal">Dung lượng</th>
                <th className="px-4 py-4 text-center font-normal">Ngữ cảnh AI</th>
                <th className="w-32 px-4 py-4 text-right font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface">
              {docs === null &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="skeleton h-8 w-full rounded" />
                    </td>
                  </tr>
                ))}
              {docs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                    Chưa có tài liệu nào cho mục này.
                  </td>
                </tr>
              )}
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-white/5 transition-colors hover:bg-surface-variant/20">
                  <td className="max-w-[280px] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Icon name={doc.icon} className="shrink-0 text-[20px] text-gold/50" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">{doc.type}</td>
                  <td className="px-4 py-4 font-data-mono text-[12px] text-on-surface-variant">{doc.updatedAt}</td>
                  <td className="px-4 py-4 text-right font-data-mono text-[12px] text-on-surface-variant">{doc.size}</td>
                  <td className="px-4 py-4 text-center">
                    {doc.status === "processing" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-variant px-2.5 py-1 font-label-caps text-[10px] text-on-surface-variant">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold/50" /> Đang xử lý
                      </span>
                    ) : doc.hasText || doc.type === "Image" ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 px-2.5 py-1 font-label-caps text-[10px] text-gold"
                        title={
                          doc.type === "Image"
                            ? "Ảnh được gửi cho AI khi luận giải (kèm chú thích nếu có)"
                            : "Nội dung được đưa vào ngữ cảnh Gemini"
                        }
                      >
                        <Icon name="auto_awesome" className="text-[11px]" /> Có
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-label-caps text-[10px] text-outline" title="Chỉ lưu trữ, không nạp vào AI">
                        Lưu trữ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openModal(doc, "view")}
                        title="Xem"
                        className="press rounded p-1.5 text-on-surface-variant transition-colors hover:text-gold"
                      >
                        <Icon name="visibility" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(doc, "edit")}
                        title="Sửa"
                        className="press rounded p-1.5 text-on-surface-variant transition-colors hover:text-gold"
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      {doc.fileUrl && (
                        <a
                          href={mediaUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Tải về / mở tệp"
                          className="press rounded p-1.5 text-on-surface-variant transition-colors hover:text-gold"
                        >
                          <Icon name="download" className="text-[18px]" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(doc)}
                        title="Xóa"
                        className="press rounded p-1.5 text-on-surface-variant transition-colors hover:text-error"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalDoc && (
        <DocModal
          doc={modalDoc}
          mode={modalMode}
          onClose={() => setModalDoc(null)}
          onSaved={async () => {
            setModalDoc(null);
            await load();
          }}
        />
      )}
    </>
  );
}

// ── Modal xem / sửa ─────────────────────────────────────────────────────────

function DocModal({
  doc,
  mode,
  onClose,
  onSaved,
}: {
  doc: KnowledgeDoc;
  mode: "view" | "edit";
  onClose: () => void;
  onSaved: () => void;
}) {
  const editable = doc.source === "inline" || doc.type === "Text" || doc.type === "Image";
  const isImage = doc.type === "Image";
  const [name, setName] = useState(doc.name);
  const [category, setCategory] = useState<ReadingType>(doc.category);
  const [text, setText] = useState(doc.text ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isEdit = mode === "edit";

  useEffect(() => {
    setName(doc.name);
    setCategory(doc.category);
    setText(doc.text ?? "");
  }, [doc]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const patch: { name?: string; text?: string; category?: ReadingType } = {};
      if (name.trim() && name.trim() !== doc.name) patch.name = name.trim();
      if (category !== doc.category) patch.category = category;
      if (editable && text !== (doc.text ?? "")) patch.text = text;
      if (Object.keys(patch).length) await knowledge.update(doc.id, patch);
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Lưu thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const fileUrl = mediaUrl(doc.fileUrl);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-sm" aria-label="Đóng" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low motion-safe:animate-scale-in">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Icon name={doc.icon} className="shrink-0 text-[20px] text-gold" />
            <div className="min-w-0">
              <p className="truncate font-headline-md text-[18px] text-white">{isEdit ? "Sửa tài liệu" : doc.name}</p>
              <p className="font-data-mono text-[11px] text-outline">
                {doc.type} · {doc.size} · cập nhật {doc.updatedAt}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="press rounded p-1 text-on-surface-variant hover:text-white">
            <Icon name="close" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isEdit ? (
            <div className="space-y-4">
              <label className="block">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Tên</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-surface-container px-4 py-2.5 font-body-md text-body-md text-white outline-none focus:border-gold/60"
                />
              </label>
              <label className="block">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Thuộc mục</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReadingType)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-surface-container px-4 py-2.5 font-body-md text-body-md text-white outline-none focus:border-gold/60"
                >
                  <option value="chi-tay">Kiến thức Chỉ tay</option>
                  <option value="not-ruoi">Kiến thức Nốt ruồi</option>
                </select>
              </label>
              {editable ? (
                <label className="block">
                  {isImage && fileUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl}
                      alt={doc.name}
                      className="mb-3 max-h-[36vh] rounded-lg border border-white/10"
                    />
                  )}
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    {isImage
                      ? "Chú thích cho ảnh (AI xem ảnh này kèm chú thích khi luận giải)"
                      : "Nội dung (đưa vào ngữ cảnh Gemini)"}
                  </span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                    className={`mt-1.5 w-full resize-y whitespace-pre-wrap rounded-lg border border-white/10 bg-surface-container px-4 py-3 leading-relaxed text-white outline-none focus:border-gold/60 ${
                      isImage
                        ? "min-h-[320px] font-data-mono text-[13px]"
                        : "min-h-[440px] font-body-md text-[15px]"
                    }`}
                  />
                  {isImage && (
                    <span className="mt-1 block font-body-md text-[11px] text-outline">
                      Giữ nguyên xuống dòng / thụt lề. Nếu là JSON, bấm “Định dạng lại” để in đẹp.
                    </span>
                  )}
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setText(prettyText(text))}
                      className="press mt-1.5 rounded border border-white/15 px-2.5 py-1 font-data-mono text-[11px] text-on-surface-variant hover:text-gold"
                    >
                      Định dạng lại (JSON)
                    </button>
                  )}
                </label>
              ) : (
                <p className="rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
                  Tệp {doc.type} — chỉ sửa được tên và mục. Muốn đổi nội dung: xóa rồi tải tệp mới.
                  {doc.hasText && " (Văn bản đã trích tự động được dùng cho AI.)"}
                </p>
              )}
            </div>
          ) : doc.type === "Image" && fileUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={doc.name} className="mx-auto max-h-[45vh] rounded-lg border border-white/10" />
              {doc.text ? (
                <div className="rounded-lg border border-gold/20 bg-gold/[0.04] p-3">
                  <span className="font-label-caps text-[10px] text-gold/70">Chú thích cho AI</span>
                  <pre className="mt-1.5 max-h-[38vh] overflow-auto whitespace-pre-wrap break-words font-data-mono text-[12px] leading-relaxed text-on-surface">
                    {prettyText(doc.text)}
                  </pre>
                </div>
              ) : (
                <p className="text-center text-xs text-outline">
                  Chưa có chú thích — bấm “Sửa” để thêm mô tả giúp AI hiểu ảnh này.
                </p>
              )}
            </div>
          ) : doc.type === "PDF" && fileUrl ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Icon name="picture_as_pdf" className="text-5xl text-gold/60" />
              <p className="font-body-md text-body-md text-on-surface-variant">Tệp PDF không xem trực tiếp ở đây.</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="press rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold"
              >
                Mở / Tải PDF
              </a>
            </div>
          ) : doc.text || doc.hasText ? (
            <pre className="max-h-[62vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-white/5 bg-surface-container/40 p-4 font-body-md text-[14px] leading-relaxed text-on-surface">
              {doc.text || "(đang tải nội dung…)"}
            </pre>
          ) : (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Icon name={doc.icon} className="text-5xl text-gold/60" />
              <p className="font-body-md text-body-md text-on-surface-variant">
                Tệp {doc.type} — mở bằng nút bên dưới.
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold"
                >
                  Mở / Tải tệp
                </a>
              )}
            </div>
          )}

          {err && <p className="mt-4 text-sm text-error">{err}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          {doc.fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant hover:text-gold"
            >
              <Icon name="download" className="text-[16px]" /> Tải về
            </a>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="press rounded-sm border border-white/20 px-5 py-2 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
            >
              Đóng
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="press rounded-sm bg-gold px-6 py-2 font-label-caps text-label-caps text-on-gold disabled:opacity-50"
              >
                {busy ? "Đang lưu…" : "Lưu"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import {
  Check,
  Flame,
  Star,
  ChevronDown,
  AlertCircle,
  Info,
  X,
  Zap,
  FileText,
  Shield,
  Beaker,
  AlertTriangle,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyContext";
import { useTranslation } from "@/i18n";

/*
  Replace these stubs with your actual imports:
  import type { Product } from '@/products';
  import { useCart } from '@/context/CartContext';
  import { getStorefrontPrice, ... } from '@/utils/pricing';
  import { formatDosageLabel, getDefaultStorefrontDosage } from '@/products';
*/
const formatDosageLabel = (mg, unit) => `${mg}${unit ?? "mg"}`;
const getStorefrontPrice = (o, e, p) => (e ? +(o * (1 - p / 100)).toFixed(2) : o);
const getStorefrontSavings = (o, e, p) => (e ? +(o * (p / 100)).toFixed(2) : 0);
const getBundleLabel = (q, t) => t('product.buyBundle', { qty: q });
const getStorefrontBundleUnitPrice = (o, e, m, b) => {
  const base = e ? o * (1 - m / 100) : o;
  return +(base * (1 - b / 100)).toFixed(2);
};
const getStorefrontBundleTotal = (o, q, e, m, b) =>
  +(getStorefrontBundleUnitPrice(o, e, m, b) * q).toFixed(2);
// Default variant shown on the card:
//   1. 5mg in-stock if available
//   2. otherwise the smallest in-stock dosage
//   3. otherwise the smallest overall dosage
const getDefaultStorefrontDosage = (p) => {
  const dosages = p.dosages ?? [];
  if (dosages.length === 0) return null;
  const toNum = (d) => {
    const n = typeof d.mg === "number" ? d.mg : parseFloat(String(d.mg));
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };
  const isMgUnit = (d) => (d.unit ?? "MG") === "MG";
  const fiveMg = dosages.find((d) => d.inStock && isMgUnit(d) && toNum(d) === 5);
  if (fiveMg) return fiveMg;
  const inStockSorted = dosages.filter((d) => d.inStock).sort((a, b) => toNum(a) - toNum(b));
  if (inStockSorted.length > 0) return inStockSorted[0];
  return [...dosages].sort((a, b) => toNum(a) - toNum(b))[0] ?? null;
};

export default function ProductCard({ product, discountSettings = {} }) {
  const { t } = useTranslation();
  const dosageToNum = (d) => {
    const n = typeof d?.mg === "number" ? d.mg : parseFloat(String(d?.mg));
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };
  const dosages = [...(product.dosages ?? [])].sort((a, b) => dosageToNum(a) - dosageToNum(b));
  const defaultDosage = getDefaultStorefrontDosage(product);
  const [sel, setSel] = useState(defaultDosage);
  const [adding, setAdding] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [imgOk, setImgOk] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistMsg, setWaitlistMsg] = useState("");
  const ddRef = useRef(null);
  const { addItem } = useCart();
  const { format } = useCurrency();

  const submitWaitlist = async (e) => {
    e?.preventDefault?.();
    if (!waitlistEmail.trim()) {
      setWaitlistMsg(t('product.enterEmail'));
      return;
    }
    setWaitlistLoading(true);
    setWaitlistMsg("");
    try {
      const { data, error } = await supabase.rpc("join_product_waitlist", {
        p_product_id: product.id,
        p_product_name: product.name,
        p_email: waitlistEmail.trim().toLowerCase(),
        p_phone: waitlistPhone.trim() || null,
      });
      if (error || !data?.ok) {
        setWaitlistMsg(data?.error || error?.message || t('product.waitlistError'));
      } else {
        setWaitlistMsg(t('product.waitlistSuccess'));
      }
    } catch (_err) {
      setWaitlistMsg(t('product.waitlistError'));
    } finally {
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    const h = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // No dosages configured yet → render a "Coming soon / Out of stock" tile
  // instead of hiding the product. Admin can add dosages later and the card
  // will automatically switch to the regular render path.
  if (!sel) {
    const moreInfoText = product.moreInfo?.trim();
    return (
      <>
        <style>{STYLES}</style>
        <div
          className="pc pc-oos pc-coming-soon"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="pc-accent-line" />
          <div className="pc-img-area">
            <div className="pc-img-inner">
              <img
                src={product.image}
                alt={product.name}
                className={imgOk ? "ok" : ""}
                onLoad={() => setImgOk(true)}
              />
            </div>
            <div className="pc-img-grad-bot" />
            <div className="pc-img-grad-top" />
            <span className="pc-coming-badge">{t('product.comingSoon')}</span>
          </div>

          <div className="pc-body">
            <div className="pc-meta-top">
              <span className="pc-cat-label">{product.category?.replace(/-/g, " ") || ""}</span>
              <span className="pc-spacer" />
              <span className="pc-stock-inline out">
                <span className="pc-stock-dot-sm" />
                {t('product.outOfStock')}
              </span>
            </div>

            <h3 className="pc-name">{product.name}</h3>
            <p className="pc-ruo-mobile">{t('product.researchUseOnly')}</p>

            <div className="pc-rating-row">
              <div className="pc-stars-group">
                <div className="pc-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <span className="pc-review-ct">({product.reviewCount})</span>
              </div>
              <div className="pc-links-group">
                {moreInfoText && (
                  <button
                    className="pc-meta-link"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal(true); }}
                  >
                    <Info size={10} /> {t('product.info')}
                  </button>
                )}
              </div>
            </div>

            <div className="pc-divider" />

            <div className="pc-stock-mobile">
              <span className="pc-stk-dot out" />
              <span style={{ fontSize: 8, fontWeight: 600, color: "#EF4444" }}>{t('product.outOfStockTitle')}</span>
            </div>

            <div className="pc-coming-msg">
              {t('product.waitlistMsg')}
            </div>
            <form onSubmit={submitWaitlist} className="pc-wl-form">
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="pc-wl-inp"
                placeholder={t('product.emailPlaceholder')}
                required
              />
              <input
                type="tel"
                value={waitlistPhone}
                onChange={(e) => setWaitlistPhone(e.target.value)}
                className="pc-wl-inp"
                placeholder={t('product.phoneOptional')}
              />
              <button className="pc-cta go" type="submit" disabled={waitlistLoading}>
                {waitlistLoading ? t('product.joining') : t('product.joinWaitlist')}
              </button>
              {waitlistMsg && <p className="pc-wl-msg">{waitlistMsg}</p>}
            </form>
          </div>
        </div>

        {modal && moreInfoText && (
          <div className="pc-mo" onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
            <div className="pc-mo-box">
              <button className="pc-mo-x" onClick={() => setModal(false)}><X size={14} /></button>
              <div className="pc-mo-in">
                <h2 className="pc-mo-nm">{product.name}</h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap", lineHeight: 1.55, marginTop: 8 }}>
                  {moreInfoText}
                </p>
                <button className="pc-mo-cls" onClick={() => setModal(false)}>{t('product.close')}</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const anyIn = dosages.some((d) => d.inStock);
  const oos = !anyIn;

  const dEn = discountSettings.discount_enabled ?? true;
  const dP = discountSettings.discount_percentage ?? 20;
  const b2 = discountSettings.buy2_percentage ?? 5;
  const b3 = discountSettings.buy3_percentage ?? 10;

  const price = getStorefrontPrice(sel.originalPrice, dEn, dP);
  const save = getStorefrontSavings(sel.originalPrice, dEn, dP);

  const doAdd = (e?: React.MouseEvent, qty = 1) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!sel?.inStock) return;
    const unitPrice =
      qty === 1
        ? price
        : qty === 2
          ? getStorefrontBundleUnitPrice(sel.originalPrice, dEn, dP, b2)
          : getStorefrontBundleUnitPrice(sel.originalPrice, dEn, dP, b3);
    addItem({
      productId: product.id,
      name: product.name,
      dosage: formatDosageLabel(sel.mg, sel.unit),
      basePrice: sel.originalPrice,
      price: unitPrice,
      originalPrice: sel.originalPrice,
      quantity: qty,
      image: product.image ?? '',
    });
    setAdding(true);
    setTimeout(() => setAdding(false), 1500);
  };

  const tiers = [
    { q: 2, l: getBundleLabel(2, t), pct: b2, u: getStorefrontBundleUnitPrice(sel.originalPrice, dEn, dP, b2), t: getStorefrontBundleTotal(sel.originalPrice, 2, dEn, dP, b2) },
    { q: 3, l: getBundleLabel(3, t), pct: b3, u: getStorefrontBundleUnitPrice(sel.originalPrice, dEn, dP, b3), t: getStorefrontBundleTotal(sel.originalPrice, 3, dEn, dP, b3) },
  ];
  const displayPrice = format(price);
  const displayOriginal = format(sel.originalPrice);
  const showB = (product.bundlePricing?.length ?? 0) > 0;
  const moreInfo = product.moreInfo?.trim();

  const bdg = (() => {
    if (product.badge?.includes("OUT OF STOCK"))
      return { c: "#EF4444", ic: <AlertCircle size={8} />, label: t('product.outOfStockTitle') };
    if (product.category === "best-seller")
      return { c: "#F59E0B", ic: <Flame size={8} />, label: t('product.bestseller') };
    if (product.category === "high-popularity")
      return { c: "#60A5FA", ic: <Star size={8} />, label: t('product.trending') };
    return null;
  })();

  const vialLabel = product.vialType === "liquid" ? t('product.sterileSolution') : t('product.lyophilizedPowder');

  const handleOpenCoa = (e) => {
    e?.preventDefault(); e?.stopPropagation();
    const url = product.coaUrl?.trim();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ── More-info renderer ── */
  const renderMI = () => {
    if (!moreInfo) return defDisclaimer();
    const n = moreInfo.replace(/\r\n/g, "\n").trim();
    const bl = n.split("\n").map((l) => l.trim()).filter((l) => /^[•\-]/.test(l)).map((l) => l.replace(/^[•\-]\s?/, "").trim());
    const pts = n.split(/\n\s*\n/g).map((p) => p.trim()).filter(Boolean);
    const f = (re) => pts.find((p) => re.test(p)) ?? null;
    const tga = f(/TGA|ARTG|therapeutic goods/i) ?? pts[1] ?? pts[0] ?? "";
    const nt = f(/not intended for therapeutic|diagnostic|cosmetic/i) ?? pts[2] ?? pts[1] ?? "";
    const r1 = f(/for research purposes only/i) ?? pts[0] ?? "";
    const r2 = f(/in vitro|laboratory use|Not for human/i) ?? "";
    const rs = [r1, r2].filter(Boolean).join(" ").trim();
    if (!tga || !nt || !rs) return <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{moreInfo}</p>;
    return (
      <>
        <DB icon={<AlertTriangle size={11} />} t="NOT APPROVED BY THE TGA" c="#F59E0B" tx={tga} />
        <DB icon={<Shield size={11} />} t="NOT FOR THERAPEUTIC USE" c="#EF4444" tx={nt} />
        <DB icon={<Beaker size={11} />} t="RESEARCH PURPOSES ONLY" c="#3B82F6" tx={rs} />
        {bl.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 3 }}>
            {bl.slice(0, 10).map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#EF4444", marginTop: 4, flexShrink: 0 }} />
                {b}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };
  const defDisclaimer = () => (
    <>
      <DB icon={<AlertTriangle size={11} />} t={t('product.notApprovedTga')} c="#F59E0B" tx={t('product.defTga')} />
      <DB icon={<Shield size={11} />} t={t('product.notTherapeutic')} c="#EF4444" tx={t('product.defTherapeutic')} />
      <DB icon={<Beaker size={11} />} t={t('product.researchOnly')} c="#3B82F6" tx={t('product.defResearch')} />
    </>
  );

  return (
    <>
      <style>{STYLES}</style>

      <div
        className={`pc ${oos ? "pc-oos" : ""} ${ddOpen ? "pc-dd-open" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Accent line on hover — desktop only */}
        <div className={`pc-accent-line ${hovered ? "visible" : ""}`} />

        {/* ══════ IMAGE AREA ══════ */}
        <div className="pc-img-area">
          <div className="pc-img-inner">
            <img
              src={product.image}
              alt={product.name}
              className={imgOk ? "ok" : ""}
              onLoad={() => setImgOk(true)}
            />
          </div>

          {/* Bottom gradient — desktop */}
          <div className="pc-img-grad-bot" />
          {/* Top gradient — desktop */}
          <div className="pc-img-grad-top" />

          {/* Discount badge */}
          {!oos && dEn && (
            <span className="pc-sale-badge">-{dP}%</span>
          )}

          {/* Category badge */}
          {bdg && (
            <span className="pc-cat-badge">{bdg.label}</span>
          )}

          {/* Desktop hover overlay with quick-add */}
          <div className={`pc-hover-overlay ${hovered ? "show" : ""}`}>
            {!oos && (
              <button className="pc-quick-add" onClick={doAdd} disabled={adding}>
                <Plus size={13} strokeWidth={3} />
                {adding ? t('product.adding') : t('product.quickAdd')}
              </button>
            )}
            <span className="pc-view-link">
              {t('product.viewDetails')} <ArrowUpRight size={11} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* ══════ BODY ══════ */}
        <div className="pc-body">

          {/* Category + stock — desktop layout */}
          <div className="pc-meta-top">
            {product.categoryName && (
              <span className="pc-cat-label">{product.categoryName}</span>
            )}
            <span className="pc-spacer" />
            <span className={`pc-stock-inline ${sel.inStock ? "in" : "out"}`}>
              <span className="pc-stock-dot-sm" />
              {sel.inStock ? t('product.inStock') : t('product.outOfStock')}
            </span>
          </div>

          {/* Name */}
          <h3 className={`pc-name ${hovered ? "pc-name-hover" : ""}`}>{product.name}</h3>

          {/* Mobile: research tag */}
          <p className="pc-ruo-mobile">{t('product.researchUseOnly')}</p>

          {/* Stars + COA/Info */}
          <div className="pc-rating-row">
            <div className="pc-stars-group">
              <div className="pc-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
              <span className="pc-review-ct">({product.reviewCount})</span>
            </div>
            <div className="pc-links-group">
              {product.coaUrl?.trim() && (
                <button className="pc-meta-link" onClick={handleOpenCoa}>
                  <FileText size={10} /> COA
                </button>
              )}
              {moreInfo && (
                <button className="pc-meta-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal(true); }}>
                  <Info size={10} /> Info
                </button>
              )}
            </div>
          </div>

          {/* Divider — desktop */}
          <div className="pc-divider" />

          {/* Mobile stock indicator */}
          <div className="pc-stock-mobile">
            <span className={`pc-stk-dot ${sel.inStock ? "in" : "out"}`} />
            <span style={{ fontSize: 8, fontWeight: 600, color: sel.inStock ? "#22C55E" : "#EF4444" }}>
              {sel.inStock ? t('product.inStock') : t('product.outOfStockTitle')}
            </span>
          </div>

          {/* Dosage: mobile = dropdown, desktop = chips */}
          {/* Desktop chips */}
          <div className="pc-dosage-desktop">
            <span className="pc-dosage-label">{t('product.size')}</span>
            <div className="pc-dosage-chips">
              {dosages.map((d) => {
                const ac = String(sel.mg) === String(d.mg) && (sel.unit ?? "MG") === (d.unit ?? "MG");
                return (
                  <button
                    key={`${d.mg}-${d.unit ?? "MG"}`}
                    className={`pc-chip ${ac ? "active" : ""}`}
                    onClick={(e) => { e.preventDefault(); setSel(d); }}
                    disabled={!d.inStock}
                  >
                    {formatDosageLabel(d.mg, d.unit)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile dropdown */}
          <div className="pc-dosage-mobile" ref={ddRef}>
            <button className="pc-dd-btn" onClick={() => setDdOpen(!ddOpen)} disabled={oos}>
              <span>{formatDosageLabel(sel.mg, sel.unit)}</span>
              <ChevronDown size={11} style={{ color: "rgba(255,255,255,0.3)", transition: "transform .2s", transform: ddOpen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
            </button>
            {ddOpen && (
              <div className="pc-dd-menu">
                {dosages.map((d) => {
                  const ac = String(sel.mg) === String(d.mg) && (sel.unit ?? "MG") === (d.unit ?? "MG");
                  return (
                    <button
                      key={`${d.mg}-${d.unit ?? "MG"}`}
                      className={`pc-dd-opt ${ac ? "ac" : ""}`}
                      onClick={() => { setSel(d); setDdOpen(false); }}
                      disabled={!d.inStock}
                    >
                      <span>{formatDosageLabel(d.mg, d.unit)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: d.inStock ? "#22C55E" : "#EF4444" }}>
                        {d.inStock ? "✓" : "✕"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="pc-price">
            <div className="pc-price-main-row">
              {dEn && <span className="pc-price-strike">{displayOriginal}</span>}
              <span className={`pc-price-now ${dEn ? "accent" : ""}`}>{displayPrice}</span>
              {dEn && save > 0 && (
                <span className="pc-price-save-pill">{t('product.offPercent', { percent: dP })}</span>
              )}
            </div>
            {sel && <span className="pc-price-per">{t('product.perVial', { dosage: formatDosageLabel(sel.mg, sel.unit) })}</span>}
          </div>

          {/* Trust badges — desktop */}
          <div className="pc-trust">
            <div className="pc-trust-item">
              <Shield size={11} /> {t('product.labVerified')}
            </div>
            <div className="pc-trust-item dim">
              <Beaker size={11} /> {t('product.hplcTested')}
            </div>
          </div>

          {/* Bundle */}
          {showB && (
            <div className="pc-bun">
              <div className="pc-bun-h"><Zap size={9} color="#FCD34D" /><span>{t('product.bundleSave')}</span></div>
              <div className="pc-bun-list">
                {tiers.map((tr) => {
                  const sv = (sel.originalPrice - tr.u) * tr.q;
                  return (
                    <button key={tr.q} className="pc-bun-r" disabled={!sel.inStock} onClick={(e) => doAdd(e, tr.q)}>
                      <span className="pc-bun-q">{tr.q}x</span>
                      <div className="pc-bun-m">
                        <span className="pc-bun-l">{tr.l}</span>
                        <span className="pc-bun-u">{format(tr.u)}/ea</span>
                      </div>
                      <div className="pc-bun-e">
                        <span className="pc-bun-t">{format(tr.t)}</span>
                        <span className="pc-bun-s">{t('product.saveAmount', { amount: format(sv) })}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          {!oos && (
            <button
              className={`pc-cta ${adding ? "done" : "go"}`}
              onClick={doAdd}
              disabled={adding}
            >
              {adding ? (
                <><Check size={13} /> {t('product.added')}</>
              ) : (
                <><Plus size={14} strokeWidth={2.5} /> {t('product.addToCart')}</>
              )}
            </button>
          )}
          {oos && (
            <form onSubmit={submitWaitlist} className="pc-wl-form" style={{ marginTop: 10 }}>
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="pc-wl-inp"
                placeholder={t('product.emailPlaceholder')}
                required
              />
              <input
                type="tel"
                value={waitlistPhone}
                onChange={(e) => setWaitlistPhone(e.target.value)}
                className="pc-wl-inp"
                placeholder={t('product.phoneOptional')}
              />
              <button className="pc-cta go" type="submit" disabled={waitlistLoading}>
                {waitlistLoading ? t('product.joining') : t('product.joinPriorityWaitlist')}
              </button>
              {waitlistMsg && <p className="pc-wl-msg">{waitlistMsg}</p>}
            </form>
          )}
        </div>
      </div>

      {/* ════ MODAL ════ */}
      {modal && (
        <div className="pc-mo" onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="pc-mo-box">
            <button className="pc-mo-x" onClick={() => setModal(false)}><X size={14} /></button>
            <div className="pc-mo-in">
              <h2 className="pc-mo-nm">{product.name}</h2>
              <div className="pc-stars-group" style={{ marginBottom: 12 }}>
                <div className="pc-stars">{[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />)}</div>
                <span className="pc-review-ct" style={{ fontSize: 10 }}>({product.reviewCount} {t('product.reviews')})</span>
              </div>
              <div className="pc-mo-pills">
                <div className="pc-mo-pill"><span className="pc-mo-pl">{t('product.form')}</span><span className="pc-mo-pv">{vialLabel}</span></div>
                <div className="pc-mo-pill"><span className="pc-mo-pl">{t('product.dosages')}</span><span className="pc-mo-pv">{dosages.map(d => formatDosageLabel(d.mg, d.unit)).join(", ")}</span></div>
              </div>
              {product.technicalSpecs?.composition && (
                <div className="pc-mo-comp"><span style={{ color: "#60A5FA", fontWeight: 600 }}>{t('product.composition')}</span> {product.technicalSpecs.composition}</div>
              )}
              <h3 className="pc-mo-sec"><Info size={13} style={{ color: "#60A5FA" }} /> {t('product.specifications')}</h3>
              <div className="pc-sp-tbl">
                {[
                  [t('product.synonyms'), product.technicalSpecs?.synonyms],
                  [t('product.cas'), product.technicalSpecs?.casNumber],
                  [t('product.molWeight'), product.technicalSpecs?.molecularWeight],
                  [t('product.length'), product.technicalSpecs?.peptideLength],
                  [t('product.purity'), product.technicalSpecs?.purity],
                  [t('product.appearance'), product.technicalSpecs?.appearance],
                  [t('product.solubility'), product.technicalSpecs?.solubility],
                  [t('product.quality'), product.technicalSpecs?.qualityVerification],
                  [t('product.storage'), product.technicalSpecs?.storageConditions],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} className="pc-sp-r"><span className="pc-sp-l">{l}</span><span className="pc-sp-v">{v}</span></div>
                ))}
              </div>
              <h3 className="pc-mo-sec"><AlertTriangle size={13} style={{ color: "#EF4444" }} /> {t('product.importantInfo')}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{renderMI()}</div>
              <button className="pc-mo-cls" onClick={() => setModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DB({ icon, t, c, tx }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${c}22`, background: "rgba(255,255,255,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: c, marginBottom: 2 }}>{icon} {t}</div>
      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", lineHeight: 1.45, margin: 0 }}>{tx}</p>
    </div>
  );
}

/* ═════════════════════════════════════
   STYLES
   ═════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* ── CARD ── */
.pc {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Outfit', system-ui, sans-serif;
  color: #EDF0F7;
  height: 100%;
  background: #0C0C10;
  border: 1px solid rgba(234,179,8,0.1);
  border-radius: 14px;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s, box-shadow 0.4s;
}
.pc *, .pc *::before, .pc *::after { box-sizing: border-box; margin: 0; padding: 0; }
.pc:hover {
  transform: translateY(-4px);
  border-color: rgba(245,158,11,0.22);
  box-shadow: 0 16px 48px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(59,130,246,0.1), inset 0 1px 0 0 rgba(245,158,11,0.1);
}
.pc.pc-oos { opacity: 0.55; }

/* Accent line */
.pc-accent-line {
  position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 20; pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, #EAB308 38%, #3B82F6 62%, transparent 100%);
  opacity: 0; transition: opacity 0.4s;
}
.pc-accent-line.visible { opacity: 1; }

/* ══════ IMAGE ══════ */
.pc-img-area {
  position: relative;
  overflow: hidden;
  /* Mobile: square */
  aspect-ratio: 1/1;
  background: #08080B;
}
.pc-img-inner {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.pc-img-inner img {
  width: 85%; height: 85%; object-fit: contain;
  opacity: 0;
  transition: opacity 0.35s, transform 0.6s cubic-bezier(0.16,1,0.3,1);
}
.pc-img-inner img.ok { opacity: 1; }
.pc:hover .pc-img-inner img.ok { transform: scale(1.05); }

/* Gradient overlays — hidden mobile, shown desktop */
.pc-img-grad-bot, .pc-img-grad-top { display: none; }

/* Sale badge */
.pc-sale-badge {
  position: absolute; top: 8px; right: 8px; z-index: 10;
  padding: 3px 8px; border-radius: 6px;
  background: #DC2626; color: white;
  font-size: 10px; font-weight: 800; letter-spacing: 0.02em;
}

/* Coming-soon badge (variant of sale badge for products without dosages) */
.pc-coming-badge {
  position: absolute; top: 8px; right: 8px; z-index: 10;
  padding: 3px 8px; border-radius: 6px;
  background: rgba(107,114,128,0.9); color: #F4F6FA;
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Coming-soon inline message on card body */
.pc-coming-msg {
  margin: 4px 0 8px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px dashed rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  font-size: 9px; line-height: 1.45;
  color: rgba(255,255,255,0.42);
  text-align: center;
}
.pc-wl-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pc-wl-inp {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: #EDF0F7;
  font-size: 11px;
  font-family: 'Outfit', sans-serif;
}
.pc-wl-inp::placeholder { color: rgba(255,255,255,0.35); }
.pc-wl-msg {
  font-size: 10px;
  line-height: 1.4;
  color: rgba(255,255,255,0.65);
  margin-top: 2px;
}
@media (min-width: 640px) {
  .pc-coming-badge { top: 12px; right: 12px; padding: 4px 10px; font-size: 11px; border-radius: 8px; }
  .pc-coming-msg { font-size: 11px; padding: 10px 12px; margin: 6px 0 14px; }
  .pc-wl-inp { font-size: 12px; padding: 10px 12px; }
  .pc-wl-msg { font-size: 11px; }
}

/* Category badge */
.pc-cat-badge {
  position: absolute; top: 8px; left: 8px; z-index: 10;
  padding: 2px 8px; border-radius: 6px;
  font-size: 8px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.5); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Hover overlay — hidden on mobile */
.pc-hover-overlay {
  display: none;
}

/* ══════ BODY ══════ */
.pc-body { flex: 1; display: flex; flex-direction: column; padding: 8px; }

/* Desktop meta top row — hidden mobile */
.pc-meta-top { display: none; }

.pc-name {
  font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.92);
  line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.25s;
}
.pc-name-hover { color: #FBBF24; }

.pc-ruo-mobile {
  font-size: 6.5px; font-weight: 600; color: #EF4444;
  letter-spacing: 0.8px; text-transform: uppercase;
  margin: 1px 0 5px; opacity: 0.8;
}

/* Stars + links */
.pc-rating-row {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-bottom: 5px;
}
.pc-stars-group { display: flex; align-items: center; gap: 4px; }
.pc-stars { display: flex; gap: 0.5px; }
.pc-review-ct { font-size: 8px; color: rgba(255,255,255,0.25); }
.pc-links-group { display: flex; gap: 4px; margin-left: auto; }
.pc-meta-link {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 8px; font-weight: 500; color: rgba(255,255,255,0.25);
  background: none; border: none; cursor: pointer; padding: 2px 4px; border-radius: 4px;
  transition: color 0.2s; font-family: 'Outfit', sans-serif;
}
.pc-meta-link:hover { color: #F59E0B; }

/* Divider — desktop only */
.pc-divider { display: none; }

/* Mobile stock */
.pc-stock-mobile {
  display: flex; align-items: center; gap: 4px; margin-bottom: 6px;
}
.pc-stk-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.pc-stk-dot.in { background: #22C55E; box-shadow: 0 0 6px rgba(34,197,94,0.4); animation: pcP 2s infinite; }
.pc-stk-dot.out { background: #EF4444; }
@keyframes pcP { 0%,100%{box-shadow:0 0 3px rgba(34,197,94,0.2)} 50%{box-shadow:0 0 9px rgba(34,197,94,0.5)} }

/* ── DOSAGE ── */
/* Desktop chips — hidden mobile */
.pc-dosage-desktop { display: none; }
.pc-dosage-label {
  display: block; margin-bottom: 6px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: rgba(255,255,255,0.2);
}
.pc-dosage-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.pc-chip {
  padding: 6px 14px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.45);
  cursor: pointer; transition: all 0.2s;
  font-family: 'Outfit', sans-serif;
}
.pc-chip:hover:not(:disabled) { border-color: rgba(245,158,11,0.35); color: rgba(255,255,255,0.65); }
.pc-chip.active {
  background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.4);
  color: #FDE68A; box-shadow: 0 0 14px rgba(245,158,11,0.15);
}
.pc-chip:disabled { text-decoration: line-through; opacity: 0.4; cursor: not-allowed; color: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.03); }

/* Mobile dropdown */
.pc-dosage-mobile { position: relative; margin-bottom: 8px; }
.pc-dd-btn {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: #EDF0F7; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600;
  cursor: pointer; transition: border-color 0.2s;
}
.pc-dd-btn:hover { border-color: rgba(245,158,11,0.35); }
.pc-dd-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.pc-dd-menu {
  position: absolute; top: calc(100% + 3px); left: 0; right: 0; z-index: 60;
  border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(10,14,28,0.96); backdrop-filter: blur(24px);
  box-shadow: 0 14px 40px rgba(0,0,0,0.55); overflow: hidden;
}

/* ── Mobile-only dropdown fixes ── */
/* When dropdown is open, let the card overflow so the menu isn't clipped. */
@media (max-width: 767px) {
  .pc.pc-dd-open { overflow: visible; }
  /* Keep the non-dropdown parts of the card clipped (image, accent line, etc.)
     by re-hiding the inner content wrapper – only the dropdown escapes. */
  .pc.pc-dd-open .pc-inner { overflow: visible; }
  .pc-dd-menu {
    z-index: 9999;
    /* Scroll within the menu itself so it never needs to escape the viewport. */
    max-height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
    /* Slim scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(245,158,11,0.4) transparent;
  }
  .pc-dd-menu::-webkit-scrollbar { width: 3px; }
  .pc-dd-menu::-webkit-scrollbar-track { background: transparent; }
  .pc-dd-menu::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.4); border-radius: 3px; }
}
.pc-dd-opt {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 10px; border: none; background: none;
  color: #EDF0F7; font-family: 'IBM Plex Mono', monospace; font-size: 10px;
  cursor: pointer; transition: background 0.15s;
}
.pc-dd-opt:hover { background: rgba(245,158,11,0.1); }
.pc-dd-opt.ac { background: rgba(245,158,11,0.13); color: #FBBF24; }
.pc-dd-opt:disabled { color: rgba(239,68,68,0.4); cursor: not-allowed; }
.pc-dd-opt + .pc-dd-opt { border-top: 1px solid rgba(255,255,255,0.05); }

/* ── PRICE ── */
.pc-price { margin-bottom: 8px; }
.pc-price-main-row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.pc-price-strike { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.2); text-decoration: line-through; text-decoration-color: rgba(255,255,255,0.1); }
.pc-price-now { font-size: 20px; font-weight: 800; color: white; letter-spacing: -0.025em; line-height: 1; }
.pc-price-now.accent { color: #FBBF24; }
.pc-price-save-pill {
  font-size: 10px; font-weight: 600; color: #FDE68A;
  padding: 2px 7px; border-radius: 5px;
  background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.22);
}
.pc-price-per { display: block; font-size: 10px; color: rgba(255,255,255,0.18); margin-top: 2px; }

/* Trust badges — desktop only */
.pc-trust { display: none; }

/* ── BUNDLE ── */
.pc-bun {
  border-radius: 10px; border: 1px solid rgba(59,130,246,0.15);
  background: linear-gradient(135deg, rgba(234,179,8,0.05) 0%, rgba(59,130,246,0.06) 100%);
  overflow: hidden; margin-bottom: 8px;
}
.pc-bun-h {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 8px; border-bottom: 1px solid rgba(59,130,246,0.12);
  font-size: 8px; font-weight: 700; color: #FCD34D;
  letter-spacing: 0.8px; text-transform: uppercase;
}
.pc-bun-list { padding: 4px; display: flex; flex-direction: column; gap: 3px; }
.pc-bun-r {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 6px; border-radius: 7px; border: 1px solid transparent;
  background: rgba(255,255,255,0.02);
  cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif;
}
.pc-bun-r:hover:not(:disabled) { background: rgba(59,130,246,0.08); border-color: rgba(234,179,8,0.2); }
.pc-bun-r:disabled { opacity: 0.25; cursor: not-allowed; }
.pc-bun-q {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 5px;
  background: linear-gradient(135deg, rgba(234,179,8,0.22), rgba(59,130,246,0.12));
  color: #FDE68A; font-size: 8px; font-weight: 700; flex-shrink: 0;
}
.pc-bun-m { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pc-bun-l { font-size: 10px; font-weight: 600; color: #EDF0F7; }
.pc-bun-u { font-size: 7px; color: rgba(255,255,255,0.3); font-family: 'IBM Plex Mono', monospace; }
.pc-bun-e { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.pc-bun-t { font-size: 12px; font-weight: 700; color: #EDF0F7; line-height: 1.1; }
.pc-bun-s { font-size: 7px; font-weight: 700; color: #F59E0B; padding: 1px 3px; border-radius: 3px; background: rgba(245,158,11,0.1); }

/* ── CTA ── */
.pc-cta {
  margin-top: auto; width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  border: none; font-family: 'Outfit', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.01em;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
  padding: 10px; border-radius: 10px;
}
.pc-cta.go {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #0c0a06;
}
.pc-cta.go:hover {
  background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
  box-shadow: 0 6px 24px rgba(245,158,11,0.38);
  transform: translateY(-1px);
}
.pc-cta.go:active { transform: translateY(0); }
.pc-cta.done { background: rgba(245,158,11,0.12); color: rgba(255,255,255,0.45); }

/* ═══════════════════════════════════
   DESKTOP (≥640px) — match production card style
   ═══════════════════════════════════ */
@media (min-width: 640px) {
  .pc { border-radius: 16px; }

  /* Image: taller 4:5 ratio */
  .pc-img-area { aspect-ratio: 4/5; }

  /* Show gradient overlays */
  .pc-img-grad-bot {
    display: block; position: absolute; inset: auto 0 0 0; z-index: 1; pointer-events: none;
    height: 100px; background: linear-gradient(to top, #0C0C10, transparent);
  }
  .pc-img-grad-top {
    display: block; position: absolute; inset: 0 0 auto 0; z-index: 1; pointer-events: none;
    height: 60px; background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent);
  }

  /* Show hover overlay */
  .pc-hover-overlay {
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    position: absolute; inset: 0; z-index: 3;
    padding-bottom: 16px; gap: 8px; pointer-events: none;
    background: transparent; opacity: 0;
    transition: opacity 0.35s, background 0.35s;
  }
  .pc-hover-overlay.show {
    opacity: 1;
    background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 40%, transparent 60%);
  }
  .pc-quick-add {
    pointer-events: auto;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 22px; border-radius: 100px; border: none;
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #0c0a06;
    font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.02em; cursor: pointer;
    box-shadow: 0 4px 16px rgba(245,158,11,0.35);
    transform: translateY(8px);
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s;
  }
  .pc-hover-overlay.show .pc-quick-add { transform: translateY(0); }
  .pc-quick-add:hover { box-shadow: 0 6px 24px rgba(245,158,11,0.45); }

  .pc-view-link {
    pointer-events: auto;
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.7);
    cursor: pointer; transition: color 0.2s, transform 0.35s cubic-bezier(0.16,1,0.3,1) 0.04s;
    transform: translateY(6px);
  }
  .pc-hover-overlay.show .pc-view-link { transform: translateY(0); }
  .pc-view-link:hover { color: #FDE68A; }

  .pc-sale-badge { top: 12px; right: 12px; padding: 4px 10px; font-size: 11px; border-radius: 8px; }
  .pc-cat-badge { top: 12px; left: 12px; font-size: 9px; padding: 3px 10px; }

  /* Body */
  .pc-body { padding: 16px 16px 20px; }

  /* Show desktop meta row */
  .pc-meta-top {
    display: flex; align-items: center; margin-bottom: 8px;
  }
  .pc-cat-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }
  .pc-spacer { flex: 1; }
  .pc-stock-inline {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 550;
  }
  .pc-stock-inline.in { color: rgba(52,211,153,0.75); }
  .pc-stock-inline.out { color: rgba(248,113,113,0.7); }
  .pc-stock-dot-sm {
    width: 5px; height: 5px; border-radius: 50%; background: currentColor;
    box-shadow: 0 0 6px currentColor;
  }

  /* Hide mobile-only elements */
  .pc-ruo-mobile { display: none; }
  .pc-stock-mobile { display: none; }
  .pc-dosage-mobile { display: none; }

  /* Show desktop elements */
  .pc-dosage-desktop { display: block; margin-bottom: 14px; }
  .pc-divider {
    display: block; height: 1px; margin-bottom: 12px;
    background: linear-gradient(90deg, rgba(245,158,11,0.18), rgba(59,130,246,0.12), rgba(255,255,255,0.04), transparent);
  }
  .pc-trust {
    display: flex; align-items: center; gap: 16px; margin-bottom: 14px;
  }
  .pc-trust-item {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 500; color: rgba(245,158,11,0.75);
  }
  .pc-trust-item.dim { color: rgba(96,165,250,0.65); }

  .pc-name { font-size: 16px; font-weight: 660; line-height: 1.3; margin-bottom: 4px; }
  .pc-rating-row { margin-bottom: 10px; gap: 6px; }
  .pc-review-ct { font-size: 11px; color: rgba(255,255,255,0.3); }
  .pc-meta-link { font-size: 11px; padding: 3px 5px; }

  .pc-price { margin-bottom: 14px; }
  .pc-price-strike { font-size: 14px; }
  .pc-price-now { font-size: 24px; }
  .pc-price-save-pill { font-size: 11px; }
  .pc-price-per { font-size: 11px; }

  .pc-cta { padding: 13px; font-size: 13px; font-weight: 680; }

  .pc-bun { border-radius: 12px; margin-bottom: 14px; }
  .pc-bun-h { padding: 8px 12px; font-size: 9px; }
  .pc-bun-list { padding: 6px; gap: 4px; }
  .pc-bun-r { padding: 8px 10px; gap: 8px; border-radius: 8px; }
  .pc-bun-q { width: 28px; height: 28px; border-radius: 6px; font-size: 10px; }
  .pc-bun-l { font-size: 12px; }
  .pc-bun-u { font-size: 8px; }
  .pc-bun-t { font-size: 15px; }
  .pc-bun-s { font-size: 8px; }
}

/* ═══════ MODAL ═══════ */
.pc-mo {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
  animation: pcFd 0.2s ease;
  font-family: 'Outfit', system-ui, sans-serif; color: #EDF0F7;
}
@media (min-width: 640px) { .pc-mo { align-items: center; padding: 20px; } }
@keyframes pcFd { from{opacity:0}to{opacity:1} }

.pc-mo-box {
  position: relative; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto;
  border-radius: 16px 16px 0 0;
  background: rgba(12,12,16,0.96); backdrop-filter: blur(32px) saturate(1.3);
  border: 1px solid rgba(255,255,255,0.06); border-bottom: none;
  box-shadow: 0 -6px 40px rgba(0,0,0,0.4);
  animation: pcSU 0.3s cubic-bezier(0.16,1,0.3,1);
}
@media (min-width: 640px) {
  .pc-mo-box { border-radius: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 60px rgba(0,0,0,0.45); animation-name: pcSC; }
}
@keyframes pcSU { from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)} }
@keyframes pcSC { from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)} }
.pc-mo-box::-webkit-scrollbar { width: 3px; }
.pc-mo-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
.pc-mo-box::before { content: ''; display: block; width: 32px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.1); margin: 8px auto 0; }
@media (min-width: 640px) { .pc-mo-box::before { display: none; } }

.pc-mo-x {
  position: sticky; top: 6px; float: right; margin: 6px 10px 0 0;
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4); cursor: pointer; z-index: 10; transition: background 0.2s;
}
.pc-mo-x:hover { background: rgba(255,255,255,0.08); }

.pc-mo-in { padding: 14px; padding-top: 4px; }
.pc-mo-nm { font-size: 18px; font-weight: 700; color: #EDF0F7; margin-bottom: 3px; }

.pc-mo-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.pc-mo-pill { padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 1px; }
.pc-mo-pl { font-size: 8px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.4px; }
.pc-mo-pv { font-size: 10px; font-weight: 600; color: #EDF0F7; }

.pc-mo-comp { padding: 8px 10px; border-radius: 8px; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.14); font-size: 10px; color: #EDF0F7; margin-bottom: 12px; }

.pc-mo-sec { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #EDF0F7; margin: 14px 0 7px; }

.pc-sp-tbl { border-radius: 10px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
.pc-sp-r { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 10px; font-size: 10px; gap: 8px; }
.pc-sp-r + .pc-sp-r { border-top: 1px solid rgba(255,255,255,0.04); }
.pc-sp-l { color: rgba(255,255,255,0.35); flex-shrink: 0; }
.pc-sp-v { color: #EDF0F7; text-align: right; word-break: break-word; }

.pc-mo-cls {
  width: 100%; padding: 11px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03);
  color: #EDF0F7; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600;
  cursor: pointer; margin-top: 14px; transition: background 0.2s;
}
.pc-mo-cls:hover { background: rgba(255,255,255,0.06); }
`;
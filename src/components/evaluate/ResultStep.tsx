import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import BeforeAfterSlider from '../ui/BeforeAfterSlider';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../auth/AuthProvider';
import { invokeFunction } from '../../lib/payments/invokeFunction';
import type { TpoOption } from '../../data/tpoOptions';
import type { StyleIntent } from './IntentStep';
import type { MockResult } from '../../data/mockScoring';
import './evaluate-shared.css';
import './ResultStep.css';

interface ResultStepProps {
  result: MockResult;
  tpo: TpoOption;
  intent: StyleIntent;
  previewUrl?: string | null;
  dateLabel?: string;
  backLabel?: string;
  evaluationId?: string | null;
  isSample?: boolean;
  initialEditedUrl?: string | null;
  onReset: () => void;
}

export default function ResultStep({
  result,
  tpo,
  intent,
  previewUrl,
  dateLabel,
  backLabel,
  evaluationId,
  isSample,
  initialEditedUrl,
  onReset,
}: ResultStepProps) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const r = t.evaluate.result;

  const [editedUrl, setEditedUrl] = useState<string | null>(initialEditedUrl ?? null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(false);

  const canGenerate = Boolean(evaluationId && !isSample);
  const isPro = user?.plan === 'pro';

  const handleGenerate = async () => {
    if (!evaluationId) return;
    setGenerating(true);
    setGenError(false);
    try {
      const res = await invokeFunction<{ editedPhotoUrl: string }>('generate-image-edit', { evaluationId });
      setEditedUrl(res.editedPhotoUrl);
    } catch {
      setGenError(true);
    } finally {
      setGenerating(false);
    }
  };

  const grade =
    result.overall >= 90 ? r.gradeExcellent : result.overall >= 75 ? r.gradeGood : r.gradeFair;
  const tpoLabel = locale === 'ko' ? tpo.labelKo : tpo.labelEn;
  const intentLabel =
    intent === 'classic' ? t.evaluate.intent.classicTitle : t.evaluate.intent.experimentalTitle;

  return (
    <div className="result-step">
      <div className="result-header">
        <span className="badge badge-accent">{r.eyebrow}</span>
        {dateLabel && <p className="result-date">{dateLabel}</p>}
        <div className="result-score">
          <strong>{result.overall}</strong>
          <span>{r.scoreSuffix}</span>
        </div>
        <div className="result-grade">{grade}</div>
        <div className="result-tags">
          <span className="badge badge-primary">
            <Icon name={tpo.icon} size={14} />
            {tpoLabel}
          </span>
          <span className="badge badge-accent">
            <Icon name={intent === 'classic' ? 'shield' : 'sparkle'} size={14} />
            {intentLabel}
          </span>
        </div>
      </div>

      <section className="result-section">
        <h2>{r.categoriesTitle}</h2>
        <div className="result-categories">
          {result.categories.map((c) => (
            <div key={c.key} className={`result-category ${c.isBonus ? 'is-bonus' : ''}`}>
              <div className="result-category__icon">
                <Icon name={c.icon} size={16} />
              </div>
              <div className="result-category__body">
                <div className="result-category__top">
                  <span className="result-category__label">
                    {locale === 'ko' ? c.labelKo : c.labelEn}
                  </span>
                  {c.isBonus && <span className="badge badge-yellow">{r.bonusBadge}</span>}
                  <span className="result-category__score">
                    {c.score}/{c.max}
                  </span>
                </div>
                <div className="result-category__track">
                  <div
                    className="result-category__fill"
                    style={{ width: `${(c.score / c.max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="result-section result-strengths">
        <h2>{r.strengthsTitle}</h2>
        <div className="result-list">
          {result.strengths.map((s) => (
            <div className="result-list__item" key={s.key}>
              <Icon name="check" size={18} />
              <span>{locale === 'ko' ? s.textKo : s.textEn}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="result-section result-improvements">
        <h2>{r.improvementsTitle}</h2>
        <div className="result-list">
          {result.improvements.map((f) => (
            <div className="result-list__item" key={f.key}>
              <Icon name="arrowRight" size={18} />
              <span>{locale === 'ko' ? f.textKo : f.textEn}</span>
              <span className="result-improvements__gain">
                +{f.pointsGain} {r.pointsGainSuffix}
              </span>
            </div>
          ))}
        </div>
      </section>

      {previewUrl && (
        <section className="result-section">
          <h2>{r.beforeAfterTitle}</h2>
          <BeforeAfterSlider
            beforeLabel={t.home.beforeLabel}
            afterLabel={editedUrl ? r.afterGenerateCta : r.afterMockLabel}
            hint={t.home.sliderHint}
            beforeSlot={
              <div className="result-photo-frame">
                <img src={previewUrl} alt="" />
              </div>
            }
            afterSlot={
              <div className="result-photo-frame">
                <img src={editedUrl ?? previewUrl} alt="" />
                {!editedUrl && (
                  <div className={`result-photo-frame__overlay ${generating ? 'is-pulsing' : ''}`}>
                    <Icon name="sparkle" size={40} />
                  </div>
                )}
              </div>
            }
          />

          {canGenerate && isPro && (
            <div className="result-generate">
              {genError && <p className="result-generate__error">{r.afterErrorNote}</p>}
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <Icon name="sparkle" size={16} />
                {generating ? r.afterGenerating : editedUrl ? r.afterRegenerateCta : r.afterGenerateCta}
              </Button>
            </div>
          )}

          {canGenerate && !isPro && (
            <div className="result-generate">
              <p className="result-beforeafter__note">{r.afterProNote}</p>
              <Link to="/pricing">
                <Button variant="outline">{r.afterProCta}</Button>
              </Link>
            </div>
          )}

          {!canGenerate && <p className="result-beforeafter__note">{r.afterMockNote}</p>}
        </section>
      )}

      <div className="evaluate-step__actions">
        <Button variant="outline" onClick={onReset}>
          <Icon name="swap" size={16} />
          {backLabel ?? r.resetButton}
        </Button>
      </div>
    </div>
  );
}

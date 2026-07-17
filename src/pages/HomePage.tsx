import { Link } from 'react-router-dom';
import Icon, { type IconName } from '../components/ui/Icon';
import Button from '../components/ui/Button';
import BeforeAfterSlider from '../components/ui/BeforeAfterSlider';
import OutfitPlaceholder from '../components/ui/OutfitPlaceholder';
import { useI18n } from '../i18n/I18nProvider';
import {
  sampleCategoryScores,
  sampleOverallScore,
  sampleFeedbackKo,
  sampleFeedbackEn,
  sampleTpoKo,
  sampleTpoEn,
} from '../data/sampleResult';
import './HomePage.css';

export default function HomePage() {
  const { t, locale } = useI18n();

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="container hero">
        <div>
          <span className="hero__badge">
            <Icon name="sparkle" size={16} />
            {t.home.heroBadge}
          </span>
          <h1 className="hero__title">{t.home.heroTitle}</h1>
          <p className="hero__subtitle">{t.home.heroSubtitle}</p>
          <div className="hero__actions">
            <Link to="/evaluate">
              <Button size="lg">
                <Icon name="upload" size={18} />
                {t.home.heroCtaPrimary}
              </Button>
            </Link>
            <a href="#sample-result">
              <Button size="lg" variant="outline">
                {t.home.heroCtaSecondary}
              </Button>
            </a>
          </div>
          <div className="hero__trust">
            <Icon name="heart" size={16} />
            {t.home.trustNote}
          </div>
        </div>

        <div>
          <BeforeAfterSlider
            beforeSlot={<OutfitPlaceholder variant="before" />}
            afterSlot={<OutfitPlaceholder variant="after" />}
            beforeLabel={t.home.beforeLabel}
            afterLabel={t.home.afterLabel}
            hint={t.home.sliderHint}
          />
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="section container">
        <div className="section-head">
          <h2>{t.home.sectionFeaturesTitle}</h2>
          <p>{t.home.sectionFeaturesSubtitle}</p>
        </div>
        <div className="feature-grid">
          {t.home.features.map((f) => (
            <div className="card feature-card" key={f.title}>
              <div className="feature-card__icon">
                <Icon name={f.icon as IconName} size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Flow ---------- */}
      <section className="section container">
        <div className="section-head">
          <h2>{t.home.sectionFlowTitle}</h2>
        </div>
        <div className="flow-grid">
          {t.home.flow.map((s) => (
            <div className="card flow-step" key={s.step}>
              <div className="flow-step__num">{s.step}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Sample result ---------- */}
      <section className="section sample-section" id="sample-result">
        <div className="container">
          <div className="section-head">
            <h2>{t.home.sampleTitle}</h2>
            <p>{t.home.sampleSubtitle}</p>
          </div>

          <div className="card sample-card">
            <div className="sample-card__top">
              <div className="sample-card__score">
                <strong>{sampleOverallScore}</strong>
                <span>/ 100</span>
              </div>
              <span className="badge badge-accent">
                <Icon name="tag" size={14} />
                {locale === 'ko' ? sampleTpoKo : sampleTpoEn}
              </span>
            </div>

            <div className="sample-card__bars">
              {sampleCategoryScores.map((c) => (
                <div className="sample-bar" key={c.labelKo}>
                  <span className="sample-bar__label">{locale === 'ko' ? c.labelKo : c.labelEn}</span>
                  <span className="sample-bar__track">
                    <span
                      className="sample-bar__fill"
                      style={{ width: `${(c.score / c.max) * 100}%` }}
                    />
                  </span>
                  <span className="sample-bar__value">
                    {c.score}/{c.max}
                  </span>
                </div>
              ))}
            </div>

            <div className="sample-card__feedback">
              <Icon name="heart" size={18} />
              <span>{locale === 'ko' ? sampleFeedbackKo : sampleFeedbackEn}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section container">
        <div className="cta-banner">
          <h2>{t.home.ctaTitle}</h2>
          <p>{t.home.ctaSubtitle}</p>
          <Link to="/evaluate">
            <Button size="lg" variant="accent">
              <Icon name="arrowRight" size={18} />
              {t.common.startEvaluate}
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

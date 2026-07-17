import { useCallback, useRef, useState, type ReactNode } from 'react';
import Icon from './Icon';
import './BeforeAfterSlider.css';

interface BeforeAfterSliderProps {
  beforeSlot: ReactNode;
  afterSlot: ReactNode;
  beforeLabel: string;
  afterLabel: string;
  hint?: string;
  watermark?: string;
  initialPosition?: number;
}

export default function BeforeAfterSlider({
  beforeSlot,
  afterSlot,
  beforeLabel,
  afterLabel,
  hint,
  watermark = 'K-FitJudge',
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    updateFromClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  };
  const stopDragging = () => setDragging(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 4));
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 4));
  };

  return (
    <div>
      <div
        className="ba-slider"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <div className="ba-slider__layer ba-slider__after">
          <div className="ba-slider__media">{afterSlot}</div>
          <span className="ba-slider__tag">{afterLabel}</span>
        </div>

        <div
          className="ba-slider__layer ba-slider__before"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className="ba-slider__media">{beforeSlot}</div>
          <span className="ba-slider__tag">{beforeLabel}</span>
        </div>

        <div className="ba-slider__watermark">
          <Icon name="shield" size={14} />
          {watermark}
        </div>

        <div
          className="ba-slider__divider"
          style={{ left: `${position}%` }}
          role="slider"
          tabIndex={0}
          aria-label="Before / After comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={handleKeyDown}
        >
          <div className="ba-slider__handle">
            <Icon name="swap" size={18} />
          </div>
        </div>
      </div>
      {hint && <p className="ba-slider__hint">{hint}</p>}
    </div>
  );
}

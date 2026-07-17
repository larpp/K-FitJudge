import { Fragment } from 'react';
import Icon from '../ui/Icon';
import './StepProgress.css';

interface StepProgressProps {
  labels: readonly string[];
  currentIndex: number;
}

export default function StepProgress({ labels, currentIndex }: StepProgressProps) {
  return (
    <div className="step-progress">
      {labels.map((label, i) => (
        <Fragment key={label}>
          <div
            className={`step-progress__item ${i < currentIndex ? 'is-done' : ''} ${i === currentIndex ? 'is-current' : ''}`}
          >
            <div className="step-progress__circle">
              {i < currentIndex ? <Icon name="check" /> : i + 1}
            </div>
            <span className="step-progress__label">{label}</span>
          </div>
          {i < labels.length - 1 && (
            <div className={`step-progress__line ${i < currentIndex ? 'is-done' : ''}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

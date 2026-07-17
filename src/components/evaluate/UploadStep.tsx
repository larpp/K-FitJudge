import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import './evaluate-shared.css';
import './UploadStep.css';

interface UploadStepProps {
  previewUrl: string | null;
  isSample: boolean;
  onFileSelect: (file: File) => void;
  onUseSample: () => void;
  onClear: () => void;
  onNext: () => void;
}

export default function UploadStep({
  previewUrl,
  isSample,
  onFileSelect,
  onUseSample,
  onClear,
  onNext,
}: UploadStepProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  return (
    <div className="upload-step">
      <h1>{t.evaluate.upload.title}</h1>
      <p className="evaluate-step__subtitle">{t.evaluate.upload.subtitle}</p>

      {!previewUrl ? (
        <>
          <div
            className={`upload-dropzone ${isDragging ? 'is-dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="upload-dropzone__icon">
              <Icon name="upload" size={26} />
            </div>
            <p className="upload-dropzone__title">{t.evaluate.upload.dropTitle}</p>
            <p className="upload-dropzone__hint">{t.evaluate.upload.dropHint}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              {t.evaluate.upload.browseButton}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div className="upload-step__or">{t.evaluate.upload.or}</div>

          <Button variant="ghost" onClick={onUseSample}>
            <Icon name="sparkle" size={16} />
            {t.evaluate.upload.sampleButton}
          </Button>
        </>
      ) : (
        <div className="upload-preview">
          <div className="upload-preview__frame">
            <img src={previewUrl} alt="" />
          </div>
          <div className="upload-preview__badge">
            <Icon name="check" size={16} />
            {isSample ? t.evaluate.upload.sampleSelectedLabel : t.evaluate.upload.selectedLabel}
          </div>
          <div className="upload-preview__change">
            <Button variant="ghost" size="sm" onClick={onClear}>
              {t.evaluate.upload.changeButton}
            </Button>
          </div>
        </div>
      )}

      <div className="evaluate-step__actions">
        <Button size="lg" disabled={!previewUrl} onClick={onNext}>
          {t.evaluate.upload.nextButton}
          <Icon name="chevronRight" size={18} />
        </Button>
      </div>
    </div>
  );
}

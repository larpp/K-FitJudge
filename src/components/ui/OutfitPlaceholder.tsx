import Icon from './Icon';
import './OutfitPlaceholder.css';

interface OutfitPlaceholderProps {
  variant: 'before' | 'after';
}

/** 실제 사진이 없는 데모/더미 화면에서 옷차림을 상징적으로 보여주는 플레이스홀더. */
export default function OutfitPlaceholder({ variant }: OutfitPlaceholderProps) {
  return (
    <div className={`outfit-ph outfit-ph--${variant}`}>
      <Icon name="shirt" size={72} />
      {variant === 'after' && (
        <>
          <Icon name="sparkle" className="outfit-ph__spark outfit-ph__spark--1" size={20} />
          <Icon name="sparkle" className="outfit-ph__spark outfit-ph__spark--2" size={14} />
        </>
      )}
    </div>
  );
}

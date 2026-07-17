import type { ReactElement } from 'react';

/**
 * 솔리드(채움) 아이콘 세트. Material Symbols(filled)/Heroicons solid 스타일을
 * 따르는 단색(fill 기반) 아이콘을 자체 SVG로 구성했다.
 */
export type IconName =
  | 'upload'
  | 'sparkle'
  | 'shirt'
  | 'shield'
  | 'swap'
  | 'tag'
  | 'star'
  | 'user'
  | 'chevronRight'
  | 'check'
  | 'close'
  | 'menu'
  | 'bag'
  | 'heart'
  | 'palette'
  | 'arrowRight'
  | 'cap'
  | 'ring'
  | 'bolt'
  | 'shoe';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

const paths: Record<IconName, ReactElement> = {
  upload: (
    <>
      <path d="M12 3.5 17 9h-3.2v7.2h-3.6V9H7l5-5.5z" />
      <rect x="5" y="18.5" width="14" height="2" rx="1" />
    </>
  ),
  sparkle: <polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" />,
  shirt: (
    <path d="M8 3h2l2 2 2-2h2l4 4-2.5 2.5-.5-1V21H7V8.5l-.5 1L4 7l4-4z" />
  ),
  shield: (
    <path d="M12 2 19 5v6c0 5-3 8.5-7 10-4-1.5-7-5-7-10V5l7-3z" />
  ),
  swap: (
    <>
      <path d="M3 7h14l-3.5-3.5 1.4-1.4L21 8l-6.1 5.9-1.4-1.4L17 9H3V7z" />
      <path d="M21 17H7l3.5 3.5-1.4 1.4L3 16l6.1-5.9 1.4 1.4L7 15h14v2z" />
    </>
  ),
  tag: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 3H4a1 1 0 0 0-1 1v7a1 1 0 0 0 .29.7l9 9a1 1 0 0 0 1.42 0l7-7a1 1 0 0 0 0-1.4l-9-9A1 1 0 0 0 11 3zM7 8.5A1.5 1.5 0 1 1 7 5.5a1.5 1.5 0 0 1 0 3z"
    />
  ),
  star: (
    <polygon points="12,2 14.9,8.6 22,9.3 16.5,13.9 18.2,21 12,17.3 5.8,21 7.5,13.9 2,9.3 9.1,8.6" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </>
  ),
  chevronRight: <polygon points="9,4 9,20 19,12" />,
  check: (
    <polygon points="9,16.2 4.8,12 3.4,13.4 9,19 20.6,7.4 19.2,6" />
  ),
  close: (
    <>
      <rect x="11" y="2" width="2" height="20" rx="1" transform="rotate(45 12 12)" />
      <rect x="11" y="2" width="2" height="20" rx="1" transform="rotate(-45 12 12)" />
    </>
  ),
  menu: (
    <>
      <rect x="3" y="5" width="18" height="2" rx="1" />
      <rect x="3" y="11" width="18" height="2" rx="1" />
      <rect x="3" y="17" width="18" height="2" rx="1" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1 12.5a1 1 0 0 1-1 1.1H6a1 1 0 0 1-1-1.1L6 8z" />
      <rect x="8.3" y="4" width="7.4" height="1.6" rx="0.8" />
      <rect x="8.3" y="5" width="1.6" height="4" rx="0.8" />
      <rect x="14.1" y="5" width="1.6" height="4" rx="0.8" />
    </>
  ),
  heart: (
    <path d="M12 21s-7.5-4.6-10-9.1C.5 8.6 2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5 18 5 19.5 8.6 22 11.9 19.5 16.4 12 21 12 21z" />
  ),
  palette: (
    <>
      <circle cx="9" cy="9" r="5" opacity=".55" />
      <circle cx="15" cy="9" r="5" opacity=".55" />
      <circle cx="12" cy="14" r="5" opacity=".55" />
    </>
  ),
  arrowRight: (
    <path d="M4 11h13.2l-4.6-4.6L14 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2z" />
  ),
  cap: (
    <>
      <polygon points="12,4 22,9 12,14 2,9" />
      <path d="M7 10.5 12 12.5 17 10.5V15c0 1.8-2.4 3-5 3s-5-1.2-5-3v-4.5z" />
      <circle cx="21" cy="9.5" r="1.1" />
    </>
  ),
  ring: (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 15A5 5 0 1 0 17 15A5 5 0 1 0 7 15Z M9.2 15A2.8 2.8 0 1 1 14.8 15A2.8 2.8 0 1 1 9.2 15Z"
      />
      <polygon points="12,4 14.3,8 12,10.8 9.7,8" />
    </>
  ),
  bolt: <polygon points="13,2 4,14 11,14 9,22 20,9 13,9" />,
  shoe: (
    <path d="M2 18.5v-2c0-.9.7-1.7 1.6-1.9l3.3-2.9c.7-.6 1.6-1 2.5-1h3.3c2 0 3.9 1.1 4.9 2.8l1 1.7c.9.3 1.4 1.1 1.4 2v1.3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
  ),
};

export default function Icon({ name, className = '', size }: IconProps) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      style={size ? { width: size, height: size } : undefined}
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

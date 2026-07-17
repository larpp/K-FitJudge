import Icon, { type IconName } from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

interface ComingSoonProps {
  icon: IconName;
  title: string;
  description: string;
}

/** Stage 4에서 실제 화면(로그인/마이페이지/요금제)으로 채워질 임시 자리표시자. */
export default function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <div className="container coming-soon">
      <div className="coming-soon__icon">
        <Icon name={icon} size={30} />
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/">
        <Button variant="outline" size="sm">
          홈으로
        </Button>
      </Link>
    </div>
  );
}

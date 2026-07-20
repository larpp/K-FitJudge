import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import ResultStep from '../components/evaluate/ResultStep';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { tpoOptions } from '../data/tpoOptions';
import type { ScoreCategory, StrengthEntry, FeedbackEntry } from '../data/mockScoring';
import type { StyleIntent } from '../components/evaluate/IntentStep';
import './HistoryDetailPage.css';

interface EvaluationRow {
  id: string;
  tpo: string;
  intent: StyleIntent;
  overall_score: number;
  categories: ScoreCategory[];
  strengths: StrengthEntry[];
  improvements: FeedbackEntry[];
  photo_path: string | null;
  edited_photo_path: string | null;
  created_at: string;
}

export default function HistoryDetailPage() {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const m = t.mypage;

  const [row, setRow] = useState<EvaluationRow | null | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [editedPhotoUrl, setEditedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select(
          'id, tpo, intent, overall_score, categories, strengths, improvements, photo_path, edited_photo_path, created_at',
        )
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;
      // 조회 자체가 에러(예: 최근에 추가된 컬럼이 반영 안 됨)로 실패한 경우를 "기록 없음"과
      // 구분해서 콘솔에 남겨야 나중에 원인을 바로 알 수 있다.
      if (error) console.error('Failed to load evaluation detail:', error.message);
      setRow((data as EvaluationRow | null) ?? null);

      if (data?.photo_path) {
        const { data: signed } = await supabase.storage
          .from('evaluation-photos')
          .createSignedUrl(data.photo_path, 3600);
        if (!cancelled && signed) setPhotoUrl(signed.signedUrl);
      }
      if (data?.edited_photo_path) {
        const { data: signedEdited } = await supabase.storage
          .from('evaluation-photos')
          .createSignedUrl(data.edited_photo_path, 3600);
        if (!cancelled && signedEdited) setEditedPhotoUrl(signedEdited.signedUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, id]);

  if (authLoading || (user && row === undefined)) {
    return <div className="container history-detail-loading" aria-busy="true" />;
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card history-detail-notfound">
          <div className="history-detail-notfound__icon">
            <Icon name="user" size={26} />
          </div>
          <h1>{m.protectedTitle}</h1>
          <p>{m.protectedDesc}</p>
          <Link to="/login">
            <Button>{m.loginCta}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tpoOption = row ? tpoOptions.find((o) => o.key === row.tpo) : null;

  if (!row || !tpoOption) {
    return (
      <div className="container">
        <div className="card history-detail-notfound">
          <div className="history-detail-notfound__icon">
            <Icon name="close" size={26} />
          </div>
          <h1>{m.historyNotFoundTitle}</h1>
          <p>{m.historyNotFoundDesc}</p>
          <Link to="/mypage">
            <Button>{m.historyDetailBack}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container history-detail">
      <ResultStep
        result={{
          overall: row.overall_score,
          categories: row.categories,
          strengths: row.strengths,
          improvements: row.improvements,
        }}
        tpo={tpoOption}
        intent={row.intent}
        previewUrl={photoUrl}
        dateLabel={new Date(row.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
        backLabel={m.historyDetailBack}
        evaluationId={row.id}
        initialEditedUrl={editedPhotoUrl}
        onReset={() => navigate('/mypage')}
      />
    </div>
  );
}

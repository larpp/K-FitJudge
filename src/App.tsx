import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import EvaluatePage from './pages/EvaluatePage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import PricingPage from './pages/PricingPage';
import TossReturnPage from './pages/TossReturnPage';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/evaluate" element={<EvaluatePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/toss/success" element={<TossReturnPage />} />
          <Route path="/payment/toss/fail" element={<TossReturnPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

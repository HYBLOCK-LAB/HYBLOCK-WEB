import { Suspense } from 'react';
import CheckInForm from '@/components/CheckInForm';

export const dynamic = 'force-dynamic';

export default function CheckInPage() {
  return (
    <div className="container">
      <div className="card">
        <div className="logo-container">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>
        
        <h1>출석 체크</h1>
        <Suspense fallback={<div>로딩 중...</div>}>
          <CheckInForm />
        </Suspense>
      </div>
    </div>
  );
}

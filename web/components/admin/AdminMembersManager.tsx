'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';

type AdminMember = {
  id: number;
  name: string;
  cohort: number;
  affiliation?: 'development' | 'business' | null;
  hasAssignment?: boolean;
  isActive: boolean;
};

export default function AdminMembersManager({ initialMembers }: { initialMembers: AdminMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleToggleAssignment = async (memberId: number, nextValue: boolean) => {
    try {
      setUpdatingId(memberId);
      const response = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, hasAssignment: nextValue }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? '산출물 상태 변경에 실패했습니다.');
      }

      setMembers((current) =>
        current.map((member) => (
          member.id === memberId ? { ...member, hasAssignment: nextValue } : member
        )),
      );
    } catch (error) {
      console.error('Assignment toggle error:', error);
      window.alert(error instanceof Error ? error.message : '산출물 상태 변경에 실패했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-monolith-outlineVariant/20">
      <table className="min-w-full divide-y divide-monolith-outlineVariant/20 bg-monolith-surfaceLowest text-sm">
        <thead className="bg-monolith-surfaceLow text-left text-monolith-onSurfaceMuted">
          <tr>
            <th className="px-5 py-4 font-semibold">이름</th>
            <th className="px-5 py-4 font-semibold">기수</th>
            <th className="px-5 py-4 font-semibold">파트</th>
            <th className="px-5 py-4 font-semibold">산출물</th>
            <th className="px-5 py-4 font-semibold">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-monolith-outlineVariant/15">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-5 py-4 font-semibold text-monolith-onSurface">{member.name}</td>
              <td className="px-5 py-4 text-monolith-onSurfaceMuted">{member.cohort}기</td>
              <td className="px-5 py-4 text-monolith-onSurfaceMuted">
                {member.affiliation === 'development' ? 'Development' : member.affiliation === 'business' ? 'Business' : '-'}
              </td>
              <td className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => void handleToggleAssignment(member.id, !member.hasAssignment)}
                  disabled={updatingId === member.id}
                  className={[
                    'inline-flex min-w-[96px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition',
                    member.hasAssignment
                      ? 'bg-monolith-primaryFixed text-monolith-primary'
                      : 'bg-monolith-surfaceLow text-monolith-onSurfaceMuted',
                  ].join(' ')}
                >
                  {updatingId === member.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                  {member.hasAssignment ? '제출 완료' : '미제출'}
                </button>
              </td>
              <td className="px-5 py-4">
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]',
                    member.isActive
                      ? 'bg-monolith-primaryFixed text-monolith-primary'
                      : 'bg-monolith-surfaceLow text-monolith-onSurfaceMuted',
                  ].join(' ')}
                >
                  {member.isActive ? 'active' : 'inactive'}
                </span>
              </td>
            </tr>
          ))}
          {members.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-monolith-onSurfaceMuted">
                불러온 멤버 데이터가 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

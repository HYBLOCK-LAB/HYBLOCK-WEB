import AdminSectionShell from '@/components/admin/AdminSectionShell';
import ApplicantTable from '@/components/recruitment/ApplicantTable';
import { applicationStatusLabels, getApplicants, getCampaigns } from '@/lib/recruitment-admin';

export const dynamic = 'force-dynamic';
type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function RecruitmentAdminPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const campaigns = await getCampaigns();
  const campaignId = typeof params.campaign === 'string' ? params.campaign : campaigns[0]?.id;
  const query = typeof params.q === 'string' ? params.q.trim().toLowerCase() : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const track = typeof params.track === 'string' ? params.track : '';
  const school = typeof params.school === 'string' ? params.school.trim().toLowerCase() : '';
  const sort = typeof params.sort === 'string' ? params.sort : 'submittedAt';
  const direction = params.direction === 'asc' ? 1 : -1;
  const applicants = campaignId ? await getApplicants(campaignId) : [];
  const filtered = applicants.filter((item) => (!query || item.name.toLowerCase().includes(query)) && (!status || item.status === status) && (!track || item.trackCode === track) && (!school || item.university.toLowerCase().includes(school)));
  filtered.sort((a, b) => {
    const left = a[sort as keyof typeof a]; const right = b[sort as keyof typeof b];
    if (left == null) return 1; if (right == null) return -1;
    return (typeof left === 'number' ? left - Number(right) : String(left).localeCompare(String(right), 'ko')) * direction;
  });
  const nextDirection = params.direction === 'asc' ? 'desc' : 'asc';
  const sortHref = (key: string) => { const next = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (typeof v === 'string') next.set(k,v); }); next.set('sort', key); next.set('direction', sort === key ? nextDirection : 'desc'); return `?${next}`; };

  return <AdminSectionShell currentPath="/admin/recruitment" title="지원자 관리" description="지원자를 검색·필터링하고 행을 선택해 지원서와 평가 내용을 확인합니다.">
    <form className="grid gap-3 rounded-xl bg-monolith-surface-low p-4 md:grid-cols-2 xl:grid-cols-5">
      <select name="campaign" defaultValue={campaignId} className="min-h-11 rounded-lg border border-monolith-outline-variant bg-white px-3 text-sm"><option value="">모집 기수</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.cohort}기 · {campaign.title}</option>)}</select>
      <input name="q" defaultValue={query} placeholder="이름 검색" className="min-h-11 rounded-lg border border-monolith-outline-variant bg-white px-3 text-sm" />
      <select name="status" defaultValue={status} className="min-h-11 rounded-lg border border-monolith-outline-variant bg-white px-3 text-sm"><option value="">모든 상태</option>{Object.entries(applicationStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select name="track" defaultValue={track} className="min-h-11 rounded-lg border border-monolith-outline-variant bg-white px-3 text-sm"><option value="">모든 분야</option><option value="development">개발팀</option><option value="business">비즈니스팀</option></select>
      <div className="flex gap-2"><input name="school" defaultValue={school} placeholder="대학교" className="min-w-0 flex-1 rounded-lg border border-monolith-outline-variant bg-white px-3 text-sm" /><button className="min-h-11 rounded-lg bg-monolith-primary px-4 text-sm font-bold text-white">적용</button></div>
    </form>
    <ApplicantTable applicants={filtered} sortLinks={{ birthYear: sortHref('birthYear'), documentScore: sortHref('documentScore'), interviewScore: sortHref('interviewScore'), submittedAt: sortHref('submittedAt') }}/>
  </AdminSectionShell>;
}

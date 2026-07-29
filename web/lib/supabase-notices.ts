import { getSupabase } from '@/lib/supabase';

export type NoticeItem = {
  id: number;
  category: string;
  title: string;
  author: string;
  date: string;
  content: string;
  images: string[];
};

type NoticeRow = {
  id: number;
  category: string;
  title: string;
  author: string;
  date: string;
  content: string;
  images: string[] | null;
};

const localNoticeFixtures: NoticeItem[] = [
  {
    id: 124,
    category: '학술',
    title: '블록체인 인프라 보안 강화 세미나 자료 배포',
    author: '기술팀장',
    date: '2024-08-12',
    content: `## 세미나 자료 안내

블록체인 인프라 보안 강화 세미나에서 사용한 발표 자료를 공유합니다.

- 노드와 RPC 엔드포인트의 기본 보안 점검
- 스마트 컨트랙트 배포 전 확인 사항
- 사고 대응 절차와 권한 관리

이 공지는 Supabase 연결 전 로컬 화면을 확인하기 위한 예시 데이터입니다.`,
    images: [],
  },
  {
    id: 123,
    category: '이벤트',
    title: '제4회 HYBLOCK 해커톤 참가자 모집 (9/1~9/15)',
    author: '이벤트기획팀',
    date: '2024-08-10',
    content: `## 참가 안내

HYBLOCK 해커톤 참가자를 모집합니다. 팀 구성과 세부 일정은 운영진 안내 채널에서 확인해 주세요.

- 모집 기간: 9월 1일 ~ 9월 15일
- 대상: HYBLOCK 회원
- 제출 항목: 참가 동기와 관심 주제

이 공지는 Supabase 연결 전 로컬 화면을 확인하기 위한 예시 데이터입니다.`,
    images: [],
  },
  {
    id: 122,
    category: '운영',
    title: '8월 정기 커뮤니티 데이 장소 변경 안내',
    author: '운영지원팀',
    date: '2024-08-05',
    content: `## 장소 변경

8월 정기 커뮤니티 데이 장소가 변경되었습니다. 참석 전 공지 채널의 최종 위치를 확인해 주세요.

이 공지는 Supabase 연결 전 로컬 화면을 확인하기 위한 예시 데이터입니다.`,
    images: [],
  },
  {
    id: 121,
    category: '학술',
    title: '스마트 컨트랙트 최적화 기법에 관한 연구 공유',
    author: '학술팀',
    date: '2024-07-28',
    content: `## 연구 공유

가스 비용과 코드 가독성을 함께 고려한 스마트 컨트랙트 최적화 사례를 공유합니다.

이 공지는 Supabase 연결 전 로컬 화면을 확인하기 위한 예시 데이터입니다.`,
    images: [],
  },
  {
    id: 120,
    category: '운영',
    title: '개인정보 처리방침 개정 관련 사전 안내',
    author: '관리팀',
    date: '2024-07-20',
    content: `## 개정 사전 안내

개인정보 처리방침 개정 예정 사항을 사전에 안내합니다. 실제 운영 공지는 Supabase 연결 후 관리자 화면에서 등록해 주세요.

이 공지는 Supabase 연결 전 로컬 화면을 확인하기 위한 예시 데이터입니다.`,
    images: [],
  },
];

function hasSupabaseConfig() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && key);
}

export function isUsingLocalNoticeFixtures() {
  if (process.env.HYBLOCK_USE_LOCAL_NOTICE_FIXTURES === '1') return true;
  if (process.env.HYBLOCK_USE_LOCAL_NOTICE_FIXTURES === '0') return false;

  return process.env.NODE_ENV === 'development' && !hasSupabaseConfig();
}

function getFilteredLocalNotices(params: { category?: string; query?: string }) {
  const keyword = params.query?.trim().toLocaleLowerCase('ko-KR');

  return localNoticeFixtures.filter((notice) => {
    if (params.category && params.category !== '전체' && notice.category !== params.category) {
      return false;
    }

    if (!keyword) return true;

    return [notice.title, notice.author, notice.content].some((value) =>
      value.toLocaleLowerCase('ko-KR').includes(keyword),
    );
  });
}

export async function getNoticeCategories() {
  if (isUsingLocalNoticeFixtures()) {
    return ['전체', ...Array.from(new Set(localNoticeFixtures.map((notice) => notice.category)))];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.from('notice').select('category').returns<Array<{ category: string }>>();

  if (error) throw error;

  const categories = Array.from(new Set((data ?? []).map((row) => row.category.trim()).filter(Boolean)));
  return ['전체', ...categories];
}

export async function getPaginatedNotices(params: {
  page: number;
  pageSize: number;
  category?: string;
  query?: string;
}) {
  if (isUsingLocalNoticeFixtures()) {
    const notices = getFilteredLocalNotices(params);
    const from = (params.page - 1) * params.pageSize;

    return {
      notices: notices.slice(from, from + params.pageSize),
      totalCount: notices.length,
    };
  }

  const supabase = getSupabase();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .from('notice')
    .select('id, category, title, author, date, content, images', { count: 'exact' })
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (params.category && params.category !== '전체') {
    query = query.eq('category', params.category);
  }

  if (params.query) {
    const keyword = params.query.replaceAll(',', ' ').trim();
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,author.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }
  }

  const { data, error, count } = await query.range(from, to).returns<NoticeRow[]>();

  if (error) throw error;

  return {
    notices: (data ?? []).map<NoticeItem>((notice) => ({
      ...notice,
      images: notice.images ?? [],
    })),
    totalCount: count ?? 0,
  };
}

export async function getAllNotices() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('notice')
    .select('id, category, title, author, date, content, images')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .returns<NoticeRow[]>();

  if (error) throw error;

  return (data ?? []).map<NoticeItem>((notice) => ({
    ...notice,
    images: notice.images ?? [],
  }));
}

export async function getNoticeById(id: number) {
  if (isUsingLocalNoticeFixtures()) {
    return localNoticeFixtures.find((notice) => notice.id === id) ?? null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('notice')
    .select('id, category, title, author, date, content, images')
    .eq('id', id)
    .maybeSingle<NoticeRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    images: data.images ?? [],
  } satisfies NoticeItem;
}

export async function createNotice(params: {
  category: string;
  title: string;
  author: string;
  date: string;
  content: string;
  images: string[];
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('notice')
    .insert({
      category: params.category,
      title: params.title,
      author: params.author,
      date: params.date,
      content: params.content,
      images: params.images,
    })
    .select('id, category, title, author, date, content, images')
    .single<NoticeRow>();

  if (error) throw error;

  return {
    ...data,
    images: data.images ?? [],
  } satisfies NoticeItem;
}

export async function updateNotice(params: {
  id: number;
  category: string;
  title: string;
  author: string;
  date: string;
  content: string;
  images: string[];
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('notice')
    .update({
      category: params.category,
      title: params.title,
      author: params.author,
      date: params.date,
      content: params.content,
      images: params.images,
    })
    .eq('id', params.id)
    .select('id, category, title, author, date, content, images')
    .single<NoticeRow>();

  if (error) throw error;

  return {
    ...data,
    images: data.images ?? [],
  } satisfies NoticeItem;
}

export async function deleteNotice(id: number) {
  const supabase = getSupabase();
  const { error } = await supabase.from('notice').delete().eq('id', id);
  if (error) throw error;
}

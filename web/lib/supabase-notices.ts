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

export async function getNoticeCategories() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('notice').select('category').returns<Array<{ category: string }>>();

    if (error) throw error;

    const categories = Array.from(new Set((data ?? []).map((row) => row.category.trim()).filter(Boolean)));
    return ['전체', ...categories];
  } catch (error) {
    console.error('getNoticeCategories error:', error);
    return ['전체'];
  }
}

export async function getPaginatedNotices(params: {
  page: number;
  pageSize: number;
  category?: string;
  query?: string;
}) {
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

import { createClient } from '@supabase/supabase-js';

// 백업 가능한 테이블만 허용 (그 외 테이블 이름은 거부)
const ALLOWED_TABLES = ['members', 'products', 'rounds', 'orders'];
const MAX_ROWS = 5000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured with Supabase credentials' });
  }

  // 1) 로그인 토큰 확인: "Authorization: Bearer <access_token>"
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized (no token)' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Unauthorized (invalid token)' });
  }

  // 2) 요청 내용 검사
  const { table_name, group_id, snapshot } = req.body || {};
  if (!ALLOWED_TABLES.includes(table_name) || !group_id || !Array.isArray(snapshot)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  if (snapshot.length > MAX_ROWS) {
    return res.status(413).json({ error: 'Snapshot too large' });
  }

  // 3) 권한 확인: 자기 여선교회 데이터만 백업 가능 (본부 head는 전체 가능)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('group_id, role')
    .eq('id', userData.user.id)
    .single();
  if (profileError || !profile) {
    return res.status(403).json({ error: 'Forbidden (no profile)' });
  }
  const isHead = profile.role === 'head';
  if (!isHead && String(profile.group_id) !== String(group_id)) {
    return res.status(403).json({ error: 'Forbidden (group mismatch)' });
  }

  // 4) 백업 저장
  try {
    const { error } = await supabase
      .from('order_backups')
      .insert([{ table_name, group_id, snapshot }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}

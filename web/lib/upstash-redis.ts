const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

type UpstashResponse<T> = {
  result?: T;
  error?: string;
};

function getUpstashConfig() {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis environment variables are not configured.');
  }

  return {
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  };
}

export async function executeRedisCommand<T>(command: Array<string | number>) {
  const { url, token } = getUpstashConfig();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as UpstashResponse<T>;
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result ?? null;
}

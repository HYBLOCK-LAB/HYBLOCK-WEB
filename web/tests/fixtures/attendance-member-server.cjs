// Local-only member service for protected-page browser tests. No production data.
const http = require('node:http');
const member = { id: 1, wallet_address: '0x1111111111111111111111111111111111111111', name: '테스트 관리자', major: '컴퓨터', cohort: 1, affiliation: 'development', role: 'admin', is_active: true, is_admin: true, has_assignment: false };
http.createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (request.url.startsWith('/rest/v1/member')) {
    response.end(JSON.stringify(request.headers.accept?.includes('object+json') ? member : [member]));
  } else if (request.url === '/health') response.end('{}');
  else { response.statusCode = 404; response.end('{}'); }
}).listen(5184, '127.0.0.1');

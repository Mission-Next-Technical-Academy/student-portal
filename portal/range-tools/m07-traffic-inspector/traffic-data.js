// Traffic Inspector — dataset for Module 7 (network/web-assessment side).
//
// Request/response rows ported from the Mission Next SOC Analyst Track's
// "sa-3" Web Application Security Assessment lab (`src/data/labs/
// security-assessments.labs.js`, `buildSa3Burp()`), copied as part of the
// Epic B/C migration (docs/LAB_MIGRATION_MATRIX.md, "Security-assessment
// web proxy (BurpProxyLabShell)" row — the network/web-assessment analog
// available for Module 7; the email side of this module has no
// Mission Next source and is left untouched). The captured-traffic values
// are unchanged from the source (same host, same price-manipulation and
// injection indicators); the ~80-row noise volume was trimmed to a
// representative set for a standalone lab page. The task list's
// `validation` objects are visible client-side, same limitation carried
// over from the source app's task list (see the matrix row's RISKS
// column) — not fixed here.
//
// Per the matrix row's REQUIRED ADAPTATION: the source's one-click
// "mark complete" shortcut is NOT ported. Every task here validates real
// evidence the student produced — either a saved request from the
// history table, or an actual manipulated request sent through Repeater —
// never a single click that claims completion without review.

const M07_TRAFFIC_DATASET = {
  id: 'm07-web-traffic-assessment',
  title: 'app.example.local — Captured Proxy Session',
  subtitle: 'Web Application Security Assessment',
  description: 'Customer reports show inconsistent prices appearing on completed orders for app.example.local. Use the captured traffic to identify the vulnerability class that allows price manipulation, then verify two other findings flagged by automated tooling.',
  requests: [
    { id: 'r1', method: 'GET', url: '/', status: 200, length: 4128, mime: 'HTML', title: 'app.example — home',
      request: 'GET / HTTP/1.1\nHost: app.example.local\nUser-Agent: Mozilla/5.0\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 4128\n\n<html>...home page...</html>\n' },
    { id: 'r2', method: 'GET', url: '/login', status: 200, length: 3214, mime: 'HTML', title: 'Login',
      request: 'GET /login HTTP/1.1\nHost: app.example.local\nUser-Agent: Mozilla/5.0\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 3214\n\n<html>...login form...</html>\n' },
    { id: 'r3', method: 'POST', url: '/login', status: 302, length: 0, mime: 'HTML', title: 'redirect /dashboard',
      request: 'POST /login HTTP/1.1\nHost: app.example.local\nContent-Type: application/x-www-form-urlencoded\n\nusername=j.sanders&password=Spring2026!\n',
      response: 'HTTP/1.1 302 Found\nLocation: /dashboard\nSet-Cookie: PHPSESSID=8f3a1c; Path=/\n\n' },
    { id: 'r4', method: 'GET', url: '/dashboard', status: 200, length: 5921, mime: 'HTML', title: 'Dashboard',
      request: 'GET /dashboard HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 5921\n\n<html>...dashboard...</html>\n' },
    { id: 'r5', method: 'GET', url: '/api/users/me', status: 200, length: 612, mime: 'JSON', title: '',
      request: 'GET /api/users/me HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: application/json\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":1001,"username":"j.sanders","role":"customer"}\n' },
    { id: 'r6', method: 'GET', url: '/products', status: 200, length: 8244, mime: 'HTML', title: 'Catalog',
      request: 'GET /products HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 8244\n\n<html>...product grid...</html>\n' },
    { id: 'r7', method: 'GET', url: '/products/4', status: 200, length: 4128, mime: 'HTML', title: 'Product 4',
      request: 'GET /products/4 HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 4128\n\n<html>...product detail, price $199.00...</html>\n' },
    { id: 'r8', method: 'GET', url: '/cart', status: 200, length: 2918, mime: 'HTML', title: 'Cart',
      request: 'GET /cart HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 2918\n\n<html>...empty cart...</html>\n' },
    { id: 'r-cart-add', method: 'POST', url: '/cart/add', status: 200, length: 412, mime: 'JSON', title: '', evidence: true,
      request: 'POST /cart/add HTTP/1.1\nHost: app.example.local\nContent-Type: application/x-www-form-urlencoded\nCookie: PHPSESSID=8f3a1c\n\nproduct_id=4&quantity=1&price=199.00\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"ok":true,"cartTotal":199.00,"items":1}\n',
      responseManipulated: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"ok":true,"cartTotal":1.00,"items":1}\n',
      summary: 'Adds a product to the cart. The price is submitted by the client rather than looked up server-side — a request sent through Repeater with a rewritten price field is the way to confirm that.' },
    { id: 'r9', method: 'GET', url: '/cart', status: 200, length: 3104, mime: 'HTML', title: 'Cart (1 item)',
      request: 'GET /cart HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 3104\n\n<html>...cart, 1 item...</html>\n' },
    { id: 'r10', method: 'POST', url: '/checkout', status: 302, length: 0, mime: 'HTML', title: 'redirect /thanks',
      request: 'POST /checkout HTTP/1.1\nHost: app.example.local\nContent-Type: application/x-www-form-urlencoded\nCookie: PHPSESSID=8f3a1c\n\nconfirm=1\n',
      response: 'HTTP/1.1 302 Found\nLocation: /thanks\n\n' },
    { id: 'r11', method: 'GET', url: '/search?q=phone', status: 200, length: 4118, mime: 'HTML', title: 'Search results',
      request: 'GET /search?q=phone HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h2>Results for: phone</h2>...\n' },
    { id: 'r-search-xss', method: 'GET', url: '/search?q=<script>alert(1)</script>', status: 200, length: 4218, mime: 'HTML', title: 'Search results', evidence: true,
      request: 'GET /search?q=<script>alert(1)</script> HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h2>Results for: <script>alert(1)</script></h2>...\n',
      summary: 'The search query is reflected back into the page unescaped. A script tag submitted as the query string is returned verbatim in the response body — a reflected XSS indicator.' },
    { id: 'r12', method: 'GET', url: '/admin', status: 404, length: 287, mime: 'HTML', title: 'Not Found',
      request: 'GET /admin HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 404 Not Found\nContent-Type: text/html\nContent-Length: 287\n\n<html>...not found...</html>\n' },
    { id: 'r13', method: 'GET', url: '/.env', status: 404, length: 281, mime: 'HTML', title: 'Not Found',
      request: 'GET /.env HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n',
      response: 'HTTP/1.1 404 Not Found\nContent-Type: text/html\nContent-Length: 281\n\n<html>...not found...</html>\n' },
    { id: 'r-sqli', method: 'GET', url: "/products?id=1'", status: 500, length: 612, mime: 'HTML', title: 'Internal Server Error', evidence: true,
      request: "GET /products?id=1' HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: */*\n\n",
      response: "HTTP/1.1 500 Internal Server Error\nContent-Type: text/html\n\nYou have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '''' at line 1\n",
      summary: 'A single quote appended to the id parameter produces a raw SQL syntax error in the response — the parameter reaches a query without safe handling, a SQL injection indicator.' },
    { id: 'r14', method: 'GET', url: '/api/products?cat=1', status: 200, length: 1031, mime: 'JSON', title: '',
      request: 'GET /api/products?cat=1 HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: application/json\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"items":[{"id":1,"price":199.00}]}\n' },
    { id: 'r15', method: 'GET', url: '/api/products?cat=2', status: 200, length: 1038, mime: 'JSON', title: '',
      request: 'GET /api/products?cat=2 HTTP/1.1\nHost: app.example.local\nCookie: PHPSESSID=8f3a1c\nAccept: application/json\n\n',
      response: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"items":[{"id":2,"price":89.00}]}\n' },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Confirm the price-manipulation vulnerability',
      points: 40,
      description: 'The cart total is trusted from client input. Send the POST /cart/add request through Repeater, rewrite price=199.00 to price=1, and send it to confirm the server accepts the manipulated value.',
      hint: 'Select r-cart-add in the traffic table, click "Send to Repeater", edit the request body to price=1, then click Send.',
      validation: { type: 'repeater-manipulated', requestId: 'r-cart-add' },
    },
    {
      id: 't2',
      title: 'Save the reflected XSS evidence',
      points: 30,
      description: 'Inspect the /search?q=<script>… request and confirm the payload is reflected unescaped in the response body, then save it as evidence.',
      hint: 'Select the /search?q=<script>alert(1)</script> row, read the response pane, then save the evidence.',
      validation: { type: 'evidence', requestId: 'r-search-xss' },
    },
    {
      id: 't3',
      title: 'Save the SQL injection evidence',
      points: 30,
      description: "Inspect the /products?id=1' request and confirm the raw SQL syntax error in the response, then save it as evidence.",
      hint: "Select the /products?id=1' row (status 500) and read the response before saving.",
      validation: { type: 'evidence', requestId: 'r-sqli' },
    },
  ],
};

Object.assign(window, { M07_TRAFFIC_DATASET });

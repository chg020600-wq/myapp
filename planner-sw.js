// 나의 플래너 서비스 워커: planner_1.html 에만 적용됩니다. (같은 저장소의 다른 앱에는 영향 없음)
// 화면(HTML)은 항상 인터넷에서 최신본을 먼저 받고, 연결이 없을 때만 저장본을 씁니다.
var V = 'planner-sw-v2';
var PAGE = new URL('./planner_1.html', self.location.href).href;
var SHELL = [PAGE, 'planner.webmanifest', 'planner-icon-192.png', 'planner-icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function(c){
    return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); }));
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== V; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var r = e.request;
  if(r.method !== 'GET') return;
  var u = new URL(r.url);
  var sameOrigin = (u.origin === self.location.origin);
  var firebaseSdk = (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0);
  if(!sameOrigin && !firebaseSdk) return;   // 로그인·데이터 통신은 건드리지 않음

  if(r.mode === 'navigate'){
    var key = u.origin + u.pathname;        // 주소 뒤의 ?와 #는 빼고 저장
    e.respondWith(
      fetch(r).then(function(res){
        var cp = res.clone();
        caches.open(V).then(function(c){ c.put(key, cp); });
        return res;
      }).catch(function(){
        return caches.match(key).then(function(m){ return m || caches.match(PAGE); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(function(m){
      var net = fetch(r).then(function(res){
        if(res && res.ok){ var cp = res.clone(); caches.open(V).then(function(c){ c.put(r, cp); }); }
        return res;
      }).catch(function(){ return m; });
      return m || net;
    })
  );
});

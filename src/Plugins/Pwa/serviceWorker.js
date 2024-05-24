const CACHE_NAMES = {
  API: "api-cache-v1",
};

// 安装pwa服务
self.addEventListener("install", (event) => {});

// 激活pwa服务
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 需要拦截的URL
const urlsToCache = ["/VirtualFile/GetPublishFile"];

// 拦截请求
self.addEventListener("fetch", (event) => {
  const Url = new URL(event.request.url);
  if (urlsToCache.includes(Url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAMES.API).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});

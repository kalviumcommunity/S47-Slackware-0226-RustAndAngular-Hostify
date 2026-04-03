Performance optimizations implemented:

1) Caching (ProductService.getProductsDb)
- Location: `conceptKlarity/angular/product.service.ts`
- What is cached: DB-backed product list responses returned by `getProductsDb(page, limit, name)`.
- Cache key: `p=<page>&l=<limit>&n=<name>`.
- TTL: 30 seconds (configurable in the service).
- When cache is used: identical calls (same page/limit/name) within TTL return cached data via `of(...)` without hitting the network.
- Invalidation: cache is cleared when `createProduct(...)` is called to ensure fresh reads after writes.

Why: avoids repeated identical network requests for short-lived lists (improves responsiveness when users toggle filters or re-open lists).

2) Debounce (search input)
- Location: `conceptKlarity/angular/product-list.component.ts` and `product-list.component.html`.
- Where applied: the search input triggers `onSearchChange(...)`; inside the component a `search$` Subject is debounced with `debounceTime(300)` and `distinctUntilChanged()`.
- Why: prevents making an API call on every keystroke; API is called only after the user stops typing for 300ms.

3) Throttle (load-more)
- Location: `conceptKlarity/angular/product-list.component.ts` and `product-list.component.html`.
- Where applied: `loadMore()` pushes to `loadMore$`; the stream is throttled with `throttleTime(1000)`.
- Why: prevents accidental rapid repeated page loads (e.g., multiple clicks) and limits heavy operations to a controlled rate.

How these optimizations reduce API calls
- Debounce reduces search-triggered requests during typing.
- Cache avoids repeated identical paginated queries for a short period.
- Throttle prevents burst requests from rapid UI interactions.

How to test locally
1. Ensure backend is running at `http://localhost:8080`.
2. Start Angular app (use Node LTS):

```bash
npm ci
npm start
```

3. Open the app and type into the "Search products" box: observe network calls only after typing pauses ~300ms.
4. Click "Load more" repeatedly: extra clicks within 1s are ignored.
5. Create a new product using the form: cache is cleared, subsequent list fetches will reflect the new item.

Notes and next steps
- Cache TTL and throttle/debounce timings are conservative defaults and can be tuned for your UX.
- For multi-user/multi-tab scenarios consider a shared storage or server-side cache with ETags.
- If you need, I can add unit tests (Jasmine/Karma) to verify caching behavior and RxJS streams.

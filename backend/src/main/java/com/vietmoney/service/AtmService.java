package com.vietmoney.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietmoney.domain.entity.AtmCache;
import com.vietmoney.domain.entity.SavedAtm;
import com.vietmoney.domain.entity.ScannedRegion;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.SavedAtmRequest;
import com.vietmoney.repository.AtmCacheRepository;
import com.vietmoney.repository.SavedAtmRepository;
import com.vietmoney.repository.ScannedRegionRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AtmService {

    private final UserRepository userRepository;
    private final SavedAtmRepository savedAtmRepository;
    private final AtmCacheRepository atmCacheRepository;
    private final ScannedRegionRepository scannedRegionRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.goong.api-key:}")
    private String goongApiKey;

    // ── Goong API endpoints ────────────────────────────────────────────────────
    private static final String GOONG_DIRECTION_URL    = "https://rsapi.goong.io/Direction";
    private static final String GOONG_AUTOCOMPLETE_URL = "https://rsapi.goong.io/Place/AutoComplete";
    private static final String GOONG_DETAIL_URL       = "https://rsapi.goong.io/Place/Detail";

    /**
     * ✦ KEY FIX: Dùng Text Search thay AutoComplete.
     *   Text Search trả lat/lng ngay trong response → không cần gọi Detail riêng.
     *   Docs: https://docs.goong.io/rest/place/#place-search-api
     */
    private static final String GOONG_TEXTSEARCH_URL = "https://rsapi.goong.io/Place/Search";

    // ── Pre-scan strategy constants ────────────────────────────────────────────
    /**
     * Bán kính scan mỗi sub-ô (metres).
     * Nhỏ hơn = Goong trả kết quả sát vị trí center hơn, ít bị cắt bởi limit 10.
     * 3_000m ≈ bán kính một phường/quận nhỏ → phù hợp mật độ ATM đô thị VN.
     */
    private static final int    SCAN_RADIUS_M   = 3_000;

    /**
     * Kích thước ô lưới chính (độ). ~5.5 km/ô.
     * Mỗi ô được chia thành sub-grid 2×2 khi scan để tăng coverage.
     */
    private static final double SCAN_CELL_DEG   = 0.05;   // ≈ 5.5 km

    /** TTL cache — rescan sau bao nhiêu giờ */
    private static final int    CACHE_TTL_HOURS = 72;

    /**
     * ✦ CORE FIX: Query từng tên ngân hàng cụ thể thay vì chỉ "ATM"/"ngân hàng".
     *
     * Vấn đề cũ: Goong Text Search chỉ trả tối đa 10 kết quả/request.
     * Với keyword chung như "ATM" → chỉ lấy được ~10 địa điểm, bỏ sót hàng chục ngân hàng.
     *
     * Giải pháp: Query riêng từng ngân hàng lớn + query chung để bắt phần còn lại.
     * Mỗi query trả ~10 kết quả × 20 queries = ~200 ATM/ô → coverage tốt hơn nhiều.
     *
     * Thứ tự: ngân hàng lớn (nhiều ATM) trước để ưu tiên khi hit rate limit.
     */
    private static final String[] SCAN_KEYWORDS = {
            // ── Ngân hàng quốc doanh ──────────────────────────────────────────────
            "Agribank ATM", "Vietcombank ATM", "BIDV ATM", "VietinBank ATM",
            // ── TMCP lớn — dùng tên thương hiệu phổ biến nhất trên Goong ─────────
            "MB Smartbank",          // ✦ MBBank dùng brand "MB Smartbank" cho kiosk/ATM
            "MBBank ATM",            // chi nhánh truyền thống
            "Techcombank ATM", "VPBank ATM", "TPBank ATM",
            "ACB ATM", "Sacombank ATM", "HDBank ATM", "VIB ATM",
            // ── TMCP vừa ──────────────────────────────────────────────────────────
            "MSB ATM", "SeABank ATM", "OCB ATM", "SHB ATM",
            "Eximbank ATM", "LienVietPostBank ATM", "BacABank ATM",
            "NamABank ATM", "KienlongBank ATM", "PGBank ATM",
            // ── Ngân hàng nước ngoài phổ biến tại VN ──────────────────────────────
            "Shinhan ATM", "HSBC ATM", "Standard Chartered ATM",
            // ── Brand đặc biệt / kiosk không mang tên ngân hàng rõ ───────────────
            "Napas ATM",             // nhiều ATM liên ngân hàng chỉ gắn logo Napas
            "cây ATM",               // catch-all cho các máy không gắn tên ngân hàng
            "ATM ngân hàng",
    };

    /**
     * Alias map: từ khoá người dùng gõ → bankKey chuẩn trong hệ thống.
     * Dùng cho detectBankKeyFromQuery() để normalize tên tìm kiếm.
     *
     * Ví dụ: user gõ "smartbank" → resolve về "MBBank"
     */
    private static final Map<String, String> BANK_ALIASES = Map.ofEntries(
            Map.entry("vcb",          "Vietcombank"),
            Map.entry("vietcombank",  "Vietcombank"),
            Map.entry("tcb",          "Techcombank"),
            Map.entry("techcom",      "Techcombank"),
            Map.entry("bidv",         "BIDV"),
            Map.entry("mb",           "MBBank"),
            Map.entry("mbbank",       "MBBank"),
            Map.entry("smartbank",    "MBBank"),   // ✦ MB Smartbank → MBBank
            Map.entry("agr",          "Agribank"),
            Map.entry("agribank",     "Agribank"),
            Map.entry("tpbank",       "TPBank"),
            Map.entry("vpbank",       "VPBank"),
            Map.entry("hdbank",       "HDBank"),
            Map.entry("acb",          "ACB"),
            Map.entry("sacombank",    "Sacombank"),
            Map.entry("stb",          "Sacombank"),
            Map.entry("vib",          "VIB"),
            Map.entry("msb",          "MSB"),
            Map.entry("seabank",      "SeABank"),
            Map.entry("ocb",          "OCB"),
            Map.entry("vietinbank",   "VietinBank"),
            Map.entry("vietin",       "VietinBank"),
            Map.entry("ctg",          "VietinBank"),
            Map.entry("shb",          "SHB"),
            Map.entry("shinhan",      "Shinhan"),
            Map.entry("hsbc",         "HSBC")
    );

    // ── Rate limiting ──────────────────────────────────────────────────────────
    /**
     * Semaphore giới hạn concurrent HTTP calls.
     * Không dùng để bảo vệ token bucket — chỉ giới hạn concurrent Goong calls.
     */
    private final Semaphore     apiSemaphore    = new Semaphore(3, true);
    /**
     * Token bucket: số API calls tối đa trong TOKEN_WINDOW_MS.
     * Tăng lên 80 vì mỗi cell scan giờ có thể cần tới:
     *   4 sub-centers × 20 keywords = 80 calls/cell
     * Goong free tier giới hạn ~100 req/phút → 80 để có buffer.
     */
    private final AtomicInteger globalTokens    = new AtomicInteger(80);
    private volatile long       lastTokenReset  = System.currentTimeMillis();
    private static final int    GLOBAL_RPS      = 80;
    private static final long   TOKEN_WINDOW_MS = 60_000;

    // ── Per-user cooldown ──────────────────────────────────────────────────────
    private final ConcurrentHashMap<String, Long> userLastFetchMs = new ConcurrentHashMap<>();
    private static final long USER_COOLDOWN_MS = 8_000;

    // ── Executor ──────────────────────────────────────────────────────────────
    private final ExecutorService executor = Executors.newFixedThreadPool(4, r -> {
        Thread t = new Thread(r, "atm-worker");
        t.setDaemon(true);
        return t;
    });

    /** Ngăn duplicate scan cho cùng một ô */
    private final ConcurrentHashMap<String, CompletableFuture<Void>> scanInFlight
            = new ConcurrentHashMap<>();

    // ══════════════════════════════════════════════════════════════════════════
    //  PUBLIC: Lấy ATM gần vị trí
    //  1. Xác định các ô lưới cần quét
    //  2. Trigger async scan cho ô chưa có / hết TTL
    //  3. Trả ngay dữ liệu từ DB (không chờ scan)
    // ══════════════════════════════════════════════════════════════════════════
    public List<Map<String, Object>> getNearbyAtms(double lat, double lng,
                                                   int radius, String username) {
        boolean skipScanTrigger = false;
        if (username != null) {
            Long last = userLastFetchMs.get(username);
            if (last != null && System.currentTimeMillis() - last < USER_COOLDOWN_MS) {
                skipScanTrigger = true;
            }
        }

        List<int[]> neededCells = getCellsForRadius(lat, lng, radius);

        if (!skipScanTrigger) {
            LocalDateTime ttlCutoff = LocalDateTime.now().minusHours(CACHE_TTL_HOURS);
            for (int[] cell : neededCells) {
                Optional<ScannedRegion> existing =
                        scannedRegionRepository.findByGridLatAndGridLng(cell[0], cell[1]);
                if (existing.isEmpty() || existing.get().getScannedAt().isBefore(ttlCutoff)) {
                    triggerAsyncScan(cell[0], cell[1]);
                }
            }
            if (username != null) {
                userLastFetchMs.put(username, System.currentTimeMillis());
            }
        }

        return getFromDb(lat, lng, radius);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Trigger async scan, dùng lock để tránh duplicate
    // ══════════════════════════════════════════════════════════════════════════
    @Async
    public void triggerAsyncScan(int gridLat, int gridLng) {
        String cellKey = gridLat + "_" + gridLng;
        if (scanInFlight.containsKey(cellKey)) {
            log.debug("Scan already in-flight for cell {}", cellKey);
            return;
        }
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                scanCell(gridLat, gridLng);
            } finally {
                scanInFlight.remove(cellKey);
            }
        }, executor);
        scanInFlight.put(cellKey, future);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ✦ CORE FIX: Scan ô lưới bằng Text Search API
    //
    //  Text Search trả trực tiếp lat/lng trong mỗi item → không cần N+1 calls.
    //  Response structure:
    //    { "result": [ { "place_id", "name", "formatted_address",
    //                    "geometry": { "location": { "lat", "lng" } } } ] }
    // ══════════════════════════════════════════════════════════════════════════
    private void scanCell(int gridLat, int gridLng) {
        double cellOriginLat = gridLat * SCAN_CELL_DEG;
        double cellOriginLng = gridLng * SCAN_CELL_DEG;
        String cellKey       = gridLat + "_" + gridLng;

        log.info("🔍 Scanning cell {} (origin {},{}) r={}m", cellKey, cellOriginLat, cellOriginLng, SCAN_RADIUS_M);

        // Global dedup map: placeId → ATM data
        Map<String, Map<String, Object>> atmByPlaceId = new LinkedHashMap<>();

        /*
         * ✦ Sub-grid strategy:
         *   Chia ô lưới thành 4 điểm (2×2) cách nhau SCAN_CELL_DEG/2.
         *   Mỗi điểm là center của một vùng scan bán kính SCAN_RADIUS_M.
         *   Vùng phủ chồng nhau ~50% → bắt được ATM ở rìa ô không bị bỏ sót.
         *
         *   origin ──┬── sub[0,0]  sub[0,1]
         *            └── sub[1,0]  sub[1,1]
         */
        double half = SCAN_CELL_DEG / 2.0;
        double[][] subCenters = {
                { cellOriginLat,        cellOriginLng        },
                { cellOriginLat,        cellOriginLng + half },
                { cellOriginLat + half, cellOriginLng        },
                { cellOriginLat + half, cellOriginLng + half },
        };

        for (double[] center : subCenters) {
            double cLat = center[0], cLng = center[1];

            for (String kw : SCAN_KEYWORDS) {
                if (!acquireGlobalToken()) {
                    log.warn("Rate limit hit — stopping scan for cell {}", cellKey);
                    // Thoát cả hai vòng lặp
                    saveAndMarkCell(atmByPlaceId, cellKey, gridLat, gridLng, cellOriginLat, cellOriginLng);
                    return;
                }
                try {
                    String url = UriComponentsBuilder.fromHttpUrl(GOONG_TEXTSEARCH_URL)
                            .queryParam("input",    kw)
                            .queryParam("location", cLat + "," + cLng)
                            .queryParam("radius",   SCAN_RADIUS_M)
                            .queryParam("api_key",  goongApiKey)
                            .toUriString();

                    String body = callGoongWithBackoff(url);
                    if (body == null) continue;

                    JsonNode root   = objectMapper.readTree(body);
                    String   status = root.path("status").asText("");

                    // Goong trả ZERO_RESULTS khi khu vực không có kết quả — bình thường, không phải lỗi
                    if ("ZERO_RESULTS".equalsIgnoreCase(status)) continue;
                    if (!status.isBlank() && !"OK".equalsIgnoreCase(status)) {
                        log.warn("Text Search status={} kw='{}' sub=({},{}) cell={}", status, kw, cLat, cLng, cellKey);
                        continue;
                    }

                    // Goong Text Search dùng key "result" (không phải "results")
                    JsonNode results = root.path("result");
                    if (!results.isArray() || results.isEmpty()) continue;

                    for (JsonNode place : results) {
                        String placeId = place.path("place_id").asText("");
                        if (placeId.isBlank() || atmByPlaceId.containsKey(placeId)) continue;

                        JsonNode loc  = place.path("geometry").path("location");
                        double   pLat = loc.path("lat").asDouble(0);
                        double   pLng = loc.path("lng").asDouble(0);
                        if (pLat == 0 && pLng == 0) continue;

                        String name    = place.path("name").asText("");
                        String address = place.path("formatted_address").asText("");
                        if (name.isBlank()) name = address;

                        Map<String, Object> atm = new LinkedHashMap<>();
                        atm.put("placeId",  placeId);
                        atm.put("name",     name);
                        atm.put("address",  address);
                        atm.put("lat",      pLat);
                        atm.put("lng",      pLng);
                        atm.put("bankKey",  detectBankKey(name));
                        atm.put("type",     resolveType(kw, name));
                        atm.put("status",   "open");
                        atm.put("rating",   4.5);
                        atm.put("gridKey",  cellKey);
                        atmByPlaceId.put(placeId, atm);
                    }

                } catch (Exception e) {
                    log.warn("Text Search error kw='{}' sub=({},{}) cell={}: {}", kw, cLat, cLng, cellKey, e.getMessage());
                }
            }
        }

        saveAndMarkCell(atmByPlaceId, cellKey, gridLat, gridLng, cellOriginLat, cellOriginLng);
    }

    /**
     * Lưu batch ATMs và đánh dấu ô đã scan.
     * Tách ra để dùng chung cho cả luồng hoàn thành lẫn luồng bị rate-limit ngắt sớm.
     */
    private void saveAndMarkCell(Map<String, Map<String, Object>> atmByPlaceId,
                                 String cellKey, int gridLat, int gridLng,
                                 double centerLat, double centerLng) {
        List<Map<String, Object>> allResults = new ArrayList<>(atmByPlaceId.values());
        log.info("Cell {} → {} unique ATMs found", cellKey, allResults.size());

        if (!allResults.isEmpty()) {
            saveAtmCacheBatch(allResults, cellKey);
        }

        ScannedRegion region = scannedRegionRepository
                .findByGridLatAndGridLng(gridLat, gridLng)
                .orElseGet(ScannedRegion::new);
        region.setGridLat(gridLat);
        region.setGridLng(gridLng);
        region.setCenterLat(centerLat);
        region.setCenterLng(centerLng);
        region.setAtmCount(allResults.size());
        region.setScannedAt(LocalDateTime.now());
        scannedRegionRepository.save(region);

        log.info("✅ Cell {} done: {} ATMs saved to cache", cellKey, allResults.size());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  DB query: bounding box → Haversine filter → sort by distance
    // ══════════════════════════════════════════════════════════════════════════
    private List<Map<String, Object>> getFromDb(double lat, double lng, int radius) {
        double radiusDeg = (radius / 1000.0) / 111.0;

        List<AtmCache> candidates = atmCacheRepository.findByBoundingBox(
                lat - radiusDeg, lat + radiusDeg,
                lng - radiusDeg, lng + radiusDeg
        );

        double radiusKm = radius / 1000.0;
        return candidates.stream()
                .filter(a -> a.getLat() != null && a.getLng() != null)
                .filter(a -> haversineKm(lat, lng, a.getLat(), a.getLng()) <= radiusKm)
                .sorted(Comparator.comparingDouble(a -> haversineKm(lat, lng, a.getLat(), a.getLng())))
                .map(a -> {
                    Map<String, Object> m = toMap(a);
                    m.put("distanceKm", round2(haversineKm(lat, lng, a.getLat(), a.getLng())));
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Tính các ô lưới bao phủ vòng tròn (lat, lng, radius)
    // ══════════════════════════════════════════════════════════════════════════
    private List<int[]> getCellsForRadius(double lat, double lng, int radiusM) {
        double radiusDeg = (radiusM / 1000.0) / 111.0;
        double pad = SCAN_CELL_DEG * 0.5;

        int minGLat = (int) Math.floor((lat - radiusDeg - pad) / SCAN_CELL_DEG);
        int maxGLat = (int) Math.ceil ((lat + radiusDeg + pad) / SCAN_CELL_DEG);
        int minGLng = (int) Math.floor((lng - radiusDeg - pad) / SCAN_CELL_DEG);
        int maxGLng = (int) Math.ceil ((lng + radiusDeg + pad) / SCAN_CELL_DEG);

        List<int[]> cells = new ArrayList<>();
        for (int gLat = minGLat; gLat <= maxGLat; gLat++)
            for (int gLng = minGLng; gLng <= maxGLng; gLng++)
                cells.add(new int[]{ gLat, gLng });
        return cells;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getPlaceDetail — khi user click ATM để xem chi tiết
    //  DB-first; chỉ gọi API nếu thiếu coords
    // ══════════════════════════════════════════════════════════════════════════
    public Object getPlaceDetail(String placeId) {
        Optional<AtmCache> cached = atmCacheRepository.findByPlaceId(placeId);
        if (cached.isPresent() && cached.get().getLat() != null) {
            return toDetailMap(cached.get());
        }

        if (!acquireGlobalToken()) {
            return cached.map(this::toDetailMap).orElse(Map.of("error", "Rate limit reached"));
        }

        try {
            // Thử Text Search theo placeId trước, fallback sang Detail
            String url  = UriComponentsBuilder.fromHttpUrl(GOONG_DETAIL_URL)
                    .queryParam("place_id", placeId)
                    .queryParam("api_key", goongApiKey)
                    .toUriString();
            String body = callGoongWithBackoff(url);
            if (body == null) return cached.map(this::toDetailMap)
                    .orElse(Map.of("error", "Không tìm thấy"));

            JsonNode root  = objectMapper.readTree(body);
            if (root.has("error") || !root.has("result"))
                return cached.map(this::toDetailMap).orElse(Map.of("error", "Không tìm thấy"));

            JsonNode place = root.path("result");
            JsonNode loc   = place.path("geometry").path("location");
            double pLat    = loc.path("lat").asDouble(0);
            double pLng    = loc.path("lng").asDouble(0);

            AtmCache entry = cached.orElseGet(AtmCache::new);
            entry.setPlaceId(placeId);

            String detailName = place.path("name").asText("");
            entry.setName(!detailName.isBlank() ? detailName
                    : (entry.getName() != null ? entry.getName() : "ATM"));

            String fmtAddr = place.path("formatted_address").asText("");
            entry.setAddress(!fmtAddr.isBlank() ? fmtAddr
                    : (entry.getAddress() != null ? entry.getAddress() : "Việt Nam"));

            entry.setLat(pLat != 0 ? pLat : null);
            entry.setLng(pLng != 0 ? pLng : null);
            entry.setBankKey(detectBankKey(entry.getName()));
            entry.setScannedAt(LocalDateTime.now());
            if (entry.getGridKey() == null && pLat != 0)
                entry.setGridKey(toGridKey(pLat, pLng));
            atmCacheRepository.save(entry);

            return objectMapper.readValue(place.toString(), Object.class);
        } catch (Exception e) {
            log.error("PlaceDetail error {}: {}", placeId, e.getMessage());
            return cached.map(this::toDetailMap).orElse(Map.of("error", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Search autocomplete cho thanh tìm kiếm UI
    //  DB-first → fallback Goong AutoComplete (AutoComplete vẫn đúng ở đây
    //  vì chỉ cần gợi ý text, không cần coords ngay)
    // ══════════════════════════════════════════════════════════════════════════
    public List<Map<String, Object>> searchAutocomplete(String query, double lat, double lng) {
        // DB-first: tìm trong vùng ±0.5 độ
        List<AtmCache> dbMatches = atmCacheRepository.findByBoundingBox(
                        lat - 0.5, lat + 0.5, lng - 0.5, lng + 0.5
                ).stream()
                .filter(a -> a.getName() != null &&
                        (a.getName().toLowerCase().contains(query.toLowerCase()) ||
                                (a.getAddress() != null && a.getAddress().toLowerCase().contains(query.toLowerCase()))))
                .sorted(Comparator.comparingDouble(a -> haversineKm(lat, lng,
                        a.getLat() != null ? a.getLat() : lat,
                        a.getLng() != null ? a.getLng() : lng)))
                .limit(8)
                .collect(Collectors.toList());

        if (!dbMatches.isEmpty()) {
            return dbMatches.stream().map(a -> {
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("placeId",       a.getPlaceId());
                s.put("mainText",      a.getName());
                s.put("secondaryText", a.getAddress());
                s.put("description",   a.getName() + (a.getAddress() != null ? ", " + a.getAddress() : ""));
                s.put("lat",           a.getLat());
                s.put("lng",           a.getLng());
                s.put("distanceKm",    round2(haversineKm(lat, lng,
                        a.getLat() != null ? a.getLat() : lat,
                        a.getLng() != null ? a.getLng() : lng)));
                return s;
            }).collect(Collectors.toList());
        }

        // Fallback Goong AutoComplete (chỉ trả suggestions, không cần coords)
        if (!acquireGlobalToken()) return Collections.emptyList();

        try {
            String url  = UriComponentsBuilder.fromHttpUrl(GOONG_AUTOCOMPLETE_URL)
                    .queryParam("input", query)
                    .queryParam("location", lat + "," + lng)
                    .queryParam("radius", 50_000)
                    .queryParam("more_compound", true)
                    .queryParam("api_key", goongApiKey)
                    .toUriString();
            String body = callGoongWithBackoff(url);
            if (body == null) return Collections.emptyList();

            JsonNode root = objectMapper.readTree(body);
            if (root.has("error")) return Collections.emptyList();

            List<Map<String, Object>> suggestions = new ArrayList<>();
            for (JsonNode p : root.path("predictions")) {
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("placeId",       p.path("place_id").asText(""));
                s.put("description",   p.path("description").asText(""));
                s.put("mainText",      p.path("structured_formatting").path("main_text").asText(""));
                s.put("secondaryText", p.path("structured_formatting").path("secondary_text").asText(""));
                suggestions.add(s);
            }
            return suggestions;
        } catch (Exception e) {
            log.error("Autocomplete error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Direction proxy
    // ══════════════════════════════════════════════════════════════════════════
    public Object getDirection(String origin, String destination, String vehicle) {
        if (!acquireGlobalToken()) return Map.of("error", "Rate limit — thử lại sau");
        try {
            String url  = UriComponentsBuilder.fromHttpUrl(GOONG_DIRECTION_URL)
                    .queryParam("origin",      origin)
                    .queryParam("destination", destination)
                    .queryParam("vehicle",     vehicle)
                    .queryParam("api_key",     goongApiKey)
                    .toUriString();
            String body = callGoongWithBackoff(url);
            if (body == null) return Map.of("error", "Không thể tính đường đi");
            return objectMapper.readValue(body, Object.class);
        } catch (Exception e) {
            log.error("Direction error: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Saved ATM CRUD
    // ══════════════════════════════════════════════════════════════════════════
    @Transactional
    public Object saveAtm(String username, SavedAtmRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!savedAtmRepository.existsByUserAndAtmId(user, request.getAtmId())) {
            savedAtmRepository.save(SavedAtm.builder()
                    .user(user)
                    .atmId(request.getAtmId())
                    .name(request.getName())
                    .address(request.getAddress())
                    .lat(request.getLat())
                    .lng(request.getLng())
                    .bankKey(request.getBankKey())
                    .build());
        }
        return Map.of("success", true);
    }

    @Transactional
    public void unsaveAtm(String username, Long atmId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        savedAtmRepository.deleteByUserAndAtmId(user, atmId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSavedAtms(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return savedAtmRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(atm -> Map.<String, Object>of(
                        "id",      atm.getAtmId(),
                        "name",    atm.getName()    != null ? atm.getName()    : "",
                        "address", atm.getAddress() != null ? atm.getAddress() : "",
                        "lat",     atm.getLat()     != null ? atm.getLat()     : 0.0,
                        "lng",     atm.getLng()     != null ? atm.getLng()     : 0.0,
                        "bankKey", atm.getBankKey() != null ? atm.getBankKey() : "",
                        "saved",   true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getAtmById(Long id) {
        return savedAtmRepository.findById(id)
                .map(a -> (Object) Map.of(
                        "id",      a.getAtmId(),
                        "name",    a.getName()    != null ? a.getName()    : "",
                        "address", a.getAddress() != null ? a.getAddress() : "",
                        "lat",     a.getLat()     != null ? a.getLat()     : 0.0,
                        "lng",     a.getLng()     != null ? a.getLng()     : 0.0,
                        "bankKey", a.getBankKey() != null ? a.getBankKey() : ""))
                .orElse(Map.of("message", "Không tìm thấy ATM"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Scheduled cleanup (3am hằng ngày)
    // ══════════════════════════════════════════════════════════════════════════
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupStaleCache() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(CACHE_TTL_HOURS * 2L);
        int deleted = atmCacheRepository.deleteByScannedAtBefore(cutoff);
        List<ScannedRegion> staleRegions = scannedRegionRepository.findByScannedAtBefore(cutoff);
        scannedRegionRepository.deleteAll(staleRegions);
        log.info("Cache cleanup: deleted {} ATM entries, {} scanned regions", deleted, staleRegions.size());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Admin: Force re-scan
    // ══════════════════════════════════════════════════════════════════════════
    public Map<String, Object> forceRescan(double lat, double lng) {
        List<int[]> cells = getCellsForRadius(lat, lng, SCAN_RADIUS_M);
        for (int[] cell : cells) {
            scannedRegionRepository.findByGridLatAndGridLng(cell[0], cell[1])
                    .ifPresent(scannedRegionRepository::delete);
        }
        log.info("Force re-scan ({},{}) — {} cells invalidated", lat, lng, cells.size());
        return Map.of(
                "message", "Cells invalidated, next request will re-scan",
                "cells",   cells.size()
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Coverage info
    // ══════════════════════════════════════════════════════════════════════════
    public Map<String, Object> getCoverageInfo(double lat, double lng, int radius) {
        List<int[]> needed = getCellsForRadius(lat, lng, radius);
        LocalDateTime cutoff = LocalDateTime.now().minusHours(CACHE_TTL_HOURS);
        long scanned = needed.stream()
                .filter(c -> scannedRegionRepository.findByGridLatAndGridLng(c[0], c[1])
                        .map(r -> r.getScannedAt().isAfter(cutoff))
                        .orElse(false))
                .count();
        long dbCount = atmCacheRepository.countByBoundingBox(
                lat - radius / 111000.0, lat + radius / 111000.0,
                lng - radius / 111000.0, lng + radius / 111000.0
        );
        return Map.of(
                "neededCells",  needed.size(),
                "scannedCells", scanned,
                "coveragePct",  needed.isEmpty() ? 100 : (int)(scanned * 100 / needed.size()),
                "atmInDb",      dbCount,
                "radiusM",      radius
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════════════════════════════════════

    /** Batch upsert ATMs vào cache. Chỉ lưu entry có coords. */
    @Transactional
    public void saveAtmCacheBatch(List<Map<String, Object>> atms, String gridKey) {
        int saved = 0;
        for (Map<String, Object> atm : atms) {
            String placeId = (String) atm.get("placeId");
            if (placeId == null || placeId.isBlank()) continue;
            if (atm.get("lat") == null || atm.get("lng") == null) continue;

            AtmCache entry = atmCacheRepository.findByPlaceId(placeId)
                    .orElseGet(AtmCache::new);
            entry.setPlaceId(placeId);
            entry.setName((String)    atm.getOrDefault("name",    ""));
            entry.setAddress((String) atm.getOrDefault("address", ""));
            entry.setBankKey((String) atm.get("bankKey"));
            entry.setType((String)    atm.getOrDefault("type",    "Cây ATM"));
            entry.setStatus((String)  atm.getOrDefault("status",  "open"));
            entry.setRating(atm.get("rating") instanceof Number n ? n.doubleValue() : 4.5);
            entry.setGridKey(gridKey);
            entry.setScannedAt(LocalDateTime.now());
            if (atm.get("lat") instanceof Number n) entry.setLat(n.doubleValue());
            if (atm.get("lng") instanceof Number n) entry.setLng(n.doubleValue());
            atmCacheRepository.save(entry);
            saved++;
        }
        log.debug("Saved {} ATMs to cache grid={}", saved, gridKey);
    }

    /**
     * ✦ FIX: Exponential backoff on 429.
     * Semaphore acquire/release đúng vị trí — không bị double-release.
     */
    private String callGoongWithBackoff(String url) {
        int  maxRetries = 3;
        long delayMs    = 1_000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            boolean acquired = false;
            try {
                apiSemaphore.acquire();
                acquired = true;

                ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
                if (resp.getStatusCode().is2xxSuccessful()) return resp.getBody();

            } catch (HttpClientErrorException.TooManyRequests e) {
                log.warn("Goong 429 attempt {}/{}, backoff {}ms", attempt, maxRetries, delayMs);
                if (attempt < maxRetries) {
                    try { Thread.sleep(delayMs); } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return null;
                    }
                    delayMs *= 2;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return null;
            } catch (Exception e) {
                log.error("Goong call error: {}", e.getMessage());
                return null;
            } finally {
                // ✦ Release đúng một lần, chỉ khi đã acquire thành công
                if (acquired) apiSemaphore.release();
            }
        }
        return null;
    }

    /**
     * Token bucket đơn giản cho global rate limit.
     * Reset mỗi TOKEN_WINDOW_MS ms.
     */
    private boolean acquireGlobalToken() {
        long now = System.currentTimeMillis();
        if (now - lastTokenReset >= TOKEN_WINDOW_MS) {
            synchronized (this) {
                if (System.currentTimeMillis() - lastTokenReset >= TOKEN_WINDOW_MS) {
                    globalTokens.set(GLOBAL_RPS);
                    lastTokenReset = System.currentTimeMillis();
                }
            }
        }
        return globalTokens.getAndDecrement() > 0;
    }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private String toGridKey(double lat, double lng) {
        return (int) Math.round(lat / SCAN_CELL_DEG) + "_" + (int) Math.round(lng / SCAN_CELL_DEG);
    }

    private String resolveType(String keyword, String name) {
        String lower = name.toLowerCase();
        // Nếu tên có chữ "ngân hàng" hoặc keyword là bank → Ngân hàng
        if (lower.contains("ngân hàng") || lower.contains("bank") || keyword.contains("ngân hàng"))
            return "Ngân hàng";
        return "Cây ATM";
    }

    private Map<String, Object> toMap(AtmCache a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",      a.getId());
        m.put("placeId", a.getPlaceId());
        m.put("name",    a.getName()    != null ? a.getName()    : "");
        m.put("address", a.getAddress() != null ? a.getAddress() : "");
        m.put("lat",     a.getLat());
        m.put("lng",     a.getLng());
        m.put("bankKey", a.getBankKey());
        m.put("type",    a.getType()   != null ? a.getType()   : "Cây ATM");
        m.put("status",  a.getStatus() != null ? a.getStatus() : "open");
        m.put("rating",  a.getRating() != null ? a.getRating() : 4.5);
        m.put("phone",   a.getPhone());
        return m;
    }

    private Map<String, Object> toDetailMap(AtmCache a) {
        Map<String, Object> m = toMap(a);
        if (a.getLat() != null && a.getLng() != null)
            m.put("geometry", Map.of("location", Map.of("lat", a.getLat(), "lng", a.getLng())));
        return m;
    }

    private String detectBankKey(String name) {
        if (name == null) return null;
        String lower = name.toLowerCase();
        // ── Quốc doanh ───────────────────────────────────────────────────────
        if (lower.contains("vietcombank") || lower.contains("vcb"))          return "Vietcombank";
        if (lower.contains("vietinbank")  || lower.contains("vietin") || lower.contains("incombank")) return "VietinBank";
        if (lower.contains("bidv"))                                           return "BIDV";
        if (lower.contains("agribank")    || lower.contains("nông nghiệp"))  return "Agribank";
        // ── MBBank — nhận cả "MB Smartbank", "MBBank", "MB Bank" ─────────────
        if (lower.contains("smartbank")   || lower.contains("mbbank")
                || lower.contains("mb bank")     || lower.matches(".*\\bmb\\b.*"))  return "MBBank";
        // ── TMCP lớn ─────────────────────────────────────────────────────────
        if (lower.contains("techcombank") || lower.contains("techcom"))      return "Techcombank";
        if (lower.contains("vpbank")      || lower.contains("vp bank"))      return "VPBank";
        if (lower.contains("tpbank")      || lower.contains("tp bank"))      return "TPBank";
        if (lower.contains("acb"))                                            return "ACB";
        if (lower.contains("sacombank"))                                      return "Sacombank";
        if (lower.contains("hdbank")      || lower.contains("hd bank"))      return "HDBank";
        if (lower.contains("vib"))                                            return "VIB";
        // ── TMCP vừa ─────────────────────────────────────────────────────────
        if (lower.contains("msb")         || lower.contains("maritime"))     return "MSB";
        if (lower.contains("seabank"))                                        return "SeABank";
        if (lower.contains("ocb"))                                            return "OCB";
        if (lower.contains("shb")         || lower.contains("sài gòn hà nội")) return "SHB";
        if (lower.contains("eximbank")    || lower.contains("exim"))         return "Eximbank";
        if (lower.contains("lienviet")    || lower.contains("bưu điện"))     return "LienVietPostBank";
        if (lower.contains("bacabank")    || lower.contains("bắc á"))        return "BacABank";
        if (lower.contains("namabank")    || lower.contains("nam á"))        return "NamABank";
        // ── Nước ngoài ───────────────────────────────────────────────────────
        if (lower.contains("shinhan"))                                        return "Shinhan";
        if (lower.contains("hsbc"))                                           return "HSBC";
        if (lower.contains("standard chartered"))                             return "StandardChartered";
        if (lower.contains("cake")        || lower.contains("vp digital"))   return "Cake";
        return null;
    }
}
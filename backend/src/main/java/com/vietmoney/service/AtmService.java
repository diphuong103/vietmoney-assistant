package com.vietmoney.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietmoney.domain.entity.AtmCache;
import com.vietmoney.domain.entity.SavedAtm;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.SavedAtmRequest;
import com.vietmoney.repository.AtmCacheRepository;
import com.vietmoney.repository.SavedAtmRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.goong.api-key:}")
    private String goongApiKey;

    private static final String GOONG_DIRECTION_URL = "https://rsapi.goong.io/Direction";
    private static final String GOONG_AUTOCOMPLETE_URL = "https://rsapi.goong.io/Place/AutoComplete";
    private static final String GOONG_DETAIL_URL = "https://rsapi.goong.io/Place/Detail";

    // ── Semaphore: tối đa 3 request Goong đồng thời (per-enrich) ──────────────
    private final Semaphore apiSemaphore = new Semaphore(3, true);

    // ── Global rate limit: tối đa 10 requests/phút tới Goong ──────────────────
    // Sử dụng sliding window đơn giản: token bucket reset mỗi 60s
    private final AtomicInteger globalTokens = new AtomicInteger(10);
    private volatile long lastTokenResetMs = System.currentTimeMillis();
    private static final int GLOBAL_RPS_LIMIT = 10;
    private static final long TOKEN_WINDOW_MS = 60_000; // 1 phút

    // ── Per-user cooldown: 15 giây ────────────────────────────────────────────
    private final ConcurrentHashMap<String, Long> userLastFetchMs = new ConcurrentHashMap<>();
    private static final long USER_COOLDOWN_MS = 15_000;

    // ── Thresholds ────────────────────────────────────────────────────────────
    private static final double GRID_SIZE = 0.01; // ~1 km
    private static final int CACHE_TTL_HOURS = 6;
    /** Nếu DB có ít hơn số này thì coi như thiếu, gọi API bổ sung */
    private static final int MIN_ATM_THRESHOLD = 3;
    /** Tối đa N ATM enrich lat/lng mỗi lần */
    private static final int MAX_ENRICH = 10;
    /** Timeout enrich mỗi ATM (ms) */
    private static final long ENRICH_TIMEOUT_MS = 8_000;

    // ── Executor cho parallel enrich ──────────────────────────────────────────
    private final ExecutorService enrichExecutor = Executors.newFixedThreadPool(3, r -> {
        Thread t = new Thread(r, "atm-enrich");
        t.setDaemon(true);
        return t;
    });

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN: Tìm ATM lân cận — full flow
    // ══════════════════════════════════════════════════════════════════════════
    public List<Map<String, Object>> getNearbyAtms(double lat, double lng, int radius, String username) {

        // ── 1. Per-user cooldown ──────────────────────────────────────────────
        if (username != null) {
            Long lastMs = userLastFetchMs.get(username);
            if (lastMs != null && System.currentTimeMillis() - lastMs < USER_COOLDOWN_MS) {
                log.info("Cooldown active user={} → returning DB data", username);
                return getFromDb(lat, lng, radius);
            }
        }

        // ── 2. Bounding box → Haversine filter on DB ──────────────────────────
        List<Map<String, Object>> dbData = getFromDb(lat, lng, radius);

        // ── 3. Threshold check: đủ thì trả luôn, thiếu thì gọi API bổ sung ──
        if (dbData.size() >= MIN_ATM_THRESHOLD) {
            log.info("DB hit: {} ATMs, no API call needed", dbData.size());
            if (username != null)
                userLastFetchMs.put(username, System.currentTimeMillis());
            return dbData;
        }

        log.info("DB has only {} ATMs (< threshold {}), calling Goong API...", dbData.size(), MIN_ATM_THRESHOLD);

        // ── 4. Gọi Goong AutoComplete ─────────────────────────────────────────
        String gridKey = toGridKey(lat, lng);
        List<Map<String, Object>> fetched = fetchFromGoongAutocompleteOnly(lat, lng, radius);

        // ── 5. Enrich lat/lng song song ────────────────────────────────────────
        if (!fetched.isEmpty()) {
            enrichLatLngParallel(fetched, gridKey);
            saveAtmCacheBatch(fetched, gridKey);
        }

        // ── 6. Merge: API data + DB data (avoid duplicates) ───────────────────
        if (username != null)
            userLastFetchMs.put(username, System.currentTimeMillis());

        if (fetched.isEmpty()) {
            // Goong fail → always return DB data (dù ít)
            log.warn("Goong returned nothing; falling back to {} DB results", dbData.size());
            return dbData;
        }

        // Merge: DB đã có + kết quả mới từ API (tránh trùng placeId)
        Set<String> existingPlaceIds = dbData.stream()
                .map(m -> (String) m.get("placeId")).filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Map<String, Object>> merged = new ArrayList<>(dbData);
        for (Map<String, Object> a : fetched) {
            String pid = (String) a.get("placeId");
            if (pid == null || !existingPlaceIds.contains(pid)) {
                // Tính distanceKm
                Double aLat = (Double) a.get("lat");
                Double aLng = (Double) a.get("lng");
                if (aLat != null && aLng != null) {
                    a.put("distanceKm", haversineKm(lat, lng, aLat, aLng));
                }
                merged.add(a);
                if (pid != null)
                    existingPlaceIds.add(pid);
            }
        }

        merged.sort(Comparator.comparingDouble(m -> {
            Object d = m.get("distanceKm");
            return d instanceof Number n ? n.doubleValue() : Double.MAX_VALUE;
        }));

        return merged;
    }

    // ── Lấy data từ DB với bounding box + Haversine ───────────────────────────
    private List<Map<String, Object>> getFromDb(double lat, double lng, int radius) {
        double radiusDeg = radius / 111_000.0; // 1° ≈ 111 km
        LocalDateTime ttlCutoff = LocalDateTime.now().minusHours(CACHE_TTL_HOURS);

        List<AtmCache> candidates = atmCacheRepository.findByBoundingBoxAndTtl(
                lat - radiusDeg, lat + radiusDeg,
                lng - radiusDeg, lng + radiusDeg,
                ttlCutoff);

        return candidates.stream()
                .filter(a -> haversineKm(lat, lng, a.getLat(), a.getLng()) <= radius / 1000.0)
                .sorted(Comparator.comparingDouble(a -> haversineKm(lat, lng, a.getLat(), a.getLng())))
                .map(a -> {
                    Map<String, Object> m = toMap(a);
                    m.put("distanceKm", haversineKm(lat, lng, a.getLat(), a.getLng()));
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ── Enrich lat/lng song song (max MAX_ENRICH ATM, max 3 concurrent) ───────
    private void enrichLatLngParallel(List<Map<String, Object>> atms, String gridKey) {
        List<Map<String, Object>> toEnrich = atms.stream()
                .filter(a -> a.get("lat") == null && a.get("placeId") != null)
                .limit(MAX_ENRICH)
                .collect(Collectors.toList());

        if (toEnrich.isEmpty())
            return;
        log.info("Enriching {}/{} ATMs with lat/lng...", toEnrich.size(), atms.size());

        List<Future<?>> futures = new ArrayList<>();
        for (Map<String, Object> atm : toEnrich) {
            if (!acquireGlobalToken()) {
                log.warn("Global rate limit reached, skipping enrich for remaining ATMs");
                break;
            }
            Future<?> f = enrichExecutor.submit(() -> {
                String placeId = (String) atm.get("placeId");
                try {
                    String body = callGoongWithBackoff(
                            UriComponentsBuilder.fromHttpUrl(GOONG_DETAIL_URL)
                                    .queryParam("place_id", placeId)
                                    .queryParam("api_key", goongApiKey)
                                    .toUriString());
                    if (body == null)
                        return;

                    JsonNode root = objectMapper.readTree(body);
                    if (root.has("error") || !root.has("result"))
                        return;

                    JsonNode loc = root.path("result").path("geometry").path("location");
                    double pLat = loc.path("lat").asDouble(0);
                    double pLng = loc.path("lng").asDouble(0);
                    if (pLat != 0 && pLng != 0) {
                        atm.put("lat", pLat);
                        atm.put("lng", pLng);
                    }
                } catch (Exception e) {
                    log.warn("Enrich failed for placeId={}: {}", placeId, e.getMessage());
                }
            });
            futures.add(f);
        }

        // Wait với timeout
        long deadline = System.currentTimeMillis() + ENRICH_TIMEOUT_MS;
        for (Future<?> f : futures) {
            long remaining = deadline - System.currentTimeMillis();
            if (remaining <= 0) {
                f.cancel(true);
                continue;
            }
            try {
                f.get(remaining, TimeUnit.MILLISECONDS);
            } catch (TimeoutException te) {
                f.cancel(true);
                log.warn("Enrich timeout");
            } catch (Exception e) {
                log.warn("Enrich error: {}", e.getMessage());
            }
        }

        log.info("Enrich done: {}/{} ATMs now have lat/lng",
                atms.stream().filter(a -> a.get("lat") != null).count(), atms.size());
    }

    // ── Global token bucket ────────────────────────────────────────────────────
    private boolean acquireGlobalToken() {
        long now = System.currentTimeMillis();
        if (now - lastTokenResetMs >= TOKEN_WINDOW_MS) {
            synchronized (this) {
                if (System.currentTimeMillis() - lastTokenResetMs >= TOKEN_WINDOW_MS) {
                    globalTokens.set(GLOBAL_RPS_LIMIT);
                    lastTokenResetMs = System.currentTimeMillis();
                }
            }
        }
        return globalTokens.getAndDecrement() > 0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AutoComplete: chỉ lấy danh sách tên, placeId — KHÔNG gọi Detail
    // ══════════════════════════════════════════════════════════════════════════
    private List<Map<String, Object>> fetchFromGoongAutocompleteOnly(double lat, double lng, int radius) {
        String[] placeTypes = { "atm", "ngân hàng" };
        List<Map<String, Object>> allResults = new ArrayList<>();
        String location = lat + "," + lng;

        for (String type : placeTypes) {
            if (!acquireGlobalToken()) {
                log.warn("Global rate limit reached during AutoComplete for type={}", type);
                break;
            }
            try {
                String body = callGoongWithBackoff(
                        UriComponentsBuilder.fromHttpUrl(GOONG_AUTOCOMPLETE_URL)
                                .queryParam("input", type)
                                .queryParam("location", location)
                                .queryParam("radius", radius)
                                .queryParam("limit", 5)
                                .queryParam("api_key", goongApiKey)
                                .toUriString());

                if (body == null)
                    continue;

                JsonNode root = objectMapper.readTree(body);
                if (root.has("error"))
                    continue;

                JsonNode predictions = root.path("predictions");
                if (predictions.isArray()) {
                    for (JsonNode p : predictions) {
                        String placeId = p.path("place_id").asText("");
                        String desc = p.path("description").asText("");
                        String mainText = p.path("structured_formatting").path("main_text").asText(desc);

                        if (placeId.isBlank())
                            continue;
                        boolean dup = allResults.stream().anyMatch(r -> placeId.equals(r.get("placeId")));
                        if (dup)
                            continue;

                        String displayType = "ngân hàng".equals(type) ? "Ngân hàng" : "Cây ATM";
                        String bankKey = detectBankKey(mainText);

                        Map<String, Object> atm = new LinkedHashMap<>();
                        atm.put("placeId", placeId);
                        atm.put("name", mainText);
                        atm.put("address", desc);
                        atm.put("bankKey", bankKey);
                        atm.put("type", displayType);
                        atm.put("status", "open");
                        atm.put("rating", 4.5);
                        // lat/lng chưa có → sẽ enrich ở bước sau
                        allResults.add(atm);
                    }
                }
            } catch (Exception e) {
                log.error("Lỗi AutoComplete type={}: {}", type, e.getMessage());
            }
        }
        return allResults;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // getPlaceDetail — gọi khi user CLICK ATM (1 request), cập nhật DB
    // ══════════════════════════════════════════════════════════════════════════
    public Object getPlaceDetail(String placeId) {
        Optional<AtmCache> cached = atmCacheRepository.findByPlaceId(placeId);
        if (cached.isPresent() && cached.get().getLat() != null) {
            return toDetailMap(cached.get());
        }

        if (!acquireGlobalToken()) {
            log.warn("Global rate limit hit on getPlaceDetail({})", placeId);
            // Trả DB data nếu có (dù chưa có lat/lng)
            return cached.map(this::toDetailMap).orElse(Map.of("error", "Rate limit reached"));
        }

        try {
            String body = callGoongWithBackoff(
                    UriComponentsBuilder.fromHttpUrl(GOONG_DETAIL_URL)
                            .queryParam("place_id", placeId)
                            .queryParam("api_key", goongApiKey)
                            .toUriString());

            if (body == null)
                return cached.map(this::toDetailMap).orElse(Map.of("error", "Không tìm thấy địa điểm"));

            JsonNode root = objectMapper.readTree(body);
            if (root.has("error") || !root.has("result"))
                return cached.map(this::toDetailMap).orElse(Map.of("error", "Không tìm thấy địa điểm"));

            JsonNode place = root.path("result");
            JsonNode loc = place.path("geometry").path("location");
            double pLat = loc.path("lat").asDouble(0);
            double pLng = loc.path("lng").asDouble(0);
            String name = place.path("name").asText("ATM");
            String address = place.path("formatted_address").asText("");

            AtmCache entry = cached.orElseGet(AtmCache::new);
            entry.setPlaceId(placeId);
            entry.setName(name);
            entry.setAddress(address.isBlank() ? "Việt Nam" : address);
            entry.setLat(pLat != 0 ? pLat : null);
            entry.setLng(pLng != 0 ? pLng : null);
            entry.setBankKey(detectBankKey(name));
            entry.setScannedAt(LocalDateTime.now());
            if (entry.getGridKey() == null && pLat != 0)
                entry.setGridKey(toGridKey(pLat, pLng));
            atmCacheRepository.save(entry);

            return objectMapper.readValue(place.toString(), Object.class);
        } catch (Exception e) {
            log.error("Lỗi PlaceDetail {}: {}", placeId, e.getMessage());
            // Fallback: trả DB data nếu có
            return cached.map(this::toDetailMap).orElse(Map.of("error", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Autocomplete tìm kiếm địa điểm (search bar)
    // ══════════════════════════════════════════════════════════════════════════
    public List<Map<String, Object>> searchAutocomplete(String query, double lat, double lng) {
        if (!acquireGlobalToken()) {
            log.warn("Global rate limit hit on searchAutocomplete");
            return Collections.emptyList();
        }
        try {
            String body = callGoongWithBackoff(
                    UriComponentsBuilder.fromHttpUrl(GOONG_AUTOCOMPLETE_URL)
                            .queryParam("input", query)
                            .queryParam("location", lat + "," + lng)
                            .queryParam("radius", 50000)
                            .queryParam("more_compound", true)
                            .queryParam("api_key", goongApiKey)
                            .toUriString());

            if (body == null)
                return Collections.emptyList();

            JsonNode root = objectMapper.readTree(body);
            if (root.has("error"))
                return Collections.emptyList();

            List<Map<String, Object>> suggestions = new ArrayList<>();
            JsonNode predictions = root.path("predictions");
            if (predictions.isArray()) {
                for (JsonNode p : predictions) {
                    Map<String, Object> s = new LinkedHashMap<>();
                    s.put("placeId", p.path("place_id").asText(""));
                    s.put("description", p.path("description").asText(""));
                    s.put("mainText", p.path("structured_formatting").path("main_text").asText(""));
                    s.put("secondaryText", p.path("structured_formatting").path("secondary_text").asText(""));
                    suggestions.add(s);
                }
            }
            return suggestions;
        } catch (Exception e) {
            log.error("Lỗi Goong Autocomplete: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Proxy Goong Direction
    // ══════════════════════════════════════════════════════════════════════════
    public Object getDirection(String origin, String destination, String vehicle) {
        if (!acquireGlobalToken())
            return Map.of("error", "Rate limit reached — thử lại sau 1 phút");
        try {
            String body = callGoongWithBackoff(
                    UriComponentsBuilder.fromHttpUrl(GOONG_DIRECTION_URL)
                            .queryParam("origin", origin)
                            .queryParam("destination", destination)
                            .queryParam("vehicle", vehicle)
                            .queryParam("api_key", goongApiKey)
                            .toUriString());

            if (body == null)
                return Map.of("error", "Không thể tính đường đi");
            return objectMapper.readValue(body, Object.class);
        } catch (Exception e) {
            log.error("Lỗi Direction API: {}", e.getMessage());
            return Map.of("error", "Không thể tính đường đi: " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Lưu / Bỏ lưu ATM (user)
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
                        "id", atm.getAtmId(),
                        "name", atm.getName() != null ? atm.getName() : "",
                        "address", atm.getAddress() != null ? atm.getAddress() : "",
                        "lat", atm.getLat() != null ? atm.getLat() : 0.0,
                        "lng", atm.getLng() != null ? atm.getLng() : 0.0,
                        "bankKey", atm.getBankKey() != null ? atm.getBankKey() : "",
                        "saved", true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getAtmById(Long id) {
        return savedAtmRepository.findById(id)
                .map(a -> (Object) Map.of(
                        "id", a.getAtmId(),
                        "name", a.getName() != null ? a.getName() : "",
                        "address", a.getAddress() != null ? a.getAddress() : "",
                        "lat", a.getLat() != null ? a.getLat() : 0.0,
                        "lng", a.getLng() != null ? a.getLng() : 0.0,
                        "bankKey", a.getBankKey() != null ? a.getBankKey() : ""))
                .orElse(Map.of("message", "Không tìm thấy ATM"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Exponential backoff khi gặp 429. Semaphore giới hạn concurrent requests.
     * Retry tối đa 3 lần: 1s → 2s → 4s
     */
    private String callGoongWithBackoff(String url) {
        int maxRetries = 3;
        long delayMs = 1000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                apiSemaphore.acquire();
                try {
                    ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
                    if (resp.getStatusCode().is2xxSuccessful())
                        return resp.getBody();
                } finally {
                    apiSemaphore.release();
                }
            } catch (HttpClientErrorException.TooManyRequests e) {
                apiSemaphore.release();
                log.warn("429 from Goong attempt={}/{}, backing off {}ms", attempt, maxRetries, delayMs);
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    delayMs *= 2;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return null;
            } catch (Exception e) {
                try {
                    apiSemaphore.release();
                } catch (Exception ignored) {
                }
                log.error("Goong call error: {}", e.getMessage());
                return null;
            }
        }
        log.error("Đã vượt quá số lần retry Goong API");
        return null;
    }

    /** Lưu batch ATM vào DB cache, upsert theo placeId */
    @Transactional
    protected void saveAtmCacheBatch(List<Map<String, Object>> atms, String gridKey) {
        for (Map<String, Object> atm : atms) {
            String placeId = (String) atm.get("placeId");
            if (placeId == null || placeId.isBlank())
                continue;

            AtmCache entry = atmCacheRepository.findByPlaceId(placeId).orElseGet(AtmCache::new);
            entry.setPlaceId(placeId);
            entry.setName((String) atm.getOrDefault("name", ""));
            entry.setAddress((String) atm.getOrDefault("address", ""));
            entry.setBankKey((String) atm.get("bankKey"));
            entry.setType((String) atm.getOrDefault("type", "Cây ATM"));
            entry.setGridKey(gridKey);
            entry.setScannedAt(LocalDateTime.now());
            if (atm.get("lat") instanceof Double d)
                entry.setLat(d);
            if (atm.get("lng") instanceof Double d)
                entry.setLng(d);
            atmCacheRepository.save(entry);
        }
    }

    /** Haversine distance in km */
    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** Grid key: "gridLat_gridLng" rounded to GRID_SIZE (~1 km cell) */
    private String toGridKey(double lat, double lng) {
        long gridLat = Math.round(lat / GRID_SIZE);
        long gridLng = Math.round(lng / GRID_SIZE);
        return gridLat + "_" + gridLng;
    }

    private Map<String, Object> toMap(AtmCache a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("placeId", a.getPlaceId());
        m.put("name", a.getName() != null ? a.getName() : "");
        m.put("address", a.getAddress() != null ? a.getAddress() : "");
        m.put("lat", a.getLat());
        m.put("lng", a.getLng());
        m.put("bankKey", a.getBankKey());
        m.put("type", a.getType() != null ? a.getType() : "Cây ATM");
        m.put("status", "open");
        m.put("rating", 4.5);
        return m;
    }

    private Map<String, Object> toDetailMap(AtmCache a) {
        Map<String, Object> m = toMap(a);
        if (a.getLat() != null && a.getLng() != null)
            m.put("geometry", Map.of("location", Map.of("lat", a.getLat(), "lng", a.getLng())));
        return m;
    }

    private String detectBankKey(String name) {
        if (name == null)
            return null;
        String lower = name.toLowerCase();
        if (lower.contains("vietcombank") || lower.contains("vcb"))
            return "Vietcombank";
        if (lower.contains("techcombank") || lower.contains("tcb"))
            return "Techcombank";
        if (lower.contains("bidv"))
            return "BIDV";
        if (lower.contains("mbbank") || lower.contains("mb bank"))
            return "MBBank";
        if (lower.contains("agribank") || lower.contains("agr"))
            return "Agribank";
        if (lower.contains("tpbank") || lower.contains("tp bank"))
            return "TPBank";
        if (lower.contains("vpbank") || lower.contains("vp bank"))
            return "VPBank";
        if (lower.contains("hdbank") || lower.contains("hd bank"))
            return "HDBank";
        if (lower.contains("acb"))
            return "ACB";
        if (lower.contains("sacombank"))
            return "Sacombank";
        if (lower.contains("vib"))
            return "VIB";
        if (lower.contains("msb"))
            return "MSB";
        if (lower.contains("seabank"))
            return "SeABank";
        if (lower.contains("ocb"))
            return "OCB";
        if (lower.contains("vietinbank") || lower.contains("vietin"))
            return "VietinBank";
        return null;
    }
}
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
import java.util.concurrent.Semaphore;
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

    private static final String GOONG_DIRECTION_URL     = "https://rsapi.goong.io/Direction";
    private static final String GOONG_AUTOCOMPLETE_URL  = "https://rsapi.goong.io/Place/AutoComplete";
    private static final String GOONG_DETAIL_URL        = "https://rsapi.goong.io/Place/Detail";

    // ── Giới hạn tối đa 3 request Goong song song ─────────────────────────────
    private final Semaphore apiSemaphore = new Semaphore(3, true);

    // ── Cache theo khu vực: grid cell 0.01° (~1 km) ───────────────────────────
    private static final double GRID_SIZE = 0.01;
    // Thời gian cache hợp lệ (giờ)
    private static final int CACHE_TTL_HOURS = 6;

    // ══════════════════════════════════════════════════════════════════════════
    // Tìm ATM lân cận — DB-first, gọi API khi thiếu
    // ══════════════════════════════════════════════════════════════════════════
    public List<Map<String, Object>> getNearbyAtms(double lat, double lng, int radius) {

        String gridKey = toGridKey(lat, lng);

        // 1. Kiểm tra xem khu vực này đã được scan chưa (còn TTL)
        boolean areaCached = atmCacheRepository.existsByGridKeyAndScannedAtAfter(
                gridKey, LocalDateTime.now().minusHours(CACHE_TTL_HOURS));

        if (areaCached) {
            // Trả dữ liệu từ DB, tính khoảng cách trong DB hoặc Java
            List<AtmCache> cached = atmCacheRepository.findByGridKey(gridKey);
            if (!cached.isEmpty()) {
                log.info("Cache hit gridKey={} count={}", gridKey, cached.size());
                return cached.stream().map(this::toMap).collect(Collectors.toList());
            }
        }

        // 2. Chưa có → gọi Goong AutoComplete (KHÔNG gọi Detail hàng loạt)
        log.info("Cache miss gridKey={} → calling Goong AutoComplete", gridKey);
        List<Map<String, Object>> fetched = fetchFromGoongAutocompleteOnly(lat, lng, radius);

        // 3. Lưu vào DB (upsert theo placeId)
        if (!fetched.isEmpty()) {
            saveAtmCacheBatch(fetched, gridKey);
        }

        return fetched;
    }

    /**
     * Chỉ gọi AutoComplete (1–2 request), KHÔNG gọi Detail cho từng item.
     * lat/lng lấy trực tiếp từ AutoComplete response nếu có, hoặc để null.
     * Detail chỉ được gọi khi user click vào 1 ATM cụ thể.
     */
    private List<Map<String, Object>> fetchFromGoongAutocompleteOnly(double lat, double lng, int radius) {
        String[] placeTypes = {"atm", "ngân hàng"};
        List<Map<String, Object>> allResults = new ArrayList<>();
        String location = lat + "," + lng;

        for (String type : placeTypes) {
            try {
                String body = callGoongWithBackoff(
                        UriComponentsBuilder.fromHttpUrl(GOONG_AUTOCOMPLETE_URL)
                                .queryParam("input", type)
                                .queryParam("location", location)
                                .queryParam("radius", radius)
                                .queryParam("limit", 5)
                                .queryParam("api_key", goongApiKey)
                                .toUriString());

                if (body == null) continue;

                JsonNode root = objectMapper.readTree(body);
                if (root.has("error")) continue;

                JsonNode predictions = root.path("predictions");
                if (predictions.isArray()) {
                    for (JsonNode p : predictions) {
                        String placeId   = p.path("place_id").asText("");
                        String desc      = p.path("description").asText("");
                        String mainText  = p.path("structured_formatting").path("main_text").asText(desc);

                        // AutoComplete thường trả về compound_code hoặc không có lat/lng —
                        // chúng ta chấp nhận không có tọa độ ở bước list; sẽ enrich khi click
                        if (placeId.isBlank()) continue;

                        // Tránh trùng
                        boolean dup = allResults.stream()
                                .anyMatch(r -> placeId.equals(r.get("placeId")));
                        if (dup) continue;

                        String displayType = "ngân hàng".equals(type) ? "Ngân hàng" : "Cây ATM";
                        String bankKey     = detectBankKey(mainText);

                        Map<String, Object> atm = new LinkedHashMap<>();
                        atm.put("placeId",  placeId);
                        atm.put("name",     mainText);
                        atm.put("address",  desc);
                        atm.put("bankKey",  bankKey);
                        atm.put("type",     displayType);
                        atm.put("status",   "open");
                        atm.put("rating",   4.5);
                        // lat/lng chưa có — frontend biết là null → ẩn distance, show khi click
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
    // Lấy chi tiết 1 ATM khi user CLICK — gọi Detail API lúc này mới ok
    // ══════════════════════════════════════════════════════════════════════════
    public Object getPlaceDetail(String placeId) {
        // Kiểm tra DB trước
        Optional<AtmCache> cached = atmCacheRepository.findByPlaceId(placeId);
        if (cached.isPresent() && cached.get().getLat() != null) {
            return toDetailMap(cached.get());
        }

        // Gọi Goong Detail (chỉ 1 request)
        try {
            String body = callGoongWithBackoff(
                    UriComponentsBuilder.fromHttpUrl(GOONG_DETAIL_URL)
                            .queryParam("place_id", placeId)
                            .queryParam("api_key", goongApiKey)
                            .toUriString());

            if (body == null) return Map.of("error", "Không tìm thấy địa điểm");

            JsonNode root = objectMapper.readTree(body);
            if (root.has("error") || !root.has("result"))
                return Map.of("error", "Không tìm thấy địa điểm");

            JsonNode place = root.path("result");
            JsonNode loc   = place.path("geometry").path("location");
            double pLat    = loc.path("lat").asDouble(0);
            double pLng    = loc.path("lng").asDouble(0);
            String name    = place.path("name").asText("ATM");
            String address = place.path("formatted_address").asText("");

            // Upsert vào cache
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
            return Map.of("error", e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Autocomplete tìm kiếm địa điểm (search bar)
    // ══════════════════════════════════════════════════════════════════════════
    public List<Map<String, Object>> searchAutocomplete(String query, double lat, double lng) {
        try {
            String body = callGoongWithBackoff(
                    UriComponentsBuilder.fromHttpUrl(GOONG_AUTOCOMPLETE_URL)
                            .queryParam("input", query)
                            .queryParam("location", lat + "," + lng)
                            .queryParam("radius", 50000)
                            .queryParam("more_compound", true)
                            .queryParam("api_key", goongApiKey)
                            .toUriString());

            if (body == null) return Collections.emptyList();

            JsonNode root = objectMapper.readTree(body);
            if (root.has("error")) return Collections.emptyList();

            List<Map<String, Object>> suggestions = new ArrayList<>();
            JsonNode predictions = root.path("predictions");
            if (predictions.isArray()) {
                for (JsonNode p : predictions) {
                    Map<String, Object> s = new LinkedHashMap<>();
                    s.put("placeId",       p.path("place_id").asText(""));
                    s.put("description",   p.path("description").asText(""));
                    s.put("mainText",      p.path("structured_formatting").path("main_text").asText(""));
                    s.put("secondaryText", p.path("structured_formatting").path("secondary_text").asText(""));
                    // ❌ KHÔNG gọi Detail ở đây nữa — lat/lng lấy khi user chọn
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
        try {
            String body = callGoongWithBackoff(
                    UriComponentsBuilder.fromHttpUrl(GOONG_DIRECTION_URL)
                            .queryParam("origin", origin)
                            .queryParam("destination", destination)
                            .queryParam("vehicle", vehicle)
                            .queryParam("api_key", goongApiKey)
                            .toUriString());

            if (body == null) return Map.of("error", "Không thể tính đường đi");
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
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Gọi Goong với exponential backoff khi gặp 429.
     * Dùng Semaphore để giới hạn concurrent requests.
     * Retry tối đa 3 lần: 1s → 2s → 4s
     */
    private String callGoongWithBackoff(String url) {
        int maxRetries = 3;
        long delayMs   = 1000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                apiSemaphore.acquire();
                try {
                    ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
                    if (resp.getStatusCode().is2xxSuccessful()) return resp.getBody();
                } finally {
                    apiSemaphore.release();
                }
            } catch (HttpClientErrorException.TooManyRequests e) {
                apiSemaphore.release();
                log.warn("429 from Goong attempt={}/{}, backing off {}ms", attempt, maxRetries, delayMs);
                if (attempt < maxRetries) {
                    try { Thread.sleep(delayMs); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    delayMs *= 2; // exponential backoff
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.error("Semaphore interrupted");
                return null;
            } catch (Exception e) {
                apiSemaphore.release();
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
            if (placeId == null || placeId.isBlank()) continue;

            AtmCache entry = atmCacheRepository.findByPlaceId(placeId)
                    .orElseGet(AtmCache::new);
            entry.setPlaceId(placeId);
            entry.setName((String) atm.getOrDefault("name", ""));
            entry.setAddress((String) atm.getOrDefault("address", ""));
            entry.setBankKey((String) atm.get("bankKey"));
            entry.setType((String) atm.getOrDefault("type", "Cây ATM"));
            entry.setGridKey(gridKey);
            entry.setScannedAt(LocalDateTime.now());
            // lat/lng có thể null nếu chưa gọi Detail
            if (atm.containsKey("lat")) entry.setLat((Double) atm.get("lat"));
            if (atm.containsKey("lng")) entry.setLng((Double) atm.get("lng"));
            atmCacheRepository.save(entry);
        }
    }

    /** Grid key: "lat_lng" rounded to GRID_SIZE (~1 km cell) */
    private String toGridKey(double lat, double lng) {
        long gridLat = Math.round(lat / GRID_SIZE);
        long gridLng = Math.round(lng / GRID_SIZE);
        return gridLat + "_" + gridLng;
    }

    private Map<String, Object> toMap(AtmCache a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("placeId",  a.getPlaceId());
        m.put("name",     a.getName()    != null ? a.getName()    : "");
        m.put("address",  a.getAddress() != null ? a.getAddress() : "");
        m.put("lat",      a.getLat());
        m.put("lng",      a.getLng());
        m.put("bankKey",  a.getBankKey());
        m.put("type",     a.getType()    != null ? a.getType()    : "Cây ATM");
        m.put("status",   "open");
        m.put("rating",   4.5);
        return m;
    }

    private Map<String, Object> toDetailMap(AtmCache a) {
        Map<String, Object> m = toMap(a);
        m.put("geometry", Map.of("location", Map.of("lat", a.getLat(), "lng", a.getLng())));
        return m;
    }

    private String detectBankKey(String name) {
        if (name == null) return null;
        String lower = name.toLowerCase();
        if (lower.contains("vietcombank") || lower.contains("vcb"))  return "Vietcombank";
        if (lower.contains("techcombank") || lower.contains("tcb"))  return "Techcombank";
        if (lower.contains("bidv"))                                   return "BIDV";
        if (lower.contains("mbbank") || lower.contains("mb bank"))   return "MBBank";
        if (lower.contains("agribank") || lower.contains("agr"))     return "Agribank";
        if (lower.contains("tpbank")  || lower.contains("tp bank"))  return "TPBank";
        if (lower.contains("vpbank")  || lower.contains("vp bank"))  return "VPBank";
        if (lower.contains("hdbank")  || lower.contains("hd bank"))  return "HDBank";
        if (lower.contains("acb"))                                    return "ACB";
        if (lower.contains("sacombank"))                              return "Sacombank";
        if (lower.contains("vib"))                                    return "VIB";
        if (lower.contains("msb"))                                    return "MSB";
        if (lower.contains("seabank"))                                return "SeABank";
        if (lower.contains("ocb"))                                    return "OCB";
        if (lower.contains("vietinbank") || lower.contains("vietin"))return "VietinBank";
        return null;
    }
}
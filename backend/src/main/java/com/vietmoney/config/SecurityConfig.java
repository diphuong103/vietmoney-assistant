package com.vietmoney.config;

import com.vietmoney.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter        jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    private static final String[] PUBLIC_POST = {
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/refresh-token",
            "/api/v1/auth/logout",
            "/api/v1/media/upload",
    };

    private static final String[] PUBLIC_GET = {
            "/api/v1/articles/public",
            "/api/v1/articles/public/**",
            "/api/v1/budgets/**",
            "/api/v1/tourist-spots",
            "/api/v1/tourist-spots/search",
            "/api/v1/tourist-spots/{id}",
            "/api/v1/tourist-spots/nearby",
            "/api/v1/tourist-spots/**",
            "/api/v1/exchange-rates",
            "/api/v1/exchange-rates/convert",
            "/api/v1/wiki/**",
            "/api/v1/price-wiki/**",
            "/api/v1/atm/**",
            "/api/v1/users/me",
            "/actuator/health",
    };

    // ── Tất cả path yêu cầu role ADMIN ──────────────────
    private static final String[] ADMIN_PATHS = {
            "/api/v1/admin/**",
            "/api/v1/articles/admin/**",   // ← ArticleController: /articles/admin/...
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_POST).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET).permitAll()
                        .requestMatchers(ADMIN_PATHS).hasRole("ADMIN")  // ← dùng mảng, cover cả 2 prefix
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        })
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        config.setAllowedOriginPatterns(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
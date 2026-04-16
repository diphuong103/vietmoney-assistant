package com.vietmoney.config;

import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.Role;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        var existing = userRepository.findByUsername("admin");
        if (existing.isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@vietmoney.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .emailVerified(true)
                    .build();

            userRepository.save(admin);
            log.info("✅ Default admin account created: admin / Admin@123");
        } else {
            // Always reset admin password on startup to ensure it matches
            User admin = existing.get();
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);
            userRepository.save(admin);
            log.info("🔄 Admin password reset to default on startup.");
        }
    }
}

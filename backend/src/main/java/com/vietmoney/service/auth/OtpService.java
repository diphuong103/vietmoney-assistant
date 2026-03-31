package com.vietmoney.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    private static final String OTP_PREFIX = "otp:";
    private static final int OTP_EXPIRY_MINUTES = 5;

    public void generateAndSendOtp(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, Duration.ofMinutes(OTP_EXPIRY_MINUTES));
        sendOtpEmail(email, otp);
    }

    public boolean validateOtp(String email, String otp) {
        String stored = redisTemplate.opsForValue().get(OTP_PREFIX + email);
        if (otp.equals(stored)) {
            redisTemplate.delete(OTP_PREFIX + email);
            return true;
        }
        return false;
    }

    private void sendOtpEmail(String to, String otp) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("[VietMoney] Mã xác thực OTP");
            helper.setText(buildOtpEmailHtml(otp), true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Không thể gửi email OTP", e);
        }
    }

    private String buildOtpEmailHtml(String otp) {
        return "<div style='font-family:sans-serif;text-align:center;padding:40px'>" +
               "<h2 style='color:#D84315'>VietMoney Assistant</h2>" +
               "<p>Mã OTP của bạn là:</p>" +
               "<h1 style='color:#D84315;letter-spacing:8px'>" + otp + "</h1>" +
               "<p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>" +
               "</div>";
    }
}

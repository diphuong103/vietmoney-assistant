package com.vietmoney.service.auth;

import com.vietmoney.dto.request.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, RegisterRequest> pendingRegistrations = new ConcurrentHashMap<>();
    private final JavaMailSender mailSender;

    private static final String OTP_PREFIX = "otp:";

    private void generateAndSendOtpInternal(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        otpStorage.put(OTP_PREFIX + email, otp);
        sendOtpEmail(email, otp);
    }

    public void generateAndSendOtp(String email) {
        generateAndSendOtpInternal(email);
    }

    public void generateAndSendOtp(String email, RegisterRequest request) {
        pendingRegistrations.put(email, request);
        generateAndSendOtpInternal(email);
    }

    public RegisterRequest getPendingRegistration(String email) {
        return pendingRegistrations.get(email);
    }

    public boolean validateOtp(String email, String otp) {
        String stored = otpStorage.get(OTP_PREFIX + email);
        if (otp.equals(stored)) {
            otpStorage.remove(OTP_PREFIX + email);
            return true;
        }
        return false;
    }

    public RegisterRequest getAndRemovePendingRegistration(String email) {
        return pendingRegistrations.remove(email);
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

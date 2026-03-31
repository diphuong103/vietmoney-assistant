package com.vietmoney.service.auth;

import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.Role;
import com.vietmoney.dto.request.*;
import com.vietmoney.dto.response.*;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        if (userRepository.existsByEmail(request.getEmail()))
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .nationality(request.getNationality())
                .travelDestination(request.getTravelDestination())
                .role(Role.CLIENT)
                .build();

        userRepository.save(user);
        var userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername()).password(user.getPassword())
                .authorities("ROLE_CLIENT").build();
        String token = jwtService.generateToken(userDetails);
        return AuthResponse.builder().accessToken(token).tokenType("Bearer").build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        var userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername()).password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name()).build();
        String token = jwtService.generateToken(userDetails);
        return AuthResponse.builder().accessToken(token).tokenType("Bearer").build();
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        otpService.generateAndSendOtp(request.getEmail());
    }

    @Transactional
    public void resetPassword(VerifyOtpRequest request) {
        if (!otpService.validateOtp(request.getEmail(), request.getOtp()))
            throw new AppException(ErrorCode.OTP_INVALID);
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

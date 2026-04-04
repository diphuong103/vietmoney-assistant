package com.vietmoney.service;

import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.Role;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public Page<User> getAllUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size));
    }
    
    public void updateUserRole(Long id, String role) {
        User user = getUserById(id);
        user.setRole(Role.valueOf(role.toUpperCase()));
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

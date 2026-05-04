package com.vietmoney.exception;

public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }
}

package com.vietmoney.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vietmoney.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final Cloudinary cloudinary;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "File is empty"));
        }

        // Tối đa 50MB
        if (file.getSize() > 50 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "File quá lớn, tối đa 50MB"));
        }

        String mimeType = file.getContentType() != null
                ? file.getContentType()
                : "";

        // Chỉ cho phép ảnh / video
        if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Chỉ hỗ trợ file ảnh hoặc video"));
        }

        File tempFile = null;

        try {
            String resourceType = mimeType.startsWith("video/") ? "video" : "image";

            // Cloudinary ổn định hơn khi upload file thật thay vì byte[]
            String originalName = file.getOriginalFilename() != null
                    ? file.getOriginalFilename().replaceAll("\\s+", "_")
                    : "upload";

            tempFile = File.createTempFile("vietmoney-", "-" + originalName);

            // MultipartFile -> temp file
            file.transferTo(tempFile);

            Map<?, ?> result = cloudinary.uploader().upload(
                    tempFile,
                    ObjectUtils.asMap(
                            "resource_type", resourceType,
                            "folder", "vietmoney"
                    )
            );

            Map<String, Object> data = new HashMap<>();
            data.put("url", result.get("secure_url"));
            data.put("publicId", result.get("public_id"));
            data.put("resourceType", result.get("resource_type"));
            data.put("format", result.get("format"));
            data.put("fileSize", result.get("bytes"));
            data.put("mimeType", mimeType);

            return ResponseEntity.ok(
                    ApiResponse.success("Upload thành công", data)
            );

        } catch (Exception e) {
            e.printStackTrace(); // xem log backend thật
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error(500, "Upload thất bại: " + e.getMessage()));

        } finally {
            // Xoá temp file tránh leak ổ cứng
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}
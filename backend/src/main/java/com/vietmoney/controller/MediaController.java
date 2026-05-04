package com.vietmoney.controller;

import com.vietmoney.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final Path rootLocation = Paths.get("uploads");

    public MediaController() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "File is empty"));
        }
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + extension;
            Path destinationFile = rootLocation.resolve(Paths.get(newFilename)).normalize().toAbsolutePath();

            Files.copy(file.getInputStream(), destinationFile);

            String fileUrl = "/uploads/" + newFilename;
            Map<String, String> data = new HashMap<>();
            data.put("url", fileUrl);

            return ResponseEntity.ok(ApiResponse.success("Upload thành công", data));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error(500, "Failed to store file"));
        }
    }
}

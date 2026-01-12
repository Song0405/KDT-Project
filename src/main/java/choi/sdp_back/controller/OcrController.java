package choi.sdp_back.controller;

import choi.sdp_back.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    private final OcrService ocrService;

    @Autowired
    public OcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping("/extract-business-info")
    public ResponseEntity<Map<String, String>> extractBusinessInfo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Uploaded file is empty."));
        }

        try {
            Map<String, String> extractedData = ocrService.extractBusinessInfo(file);
            if (extractedData.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "No information could be extracted. Please check the image."));
            }
            return ResponseEntity.ok(extractedData);
        } catch (IOException e) {
            // 로깅 추가
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process image: " + e.getMessage()));
        }
    }
}


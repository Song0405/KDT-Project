package choi.sdp_back.controller;

import choi.sdp_back.dto.CompanyInfoDto;
import choi.sdp_back.service.CompanyInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-info")
@RequiredArgsConstructor
public class CompanyInfoController {

    private final CompanyInfoService companyInfoService;

    @GetMapping
    public ResponseEntity<CompanyInfoDto> getCompanyInfo() {
        CompanyInfoDto companyInfo = companyInfoService.getCompanyInfo();
        return ResponseEntity.ok(companyInfo);
    }

    // ⭐ ⭐ ⭐ 새로 추가할 부분 ⭐ ⭐ ⭐
    @PutMapping // PUT 요청을 통해 회사 정보 업데이트
    public ResponseEntity<CompanyInfoDto> updateCompanyInfo(@RequestBody CompanyInfoDto companyInfoDto) {
        CompanyInfoDto updatedInfo = companyInfoService.updateCompanyInfo(companyInfoDto);
        return ResponseEntity.ok(updatedInfo);
    }
    // ⭐ ⭐ ⭐ 여기까지 ⭐ ⭐ ⭐
}
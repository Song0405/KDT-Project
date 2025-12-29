package choi.sdp_back.service;

import choi.sdp_back.dto.CompanyInfoDto;
import choi.sdp_back.entity.CompanyInfo;
import choi.sdp_back.repository.CompanyInfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyInfoService {

    private final CompanyInfoRepository companyInfoRepository;

    @Transactional(readOnly = true)
    public CompanyInfoDto getCompanyInfo() {
        // 회사 정보는 단일 레코드만 존재한다고 가정
        CompanyInfo companyInfo = companyInfoRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    // 정보가 없으면 기본값으로 하나 생성
                    CompanyInfo defaultInfo = new CompanyInfo();
                    defaultInfo.setName("SDP Solutions");
                    defaultInfo.setDescription("SDP Solutions는 최고의 IT 솔루션을 제공합니다.");
                    defaultInfo.setAddress("서울시 강남구 테헤란로 123");
                    defaultInfo.setPhone("02-1234-5678");
                    defaultInfo.setEmail("info@sdpsolutions.com");
                    return companyInfoRepository.save(defaultInfo);
                });
        return convertToDto(companyInfo);
    }

    // ⭐ ⭐ ⭐ 새로 추가할 부분 ⭐ ⭐ ⭐
    @Transactional
    public CompanyInfoDto updateCompanyInfo(CompanyInfoDto companyInfoDto) {
        // 단일 레코드이므로, 첫 번째 회사 정보를 가져와 수정하거나, 없으면 새로 생성
        CompanyInfo companyInfo = companyInfoRepository.findAll().stream().findFirst()
                .orElseGet(CompanyInfo::new); // 없으면 새 객체 생성

        companyInfo.setName(companyInfoDto.getName());
        companyInfo.setDescription(companyInfoDto.getDescription());
        companyInfo.setAddress(companyInfoDto.getAddress());
        companyInfo.setPhone(companyInfoDto.getPhone());
        companyInfo.setEmail(companyInfoDto.getEmail());

        CompanyInfo updatedInfo = companyInfoRepository.save(companyInfo);
        return convertToDto(updatedInfo);
    }
    // ⭐ ⭐ ⭐ 여기까지 ⭐ ⭐ ⭐

    private CompanyInfoDto convertToDto(CompanyInfo companyInfo) {
        CompanyInfoDto dto = new CompanyInfoDto();
        dto.setId(companyInfo.getId());
        dto.setName(companyInfo.getName());
        dto.setDescription(companyInfo.getDescription());
        dto.setAddress(companyInfo.getAddress());
        dto.setPhone(companyInfo.getPhone());
        dto.setEmail(companyInfo.getEmail());
        return dto;
    }
}
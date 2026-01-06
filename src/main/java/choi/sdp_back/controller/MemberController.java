package choi.sdp_back.controller;

import choi.sdp_back.dto.MemberFindDto;
import choi.sdp_back.dto.MemberJoinDto;
import choi.sdp_back.dto.MemberLoginDto;
import choi.sdp_back.dto.MemberUpdateDto;
import choi.sdp_back.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // React 포트 허용
public class MemberController {

    private final MemberService memberService;

    // 회원가입
    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody MemberJoinDto dto) {
        try {
            memberService.join(dto);
            return ResponseEntity.ok("회원가입 성공");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MemberLoginDto dto) {
        try {
            Map<String, Object> result = memberService.login(dto.getMemberId(), dto.getPassword());
            result.put("message", "로그인 성공");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ⭐ [추가됨] 내 정보 조회
    @GetMapping("/info")
    public ResponseEntity<?> getMemberInfo(@RequestParam String memberId, @RequestParam String type) {
        try {
            Map<String, Object> info = memberService.getMemberInfo(memberId, type);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 정보 수정
    @PostMapping("/update")
    public ResponseEntity<?> updateMember(@RequestBody MemberUpdateDto dto) {
        try {
            memberService.updateMember(dto);
            return ResponseEntity.ok("회원 정보가 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("수정 실패: " + e.getMessage());
        }
    }


    // 회원 탈퇴
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawMember(@RequestBody MemberUpdateDto dto) {
        try {
            // 탈퇴 시에는 ID, 비번, 타입만 필요하므로 DTO 재활용
            memberService.withdrawMember(dto.getMemberId(), dto.getCurrentPassword(), dto.getType());
            return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("탈퇴 실패: " + e.getMessage());
        }
    }
    // [추가] 아이디 찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody MemberFindDto dto) {
        try {
            String foundId = memberService.findMemberId(dto.getName(), dto.getPhoneNumber());
            return ResponseEntity.ok(foundId); // 찾은 아이디 반환
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // [추가] 비밀번호 재설정
    @PostMapping("/reset-pw")
    public ResponseEntity<?> resetPw(@RequestBody MemberFindDto dto) {
        try {
            memberService.resetPassword(dto.getMemberId(), dto.getName(), dto.getPhoneNumber(), dto.getNewPassword());
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
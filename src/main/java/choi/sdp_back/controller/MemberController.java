package choi.sdp_back.controller;

import choi.sdp_back.dto.MemberFindDto;
import choi.sdp_back.dto.MemberJoinDto;
import choi.sdp_back.dto.MemberLoginDto;
import choi.sdp_back.dto.MemberUpdateDto;
import choi.sdp_back.service.MemberService;
import choi.sdp_back.service.MailService; // ✅ 이메일 서비스 임포트
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
    private final MailService mailService; // ✅ 이메일 서비스 주입 (필수)

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

    // 내 정보 조회
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
            memberService.withdrawMember(dto.getMemberId(), dto.getCurrentPassword(), dto.getType());
            return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("탈퇴 실패: " + e.getMessage());
        }
    }

    // 아이디 찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody MemberFindDto dto) {
        try {
            String foundId = memberService.findMemberId(dto.getName(), dto.getPhoneNumber());
            return ResponseEntity.ok(foundId); // 찾은 아이디 반환
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 비밀번호 재설정 (인증 후 최종 변경)
    @PostMapping("/reset-pw")
    public ResponseEntity<?> resetPw(@RequestBody MemberFindDto dto) {
        try {
            memberService.resetPassword(dto.getMemberId(), dto.getName(), dto.getPhoneNumber(), dto.getNewPassword());
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ----------------------------------------------------------------
    // ⭐ [추가됨] 이메일 인증 관련 API (회원님이 만든 기능)
    // ----------------------------------------------------------------

    // 1. 인증번호 발송
    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendCode(@RequestParam String email) {
        try {
            mailService.sendVerificationCode(email);
            return ResponseEntity.ok("인증번호가 발송되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("메일 전송 실패: " + e.getMessage());
        }
    }

    // 2. 인증번호 확인
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestParam String email, @RequestParam String code) {
        boolean result = mailService.verifyCode(email, code);
        if (result) {
            return ResponseEntity.ok("인증 성공! (비밀번호 변경을 진행하세요)");
        } else {
            return ResponseEntity.status(400).body("인증번호가 일치하지 않습니다.");
        }
    }
}
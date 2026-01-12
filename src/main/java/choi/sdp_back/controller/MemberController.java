package choi.sdp_back.controller;

import choi.sdp_back.dto.MemberJoinDto;
import choi.sdp_back.dto.MemberLoginDto;
import choi.sdp_back.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MemberController {

    private final MemberService memberService;

    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody MemberJoinDto dto) {
        try {
            memberService.join(dto);
            return ResponseEntity.ok("회원가입 성공");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MemberLoginDto dto) {
        try {
            // 서비스가 이미 Map으로 결과를 줌
            Map<String, Object> result = memberService.login(dto.getMemberId(), dto.getPassword());
            result.put("message", "로그인 성공");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
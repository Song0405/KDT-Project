package choi.sdp_back.controller;

import choi.sdp_back.entity.Layout;
import choi.sdp_back.repository.LayoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/layouts")
@CrossOrigin(origins = "http://localhost:3000") // 리액트 서버 허용
public class LayoutController {

    @Autowired
    private LayoutRepository layoutRepository;

    @GetMapping
    public List<Layout> getAllLayouts() {
        // DB에서 모든 추천 배치 테마를 가져옵니다.
        return layoutRepository.findAll();
    }
}
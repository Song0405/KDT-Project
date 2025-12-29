package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000) // 설명이 길어질 수 있으므로 길이를 늘려줍니다.
    private String description;

    private String imageFileName; // 이미지 파일 이름
    private Integer price;
}
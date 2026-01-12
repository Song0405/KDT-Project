package choi.sdp_back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@MappedSuperclass
@Getter @Setter
public abstract class MemberBase {

    @Id
    @Column(name = "MEMBER_ID")
    private String memberId;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(name = "PHONE_NUMBER")
    private String phoneNumber;

    private String email;

    @CreationTimestamp
    @Column(name = "JOIN_DATE", updatable = false)
    private LocalDateTime joinDate;
}
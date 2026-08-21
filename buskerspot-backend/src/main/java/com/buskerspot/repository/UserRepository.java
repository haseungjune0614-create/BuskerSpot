package com.buskerspot.repository;

import com.buskerspot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, Long id);

    Optional<User> findByKakaoId(String kakaoId);

    Optional<User> findByGoogleId(String googleId);  

    @Query("SELECT u FROM User u WHERE u.role = :role AND (LOWER(u.nickname) LIKE :keyword OR LOWER(u.bandName) LIKE :keyword OR LOWER(u.genre) LIKE :keyword)")
    List<User> findByRoleAndKeyword(@Param("role") String role, @Param("keyword") String keyword);

    // 검색 서비스 로직과의 호환성을 위해 필요한 메서드
    List<User> findByNicknameContainingIgnoreCaseOrGenreContainingIgnoreCase(String nickname, String genre);
}
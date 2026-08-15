package com.buskerspot.repository;

import com.buskerspot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    boolean existsByNicknameAndIdNot(String nickname, Long id);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (LOWER(u.nickname) LIKE :keyword OR LOWER(u.bandName) LIKE :keyword OR LOWER(u.genre) LIKE :keyword)")
    List<User> findByRoleAndKeyword(@Param("role") String role, @Param("keyword") String keyword);
}
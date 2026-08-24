package com.buskerspot.repository;

import com.buskerspot.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserId(Long userId);
    Optional<Bookmark> findByUserIdAndTargetId(Long userId, Long targetId);

    // 💡 [신규] 유저 삭제 시 관련 찜 기록 정리용
    @Transactional
    void deleteByUserId(Long userId);
}
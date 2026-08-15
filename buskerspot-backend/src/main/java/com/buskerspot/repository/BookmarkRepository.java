package com.buskerspot.repository;

import com.buskerspot.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserId(Long userId);
    Optional<Bookmark> findByUserIdAndTargetId(Long userId, Long targetId);
}
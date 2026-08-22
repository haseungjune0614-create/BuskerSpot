package com.buskerspot.repository;

import com.buskerspot.entity.MessageRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface MessageRecipientRepository extends JpaRepository<MessageRecipient, Long> {

    @Query("select mr from MessageRecipient mr " +
           "join fetch mr.message m " +
           "where mr.user.id = :userId " +
           "order by m.createdAt desc")
    Page<MessageRecipient> findMyMessages(@Param("userId") Long userId, Pageable pageable);

    Optional<MessageRecipient> findByIdAndUser_Id(Long id, Long userId);

    long countByUser_IdAndIsReadFalse(Long userId);

    // [신규] 특정 유저가 수신자로 등록된 모든 레코드 삭제
    @Modifying
    @Transactional
    void deleteByUser_Id(Long userId);
}
package com.buskerspot.repository;

import com.buskerspot.entity.MessageRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageRecipientRepository extends JpaRepository<MessageRecipient, Long> {

    @Query("select mr from MessageRecipient mr " +
           "join fetch mr.message m " +
           "where mr.user.id = :userId " +
           "order by m.createdAt desc")
    Page<MessageRecipient> findMyMessages(@Param("userId") Long userId, Pageable pageable);

    Optional<MessageRecipient> findByIdAndUser_Id(Long id, Long userId);

    long countByUser_IdAndIsReadFalse(Long userId);
}

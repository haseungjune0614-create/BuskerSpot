package com.buskerspot.service;

import com.buskerspot.entity.SearchKeyword;
import com.buskerspot.repository.SearchKeywordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final SearchKeywordRepository searchKeywordRepository;

    private static final int MIN_KEYWORD_LENGTH = 1;
    private static final int MAX_KEYWORD_LENGTH = 50;

    // 검색어 기록 (있으면 count +1, 없으면 새로 생성)
    @Transactional
    public void recordKeyword(String rawKeyword) {
        if (rawKeyword == null) return;
        String keyword = rawKeyword.trim();

        if (keyword.length() < MIN_KEYWORD_LENGTH || keyword.length() > MAX_KEYWORD_LENGTH) return;

        searchKeywordRepository.findByKeyword(keyword)
                .ifPresentOrElse(
                        existing -> existing.setSearchCount(existing.getSearchCount() + 1),
                        () -> searchKeywordRepository.save(
                                SearchKeyword.builder().keyword(keyword).searchCount(1L).build()
                        )
                );
    }

    // 인기 검색어 상위 N개 조회 (검색 횟수 내림차순)
    public List<String> getPopularKeywords(int limit) {
        return searchKeywordRepository
                .findAllByOrderBySearchCountDescUpdatedAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(SearchKeyword::getKeyword)
                .toList();
    }
}
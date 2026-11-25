package com.otet.prep.repository;

import com.otet.prep.model.entity.TestPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestPaperRepository extends JpaRepository<TestPaper, Long> {
    Optional<TestPaper> findByPaperCode(String paperCode);
}

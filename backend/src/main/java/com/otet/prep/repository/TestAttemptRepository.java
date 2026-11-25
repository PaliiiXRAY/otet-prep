package com.otet.prep.repository;

import com.otet.prep.model.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByCandidateEmailOrderBySubmitTimeDesc(String email);
}

package com.otet.prep.repository;

import com.otet.prep.model.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByCandidateEmailOrderByStartTimeDesc(String candidateEmail);
    Optional<TestAttempt> findTopByCandidateEmailAndStatusOrderByStartTimeDesc(String candidateEmail, String status);
}

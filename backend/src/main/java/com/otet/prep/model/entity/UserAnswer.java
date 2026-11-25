package com.otet.prep.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_answers")
public class UserAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_attempt_id", nullable = false)
    private TestAttempt testAttempt;

    private Long questionId;
    private Integer selectedOptionIndex; // null if skipped
    private boolean isCorrect;

    public UserAnswer() {}

    public UserAnswer(TestAttempt testAttempt, Long questionId, Integer selectedOptionIndex, boolean isCorrect) {
        this.testAttempt = testAttempt;
        this.questionId = questionId;
        this.selectedOptionIndex = selectedOptionIndex;
        this.isCorrect = isCorrect;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TestAttempt getTestAttempt() { return testAttempt; }
    public void setTestAttempt(TestAttempt testAttempt) { this.testAttempt = testAttempt; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public Integer getSelectedOptionIndex() { return selectedOptionIndex; }
    public void setSelectedOptionIndex(Integer selectedOptionIndex) { this.selectedOptionIndex = selectedOptionIndex; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }
}

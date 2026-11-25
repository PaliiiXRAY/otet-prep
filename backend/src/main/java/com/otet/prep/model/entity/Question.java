package com.otet.prep.model.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_paper_id", nullable = false)
    private TestPaper testPaper;

    private int questionNumber;

    @Column(nullable = false, length = 50)
    private String subject; // e.g., "CDP", "Odia", "English", "Math", "Science", "Social Studies"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionEn;

    @Column(columnDefinition = "TEXT")
    private String questionOr;

    @Column(nullable = false)
    private int correctOptionIndex; // 0, 1, 2, 3 - NEVER EXPOSED TO STUDENT DURING TEST

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("optionIndex ASC")
    private List<QuestionOption> options = new ArrayList<>();

    public Question() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TestPaper getTestPaper() { return testPaper; }
    public void setTestPaper(TestPaper testPaper) { this.testPaper = testPaper; }

    public int getQuestionNumber() { return questionNumber; }
    public void setQuestionNumber(int questionNumber) { this.questionNumber = questionNumber; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getQuestionEn() { return questionEn; }
    public void setQuestionEn(String questionEn) { this.questionEn = questionEn; }

    public String getQuestionOr() { return questionOr; }
    public void setQuestionOr(String questionOr) { this.questionOr = questionOr; }

    public int getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(int correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public List<QuestionOption> getOptions() { return options; }
    public void setOptions(List<QuestionOption> options) { this.options = options; }

    public void addOption(QuestionOption option) {
        options.add(option);
        option.setQuestion(this);
    }
}

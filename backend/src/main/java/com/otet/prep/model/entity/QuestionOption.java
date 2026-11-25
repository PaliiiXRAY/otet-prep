package com.otet.prep.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "question_options")
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private int optionIndex; // 0 (A), 1 (B), 2 (C), 3 (D)

    @Column(columnDefinition = "TEXT", nullable = false)
    private String textEn;

    @Column(columnDefinition = "TEXT")
    private String textOr;

    public QuestionOption() {}

    public QuestionOption(int optionIndex, String textEn, String textOr) {
        this.optionIndex = optionIndex;
        this.textEn = textEn;
        this.textOr = textOr;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public int getOptionIndex() { return optionIndex; }
    public void setOptionIndex(int optionIndex) { this.optionIndex = optionIndex; }

    public String getTextEn() { return textEn; }
    public void setTextEn(String textEn) { this.textEn = textEn; }

    public String getTextOr() { return textOr; }
    public void setTextOr(String textOr) { this.textOr = textOr; }
}

from typing import List, Optional
from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    question_id: int = Field(..., description="Unique ID for the question within the session")
    question_text: str = Field(..., description="The interview question generated for the candidate")
    category: str = Field(..., description="Category e.g., Technical, System Design, Behavioral, Problem Solving")
    expected_key_points: List[str] = Field(default_factory=list, description="Key concepts or keywords expected in a good answer")
    difficulty: str = Field(default="Medium", description="Difficulty level: Easy, Medium, Hard")


class InterviewQuestionsResponse(BaseModel):
    job_id: int
    resume_id: int
    total_questions: int
    questions: List[InterviewQuestion]


class CandidateAnswerSubmit(BaseModel):
    question_id: int
    answer_text: str = Field(..., description="Transcribed audio or text answer provided by the candidate")


class QuestionEvaluation(BaseModel):
    question_id: int
    score: float = Field(..., ge=0.0, le=100.0, description="Score for this specific answer out of 100")
    technical_accuracy: float = Field(..., ge=0.0, le=100.0, description="Technical correctness score")
    communication_score: float = Field(..., ge=0.0, le=100.0, description="Clarity and structured communication score")
    feedback: str = Field(..., description="Detailed constructive feedback on the answer")


class InterviewEvaluationResult(BaseModel):
    overall_interview_score: float = Field(..., ge=0.0, le=100.0, description="Overall average interview performance score")
    technical_score: float = Field(..., ge=0.0, le=100.0, description="Aggregated technical expertise score")
    communication_score: float = Field(..., ge=0.0, le=100.0, description="Aggregated clarity and communication score")
    confidence_score: float = Field(..., ge=0.0, le=100.0, description="Estimated confidence level")
    strengths: List[str] = Field(default_factory=list, description="Key candidate strengths observed")
    weaknesses: List[str] = Field(default_factory=list, description="Areas where candidate needs improvement")
    summary_feedback: str = Field(..., description="Comprehensive summary of the candidate's interview performance")
    question_evaluations: List[QuestionEvaluation] = Field(default_factory=list, description="Per-question evaluation breakdown")
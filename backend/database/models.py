
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid


class Question(BaseModel):
    text: str
    reveal_answer: str


class Description(BaseModel):

    client_name: str
    client_goal: str
    client_description: str
    situation_description: str
    company_study: Optional[str] = None
    global_hints: Optional[List[str]] = []
    questions: List[Question]


class CaseInterview(BaseModel):
    id : str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: str
    source: str
    url: str
    description: Description


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", or "system"
    content: str

class InitialChatRequest(BaseModel):
    case_id: str

class FollowUpChatRequest(BaseModel):
    case_id: str # Good to keep for context, even if response_id is primary
    response_id: str # The ID from the previous LLM response
    user_message: str
    # You might add current_question_index or other stateful info here

class AIResponseMessage(BaseModel):
    response_id: Optional[str] = None # The new ID from the LLM for follow-up
    ai_message: str


from fastapi import APIRouter
from backend.database.models import CaseInterview
from backend.database.db import cases
from typing import List

router = APIRouter()

@router.get("/", response_model=List[CaseInterview])
async def get_cases():
    """
    Returns a list of McKinsey case interviews with detailed descriptions.
    """
    return cases

@router.get("/cases/{case_id}", response_model=CaseInterview)
async def get_case(case_id: str):
    """
    Returns a specific McKinsey case interview by ID.
    """
    return next((case for case in cases if case.id == case_id), None)

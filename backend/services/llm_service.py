import os
from openai import OpenAI, APIError
from dotenv import load_dotenv
from typing import List, Dict, Optional
from pathlib import Path

# Load environment variables from .env file explicitly
# Assumes .env file is in the 'backend' directory, one level up from 'services'
dotenv_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please set it in your .env file.")

client = OpenAI(api_key=OPENAI_API_KEY)

ChatMessage = Dict[str, str] 



async def get_ai_response_initial(
    instructions: str,
    current_case_context: Optional[str] = None,
    model: str = "gpt-4o-mini",
    temperature: float = 0.5,
) -> Dict[str, str]:
    
    """
    This is the initial starting function for the AI to generate the first response 
    It is equivalent to say, greeting and explaining the user the basic case study, instructions, global hints etc
    This will return a response_id and the ai_message
    It will be later used to generate and chain the following responses to start the conversation

    Args: 
        instructions: str,
        current_case_context: Optional[str] = None,
        model: str = "gpt-4.1-mini",
        temperature: float = 0.5,
    Returns:
        Dict[str, str]: A dictionary containing the response_id and the ai_message
    """   
    input = f"Current case context: {current_case_context}"
    try:
        # Removed await, as client.responses.create is synchronous with the standard OpenAI client
        response = client.responses.create(
            model=model,
            input= input,
            instructions=instructions,
            temperature=temperature,
        )
        # print(response)
        response_id = response.id
        ai_message = response.output_text
        return {"response_id": response_id, "ai_message": ai_message.strip()}
    except APIError as e:
        print(f"OpenAI API Error: {e}")
        return {"response_id": None, "ai_message": f"Error communicating with AI: {e.strerror or str(e)}"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"response_id": None, "ai_message": "An unexpected error occurred while trying to get an AI response."}


# THIS IS WHERE THE WEBSOCKET CONNECTION WILL BE MADE, these apis will be now "streamed"
async def get_ai_response_follow_up(
    response_id: str,
    instructions: str, # add the instructions for follow up here itself to avoid useless parameter passing
    curr_message: str,
    question: Optional[str] = None,
    answer: Optional[str] = None,
    model: str = "gpt-4o-mini",
    temperature: float = 0.5,
) -> Dict[str, str]:
    """
    This function will be used to generate the follow-up response to the user's message. 
    POINT TO NOTE -> we haven't started the analysis of questions yet, we are just explaining the case study, instructions, global hints and the general context 
    to the interviewee.

    This will used recursively to generate the follow-up responses to the user's message until the interviewee or interviewer or some timer decides that its the right time to start the actual interview process.

    THE RECURSIVE IMPlEMENTATION IDEA => (used later in the backend)
    base case = (if follow_up_timer < 00 || if user.clicked_on_start_interview_button || if user.clicked_on_end_interview_button) return a signal to the backend to start the actual interview process
    base case = (if response_id is None) return a signal to the backend to end the process and give the error message to the frontend
    if the base case is met then the websocket connection will be closed and anoter websocket connection will be started when the user clicks on the actual start button
    
    recursive case = 
    response_id, ai_message = get_ai_response_follow_up(response_id, instructions, curr_message) # instructions will be hardcoded later when defined
    the ai_message is to be displayed to the user on the frontend chat interface
    fetch the updated timer value from the frontend, and the user's message from the frontend
    the function where all of this is defined will be called recursively until the base case is met

    Args:
        response_id: str, // either from the previous response or from the gen_ai_response_initial function
        instructions: str,
        curr_message: str,
        model: str = "gpt-4o-mini",
        temperature: float = 0.5,   
    Returns:
        Dict[str, str]: A dictionary containing the response_id and the ai_message
    """
    if question and answer:
        input = [{"role": "user", "content": curr_message}, {"role": "user", "content": question}, {"role": "user", "content": answer}] # ig question and answer are not to be provided with role as user, will see later
    else:
        input = [{"role": "user", "content": curr_message}]
    try:
        # Removed await
        response = client.responses.create(
            model=model,
            previous_response_id=response_id,
            input=input,
            instructions=instructions,
            temperature=temperature,
        )
        print(response)
        response_id = response.id
        ai_message = response.output_text
        if response_id is None:
            return {"response_id": None, "ai_message": "An unexpected error occurred while trying to get an AI response."}
        else:
            return {"response_id": response_id, "ai_message": ai_message.strip()}
    except APIError as e:
        print(f"OpenAI API Error: {e}")
        return {"response_id": None, "ai_message": f"Error communicating with AI: {e.strerror or str(e)}"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"response_id": None, "ai_message": "An unexpected error occurred while trying to get an AI response."}
    

async def gen_ai_response_question(
    response_id: str,
    question: str,
    answer: str,
    instructions: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.5,
) -> Dict[str, str]:
    """
    This function will be used to explain the question to the user, the instructions/system prompt will be designed accordingly
    This is a starting point as usual and will be used as a starting function in a function that will manage it in the chat.py file.

    chat.py general design for this function =>
    (it will be called recursively until the base case is met)

    base case = (if follow_up_timer < 00 || if user.clicked_on_I_UNDERSTAND_bubble || if user.clicked_on_end_interview_button) return a signal to the backend to start resigstering the user's response as answers over to the next function
    base case = (if response_id is None) return a signal to the backend to end the process and give the error message to the frontend

    response_id, ai_message = gen_ai_response_question(response_id, question, answer) # instructions will be hardcoded later when defined 
    The above function is ran once 

    if user.clicked_on_I_DONT_UNDERSTAND_bubble, then the follow_up function will be called again with the updated response_id and the user's message and the question and answer will also passed

    """
    input = [{"role": "user", "content": question}, {"role": "user", "content": answer}] # ig question and answer are not to be provided with role as user, will see later
    try:
        # Removed await
        response = client.responses.create(
            model=model,
            previous_response_id=response_id,
            input=input,
            instructions=instructions,
            temperature=temperature,
        )
        print(response)
        response_id = response.id
        ai_message = response.output_text
        return {"response_id": response_id, "ai_message": ai_message.strip()}
    except APIError as e:
        print(f"OpenAI API Error: {e}")
        return {"response_id": None, "ai_message": f"Error communicating with AI: {e.strerror or str(e)}"}

async def gen_ai_response_answer(
    response_id: str,
    question: str,
    answer: str,
    curr_message: str,
    instructions: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.5,
) -> Dict[str, str]:
    """
    This function will take the user's answer and guide it through the question, it will be the main orchestractor
    It will be passed the doc text, the chat history (if necessary though it will probably not be neeeded as it is already passed in the response_id), the question and the answer

    There is a kind of problem with the parent function, how will I determine when to end it apart from the timer and the user's action? Will think about it later
    chat.py general design for this function =>
    (it will be called recursively until the base case is met)

    base case = (if follow_up_timer < 00 || if user.clicked_on_DONE_button || if user.clicked_on_end_interview_button) return a signal to the backend to start resigstering the user's response as answers over to the next function
    base case = (if response_id is None) return a signal to the backend to end the process and give the error message to the frontend

    response_id, ai_message = gen_ai_response_answer(response_id, question, answer) # instructions will be hardcoded later when defined 
    """
    input = [{"role": "user", "content": question}, {"role": "user", "content": answer}]
    try:
        # Removed await
        response = client.responses.create(
            model=model,
            previous_response_id=response_id,
            input=input,
            instructions=instructions,
            temperature=temperature,
        )           
        print(response)
        response_id = response.id
        ai_message = response.output_text
        return {"response_id": response_id, "ai_message": ai_message.strip()}
    except APIError as e:
        print(f"OpenAI API Error: {e}")
        return {"response_id": None, "ai_message": f"Error communicating with AI: {e.strerror or str(e)}"}


async def gen_ai_response_analysis(
    response_id: str,
    question: str,
    answer: str,
    instructions: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.5,
) -> Dict[str, str]:
    """
    This function will be used to analyze the user's answer and provide feedback to the user.
    It will be passed the question, the answer, the instructions and the model and temperature.

    straight forward  some if's statements like if the Done button is clicked and shit some state mgmt needed here on the frontend side.
    There should be an option to download the analysis as a pdf or sum shi 
    """
    input = [{"role": "user", "content": question}, {"role": "user", "content": answer}]
    try:
        # Removed await
        response = client.responses.create(
            model=model,
            previous_response_id=response_id,
            input=input,
            instructions=instructions,
            temperature=temperature,
        )
        print(response)
        response_id = response.id
        ai_message = response.output_text
        return {"response_id": response_id, "ai_message": ai_message.strip()}   
    except APIError as e:
        print(f"OpenAI API Error: {e}")
        return {"response_id": None, "ai_message": f"Error communicating with AI: {e.strerror or str(e)}"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"response_id": None, "ai_message": "An unexpected error occurred while trying to get an AI response."}


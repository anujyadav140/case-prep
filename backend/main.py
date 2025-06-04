from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import chat, cases # chat router will still be used for /initiate_chat
from backend.services.llm_service import get_ai_response_follow_up # For the moved WS endpoint
import yaml # For loading prompts

app = FastAPI(title="Case Interviews API")

# Load prompts for WebSocket endpoint if they are not globally accessible
# This duplicates loading from chat.py, consider a shared config/loader later
with open("backend/prompts.yaml", 'r') as f:
    prompts_config = yaml.safe_load(f)

follow_up_instructions_for_ws = prompts_config.get(
    'follow_up_prompt',
    prompts_config.get('default_system_prompt')
)

# Allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(cases.router, prefix="/cases", tags=["cases"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])

@app.websocket("/ws_test")
async def websocket_test_endpoint(websocket: WebSocket):
    print("Test WebSocket attempting to connect. Headers:")
    for name, value in websocket.headers.items():
        print(f"  {name}: {value}")
    try:
        await websocket.accept()
        print("Test WebSocket connection accepted.")
        while True:
            data = await websocket.receive_text()
            print(f"Test WebSocket received: {data}")
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("Test WebSocket client disconnected")
    except Exception as e:
        print(f"Test WebSocket error: {e}")
    finally:
        print("Test WebSocket connection closed.")

@app.websocket("/ws/chat/{case_id}/{initial_response_id}")
async def websocket_chat_endpoint_main( # Renamed to avoid conflict if chat.py is imported with its own
    websocket: WebSocket,
    case_id: str,
    initial_response_id: str
):
    client_origin = websocket.headers.get("origin")
    print(f"MAIN APP WebSocket connection attempt for case {case_id} from Origin: {client_origin}")
    print("All headers (main app):")
    for name, value in websocket.headers.items():
        print(f"  {name}: {value}")

    allowed_origins = [
        "http://localhost:3000",
    ]

    if client_origin not in allowed_origins:
        print(f"Origin '{client_origin}' not in allowed list {allowed_origins}. Rejecting WebSocket from main app.")
        await websocket.close(code=4003)
        return

    try:
        await websocket.accept()
        print(f"MAIN APP WebSocket connection accepted for case {case_id} from origin {client_origin}.")
    except Exception as e:
        print(f"Error during MAIN APP WebSocket accept for case {case_id}: {e}")
        await websocket.close(code=1011)
        return
        
    current_response_id = initial_response_id

    try:
        while True:
            user_message = await websocket.receive_text()
            
            if not current_response_id:
                await websocket.send_json({"error": "Cannot process message: AI context (response_id) is missing."})
                continue

            llm_response = await get_ai_response_follow_up(
                response_id=current_response_id,
                instructions=follow_up_instructions_for_ws,
                curr_message=user_message
            )

            ai_message = llm_response.get("ai_message")
            new_response_id = llm_response.get("response_id")

            if ai_message is None or new_response_id is None:
                await websocket.send_json({"error": "Failed to get AI response or response_id."})
            else:
                current_response_id = new_response_id
                await websocket.send_json({
                    "ai_message": ai_message,
                    "response_id": current_response_id
                })

    except WebSocketDisconnect:
        print(f"Client disconnected from MAIN APP WebSocket chat for case {case_id}")
    except Exception as e:
        print(f"Error in MAIN APP WebSocket chat for case {case_id}: {e}")
        try:
            await websocket.send_json({"error": f"An server error occurred: {str(e)}"})
        except Exception:
            pass
    finally:
        print(f"Closing MAIN APP WebSocket connection for case {case_id}")


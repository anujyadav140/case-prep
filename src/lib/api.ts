const API_BASE_URL = "/api"; // Updated to use the Next.js proxy

export interface Case {
  id: string;
  name: string;
  description: {
    client_name: string;
    client_goal: string;
    situation_description: string;
  };
}

export interface AIResponseMessage {
  response_id?: string; // Made optional as per backend model
  ai_message: string;
}

export interface FollowUpChatPayload {
  case_id: string;
  response_id: string; // ID from the previous AI message
  user_message: string;
}

export const getCases = async (): Promise<Case[]> => {
  const res = await fetch(`${API_BASE_URL}/cases`);
  if (!res.ok) {
    throw new Error("Failed to fetch cases");
  }
  return res.json();
};

export const initiateChatSession = async (caseId: string): Promise<AIResponseMessage> => {
  const res = await fetch(`${API_BASE_URL}/chat/initiate_chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ case_id: caseId }),
  });
  if (!res.ok) {
    throw new Error("Failed to initiate chat session");
  }
  return res.json();
};

export const followUpChat = async (payload: FollowUpChatPayload): Promise<AIResponseMessage> => {
  const res = await fetch(`${API_BASE_URL}/chat/follow_up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to send message" }));
    throw new Error(errorData.detail || "Failed to send message");
  }
  return res.json();
};
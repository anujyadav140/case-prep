const API_BASE_URL = "/api"; // Updated to use the Next.js proxy

export interface Case {
  id: string;
  name: string;
  description: {
    client_name: string;
    client_goal: string;
    situation_description: string;
    questions: { text: string }[];
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

export const getCase = async (caseId: string): Promise<Case> => {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch case ${caseId}`);
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

// The followUpChat function is removed as communication will now be via WebSockets.
// WebSocket connection and message handling will be managed directly in the component.
import axios from "axios";

export async function POST(request: Request) {
  try {
    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_AIASSEMLBY_apiKey;
    
    if (!apiKey || apiKey === 'your_assemblyai_api_key_here') {
      return Response.json(
        { error: "AssemblyAI API key not configured. This feature requires an AssemblyAI account." },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "https://api.assemblyai.com/v2/realtime/token",
      { expires_in: 3600 },
      { headers: { authorization: apiKey } } 
    );
    
    const { data } = response;
    console.log("Token generated successfully");
    return Response.json(data);
    
  } catch (error: any) {
    console.error("Error getting AssemblyAI token:", error.message);
    return Response.json(
      { error: "Failed to get transcription token. Please check API key configuration." },
      { status: 500 }
    );
  }
}

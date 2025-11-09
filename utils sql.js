import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { encrypted_data, emotions, confidence_scores } =
      await request.json();

    if (!encrypted_data || !emotions || !confidence_scores) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO encrypted_messages (encrypted_data, emotions, confidence_scores)
      VALUES (${encrypted_data}, ${JSON.stringify(emotions)}, ${JSON.stringify(confidence_scores)})
      RETURNING id, timestamp
    `;

    return Response.json({
      id: result[0].id,
      timestamp: result[0].timestamp,
    });
  } catch (error) {
    console.error("Error storing message:", error);
    return Response.json({ error: "Failed to store message" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const messages = await sql`
      SELECT id, emotions, confidence_scores, timestamp
      FROM encrypted_messages
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    return Response.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

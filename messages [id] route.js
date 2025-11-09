import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { error: "Message ID is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      SELECT encrypted_data, emotions, confidence_scores, timestamp
      FROM encrypted_messages
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    return Response.json({
      encrypted_data: result[0].encrypted_data,
      emotions: result[0].emotions,
      confidence_scores: result[0].confidence_scores,
      timestamp: result[0].timestamp,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return Response.json({ error: "Failed to fetch message" }, { status: 500 });
  }
}

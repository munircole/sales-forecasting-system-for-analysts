import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getUserDatasets, saveDataset } from "@/lib/database"
import { saveFile } from "@/lib/storage"

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    const result = await getUserDatasets(user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get datasets error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request)
    const formData = await request.formData()

    const file = formData.get("file")
    const name = formData.get("name")

    if (!file || !name) {
      return NextResponse.json({ success: false, message: "File and name are required" }, { status: 400 })
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Save file with encryption
    const fileResult = await saveFile(fileBuffer, file.name, "datasets")

    if (!fileResult.success) {
      return NextResponse.json({ success: false, message: "Failed to save file" }, { status: 500 })
    }

    // Parse CSV to get record and column count (simplified)
    const csvContent = fileBuffer.toString("utf8")
    const lines = csvContent.split("\n").filter((line) => line.trim())
    const recordCount = Math.max(0, lines.length - 1) // Subtract header
    const columnCount = lines.length > 0 ? lines[0].split(",").length : 0

    // Save dataset metadata to database
    const datasetInfo = {
      name,
      originalFilename: file.name,
      filePath: fileResult.filePath,
      fileSize: file.size,
      mimeType: file.type,
      recordCount,
      columnCount,
      metadata: {
        columns: lines.length > 0 ? lines[0].split(",").map((col) => col.trim()) : [],
        fileId: fileResult.fileId,
      },
    }

    const result = await saveDataset(user.id, datasetInfo)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Upload dataset error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

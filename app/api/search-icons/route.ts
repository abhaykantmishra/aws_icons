import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export interface IconFile {
  name: string
  path: string
  relativePath: string
  directory: string
  size?: number
  lastModified?: Date
  depth: number
}

export interface SearchResponse {
  icons: IconFile[]
  total: number
  query: string
  directories: string[]
}

async function searchIconFiles(
  searchTerm = "",
  jsonFile = "/app/icons.json",
  filterDir?: string,
): Promise<{
  icons: IconFile[]
  directories: string[]
}> {
  try {
    const jsonPath = path.join(process.cwd(), jsonFile)
    const raw = await fs.readFile(jsonPath, "utf-8")
    const allFiles: IconFile[] = JSON.parse(raw)

    let filteredFiles = allFiles
    if (filterDir) {
      filteredFiles = allFiles.filter((file) => file.directory === filterDir)
    }

    const directories = [...new Set(allFiles.map((file) => file.directory))].sort()

    if (!searchTerm.trim()) {
      return {
        icons: filteredFiles.sort((a, b) => {
          if (a.directory !== b.directory) return a.directory.localeCompare(b.directory)
          return a.name.localeCompare(b.name)
        }),
        directories,
      }
    }

    const searchTermLower = searchTerm.toLowerCase()
    const matchingFiles = filteredFiles.filter((file) => {
      const fileName = file.name.toLowerCase()
      const fileNameWithoutExt = path.parse(fileName).name
      const directoryName = file.directory.toLowerCase()
      const relativePath = file.relativePath.toLowerCase()

      const searchTargets = [
        fileName,
        fileNameWithoutExt,
        directoryName,
        relativePath,
        ...fileNameWithoutExt.split("-"),
        ...directoryName.split("/"),
        ...relativePath.split("/"),
      ]

      return searchTargets.some((target) => target.includes(searchTermLower))
    })

    const sortedFiles = matchingFiles.sort((a, b) => {
      const getRelevanceScore = (file: IconFile) => {
        const fileName = file.name.toLowerCase()
        const fileNameWithoutExt = path.parse(fileName).name
        const directory = file.directory.toLowerCase()
        let score = 0
        if (fileName === searchTermLower || fileNameWithoutExt === searchTermLower) score += 100
        if (fileName.startsWith(searchTermLower) || fileNameWithoutExt.startsWith(searchTermLower)) score += 50
        if (directory.includes(searchTermLower)) score += 25
        if (fileName.includes(searchTermLower)) score += 10
        score -= file.depth
        return score
      }

      const scoreA = getRelevanceScore(a)
      const scoreB = getRelevanceScore(b)
      if (scoreA !== scoreB) return scoreB - scoreA
      if (a.directory !== b.directory) return a.directory.localeCompare(b.directory)
      return a.name.localeCompare(b.name)
    })

    return {
      icons: sortedFiles,
      directories,
    }
  } catch (error) {
    console.error("Error reading or processing icons.json:", error)
    return { icons: [], directories: [] }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const filterDir = searchParams.get("filter_dir") || undefined

    const { icons, directories } = await searchIconFiles(query, "/app/icons.json", filterDir)

    const response: SearchResponse = {
      icons,
      total: icons.length,
      query,
      directories,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Failed to search icons", icons: [], total: 0, query: "", directories: [] },
      { status: 500 },
    )
  }
}

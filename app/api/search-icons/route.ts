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

/**
 * Recursively get all files from a directory and its subdirectories
 * @param dirPath - The directory path to search
 * @param baseDir - The base directory for calculating relative paths
 * @param currentDepth - Current recursion depth
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 * @returns Promise<IconFile[]> - Array of all files found
 */
async function getAllFilesRecursively(
  dirPath: string,
  baseDir: string,
  currentDepth = 0,
  maxDepth = 10,
): Promise<IconFile[]> {
  const files: IconFile[] = []

  if (currentDepth > maxDepth) {
    console.warn(`Maximum recursion depth (${maxDepth}) reached for ${dirPath}`)
    return files
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.relative(baseDir, fullPath)

      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") {
          continue
        }

        const subFiles = await getAllFilesRecursively(fullPath, baseDir, currentDepth + 1, maxDepth)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase()
        const supportedFormats = [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"]

        if (supportedFormats.includes(extension)) {
          try {
            const stats = await fs.stat(fullPath)
            const directory = path.dirname(relativePath)

            // Calculate the public URL path by removing 'public' from the start
            const publicUrlPath = relativePath.replace(/^public\//, "/")

            files.push({
              name: entry.name,
              // Use the full public URL path
              path: publicUrlPath.replace(/\\/g, "/"),
              relativePath: relativePath.replace(/\\/g, "/"),
              directory: directory === "." ? "root" : directory.replace(/\\/g, "/"),
              size: stats.size,
              lastModified: stats.mtime,
              depth: currentDepth,
            })
          } catch (error) {
            console.warn(`Error getting stats for ${fullPath}:`, error)
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${dirPath}:`, error)
  }

  return files
}

/**
 * Search for icon files in the public/icons directory and all subdirectories
 * @param searchTerm - The search term to filter filenames
 * @param directory - The directory to search in (default: public/icons)
 * @returns Promise<IconFile[]> - Array of matching icon files
 */
async function searchIconFiles(
  searchTerm = "",
  directory = "public/icons",
  filterDir?: string,
): Promise<{
  icons: IconFile[]
  directories: string[]
}> {
  try {
    // Get the absolute path to the icons directory
    const iconsDirectory = path.join(process.cwd(), directory)

    // Check if directory exists
    try {
      await fs.access(iconsDirectory)
    } catch (error) {
      console.warn(`Directory ${iconsDirectory} does not exist: `, error)
      return { icons: [], directories: [] }
    }

    // Get all files recursively
    const allFiles = await getAllFilesRecursively(iconsDirectory, iconsDirectory)

    // Apply directory filter if specified
    let filteredFiles = allFiles
    if (filterDir) {
      filteredFiles = allFiles.filter((file) => file.directory === filterDir)
    }

    // Get unique directories for filtering/display
    const directories = [...new Set(allFiles.map((file) => file.directory))].sort()

    // If no search term, return filtered files
    if (!searchTerm.trim()) {
      return {
        icons: filteredFiles.sort((a, b) => {
          // Sort by directory first, then by name
          if (a.directory !== b.directory) {
            return a.directory.localeCompare(b.directory)
          }
          return a.name.localeCompare(b.name)
        }),
        directories,
      }
    }

    // Filter files based on search term
    const searchTermLower = searchTerm.toLowerCase()
    const matchingFiles = filteredFiles.filter((file) => {
      const fileName = file.name.toLowerCase()
      const fileNameWithoutExt = path.parse(fileName).name
      const directoryName = file.directory.toLowerCase()
      const relativePath = file.relativePath.toLowerCase()

      // Search in multiple places:
      // 1. Filename (with and without extension)
      // 2. Directory path
      // 3. Full relative path
      // 4. Individual path segments
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

    // Sort by relevance
    const sortedFiles = matchingFiles.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aDir = a.directory.toLowerCase()
      const bDir = b.directory.toLowerCase()

      // Calculate relevance scores
      const getRelevanceScore = (file: IconFile) => {
        let score = 0
        const fileName = file.name.toLowerCase()
        const fileNameWithoutExt = path.parse(fileName).name
        const directory = file.directory.toLowerCase()

        // Exact filename match gets highest score
        if (fileName === searchTermLower || fileNameWithoutExt === searchTermLower) score += 100

        // Filename starts with search term
        if (fileName.startsWith(searchTermLower) || fileNameWithoutExt.startsWith(searchTermLower)) score += 50

        // Directory name matches
        if (directory.includes(searchTermLower)) score += 25

        // Filename contains search term
        if (fileName.includes(searchTermLower)) score += 10

        // Penalize deeper nesting slightly
        score -= file.depth

        return score
      }

      const scoreA = getRelevanceScore(a)
      const scoreB = getRelevanceScore(b)

      if (scoreA !== scoreB) return scoreB - scoreA

      // If scores are equal, sort by directory then name
      if (aDir !== bDir) return aDir.localeCompare(bDir)
      return aName.localeCompare(bName)
    })

    return {
      icons: sortedFiles,
      directories,
    }
  } catch (error) {
    console.error("Error searching icon files:", error)
    return { icons: [], directories: [] }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const directory = searchParams.get("dir") || "public/icons"
    const filterDir = searchParams.get("filter_dir") || undefined

    const { icons, directories } = await searchIconFiles(query, directory, filterDir)

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

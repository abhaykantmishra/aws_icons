// scripts/generate-icons-json.js
import fs from 'fs/promises'
import path from 'path'

const iconsDir = path.join(process.cwd(), 'public/icons')
const outputFile = path.join(process.cwd(), 'app/icons.json')

async function getAllIconFiles(dirPath, baseDir = iconsDir, depth = 0, maxDepth = 10) {
  const files = []

  if (depth > maxDepth) return files

  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')

    if (entry.isDirectory()) {
      files.push(...await getAllIconFiles(fullPath, baseDir, depth + 1, maxDepth))
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      const valid = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'].includes(ext)
      if (!valid) continue

      const stats = await fs.stat(fullPath)
      files.push({
        name: entry.name,
        path: `/icons/${relativePath}`,
        relativePath,
        directory: path.dirname(relativePath).replace(/\\/g, '/') || 'root',
        size: stats.size,
        lastModified: stats.mtime,
        depth,
      })
    }
  }

  return files
}

const allIcons = await getAllIconFiles(iconsDir)
await fs.writeFile(outputFile, JSON.stringify(allIcons, null, 2))

console.log(`✅ Generated ${allIcons.length} icons to icons.json`)
console.log(`📂 Output file: ${outputFile}`)
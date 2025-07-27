"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react"

interface DirectoryFilterProps {
  directories: string[]
  selectedDirectory: string | null
  onDirectorySelect: (directory: string | null) => void
}

export function DirectoryFilter({ directories, selectedDirectory, onDirectorySelect }: DirectoryFilterProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  // Build directory tree structure
  const buildDirectoryTree = (dirs: string[]) => {
    const tree: { [key: string]: string[] } = {}

    dirs.forEach((dir) => {
      if (dir === "root") return

      const parts = dir.split("/")
      let currentPath = ""

      parts.forEach((part) => {
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (!tree[parentPath]) {
          tree[parentPath] = []
        }

        if (!tree[parentPath].includes(currentPath)) {
          tree[parentPath].push(currentPath)
        }
      })
    })

    return tree
  }

  const directoryTree = buildDirectoryTree(directories)

  const toggleExpanded = (dir: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(dir)) {
      newExpanded.delete(dir)
    } else {
      newExpanded.add(dir)
    }
    setExpandedDirs(newExpanded)
  }

  const renderDirectoryTree = (parentDir: string, level = 0) => {
    const children = directoryTree[parentDir] || []

    return children.map((dir) => {
      const dirName = dir.split("/").pop() || dir
      const hasChildren = directoryTree[dir] && directoryTree[dir].length > 0
      const isExpanded = expandedDirs.has(dir)
      const isSelected = selectedDirectory === dir

      return (
        <div key={dir} style={{ marginLeft: `${level * 16}px` }}>
          <Button
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            className={`w-full justify-start text-left mb-1 ${
              isSelected ? "bg-blue-600 text-white" : "hover:bg-slate-100"
            }`}
            onClick={() => onDirectorySelect(isSelected ? null : dir)}
          >
            {hasChildren && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpanded(dir)
                }}
                className="mr-1 p-0.5 hover:bg-slate-200 rounded"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            )}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 mr-2" />
              ) : (
                <Folder className="w-4 h-4 mr-2" />
              )
            ) : (
              <div className="w-4 h-4 mr-2" />
            )}
            <span className="truncate">{dirName}</span>
          </Button>

          {hasChildren && isExpanded && renderDirectoryTree(dir, level + 1)}
        </div>
      )
    })
  }

  if (directories.length === 0) return null

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
          <Folder className="w-4 h-4 mr-2" />
          Browse by Directory
        </h3>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          <Button
            variant={selectedDirectory === null ? "default" : "ghost"}
            size="sm"
            className={`w-full justify-start mb-2 ${
              selectedDirectory === null ? "bg-blue-600 text-white" : "hover:bg-slate-100"
            }`}
            onClick={() => onDirectorySelect(null)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            All Directories ({directories.length})
          </Button>

          {renderDirectoryTree("")}
        </div>
      </CardContent>
    </Card>
  )
}

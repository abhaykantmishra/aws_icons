"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Download, ExternalLink, Zap, Shield, Globe, Loader2, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { DirectoryFilter } from "@/components/directory-filter"

interface IconFile {
  name: string
  path: string
  relativePath: string
  directory: string
  size?: number
  lastModified?: Date
  depth: number
}

interface SearchResponse {
  icons: IconFile[]
  total: number
  query: string
  directories: string[]
}

export default function Component() {

  const [searchQuery, setSearchQuery] = useState("")
  const [icons, setIcons] = useState<IconFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [directories, setDirectories] = useState<string[]>([])
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null)

  
  // Function to search icons via API
  const searchIcons = async (query: string, directory?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      let url = `/api/search-icons?q=${encodeURIComponent(query)}`
      if (directory) {
        url += `&filter_dir=${encodeURIComponent(directory)}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to search icons")
      }

      const data: SearchResponse = await response.json()
      setIcons(data.icons)
      setDirectories(data.directories)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIcons([])
      setDirectories([])
    } finally {
      setLoading(false)
    }
  }

  // First, add a new handler for the search button click
  const handleSearch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    searchIcons(searchQuery, selectedDirectory);
  };

  // Handle immediate search on Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  // useEffect(() => {
  //   // Initial search on component mount
  //   if(searchQuery == "" || selectedDirectory == null) {
  //     searchIcons("", null);
  //   }
  // }, [searchQuery, selectedDirectory]);

  // Create a ref to store the timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDownload = (icon: IconFile) => {
    // Create a temporary link to download the file
    const link = document.createElement("a")
    link.href = `/icons/${icon.path}`
    link.download = `/icons/${icon.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyIcon = (icon: IconFile) => {
    // Copy the icon URL to clipboard
    const location = window.location.origin
    navigator.clipboard.writeText(`${location}/icons/${icon.path}`)
      .then(() => {
        alert("Icon URL copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy icon URL:", err)
      })
  }

  const handleViewIcon = (icon: IconFile) => {
    // Open the icon in a new tab
    window.open(`/icons/${icon.path}`, "_blank")
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatFileName = (filename: string) => {
    return filename
      .replace(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">AWS Icons Hub</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              {/* <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
                Browse
              </a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
                Categories
              </a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
                About
              </a> */}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-6">
            Premium AWS Icons
            <span className="block text-blue-600">For Your Projects</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Discover and download or Use embed using public url, high-quality AWS service icons. All icons are publicly available and ready to use.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 animate-spin" />
            )}
            <Input
              type="text"
              placeholder="Search AWS icons... (e.g., ec2, lambda, s3)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 pr-12 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-white/90 backdrop-blur-sm"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center items-center space-x-8 text-slate-600 mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>{icons.length}+ Icons</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span>Public Use</span>
            </div>
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-blue-500" />
              <span>Free Download</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-2 px-4">
        <div className="container mx-auto">
          {searchQuery && (
            <div className="mb-6 space-y-2">
              <p className="text-slate-600">
                Found <span className="font-semibold text-blue-600">{icons.length}</span> icons
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
              {directories.length > 0 && (
                <p className="text-sm text-slate-500">
                  Searching in <span className="font-medium">{directories.length}</span> directories:{" "}
                  {directories.slice(0, 5).join(", ")}
                  {directories.length > 5 && ` and ${directories.length - 5} more...`}
                </p>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Error loading icons</h3>
              <p className="text-slate-600">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && icons.length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Searching icons...</p>
            </div>
          )}

          {/* Directory Filter */}
          {/* {!loading && directories.length > 0 && (
            <DirectoryFilter
              directories={directories}
              selectedDirectory={selectedDirectory}
              onDirectorySelect={setSelectedDirectory}
            />
          )} */}

          {/* Icons Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {icons.map((icon, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border-slate-200 bg-white/90 backdrop-blur-sm hover:bg-white"
                >
                  <CardContent className="p-6">
                    <div className="aspect-square bg-gradient-to-br from-rose-50 to-blue-50 rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Image
                        src={`/icons/${icon.path}` || "/placeholder.svg"}
                        alt={icon.name}
                        width={80}
                        height={80}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement
                          target.src = `/placeholder.svg?height=80&width=80&text=${icon.name.split("-")[1]?.toUpperCase() || "ICON"}`
                        }}
                      />
                    </div>
                    <h3 className="font-medium text-slate-800 mb-2 text-sm leading-tight">
                      {formatFileName(icon.name)}
                    </h3>
                    <div className="text-xs text-slate-500 mb-4 space-y-1">
                      <p>{icon.name}</p>
                      <p className="text-blue-600">📁 {icon.directory}</p>
                      {icon.size && <p>{formatFileSize(icon.size)}</p>}
                      <p>Depth: {icon.depth}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"  variant="outline"
                        onClick={() => handleDownload(icon)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                      </Button>
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size={"sm"}  onClick={() => handleCopyIcon(icon)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewIcon(icon)}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && icons.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No icons found</h3>
              <p className="text-slate-600">Try searching for different keywords like "ec2", "lambda", or "s3"</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 mt-16">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">AWS Icons Hub</span>
          </div>
          <p className="text-slate-600 mb-4">
            High-quality AWS service icons for your architecture diagrams and presentations.
          </p>
          <p className="text-sm text-slate-500">© 2024 AWS Icons Hub. All icons are publicly available for use.</p>
        </div>
      </footer>
    </div>
  )
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Shuffle, Clock } from "lucide-react";

interface MemoryHeaderProps {
  onUpload: () => void;
  onRandomSurface: () => void;
  onViewStream: () => void;
}

export const MemoryHeader = ({ onUpload, onRandomSurface, onViewStream }: MemoryHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 surface-gradient border-b border-border/50 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold memory-gradient bg-clip-text text-transparent">
              Memory Streamer
            </h1>
            <p className="text-muted-foreground hidden md:block">
              Constantly remember your favorite moments
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewStream}
              className="hidden md:flex"
            >
              <Clock className="w-4 h-4 mr-2" />
              Memory Stream
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRandomSurface}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Surface Random
            </Button>
            
            <Button
              size="sm"
              onClick={onUpload}
              className="memory-gradient hover:opacity-90 transition-opacity"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
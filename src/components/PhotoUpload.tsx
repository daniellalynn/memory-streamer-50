import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onUpload: (files: File[]) => void;
  className?: string;
}

export const PhotoUpload = ({ onUpload, className }: PhotoUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
        "hover:border-primary/50 hover:bg-primary/5",
        isDragActive && "border-primary bg-primary/10",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
          isDragActive ? "memory-gradient" : "bg-muted"
        )}>
          {isDragActive ? (
            <Upload className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Image className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? "Drop your photos here" : "Upload Photos to Memory Stream"}
          </h3>
          <p className="text-muted-foreground">
            Drag and drop photos here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports JPEG, PNG, GIF, and WebP formats
          </p>
        </div>
      </div>
    </div>
  );
};
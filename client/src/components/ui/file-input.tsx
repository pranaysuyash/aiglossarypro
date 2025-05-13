import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  accept?: string;
  className?: string;
  icon?: React.ReactNode;
  helperText?: string;
  onFilesSelected?: (files: FileList | null) => void;
  error?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      type = "file",
      label,
      accept,
      icon = <Upload className="h-5 w-5" />,
      helperText,
      onFilesSelected,
      error,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string>("");

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setFileName(files[0].name);
      } else {
        setFileName("");
      }
      
      if (onFilesSelected) {
        onFilesSelected(files);
      }
    };

    const triggerFileInput = () => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    };

    return (
      <div className={className}>
        {label && (
          <Label
            htmlFor={props.id}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </Label>
        )}
        <div
          className={cn(
            "relative flex items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors",
            error ? "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/50" : 
            "border-gray-300 dark:border-gray-700 hover:border-primary/70 dark:hover:border-primary/70"
          )}
        >
          <input
            type="file"
            ref={inputRef}
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            {...props}
          />
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              {icon}
            </div>
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus-within:outline-none"
                onClick={triggerFileInput}
              >
                <span>Upload a file</span>
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {helperText || `${accept?.split(',').join(', ')} up to 10MB`}
            </p>
            {fileName && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-medium">{fileName}</span>
              </div>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };

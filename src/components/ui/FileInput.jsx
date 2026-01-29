import { useRef } from "react";
import { GlassButton } from "./GlassButton";
import { Upload } from "lucide-react";

export function FileInput({ onFileSelect, accept = "image/*", label = "Upload Image" }) {
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
        e.target.value = "";
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />
            <GlassButton onClick={handleClick} className="flex items-center gap-2">
                <Upload size={18} />
                {label}
            </GlassButton>
        </>
    );
}

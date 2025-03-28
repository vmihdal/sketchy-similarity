
import { useEffect } from "react";
import { useToolStore } from "@/store/tool-store";
import { toast } from "@/components/ui/use-toast";

export const KeyboardShortcuts = () => {
  const { setActiveTool } = useToolStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts when not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v":
          setActiveTool("select");
          break;
        case "p":
          setActiveTool("pencil");
          break;
        case "r":
          setActiveTool("rectangle");
          break;
        case "c":
          setActiveTool("circle");
          break;
        case "l":
          setActiveTool("line");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Show toast with keyboard shortcuts on mount
    toast({
      title: "Keyboard Shortcuts",
      description: "V: Select, P: Pencil, R: Rectangle, C: Circle, L: Line",
      duration: 5000,
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setActiveTool]);

  return null;
};

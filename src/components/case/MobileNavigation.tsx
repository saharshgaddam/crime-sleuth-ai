
import { Image, MessageSquare, Microscope } from "lucide-react";

type ActiveTab = "sources" | "chat" | "studio";

interface MobileNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function MobileNavigation({ activeTab, setActiveTab }: MobileNavigationProps) {
  return (
    <div className="md:hidden border-t">
      <div className="grid grid-cols-3 divide-x">
        <button
          className={`flex flex-col items-center py-3 ${activeTab === "sources" ? "text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("sources")}
        >
          <Image className="h-5 w-5 mb-1" />
          <span className="text-xs">Sources</span>
        </button>
        <button
          className={`flex flex-col items-center py-3 ${activeTab === "chat" ? "text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare className="h-5 w-5 mb-1" />
          <span className="text-xs">Chat</span>
        </button>
        <button
          className={`flex flex-col items-center py-3 ${activeTab === "studio" ? "text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("studio")}
        >
          <Microscope className="h-5 w-5 mb-1" />
          <span className="text-xs">Studio</span>
        </button>
      </div>
    </div>
  );
}

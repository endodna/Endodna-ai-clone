import { Button } from "@/components/ui/button";
import { SearchXIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Error404() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center gap-6 justify-center h-screen bg-background text-foreground">
            <SearchXIcon className="size-40 text-neutral-500 stroke-1" />
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-4xl text-neutral-800 font-semibold">404</h1>
                <p className="text-neutral-600 text-sm">It seems the page you are looking for does not exist.</p>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-600" onClick={() => navigate("/")}>Back to Home Page</Button>
        </div>
    )
}
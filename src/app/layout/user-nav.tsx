import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function UserNav() {
    // This is a placeholder component.
    // The original had more logic for dropdown menus and user status.
    return (
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
        </Button>
    )
}

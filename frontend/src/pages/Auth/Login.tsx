import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import loginBackground from "@/assets/login_background.jpg"
import carePlus from "@/assets/care_plus.svg"
import poweredByEndoDNA from "@/assets/powered_by_endodna.svg"

export default function LoginForm() {
    return (
        <div
            className="relative bg-cover bg-center flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
            style={{ backgroundImage: `url(${loginBackground})` }}
        >
            <div className="absolute inset-0 bg-background/20 backdrop-blur-sm"></div>

            <div className="relative z-10 flex w-full max-w-lg flex-col gap-6">
                <div className="flex flex-col gap-6">
                    <Card className="px-4 py-4 bg-linear-65 from-neutral-50 to-neutral-100 flex flex-col gap-4">
                        <CardHeader>
                            <CardTitle className="flex flex-col gap-6">
                                <div className="-ml-2 flex items-center justify-between">
                                    <img src={carePlus} alt="Care Plus" className="w-20 h-auto" />
                                    <img src={poweredByEndoDNA} alt="Powered by EndoDNA" className="w-20 h-auto" />
                                </div>
                                <div className="text-4xl pt-4 text-neutral-700 font-semibold">
                                    Welcome Back
                                </div>

                            </CardTitle>
                            <CardDescription className="text-xs text-neutral-700">
                                <span>Don't have an account?</span> <a href="#" className="text-violet-500">Create an account</a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="grid gap-6">
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="user@mail.com"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">Password</Label>
                                            </div>
                                            <Input id="password" type="password" required />
                                        </div>
                                        <Button disabled type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-600">
                                            Login
                                        </Button>
                                    </div>
                                    <div className="text-xs text-neutral-700">
                                        <span>Forgot your login details?</span> <a href="#" className="text-violet-500">Reset password</a>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

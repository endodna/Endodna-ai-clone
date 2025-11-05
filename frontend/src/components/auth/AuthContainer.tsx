import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import loginBackground from "@/assets/login_background.jpg";
// import carePlus from "@/assets/care_plus.svg";
import endoDNA from "@/assets/endodna.svg";

export default function AuthContainer({
  header,
  children,
}: {
  header: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="relative bg-cover bg-center flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-background/20 backdrop-blur-sm"></div>

      <div className="relative z-10 flex w-full max-w-lg">
        <div className="flex flex-col gap-6 w-full">
          <Card className="px-4 py-4 bg-gradient-to-r from-white/100 to-gray-100/100 flex flex-col gap-6">
            <CardHeader className="pb-0">
              <CardDescription className="flex flex-col gap-6">
                <div className="flex items-center justify-center">
                  {/* <img src={carePlus} alt="Care Plus" className="w-20 h-auto" /> */}
                  <img
                    src={endoDNA}
                    alt="Powered by EndoDNA"
                    className="w-30 h-auto"
                  />
                </div>
                {header}
              </CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

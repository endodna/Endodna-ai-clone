import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import loginBackground from "@/assets/login_background.jpg";
// import carePlus from "@/assets/care_plus.svg";
import bellaVita from "@/assets/bellaVita.svg";
import { OrganizationBranding } from "@/hooks/useOrganizationBranding";

export default function AuthContainer({
  header,
  children,
  organizationBranding,
  organizationName,
}: {
  header: React.ReactNode;
  children?: React.ReactNode;
  organizationBranding?: OrganizationBranding | null;
  organizationName?: string;
}) {
  
  const logoUrl = organizationBranding?.customization?.logo?.url || bellaVita;
  const orgName = organizationName || organizationBranding?.name || "BellaVita";
  const tagline = organizationBranding?.customization?.tagline;
  const primaryColor = organizationBranding?.customization?.primaryColor;

  const borderStyle = primaryColor
    ? { borderColor: primaryColor }
    : {};

  return (
    <div
      className="relative bg-cover bg-center flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-background/20 backdrop-blur-sm"></div>

      <div className="relative z-10 flex w-full max-w-lg">
        <div className="flex flex-col gap-6 w-full">
          <Card
            className="px-4 py-4 bg-gradient-to-r from-white/100 to-gray-100/100 flex flex-col gap-6"
            style={borderStyle}
          >
            <CardHeader className="pb-0">
              <CardDescription className="flex flex-col gap-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <img
                    src={logoUrl}
                    alt={orgName}
                    className="w-60 h-auto"
                  />
                  {tagline && (
                    <p className="text-sm text-muted-foreground text-center">
                      {tagline}
                    </p>
                  )}
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

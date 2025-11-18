import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

export interface TabConfig {
    readonly id: string;
    readonly label: string;
    readonly Content: ComponentType;
}

interface TabNavigationProps {
    readonly tabs: readonly TabConfig[];
    readonly defaultValue?: string;
    readonly className?: string;
    readonly onTabChange?: (tabId: string) => void;
}

export function TabNavigation({ tabs, defaultValue, className, onTabChange }: Readonly<TabNavigationProps>) {
    if (!tabs.length) {
        return (
            <div className={cn("flex-1 rounded-3xl border border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500", className)}>
                No tabs available.
            </div>
        );
    }

    const fallbackValue = tabs[0]?.id ?? "";
    const initialValue = tabs.some((tab) => tab.id === defaultValue) ? defaultValue : fallbackValue;

    return (
        <Tabs
            defaultValue={initialValue}
            onValueChange={(value) => {
                onTabChange?.(value);
            }}
            className={cn("flex-1", className)}
        >
            <div className="">
                <div className="border border-neutral-200 rounded-2xl bg-neutral-100 w-fit p-2">
                    <TabsList className="">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="flex-1 text-sm font-medium text-neutral-950 leading-normal rounded-[10px]"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {tabs.map((tab) => {
                    const Content = tab.Content;
                    return (
                        <TabsContent key={tab.id} value={tab.id} className="">
                            <Content />
                        </TabsContent>
                    );
                })}
            </div>
        </Tabs>
    );
}

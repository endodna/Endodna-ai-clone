import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

export interface TabConfig<TProps extends object = Record<string, never>> {
    readonly id: string;
    readonly label: string;
    readonly Content: ComponentType<TProps>;
}

interface TabNavigationProps<TProps extends object = Record<string, never>> {
    readonly tabs: readonly TabConfig<TProps>[];
    readonly defaultValue?: string;
    readonly value?: string;
    readonly className?: string;
    readonly onTabChange?: (tabId: string) => void;
    readonly tabProps?: TProps;
}

export function TabNavigation<TProps extends object = Record<string, never>>({
    tabs,
    defaultValue,
    value,
    className,
    onTabChange,
    tabProps,
}: Readonly<TabNavigationProps<TProps>>) {
    if (!tabs.length) {
        return (
            <div className={cn("flex-1 rounded-3xl border border-dashed border-neutral-200 bg-white p-6 text-center text-base font-medium text-neutral-500", className)}>
                No tabs available.
            </div>
        );
    }

    const fallbackValue = tabs[0]?.id ?? "";
    const initialValue = tabs.some((tab) => tab.id === defaultValue) ? defaultValue : fallbackValue;
    const isControlled = value && tabs.some((tab) => tab.id === value);
    const tabsControlProps = isControlled ? { value } : { defaultValue: initialValue };

    const handleValueChange = (nextValue: string) => {
        onTabChange?.(nextValue);
    };

    return (
        <Tabs
            {...tabsControlProps}
            onValueChange={handleValueChange}
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
                    const contentProps = (tabProps ?? {}) as TProps;
                    return (
                        <TabsContent key={tab.id} value={tab.id} className="">
                            <Content {...contentProps} />
                        </TabsContent>
                    );
                })}
            </div>
        </Tabs>
    );
}
